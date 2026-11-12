//! Repositórios: uma função por operação, recebendo a conexão.
//! Não guardam estado; quem chama decide a transação e o lock.

pub mod champions;
pub mod matches;
pub mod players;
pub mod ranks;
pub mod settings;
pub mod status;
pub mod sync;
pub mod timelines;

#[cfg(test)]
pub(crate) mod fixtures;
