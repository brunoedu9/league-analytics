//! Comandos de sincronização com a Riot API.

use tauri::{AppHandle, Emitter, State};

use crate::database::Database;
use crate::error::AppResult;
use crate::services::ddragon;
use crate::services::riot::RiotClient;
use crate::services::sync::{self, SyncLock, SyncProgress, SyncResult};

/// Evento emitido a cada partida baixada: `{ puuid, done, total }`.
pub const SYNC_PROGRESS_EVENT: &str = "sync-progress";

/// Baixa as partidas que faltam do jogador e atualiza os campeões do Data Dragon.
#[tauri::command]
pub async fn sync_player_matches(
    app: AppHandle,
    db: State<'_, Database>,
    riot: State<'_, RiotClient>,
    lock: State<'_, SyncLock>,
    puuid: String,
    count: Option<u32>,
) -> AppResult<SyncResult> {
    // Nomes/ícones dos campeões: falha aqui não impede a sincronização.
    let _ = ddragon::ensure_champions(&db, riot.http()).await;

    let emit = move |p: SyncProgress| {
        let _ = app.emit(SYNC_PROGRESS_EVENT, p);
    };
    sync::sync_matches(&db, &riot, &lock, &puuid, count.unwrap_or(20), &emit).await
}
