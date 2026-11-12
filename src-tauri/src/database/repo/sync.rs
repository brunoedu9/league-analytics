use rusqlite::{Connection, OptionalExtension, params};

use crate::database::now_ms;
use crate::error::AppResult;

/// Abre um registro de sincronização com status `running` e devolve o id.
pub fn start(conn: &Connection, puuid: Option<&str>, kind: &str) -> AppResult<i64> {
    conn.execute(
        "INSERT INTO sync_history (puuid, kind, status, started_at) VALUES (?1, ?2, 'running', ?3)",
        params![puuid, kind, now_ms()],
    )?;
    Ok(conn.last_insert_rowid())
}

/// Fecha o registro: `Ok(n)` = sucesso com n partidas novas; `Err(msg)` = erro.
pub fn finish(conn: &Connection, id: i64, outcome: Result<i64, &str>) -> AppResult<()> {
    let (status, added, error) = match outcome {
        Ok(added) => ("success", added, None),
        Err(msg) => ("error", 0, Some(msg)),
    };
    conn.execute(
        "UPDATE sync_history SET status = ?2, matches_added = ?3, error = ?4, finished_at = ?5 WHERE id = ?1",
        params![id, status, added, error, now_ms()],
    )?;
    Ok(())
}

/// Momento da última sincronização bem-sucedida (de qualquer jogador).
pub fn last_success_at(conn: &Connection) -> AppResult<Option<i64>> {
    Ok(conn
        .query_row(
            "SELECT max(finished_at) FROM sync_history WHERE status = 'success'",
            [],
            |r| r.get::<_, Option<i64>>(0),
        )
        .optional()?
        .flatten())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::Database;

    #[test]
    fn tracks_success_and_error() {
        let db = Database::open_in_memory().unwrap();
        db.with(|c| {
            assert_eq!(last_success_at(c)?, None);
            let failed = start(c, Some("me"), "matches")?;
            finish(c, failed, Err("429 Rate Limit"))?;
            assert_eq!(
                last_success_at(c)?,
                None,
                "erro não conta como sincronizado"
            );
            let ok = start(c, Some("me"), "matches")?;
            finish(c, ok, Ok(12))?;
            assert!(last_success_at(c)?.is_some());
            let added: i64 = c.query_row(
                "SELECT matches_added FROM sync_history WHERE id = ?1",
                [ok],
                |r| r.get(0),
            )?;
            assert_eq!(added, 12);
            Ok(())
        })
        .unwrap();
    }
}
