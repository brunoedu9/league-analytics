//! Chave da Riot API de cada usuário (RNF03).
//!
//! Cada pessoa cadastra a própria chave na tela de Configurações. Ela fica no
//! cofre de credenciais do sistema operacional (Gerenciador de Credenciais do
//! Windows), nunca no código, no executável, no banco SQLite ou no Git.
//!
//! Ordem de busca:
//! 1. Cofre do sistema (cadastrada pelo usuário no app).
//! 2. Apenas em builds de desenvolvimento: `RIOT_API_KEY` no `.env` ou no ambiente.

use serde::Serialize;

use crate::error::{AppError, AppResult};

const SERVICE: &str = "league-analytics";
const ACCOUNT: &str = "riot-api-key";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum KeySource {
    /// Cadastrada pelo usuário no app (cofre do sistema).
    Vault,
    /// `.env`/variável de ambiente (só em desenvolvimento).
    Environment,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyStatus {
    pub configured: bool,
    pub source: Option<KeySource>,
    /// Ex.: "RGAPI-…07a9". A chave completa nunca vai para a interface.
    pub masked: Option<String>,
}

fn entry() -> AppResult<keyring::Entry> {
    keyring::Entry::new(SERVICE, ACCOUNT)
        .map_err(|e| AppError::Other(format!("cofre de credenciais indisponível: {e}")))
}

fn from_vault() -> Option<String> {
    entry()
        .ok()?
        .get_password()
        .ok()
        .filter(|k| !k.trim().is_empty())
}

#[cfg(debug_assertions)]
fn from_environment() -> Option<String> {
    let from_file = dotenvy::dotenv_iter().ok().and_then(|iter| {
        iter.filter_map(Result::ok)
            .find(|(k, _)| k == "RIOT_API_KEY")
            .map(|(_, v)| v)
    });
    from_file
        .or_else(|| std::env::var("RIOT_API_KEY").ok())
        .map(|k| k.trim().to_string())
        .filter(|k| !k.is_empty())
}

#[cfg(not(debug_assertions))]
fn from_environment() -> Option<String> {
    None
}

/// Chave atual e de onde veio.
pub fn current() -> Option<(String, KeySource)> {
    from_vault()
        .map(|k| (k, KeySource::Vault))
        .or_else(|| from_environment().map(|k| (k, KeySource::Environment)))
}

/// Chave para as requisições, ou erro orientando o usuário a cadastrá-la.
pub fn require() -> AppResult<String> {
    current().map(|(k, _)| k).ok_or(AppError::RiotKeyMissing)
}

pub fn mask(key: &str) -> String {
    let tail: String = key
        .chars()
        .rev()
        .take(4)
        .collect::<Vec<_>>()
        .into_iter()
        .rev()
        .collect();
    format!("RGAPI-…{tail}")
}

pub fn status() -> KeyStatus {
    match current() {
        Some((key, source)) => KeyStatus {
            configured: true,
            source: Some(source),
            masked: Some(mask(&key)),
        },
        None => KeyStatus {
            configured: false,
            source: None,
            masked: None,
        },
    }
}

/// Formato da Riot: `RGAPI-` + UUID (8-4-4-4-12 hexadecimais).
pub fn normalize(input: &str) -> AppResult<String> {
    let key = input.trim();
    let invalid = || {
        AppError::InvalidInput(
            "formato de chave inválido. Copie a chave completa do Riot Developer Portal (começa com RGAPI-)".into(),
        )
    };
    let uuid = key.strip_prefix("RGAPI-").ok_or_else(invalid)?;
    let groups: Vec<&str> = uuid.split('-').collect();
    let lengths_ok = groups.iter().map(|g| g.len()).eq([8, 4, 4, 4, 12]);
    let hex_ok = groups
        .iter()
        .all(|g| g.chars().all(|c| c.is_ascii_hexdigit()));
    if lengths_ok && hex_ok {
        Ok(key.to_string())
    } else {
        Err(invalid())
    }
}

pub fn save(key: &str) -> AppResult<()> {
    entry()?
        .set_password(key)
        .map_err(|e| AppError::Other(format!("não foi possível salvar a chave no cofre: {e}")))
}

pub fn remove() -> AppResult<()> {
    match entry()?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(AppError::Other(format!(
            "não foi possível remover a chave: {e}"
        ))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_key_format() {
        let ok = "RGAPI-0123abcd-4567-89ef-0123-456789abcdef";
        assert_eq!(normalize(&format!("  {ok}\n")).unwrap(), ok);
        assert!(normalize("0123abcd-4567-89ef-0123-456789abcdef").is_err());
        assert!(normalize("RGAPI-xyz").is_err());
        assert!(normalize("RGAPI-0123abcd-4567-89ef-0123-456789abcdeZ").is_err());
    }

    #[test]
    fn masks_all_but_last_four() {
        assert_eq!(
            mask("RGAPI-0123abcd-4567-89ef-0123-456789abcdef"),
            "RGAPI-…cdef"
        );
    }

    /// Usa uma entrada de teste separada para não tocar na chave real do usuário.
    /// Rode com: cargo test windows_vault -- --ignored
    #[test]
    #[ignore = "usa o Gerenciador de Credenciais do Windows"]
    fn windows_vault_roundtrip() {
        let e = keyring::Entry::new(SERVICE, "teste-automatizado").unwrap();
        e.set_password("RGAPI-00000000-0000-0000-0000-000000000000")
            .unwrap();
        assert_eq!(
            e.get_password().unwrap(),
            "RGAPI-00000000-0000-0000-0000-000000000000"
        );
        e.delete_credential().unwrap();
        assert!(matches!(e.get_password(), Err(keyring::Error::NoEntry)));
    }

    /// Rode com: cargo test live_validate -- --ignored (precisa de RIOT_API_KEY no .env).
    #[tokio::test]
    #[ignore = "acessa a Riot API"]
    async fn live_validate_key() {
        let riot = crate::services::riot::RiotClient::new().unwrap();
        let good = from_environment().expect("RIOT_API_KEY no .env");
        riot.validate_key(&good, "br1")
            .await
            .expect("chave válida aceita");
        let bad = "RGAPI-00000000-0000-0000-0000-000000000000";
        assert!(matches!(
            riot.validate_key(bad, "br1").await,
            Err(AppError::RiotKey)
        ));
    }
}
