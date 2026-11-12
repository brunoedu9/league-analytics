# services

Camada de aplicação do frontend. Cada serviço encapsula chamadas `invoke()` aos
comandos Tauri (Rust). Os componentes nunca chamam a Riot API diretamente: todo
dado vem do SQLite local via Rust, e a sincronização com a Riot é um processo
separado (ver `docs/ARCHITECTURE.md`).
