use serde::Serialize;

#[derive(Serialize)]
pub struct AppInfo {
    pub name: &'static str,
    pub version: &'static str,
}

/// Informações básicas do aplicativo. Serve também como teste da ponte frontend ↔ Rust.
#[tauri::command]
pub fn app_info() -> AppInfo {
    AppInfo {
        name: "League Analytics",
        version: env!("CARGO_PKG_VERSION"),
    }
}
