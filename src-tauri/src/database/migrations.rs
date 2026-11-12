//! Migrations versionadas com `PRAGMA user_version`.
//!
//! Cada arquivo em `src-tauri/migrations/` é embutido no executável e aplicado
//! uma única vez, em ordem, dentro de uma transação. Para mudar o esquema,
//! adicione um novo arquivo ao final de `MIGRATIONS`; nunca edite um existente.

use rusqlite::Connection;

use crate::error::{AppError, AppResult};

const MIGRATIONS: &[&str] = &[include_str!("../../migrations/0001_initial.sql")];

/// Versão de esquema que este executável conhece.
pub fn latest_version() -> u32 {
    MIGRATIONS.len() as u32
}

pub fn current_version(conn: &Connection) -> AppResult<u32> {
    Ok(conn.pragma_query_value(None, "user_version", |row| row.get(0))?)
}

/// Aplica as migrations pendentes e devolve a versão final do esquema.
pub fn run(conn: &mut Connection) -> AppResult<u32> {
    let current = current_version(conn)?;
    if current > latest_version() {
        return Err(AppError::Other(format!(
            "o banco local está na versão {current}, mais nova que a suportada por este app ({}). Atualize o aplicativo.",
            latest_version()
        )));
    }
    for (index, sql) in MIGRATIONS.iter().enumerate().skip(current as usize) {
        let tx = conn.transaction()?;
        tx.execute_batch(sql)?;
        tx.pragma_update(None, "user_version", (index + 1) as u32)?;
        tx.commit()?;
    }
    current_version(conn)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn applies_all_migrations_once() {
        let mut conn = Connection::open_in_memory().unwrap();
        assert_eq!(run(&mut conn).unwrap(), latest_version());
        // Rodar de novo não reaplica nada nem falha.
        assert_eq!(run(&mut conn).unwrap(), latest_version());
        let tables: i64 = conn
            .query_row(
                "SELECT count(*) FROM sqlite_master WHERE type = 'table'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(tables, 8);
    }

    #[test]
    fn refuses_newer_schema() {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.pragma_update(None, "user_version", latest_version() + 1)
            .unwrap();
        assert!(run(&mut conn).is_err());
    }
}
