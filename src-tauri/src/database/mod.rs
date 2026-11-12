//! Acesso ao SQLite local (RF10, RNF04).
//!
//! O banco fica no diretório de dados do aplicativo. Todas as telas leem daqui;
//! a Riot API só escreve por meio da sincronização. Modelo: `docs/DATABASE.md`.

pub mod migrations;
// As funções de escrita (insert/upsert/record) serão usadas pela sincronização
// com a Riot API (etapa 6); até lá só os testes as chamam.
#[allow(dead_code)]
pub mod models;
#[allow(dead_code)]
pub mod repo;

use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::Connection;

use crate::error::{AppError, AppResult};

/// Nome do arquivo do banco dentro do diretório de dados do app.
pub const DB_FILE_NAME: &str = "league-analytics.db";

/// Conexão única protegida por mutex. O volume de acesso de um app desktop
/// não justifica um pool; trocar por um pool depois não afeta os repositórios.
pub struct Database {
    conn: Mutex<Connection>,
    path: Option<PathBuf>,
}

impl Database {
    /// Abre (ou cria) o banco em `path` e aplica as migrations pendentes.
    pub fn open(path: &Path) -> AppResult<Self> {
        if let Some(dir) = path.parent() {
            std::fs::create_dir_all(dir)?;
        }
        let conn = Connection::open(path)?;
        Self::init(conn, Some(path.to_path_buf()))
    }

    /// Banco em memória, usado nos testes.
    #[cfg(test)]
    pub fn open_in_memory() -> AppResult<Self> {
        Self::init(Connection::open_in_memory()?, None)
    }

    fn init(mut conn: Connection, path: Option<PathBuf>) -> AppResult<Self> {
        conn.pragma_update(None, "foreign_keys", true)?;
        // WAL: leituras não bloqueiam a escrita da sincronização.
        conn.query_row("PRAGMA journal_mode = WAL", [], |_| Ok(()))?;
        conn.pragma_update(None, "synchronous", "NORMAL")?;
        migrations::run(&mut conn)?;
        Ok(Self {
            conn: Mutex::new(conn),
            path,
        })
    }

    pub fn path(&self) -> Option<&Path> {
        self.path.as_deref()
    }

    /// Executa `f` com acesso exclusivo à conexão.
    pub fn with<T>(&self, f: impl FnOnce(&mut Connection) -> AppResult<T>) -> AppResult<T> {
        let mut conn = self
            .conn
            .lock()
            .map_err(|_| AppError::Other("conexão com o banco indisponível".into()))?;
        f(&mut conn)
    }
}

/// Agora, em milissegundos desde a época Unix (convenção de datas do banco).
pub fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or_default()
}
