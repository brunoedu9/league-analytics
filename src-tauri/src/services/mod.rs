//! Integrações externas e casos de uso que as combinam com o banco local.
//!
//! - `riot`: cliente da Riot API (chave via `.env`, controle de ritmo, 429).
//! - `player`: pesquisa de jogador por Riot ID, com fallback para dados locais.
//! - `sync`: partidas da Riot → SQLite (só as que faltam).
//! - `ddragon`: nomes e ícones dos campeões (Data Dragon).

pub mod ddragon;
pub mod player;
pub mod riot;
pub mod sync;
