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
mod services;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![commands::app::app_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
