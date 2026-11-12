use rusqlite::{Connection, OptionalExtension, Row, params};

use crate::database::models::PlayerRecord;
use crate::error::AppResult;

const COLUMNS: &str = "puuid, game_name, tag_line, platform, profile_icon_id, summoner_level, updated_at, last_synced_at";

fn from_row(row: &Row) -> rusqlite::Result<PlayerRecord> {
    Ok(PlayerRecord {
        puuid: row.get(0)?,
        game_name: row.get(1)?,
        tag_line: row.get(2)?,
        platform: row.get(3)?,
        profile_icon_id: row.get(4)?,
        summoner_level: row.get(5)?,
        updated_at: row.get(6)?,
        last_synced_at: row.get(7)?,
    })
}

/// Cria ou atualiza o perfil. `last_synced_at` só muda se vier preenchido.
pub fn upsert(conn: &Connection, player: &PlayerRecord) -> AppResult<()> {
    conn.execute(
        &format!(
            "INSERT INTO players ({COLUMNS}) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
             ON CONFLICT (puuid) DO UPDATE SET
                game_name = excluded.game_name,
                tag_line = excluded.tag_line,
                platform = excluded.platform,
                profile_icon_id = excluded.profile_icon_id,
                summoner_level = excluded.summoner_level,
                updated_at = excluded.updated_at,
                last_synced_at = COALESCE(excluded.last_synced_at, players.last_synced_at)"
        ),
        params![
            player.puuid,
            player.game_name,
            player.tag_line,
            player.platform,
            player.profile_icon_id,
            player.summoner_level,
            player.updated_at,
            player.last_synced_at,
        ],
    )?;
    Ok(())
}

pub fn get(conn: &Connection, puuid: &str) -> AppResult<Option<PlayerRecord>> {
    Ok(conn
        .query_row(
            &format!("SELECT {COLUMNS} FROM players WHERE puuid = ?1"),
            [puuid],
            from_row,
        )
        .optional()?)
}

/// Busca pelo Riot ID sem diferenciar maiúsculas (permite pesquisar offline).
pub fn find_by_riot_id(
    conn: &Connection,
    game_name: &str,
    tag_line: &str,
) -> AppResult<Option<PlayerRecord>> {
    Ok(conn
        .query_row(
            &format!(
                "SELECT {COLUMNS} FROM players
                 WHERE lower(game_name) = lower(?1) AND lower(tag_line) = lower(?2)
                 ORDER BY updated_at DESC LIMIT 1"
            ),
            [game_name, tag_line],
            from_row,
        )
        .optional()?)
}

pub fn mark_synced(conn: &Connection, puuid: &str, at: i64) -> AppResult<()> {
    conn.execute(
        "UPDATE players SET last_synced_at = ?2 WHERE puuid = ?1",
        params![puuid, at],
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::Database;
    use crate::database::repo::fixtures::player;

    #[test]
    fn upsert_and_find_case_insensitive() {
        let db = Database::open_in_memory().unwrap();
        db.with(|c| {
            upsert(c, &player("p1", "Brunoedu9", "br1"))?;
            let found = find_by_riot_id(c, "BRUNOEDU9", "BR1")?.expect("encontrado");
            assert_eq!(found.puuid, "p1");
            assert!(find_by_riot_id(c, "outro", "br1")?.is_none());
            Ok(())
        })
        .unwrap();
    }

    #[test]
    fn upsert_keeps_last_sync_when_not_provided() {
        let db = Database::open_in_memory().unwrap();
        db.with(|c| {
            upsert(c, &player("p1", "Nome", "BR1"))?;
            mark_synced(c, "p1", 500)?;
            let mut renamed = player("p1", "NovoNome", "BR1");
            renamed.summoner_level = 120;
            upsert(c, &renamed)?;
            let p = get(c, "p1")?.unwrap();
            assert_eq!(p.game_name, "NovoNome");
            assert_eq!(p.summoner_level, 120);
            assert_eq!(p.last_synced_at, Some(500));
            Ok(())
        })
        .unwrap();
    }
}
