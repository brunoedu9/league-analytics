use std::collections::HashSet;

use rusqlite::{Connection, params};

use crate::database::models::{MatchSummary, NewMatch, queue_label};
use crate::database::now_ms;
use crate::error::AppResult;

/// Grava a partida com todos os participantes em uma transação.
///
/// Partidas são imutáveis depois de terminadas: se o `match_id` já existe,
/// nada é alterado e a função devolve `false`.
pub fn insert(conn: &mut Connection, m: &NewMatch) -> AppResult<bool> {
    let tx = conn.transaction()?;
    let inserted = tx.execute(
        "INSERT OR IGNORE INTO matches
            (match_id, platform, queue_id, game_mode, game_version, started_at, duration_sec, stored_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            m.match_id,
            m.platform,
            m.queue_id,
            m.game_mode,
            m.game_version,
            m.started_at,
            m.duration_sec,
            now_ms()
        ],
    )?;
    if inserted == 0 {
        return Ok(false);
    }

    {
        let mut insert_participant = tx.prepare(
            "INSERT INTO participants
                (match_id, puuid, participant_index, team_id, riot_id_game_name, riot_id_tagline,
                 champion_id, champion_name, team_position, win)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        )?;
        let mut insert_stats = tx.prepare(
            "INSERT INTO player_stats
                (participant_id, champ_level, kills, deaths, assists, minions_killed, neutral_minions,
                 gold_earned, damage_to_champions, damage_taken, vision_score, wards_placed,
                 wards_killed, control_wards, turret_takedowns, dragon_kills, baron_kills)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)",
        )?;
        for p in &m.participants {
            insert_participant.execute(params![
                m.match_id,
                p.puuid,
                p.participant_index,
                p.team_id,
                p.riot_id_game_name,
                p.riot_id_tagline,
                p.champion_id,
                p.champion_name,
                p.team_position,
                p.win,
            ])?;
            let participant_id = tx.last_insert_rowid();
            let s = &p.stats;
            insert_stats.execute(params![
                participant_id,
                s.champ_level,
                s.kills,
                s.deaths,
                s.assists,
                s.minions_killed,
                s.neutral_minions,
                s.gold_earned,
                s.damage_to_champions,
                s.damage_taken,
                s.vision_score,
                s.wards_placed,
                s.wards_killed,
                s.control_wards,
                s.turret_takedowns,
                s.dragon_kills,
                s.baron_kills,
            ])?;
        }
    }
    tx.commit()?;
    Ok(true)
}

/// Dos IDs informados, quais já estão no banco. A sincronização usa isso para
/// buscar na Riot apenas partidas novas (economiza o limite de requisições).
pub fn existing_ids(conn: &Connection, ids: &[String]) -> AppResult<HashSet<String>> {
    let mut stmt = conn.prepare_cached("SELECT 1 FROM matches WHERE match_id = ?1")?;
    let mut found = HashSet::new();
    for id in ids {
        if stmt.exists([id])? {
            found.insert(id.clone());
        }
    }
    Ok(found)
}

