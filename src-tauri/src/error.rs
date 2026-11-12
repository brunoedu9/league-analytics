use serde::{Serialize, Serializer};

/// Erro único da aplicação, serializado como texto para o frontend.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("erro no banco de dados local: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("erro de arquivo: {0}")]
    Io(#[from] std::io::Error),

    #[error("{0}")]
    Other(String),
}

impl Serialize for AppError {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
