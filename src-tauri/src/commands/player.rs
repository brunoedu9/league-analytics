//! Comandos de jogador: pesquisa (Riot + banco) e leitura do perfil salvo.

use tauri::State;

use crate::database::models::PlayerRecord;
use crate::database::{Database, repo};
use crate::error::AppResult;
use crate::services::player::{self, PlayerProfile};
use crate::services::riot::RiotClient;

/// Pesquisa por Riot ID. Atualiza o banco com os dados da Riot ou, se ela
/// estiver inacessível, devolve o perfil salvo com um aviso.
#[tauri::command]
pub async fn search_player(
    db: State<'_, Database>,
    riot: State<'_, RiotClient>,
    game_name: String,
    tag_line: String,
    platform: String,
) -> AppResult<PlayerProfile> {
    player::search(&db, &riot, &game_name, &tag_line, &platform).await
}

/// Perfil salvo no banco local (funciona sem internet).
#[tauri::command]
pub fn get_player_profile(db: State<'_, Database>, puuid: String) -> AppResult<PlayerProfile> {
    player::load(&db, &puuid, "local", None)
}

/// Jogadores já consultados, para a lista de "pesquisas recentes".
#[tauri::command]
pub fn list_players(db: State<'_, Database>, limit: Option<u32>) -> AppResult<Vec<PlayerRecord>> {
    let limit = limit.unwrap_or(10).min(100);
    db.with(|c| repo::players::list_recent(c, limit))
}
