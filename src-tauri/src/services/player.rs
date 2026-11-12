//! Caso de uso: pesquisar um jogador por Riot ID (RF01/RF02).
//!
//! 1. Busca na Riot: conta (PUUID) → invocador (nível, ícone) → elo.
//! 2. Grava perfil e elo no SQLite.
//! 3. Se a Riot falhar (sem internet, chave expirada, instabilidade), devolve
//!    o que já estiver salvo, com um aviso. Assim a pesquisa funciona offline
//!    para jogadores já consultados (RNF04).

use serde::Serialize;

use crate::database::models::{PlayerRecord, RankSnapshot};
use crate::database::{Database, now_ms, repo};
use crate::error::{AppError, AppResult};
use crate::services::riot::RiotClient;
use crate::services::riot::dto::{AccountDto, LeagueEntryDto, SummonerDto};
use crate::services::riot::routing::{account_region, is_valid_platform};

/// Filas de ranqueada exibidas (outras, como Arena, são ignoradas por ora).
const RANKED_QUEUES: [&str; 2] = ["RANKED_SOLO_5x5", "RANKED_FLEX_SR"];

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayerProfile {
    pub player: PlayerRecord,
    pub ranks: Vec<RankSnapshot>,
    /// "riot" = dados atualizados agora; "local" = dados salvos anteriormente.
    pub source: &'static str,
    /// Motivo de ter usado os dados locais, quando for o caso.
    pub warning: Option<String>,
}

/// Valida e normaliza a entrada da busca.
pub fn validate_input(game_name: &str, tag_line: &str, platform: &str) -> AppResult<()> {
    let name_len = game_name.trim().chars().count();
    let tag_len = tag_line.trim().chars().count();
    if !(3..=16).contains(&name_len) {
        return Err(AppError::InvalidInput(
            "o nome do Riot ID deve ter de 3 a 16 caracteres".into(),
        ));
    }
    if !(2..=5).contains(&tag_len) {
        return Err(AppError::InvalidInput(
            "a tag do Riot ID deve ter de 2 a 5 caracteres (ex.: BR1)".into(),
        ));
    }
    if !is_valid_platform(platform) {
        return Err(AppError::InvalidInput(format!(
            "região desconhecida: {platform}"
        )));
    }
    Ok(())
}

fn to_snapshot(entry: &LeagueEntryDto) -> RankSnapshot {
    RankSnapshot {
        queue_type: entry.queue_type.clone(),
        tier: entry.tier.clone(),
        // Mestre+ não tem divisão; a Riot devolve "I" nesses casos.
        division: match entry.tier.as_str() {
            "MASTER" | "GRANDMASTER" | "CHALLENGER" => None,
            _ => entry.rank.clone(),
        },
        league_points: entry.league_points,
        wins: entry.wins,
        losses: entry.losses,
    }
}

async fn fetch_from_riot(
    riot: &RiotClient,
    game_name: &str,
    tag_line: &str,
    platform: &str,
) -> AppResult<(PlayerRecord, Vec<RankSnapshot>)> {
    let region = account_region(platform);
    let account: AccountDto = riot
        .get(
            region,
            &format!(
                "/riot/account/v1/accounts/by-riot-id/{}/{}",
                urlencode(game_name),
                urlencode(tag_line)
            ),
        )
        .await?;
    let summoner: SummonerDto = riot
        .get(
            platform,
            &format!("/lol/summoner/v4/summoners/by-puuid/{}", account.puuid),
        )
        .await?;
    let entries: Vec<LeagueEntryDto> = riot
        .get(
            platform,
            &format!("/lol/league/v4/entries/by-puuid/{}", account.puuid),
        )
        .await?;

    let player = PlayerRecord {
        game_name: account.game_name.unwrap_or_else(|| game_name.to_string()),
        tag_line: account.tag_line.unwrap_or_else(|| tag_line.to_string()),
        puuid: account.puuid,
        platform: platform.to_string(),
        profile_icon_id: summoner.profile_icon_id,
        summoner_level: summoner.summoner_level,
        updated_at: now_ms(),
        last_synced_at: None,
    };
    let ranks = entries
        .iter()
        .filter(|e| RANKED_QUEUES.contains(&e.queue_type.as_str()))
        .map(to_snapshot)
        .collect();
    Ok((player, ranks))
}

/// Grava o resultado da Riot e devolve o perfil a partir do banco.
pub fn store(db: &Database, player: &PlayerRecord, ranks: &[RankSnapshot]) -> AppResult<()> {
    db.with(|c| {
        let tx = c.transaction()?;
        repo::players::upsert(&tx, player)?;
        let now = now_ms();
        for rank in ranks {
            repo::ranks::record(&tx, &player.puuid, rank, now)?;
        }
        tx.commit()?;
        Ok(())
    })
}

