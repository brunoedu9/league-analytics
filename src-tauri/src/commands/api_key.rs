//! Cadastro da chave da Riot API pelo próprio usuário.

use tauri::State;

use crate::error::AppResult;
use crate::services::riot::RiotClient;
use crate::services::riot::api_key::{self, KeyStatus};

/// Se há chave configurada (mascarada) e de onde ela vem.
#[tauri::command]
pub fn get_api_key_status() -> KeyStatus {
    api_key::status()
}

/// Valida o formato, testa a chave na Riot e só então salva no cofre do sistema.
#[tauri::command]
pub async fn set_api_key(riot: State<'_, RiotClient>, key: String) -> AppResult<KeyStatus> {
    let key = api_key::normalize(&key)?;
    riot.validate_key(&key, "br1").await?;
    api_key::save(&key)?;
    Ok(api_key::status())
}

/// Remove a chave do cofre do sistema.
#[tauri::command]
pub fn remove_api_key() -> AppResult<KeyStatus> {
    api_key::remove()?;
    Ok(api_key::status())
}
