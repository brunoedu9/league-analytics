use serde::{Serialize, Serializer};

/// Erro único da aplicação, serializado como texto para o frontend.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("erro no banco de dados local: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("erro de arquivo: {0}")]
    Io(#[from] std::io::Error),

    #[error("cadastre sua chave da Riot API em Configurações para buscar dados novos")]
    RiotKeyMissing,

    #[error(
        "a chave da Riot API foi recusada (inválida ou expirada). Gere uma nova no Riot Developer Portal e atualize em Configurações"
    )]
    RiotKey,

    #[error("jogador não encontrado")]
    NotFound,

    #[error("sem conexão com a Riot API ({0})")]
    Network(String),

    #[error("Riot API indisponível no momento (HTTP {0})")]
    RiotUnavailable(u16),

    #[error("{0}")]
    InvalidInput(String),

    #[error("{0}")]
    Other(String),
}

impl AppError {
    /// Falhas em que faz sentido mostrar os dados locais (offline-first).
    pub fn is_remote_failure(&self) -> bool {
        matches!(
            self,
            AppError::RiotKey
                | AppError::RiotKeyMissing
                | AppError::Network(_)
                | AppError::RiotUnavailable(_)
        )
    }
}

impl Serialize for AppError {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
