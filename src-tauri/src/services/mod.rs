//! Integrações externas e sincronização (RF11).
//!
//! Planejado:
//! - `riot`: cliente da Riot API, com respeito aos rate limits. A chave de
//!   desenvolvimento é lida de variável de ambiente, nunca do código ou do executável.
//! - `ddragon`: dados estáticos (campeões, ícones) via Data Dragon.
//! - `sync`: grava os dados da Riot no SQLite e registra em `sync_history`.
