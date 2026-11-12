use rusqlite::{Connection, OptionalExtension, params};

use crate::database::now_ms;
use crate::error::AppResult;

pub fn get(conn: &Connection, key: &str) -> AppResult<Option<String>> {
    Ok(conn
        .query_row("SELECT value FROM settings WHERE key = ?1", [key], |r| {
            r.get(0)
        })
        .optional()?)
}

pub fn set(conn: &Connection, key: &str, value: &str) -> AppResult<()> {
    conn.execute(
        "INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3)
         ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        params![key, value, now_ms()],
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::Database;

    #[test]
    fn set_and_overwrite() {
        let db = Database::open_in_memory().unwrap();
        db.with(|c| {
            assert_eq!(get(c, "region")?, None);
            set(c, "region", "br1")?;
            set(c, "region", "euw1")?;
            assert_eq!(get(c, "region")?.as_deref(), Some("euw1"));
            Ok(())
        })
        .unwrap();
    }
}
