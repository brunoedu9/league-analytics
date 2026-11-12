//! Integrações externas e casos de uso que as combinam com o banco local.
//!
//! - `riot`: cliente da Riot API (chave via `.env`, controle de ritmo, 429).
//! - `player`: pesquisa de jogador por Riot ID, com fallback para dados locais.
//!
//! Planejado: `ddragon` (dados estáticos) e `sync` (partidas → SQLite).

pub mod player;
pub mod riot;
