//! League Analytics — backend nativo (camada de infraestrutura).
//!
//! - `commands`: comandos Tauri expostos ao frontend (`invoke`).
//! - `database`: acesso ao SQLite local e migrations.
//! - `services`: integração com Riot API, Data Dragon e sincronização.
//!
//! Regra central: o frontend lê sempre do SQLite local. A Riot API só é usada
//! na sincronização, então o app continua funcionando com dados salvos quando
//! a API ou a internet estiverem indisponíveis.

mod commands;
mod database;
mod error;
mod services;

use tauri::Manager;

use database::{DB_FILE_NAME, Database};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let path = app.path().app_data_dir()?.join(DB_FILE_NAME);
            let db = Database::open(&path)?;
            app.manage(db);
            app.manage(services::riot::RiotClient::new()?);
            app.manage(services::sync::SyncLock::default());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::app::app_info,
            commands::api_key::get_api_key_status,
            commands::api_key::set_api_key,
            commands::api_key::remove_api_key,
            commands::player::search_player,
            commands::player::get_player_profile,
            commands::player::list_players,
            commands::sync::sync_player_matches,
            commands::matches::get_match_details,
            commands::matches::get_match_timeline,
            commands::database::db_status,
            commands::database::get_setting,
            commands::database::set_setting,
            commands::database::find_player,
            commands::database::get_player_ranks,
            commands::database::get_recent_matches,
            commands::database::get_rank_history,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
