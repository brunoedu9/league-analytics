//! Cliente da Riot Games API.
//!
//! - A chave vem de `RIOT_API_KEY` (arquivo `.env` em desenvolvimento ou
//!   variável de ambiente). Nunca é embutida no código nem no executável (RNF03).
//!   O `.env` é relido a cada requisição, então trocar a chave diária não
//!   exige reiniciar o app.
//! - Cada roteamento tem seu próprio controle de ritmo.
//! - 429: espera o `Retry-After` e tenta de novo (até 3 vezes).

pub mod dto;
pub mod rate_limit;
pub mod routing;

use std::collections::HashMap;
use std::time::{Duration, Instant};

use reqwest::StatusCode;
use serde::de::DeserializeOwned;
use tokio::sync::Mutex;

use crate::error::{AppError, AppResult};
use rate_limit::{DEV_KEY_WINDOWS, RateLimiter};

const MAX_ATTEMPTS: usize = 3;

pub struct RiotClient {
    http: reqwest::Client,
    limiters: Mutex<HashMap<String, RateLimiter>>,
}

impl RiotClient {
    pub fn new() -> AppResult<Self> {
        let http = reqwest::Client::builder()
            .timeout(Duration::from_secs(15))
            .user_agent(concat!("league-analytics/", env!("CARGO_PKG_VERSION")))
            .build()
            .map_err(|e| AppError::Other(format!("falha ao iniciar o cliente HTTP: {e}")))?;
        Ok(Self {
            http,
            limiters: Mutex::new(HashMap::new()),
        })
    }

    /// Cliente HTTP compartilhado (também usado pelo Data Dragon).
    pub fn http(&self) -> &reqwest::Client {
        &self.http
    }

    /// Lê a chave do `.env` (sem alterar o ambiente do processo) ou da variável de ambiente.
    fn api_key() -> AppResult<String> {
        let from_file = dotenvy::dotenv_iter().ok().and_then(|iter| {
            iter.filter_map(Result::ok)
                .find(|(k, _)| k == "RIOT_API_KEY")
                .map(|(_, v)| v)
        });
        from_file
            .or_else(|| std::env::var("RIOT_API_KEY").ok())
            .map(|k| k.trim().to_string())
            .filter(|k| !k.is_empty())
            .ok_or(AppError::RiotKey)
    }

    /// Espera até poder enviar uma requisição para `routing`.
    async fn throttle(&self, routing: &str) {
        loop {
            let wait = {
                let mut limiters = self.limiters.lock().await;
                limiters
                    .entry(routing.to_string())
                    .or_insert_with(|| RateLimiter::new(&DEV_KEY_WINDOWS))
                    .try_acquire(Instant::now())
            };
            match wait {
                None => return,
                Some(d) => tokio::time::sleep(d).await,
            }
        }
    }

    /// GET em `https://{routing}.api.riotgames.com{path}`.
    pub async fn get<T: DeserializeOwned>(&self, routing: &str, path: &str) -> AppResult<T> {
        let key = Self::api_key()?;
        let url = format!("https://{routing}.api.riotgames.com{path}");
        for _ in 0..MAX_ATTEMPTS {
            self.throttle(routing).await;
            let response = self
                .http
                .get(&url)
                .header("X-Riot-Token", &key)
                .send()
                .await
                .map_err(|e| AppError::Network(e.to_string()))?;

            let status = response.status();
            if status.is_success() {
                return response
                    .json::<T>()
                    .await
                    .map_err(|e| AppError::Other(format!("resposta inesperada da Riot: {e}")));
            }
            match status {
                StatusCode::TOO_MANY_REQUESTS => {
                    let secs = response
                        .headers()
                        .get("retry-after")
                        .and_then(|v| v.to_str().ok())
                        .and_then(|v| v.parse::<u64>().ok())
                        .unwrap_or(2);
                    tokio::time::sleep(Duration::from_secs(secs)).await;
                }
                StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN => return Err(AppError::RiotKey),
                StatusCode::NOT_FOUND => return Err(AppError::NotFound),
                s if s.is_server_error() => {
                    return Err(AppError::RiotUnavailable(s.as_u16()));
                }
                s => return Err(AppError::Other(format!("Riot API respondeu {s}"))),
            }
        }
        Err(AppError::RiotUnavailable(429))
    }
}
