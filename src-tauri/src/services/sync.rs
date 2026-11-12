//! Sincronização de partidas (RF11): Riot API → SQLite.
//!
//! 1. Lista os IDs das partidas mais recentes do jogador (1 requisição).
//! 2. Descarta as que já estão no banco (partidas são imutáveis).
//! 3. Busca cada partida nova e grava com os 10 participantes.
//! 4. Registra o resultado em `sync_history` e marca o jogador como sincronizado.
//!
//! Se a sincronização falhar no meio, as partidas já gravadas ficam; a próxima
//! sincronização continua de onde parou, porque só busca o que falta.

use serde::Serialize;
use tokio::sync::Mutex;

use crate::database::models::{NewMatch, NewParticipant, ParticipantStats};
use crate::database::{Database, now_ms, repo};
use crate::error::{AppError, AppResult};
use crate::services::riot::RiotClient;
use crate::services::riot::dto::MatchDto;
use crate::services::riot::routing::match_region;

/// Máximo de partidas por sincronização (cada uma custa 1 requisição).
pub const MAX_MATCHES_PER_SYNC: u32 = 100;

/// Impede duas sincronizações ao mesmo tempo (dividiriam o limite de requisições).
#[derive(Default)]
pub struct SyncLock(Mutex<()>);

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncProgress {
    pub puuid: String,
    pub done: usize,
    pub total: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncResult {
    /// Partidas novas gravadas.
    pub added: usize,
    /// Partidas listadas que já estavam no banco.
    pub already_stored: usize,
    pub finished_at: i64,
}

/// Converte a resposta da Riot para o formato do banco.
pub fn to_new_match(dto: MatchDto) -> NewMatch {
    let info = dto.info;
    // Partidas antigas (sem gameEndTimestamp) informam a duração em milissegundos.
    let duration_sec = if info.game_end_timestamp.is_some() {
        info.game_duration
    } else {
        info.game_duration / 1000
    };
    let participants = info
        .participants
        .into_iter()
        .map(|p| NewParticipant {
            puuid: p.puuid,
            participant_index: p.participant_id,
            team_id: p.team_id,
            riot_id_game_name: p.riot_id_game_name,
            riot_id_tagline: p.riot_id_tagline,
            champion_id: p.champion_id,
            champion_name: p.champion_name,
            team_position: p.team_position,
            win: p.win,
            stats: ParticipantStats {
                champ_level: p.champ_level,
                kills: p.kills,
                deaths: p.deaths,
                assists: p.assists,
                minions_killed: p.total_minions_killed,
                neutral_minions: p.neutral_minions_killed,
                gold_earned: p.gold_earned,
                damage_to_champions: p.total_damage_dealt_to_champions,
                damage_taken: p.total_damage_taken,
                vision_score: p.vision_score,
                wards_placed: p.wards_placed,
                wards_killed: p.wards_killed,
                control_wards: p.vision_wards_bought_in_game,
                turret_takedowns: p.turret_takedowns,
                dragon_kills: p.dragon_kills,
                baron_kills: p.baron_kills,
            },
        })
        .collect();
    NewMatch {
        match_id: dto.metadata.match_id,
        platform: info.platform_id.to_lowercase(),
        queue_id: info.queue_id,
        game_mode: info.game_mode,
        game_version: info.game_version,
        started_at: info.game_start_timestamp,
        duration_sec,
        participants,
    }
}

async fn run(
    db: &Database,
    riot: &RiotClient,
    puuid: &str,
    platform: &str,
    count: u32,
    on_progress: &(dyn Fn(SyncProgress) + Send + Sync),
) -> AppResult<SyncResult> {
    let region = match_region(platform);
    let ids: Vec<String> = riot
        .get(
            region,
            &format!("/lol/match/v5/matches/by-puuid/{puuid}/ids?start=0&count={count}"),
        )
        .await?;
    let stored = db.with(|c| repo::matches::existing_ids(c, &ids))?;
    let missing: Vec<&String> = ids.iter().filter(|id| !stored.contains(*id)).collect();

    let total = missing.len();
    on_progress(SyncProgress {
        puuid: puuid.to_string(),
        done: 0,
        total,
    });
    let mut added = 0;
    for (i, id) in missing.iter().enumerate() {
        let dto: MatchDto = riot
            .get(region, &format!("/lol/match/v5/matches/{id}"))
            .await?;
        let new_match = to_new_match(dto);
        if db.with(|c| repo::matches::insert(c, &new_match))? {
            added += 1;
        }
        on_progress(SyncProgress {
            puuid: puuid.to_string(),
            done: i + 1,
            total,
        });
    }

    let finished_at = now_ms();
    db.with(|c| repo::players::mark_synced(c, puuid, finished_at))?;
    Ok(SyncResult {
        added,
        already_stored: stored.len(),
        finished_at,
    })
}

/// Sincroniza as `count` partidas mais recentes de um jogador já salvo no banco.
pub async fn sync_matches(
    db: &Database,
    riot: &RiotClient,
    lock: &SyncLock,
    puuid: &str,
    count: u32,
    on_progress: &(dyn Fn(SyncProgress) + Send + Sync),
) -> AppResult<SyncResult> {
    let _guard = lock
        .0
        .try_lock()
        .map_err(|_| AppError::InvalidInput("já existe uma sincronização em andamento".into()))?;
    let player = db
        .with(|c| repo::players::get(c, puuid))?
        .ok_or(AppError::NotFound)?;
    let count = count.clamp(1, MAX_MATCHES_PER_SYNC);

    let sync_id = db.with(|c| repo::sync::start(c, Some(puuid), "matches"))?;
    let outcome = run(db, riot, puuid, &player.platform, count, on_progress).await;
    db.with(|c| match &outcome {
        Ok(r) => repo::sync::finish(c, sync_id, Ok(r.added as i64)),
        Err(e) => repo::sync::finish(c, sync_id, Err(&e.to_string())),
    })?;
    outcome
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::repo::fixtures::player;

    const SAMPLE: &str = r#"{
      "metadata": { "matchId": "BR1_3001", "participants": [] },
      "info": {
        "platformId": "BR1", "queueId": 420, "gameMode": "CLASSIC",
        "gameVersion": "16.22.712.4130", "gameStartTimestamp": 1794500000000,
        "gameDuration": 1856, "gameEndTimestamp": 1794501900000,
        "participants": [
          { "puuid": "me", "participantId": 1, "teamId": 100, "riotIdGameName": "Eu",
            "riotIdTagline": "BR1", "championId": 64, "championName": "LeeSin",
            "teamPosition": "JUNGLE", "win": true, "champLevel": 16, "kills": 13,
            "deaths": 3, "assists": 16, "totalMinionsKilled": 40,
            "neutralMinionsKilled": 180, "goldEarned": 15000,
            "totalDamageDealtToChampions": 30955, "totalDamageTaken": 28000,
            "visionScore": 35, "wardsPlaced": 10, "wardsKilled": 4,
            "visionWardsBoughtInGame": 3, "turretTakedowns": 2, "dragonKills": 3,
            "baronKills": 1, "unknownField": "ignorado" },
          { "puuid": "other", "participantId": 6, "teamId": 200,
            "championId": 1, "championName": "Annie", "win": false }
        ]
      }
    }"#;

    #[test]
    fn converts_riot_match_and_stores_it() {
        let dto: MatchDto = serde_json::from_str(SAMPLE).expect("JSON da Riot");
        let m = to_new_match(dto);
        assert_eq!(m.platform, "br1");
        assert_eq!(m.duration_sec, 1856);
        assert_eq!(m.participants.len(), 2);
        let me = &m.participants[0];
        assert_eq!(me.stats.minions_killed + me.stats.neutral_minions, 220);
        assert_eq!(me.stats.control_wards, 3);
        // Campos ausentes viram zero/vazio em vez de falhar.
        assert_eq!(m.participants[1].team_position, "");
        assert_eq!(m.participants[1].stats.kills, 0);

        let db = Database::open_in_memory().unwrap();
        db.with(|c| {
            repo::players::upsert(c, &player("me", "Eu", "BR1"))?;
            assert!(repo::matches::insert(c, &m)?);
            let list = repo::matches::recent_for_player(c, "me", 5)?;
            assert_eq!(list[0].cs, 220);
            assert_eq!(list[0].champion, "LeeSin");
            Ok(())
        })
        .unwrap();
    }

    #[test]
    fn old_matches_report_duration_in_ms() {
        let json = SAMPLE.replace(
            r#""gameDuration": 1856, "gameEndTimestamp": 1794501900000,"#,
            r#""gameDuration": 1856000,"#,
        );
        let m = to_new_match(serde_json::from_str(&json).unwrap());
        assert_eq!(m.duration_sec, 1856);
    }

    /// Ao vivo: rode com `cargo test live_sync -- --ignored --nocapture`.
    #[tokio::test]
    #[ignore = "acessa a Riot API"]
    async fn live_sync_challenger() {
        let db = Database::open_in_memory().unwrap();
        let riot = RiotClient::new().unwrap();
        let lock = SyncLock::default();
        let profile = crate::services::player::search(&db, &riot, "noobao9000", "NOOB", "br1")
            .await
            .expect("busca");
        let puuid = profile.player.puuid;
        let progress = |p: SyncProgress| println!("progresso {}/{}", p.done, p.total);

        let first = sync_matches(&db, &riot, &lock, &puuid, 5, &progress)
            .await
            .expect("1ª sincronização");
        println!(
            "1ª: {} novas, {} já salvas",
            first.added, first.already_stored
        );
        assert_eq!(first.added, 5);

        let second = sync_matches(&db, &riot, &lock, &puuid, 5, &progress)
            .await
            .expect("2ª sincronização");
        println!(
            "2ª: {} novas, {} já salvas",
            second.added, second.already_stored
        );
        assert_eq!(second.added, 0, "não busca de novo o que já está salvo");

        let matches = db
            .with(|c| repo::matches::recent_for_player(c, &puuid, 5))
            .unwrap();
        for m in &matches {
            println!(
                "{} {} {}/{}/{} {} CS KP {:.0}%",
                m.champion,
                if m.win { "V" } else { "D" },
                m.kills,
                m.deaths,
                m.assists,
                m.cs,
                m.kill_participation * 100.0
            );
        }
        assert_eq!(matches.len(), 5);

        // Data Dragon: nomes de exibição e ícones.
        assert!(
            crate::services::ddragon::ensure_champions(&db, riot.http())
                .await
                .expect("Data Dragon")
        );
        let named = db
            .with(|c| repo::matches::recent_for_player(c, &puuid, 5))
            .unwrap();
        println!(
            "com Data Dragon: {} · {:?}",
            named[0].champion, named[0].champion_icon
        );
        assert!(named.iter().all(|m| m.champion_icon.is_some()));

        // Linha do tempo: 1ª vez da Riot, 2ª do cache.
        let first_id = &named[0].match_id;
        let t = crate::services::timeline::get_or_fetch(&db, &riot, first_id)
            .await
            .expect("timeline");
        println!(
            "timeline: {} quadros, ouro final do participante 1 = {}",
            t.gold_frames.len(),
            t.gold_frames.last().map(|f| f[0]).unwrap_or(0)
        );
        assert!(t.gold_frames.len() > 10);
        let cached = db
            .with(|c| repo::timelines::get(c, first_id))
            .unwrap()
            .expect("salva no banco");
        assert_eq!(cached, t);
    }
}
