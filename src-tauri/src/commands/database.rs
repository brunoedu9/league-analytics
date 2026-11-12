//! Comandos de leitura do banco local. Funcionam sem internet (RNF04).

use tauri::State;

use crate::database::models::{DbStatus, MatchSummary, PlayerRecord, RankSnapshot};
use crate::database::{Database, repo};
use crate::error::AppResult;

#[tauri::command]
pub fn db_status(db: State<'_, Database>) -> AppResult<DbStatus> {
    repo::status::status(&db)
}

#[tauri::command]
pub fn get_setting(db: State<'_, Database>, key: String) -> AppResult<Option<String>> {
    db.with(|c| repo::settings::get(c, &key))
}

#[tauri::command]
pub fn set_setting(db: State<'_, Database>, key: String, value: String) -> AppResult<()> {
    db.with(|c| repo::settings::set(c, &key, &value))
}

#[tauri::command]
pub fn find_player(
    db: State<'_, Database>,
    game_name: String,
    tag_line: String,
) -> AppResult<Option<PlayerRecord>> {
    db.with(|c| repo::players::find_by_riot_id(c, &game_name, &tag_line))
}

#[tauri::command]
pub fn get_player_ranks(db: State<'_, Database>, puuid: String) -> AppResult<Vec<RankSnapshot>> {
    db.with(|c| repo::ranks::latest(c, &puuid))
}

/// Histórico de elo de uma fila (padrão: Solo/Duo), do mais antigo ao mais recente.
#[tauri::command]
pub fn get_rank_history(
    db: State<'_, Database>,
    puuid: String,
    queue: Option<String>,
    limit: Option<u32>,
) -> AppResult<Vec<repo::ranks::RankPoint>> {
    let queue = queue.unwrap_or_else(|| "RANKED_SOLO_5x5".into());
    let limit = limit.unwrap_or(200).min(1000);
    db.with(|c| repo::ranks::history(c, &puuid, &queue, limit))
}

#[tauri::command]
pub fn get_recent_matches(
    db: State<'_, Database>,
    puuid: String,
    limit: Option<u32>,
) -> AppResult<Vec<MatchSummary>> {
    let limit = limit.unwrap_or(20).min(500);
    db.with(|c| repo::matches::recent_for_player(c, &puuid, limit))
}