/// Partidas mais recentes do jogador, no formato usado pelas telas.
pub fn recent_for_player(
    conn: &Connection,
    puuid: &str,
    limit: u32,
) -> AppResult<Vec<MatchSummary>> {
    let mut stmt = conn.prepare(
        "SELECT m.match_id, m.queue_id,
                strftime('%Y-%m-%dT%H:%M:%fZ', m.started_at / 1000.0, 'unixepoch'),
                m.duration_sec, p.win,
                COALESCE(c.name, p.champion_name), p.team_position,
                s.kills, s.deaths, s.assists,
                s.minions_killed + s.neutral_minions,
                s.gold_earned, s.damage_to_champions, s.vision_score,
                (SELECT COALESCE(SUM(ts.kills), 0)
                   FROM participants tp JOIN player_stats ts ON ts.participant_id = tp.id
                  WHERE tp.match_id = p.match_id AND tp.team_id = p.team_id) AS team_kills,
                CASE WHEN c.image IS NULL THEN NULL
                     ELSE 'https://ddragon.leagueoflegends.com/cdn/' || c.version || '/img/champion/' || c.image END
           FROM participants p
           JOIN matches m ON m.match_id = p.match_id
           JOIN player_stats s ON s.participant_id = p.id
           LEFT JOIN champions c ON c.champion_id = p.champion_id
          WHERE p.puuid = ?1
          ORDER BY m.started_at DESC
          LIMIT ?2",
    )?;
    let rows = stmt.query_map(params![puuid, limit], |r| {
        let kills: i64 = r.get(7)?;
        let assists: i64 = r.get(9)?;
        let team_kills: i64 = r.get(14)?;
        Ok(MatchSummary {
            match_id: r.get(0)?,
            queue: queue_label(r.get(1)?),
            played_at: r.get(2)?,
            duration_sec: r.get(3)?,
            win: r.get(4)?,
            champion: r.get(5)?,
            champion_icon: r.get(15)?,
            position: r.get(6)?,
            kills,
            deaths: r.get(8)?,
            assists,
            cs: r.get(10)?,
            gold: r.get(11)?,
            damage: r.get(12)?,
            vision_score: r.get(13)?,
            kill_participation: if team_kills > 0 {
                ((kills + assists) as f64 / team_kills as f64).min(1.0)
            } else {
                0.0
            },
        })
    })?;
    Ok(rows.collect::<Result<_, _>>()?)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::Database;
    use crate::database::repo::fixtures::sample_match;

    #[test]
    fn stores_match_once_with_ten_participants() {
        let db = Database::open_in_memory().unwrap();
        db.with(|c| {
            let m = sample_match("BR1_1", "me", true, 1_000);
            assert!(insert(c, &m)?);
            assert!(!insert(c, &m)?, "segunda gravação deve ser ignorada");
            let matches: i64 = c.query_row("SELECT count(*) FROM matches", [], |r| r.get(0))?;
            let participants: i64 =
                c.query_row("SELECT count(*) FROM participants", [], |r| r.get(0))?;
            let stats: i64 = c.query_row("SELECT count(*) FROM player_stats", [], |r| r.get(0))?;
            assert_eq!((matches, participants, stats), (1, 10, 10));
            Ok(())
        })
        .unwrap();
    }

    #[test]
    fn recent_summary_maps_fields_for_the_ui() {
        let db = Database::open_in_memory().unwrap();
        db.with(|c| {
            insert(c, &sample_match("BR1_old", "me", false, 1_000))?;
            insert(c, &sample_match("BR1_new", "me", true, 2_000))?;
            let list = recent_for_player(c, "me", 10)?;
            assert_eq!(list.len(), 2);
            let latest = &list[0];
            assert_eq!(latest.match_id, "BR1_new");
            assert_eq!(latest.queue, "SOLO");
            assert_eq!(latest.played_at, "1970-01-01T00:00:02.000Z");
            assert!(latest.win);
            assert_eq!(latest.champion, "LeeSin");
            assert_eq!(latest.position, "JUNGLE");
            assert_eq!((latest.kills, latest.deaths, latest.assists), (10, 2, 8));
            assert_eq!(latest.cs, 150 + 60);
            // Time aliado: 10 (eu) + 4 * 5 = 30 abates; (10 + 8) / 30 = 0,6.
            assert!((latest.kill_participation - 0.6).abs() < 1e-9);
            assert!(recent_for_player(c, "outro", 10)?.is_empty());
            Ok(())
        })
        .unwrap();
    }

    #[test]
    fn uses_champion_display_name_when_available() {
        let db = Database::open_in_memory().unwrap();
        db.with(|c| {
            c.execute(
                "INSERT INTO champions (champion_id, key, name, version) VALUES (64, 'LeeSin', 'Lee Sin', '16.1.1')",
                [],
            )?;
            insert(c, &sample_match("BR1_1", "me", true, 1_000))?;
            assert_eq!(recent_for_player(c, "me", 1)?[0].champion, "Lee Sin");
            Ok(())
        })
        .unwrap();
    }

    #[test]
    fn existing_ids_and_cascade_delete() {
        let db = Database::open_in_memory().unwrap();
        db.with(|c| {
            insert(c, &sample_match("BR1_1", "me", true, 1_000))?;
            let ids = vec!["BR1_1".to_string(), "BR1_2".to_string()];
            let found = existing_ids(c, &ids)?;
            assert!(found.contains("BR1_1") && !found.contains("BR1_2"));

            c.execute("DELETE FROM matches WHERE match_id = 'BR1_1'", [])?;
            let orphans: i64 = c.query_row(
                "SELECT (SELECT count(*) FROM participants) + (SELECT count(*) FROM player_stats)",
                [],
                |r| r.get(0),
            )?;
            assert_eq!(
                orphans, 0,
                "participantes e estatísticas são removidos em cascata"
            );
            Ok(())
        })
        .unwrap();
    }
}
