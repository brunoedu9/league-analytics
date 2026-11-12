//! Comandos de análise de partida (RF04).

use tauri::State;

use crate::database::models::MatchDetails;
use crate::database::repo::timelines::Timeline;
use crate::database::{Database, repo};
use crate::error::{AppError, AppResult};
use crate::services::riot::RiotClient;
use crate::services::timeline;

/// Partida completa (10 participantes), lida do banco local.
#[tauri::command]
pub fn get_match_details(db: State<'_, Database>, match_id: String) -> AppResult<MatchDetails> {
    db.with(|c| repo::matches::details(c, &match_id))?
        .ok_or(AppError::NotFound)
}

/// Ouro por participante ao longo da partida. Usa o cache local; na primeira
/// vez, busca na Riot (precisa de internet e chave válida).
#[tauri::command]
pub async fn get_match_timeline(
    db: State<'_, Database>,
    riot: State<'_, RiotClient>,
    match_id: String,
) -> AppResult<Timeline> {
    timeline::get_or_fetch(&db, &riot, &match_id).await
}