pub async fn search(
    db: &Database,
    riot: &RiotClient,
    game_name: &str,
    tag_line: &str,
    platform: &str,
) -> AppResult<PlayerProfile> {
    let (game_name, tag_line) = (game_name.trim(), tag_line.trim().trim_start_matches('#'));
    validate_input(game_name, tag_line, platform)?;

    match fetch_from_riot(riot, game_name, tag_line, platform).await {
        Ok((player, ranks)) => {
            store(db, &player, &ranks)?;
            load(db, &player.puuid, "riot", None)
        }
        Err(err) if err.is_remote_failure() => {
            let local = db.with(|c| repo::players::find_by_riot_id(c, game_name, tag_line))?;
            match local {
                Some(p) => load(db, &p.puuid, "local", Some(err.to_string())),
                None => Err(err),
            }
        }
        Err(err) => Err(err),
    }
}

/// Monta o perfil a partir do banco local.
pub fn load(
    db: &Database,
    puuid: &str,
    source: &'static str,
    warning: Option<String>,
) -> AppResult<PlayerProfile> {
    db.with(|c| {
        let player = repo::players::get(c, puuid)?.ok_or(AppError::NotFound)?;
        let ranks = repo::ranks::latest(c, puuid)?;
        Ok(PlayerProfile {
            player,
            ranks,
            source,
            warning,
        })
    })
}

/// Codifica um segmento de URL (Riot IDs podem ter espaços e acentos).
fn urlencode(segment: &str) -> String {
    let mut out = String::with_capacity(segment.len());
    for byte in segment.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(byte as char)
            }
            _ => out.push_str(&format!("%{byte:02X}")),
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::repo::fixtures::player;

    #[test]
    fn validates_riot_id() {
        assert!(validate_input("Brunoedu9", "br1", "br1").is_ok());
        assert!(validate_input("ab", "br1", "br1").is_err());
        assert!(validate_input("Nome", "x", "br1").is_err());
        assert!(validate_input("Nome", "BR1", "zz9").is_err());
    }

    #[test]
    fn encodes_spaces_and_accents() {
        assert_eq!(urlencode("Fulano de Tal"), "Fulano%20de%20Tal");
        assert_eq!(urlencode("Joaõ"), "Joa%C3%B5");
    }

    #[test]
    fn master_plus_has_no_division() {
        let entry = LeagueEntryDto {
            queue_type: "RANKED_SOLO_5x5".into(),
            tier: "CHALLENGER".into(),
            rank: Some("I".into()),
            league_points: 3450,
            wins: 428,
            losses: 267,
        };
        assert_eq!(to_snapshot(&entry).division, None);
    }

    /// Teste ao vivo contra a Riot API (precisa de RIOT_API_KEY válida no .env).
    /// Rode com: cargo test live_search -- --ignored --nocapture
    #[tokio::test]
    #[ignore = "acessa a Riot API"]
    async fn live_search_then_offline_fallback() {
        let db = Database::open_in_memory().unwrap();
        let riot = RiotClient::new().unwrap();

        let online = search(&db, &riot, "Brunoedu9", "br1", "br1")
            .await
            .expect("busca na Riot");
        println!(
            "riot  -> {}#{} nível {} · {} filas ranqueadas",
            online.player.game_name,
            online.player.tag_line,
            online.player.summoner_level,
            online.ranks.len()
        );
        assert_eq!(online.source, "riot");

        let missing = search(&db, &riot, "zz-nao-existe-zz", "zz9", "br1").await;
        assert!(matches!(missing, Err(AppError::NotFound)));

        // O que o fallback offline faz: encontrar pelo Riot ID no banco e ler o perfil salvo.
        let local = db
            .with(|c| repo::players::find_by_riot_id(c, "BRUNOEDU9", "BR1"))
            .unwrap()
            .expect("salvo no banco");
        let offline = load(&db, &local.puuid, "local", Some("sem conexão".into())).unwrap();
        println!(
            "local -> {}#{} (aviso: {:?})",
            offline.player.game_name, offline.player.tag_line, offline.warning
        );
        assert_eq!(offline.player.puuid, online.player.puuid);
    }

    #[test]
    fn store_then_load_profile() {
        let db = Database::open_in_memory().unwrap();
        let rank = RankSnapshot {
            queue_type: "RANKED_SOLO_5x5".into(),
            tier: "GOLD".into(),
            division: Some("II".into()),
            league_points: 40,
            wins: 10,
            losses: 8,
        };
        store(
            &db,
            &player("p1", "Nome", "BR1"),
            std::slice::from_ref(&rank),
        )
        .unwrap();
        let profile = load(&db, "p1", "local", Some("offline".into())).unwrap();
        assert_eq!(profile.player.game_name, "Nome");
        assert_eq!(profile.ranks, vec![rank]);
        assert_eq!(profile.source, "local");
    }
}
