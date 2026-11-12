use rusqlite::Connection;

use crate::database::models::DbStatus;
use crate::database::{Database, migrations, repo};
use crate::error::AppResult;

fn count(conn: &Connection, table: &str) -> AppResult<i64> {
    Ok(conn.query_row(&format!("SELECT count(*) FROM {table}"), [], |r| r.get(0))?)
}

/// Resumo do banco local para a tela de Configurações.
pub fn status(db: &Database) -> AppResult<DbStatus> {
    let path = db.path().map(|p| p.display().to_string());
    let size_bytes = db
        .path()
        .and_then(|p| std::fs::metadata(p).ok())
        .map(|m| m.len());
    db.with(|c| {
        Ok(DbStatus {
            path,
            schema_version: migrations::current_version(c)?,
            players: count(c, "players")?,
            matches: count(c, "matches")?,
            participants: count(c, "participants")?,
            rank_snapshots: count(c, "rank_history")?,
            size_bytes,
            last_sync_at: repo::sync::last_success_at(c)?,
        })
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::repo::{fixtures, matches};

    #[test]
    fn counts_rows() {
        let db = Database::open_in_memory().unwrap();
        db.with(|c| {
            matches::insert(c, &fixtures::sample_match("BR1_1", "me", true, 1)).map(|_| ())
        })
        .unwrap();
        let s = status(&db).unwrap();
        assert_eq!(s.schema_version, migrations::latest_version());
        assert_eq!((s.matches, s.participants, s.players), (1, 10, 0));
        assert!(s.path.is_none());
    }
}
