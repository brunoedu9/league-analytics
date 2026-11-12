//! Cliente da Riot Games API.
//!
//! - A chave é a do próprio usuário, cadastrada em Configurações e guardada no
//!   cofre de credenciais do sistema (ver `api_key`). Nunca é embutida no código
//!   nem no executável (RNF03). É lida a cada requisição, então trocar a chave
//!   não exige reiniciar o app.
//! - Cada roteamento tem seu próprio controle de ritmo.
//! - 429: espera o `Retry-After` e tenta de novo (até 3 vezes).

pub mod api_key;
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

    /// Testa uma chave (ainda não salva) com uma chamada leve: status da plataforma.
    pub async fn validate_key(&self, key: &str, platform: &str) -> AppResult<()> {
        self.throttle(platform).await;
        let response = self
            .http
            .get(format!(
                "https://{platform}.api.riotgames.com/lol/status/v4/platform-data"
            ))
            .header("X-Riot-Token", key)
            .send()
            .await
            .map_err(|e| AppError::Network(e.to_string()))?;
        match response.status() {
            s if s.is_success() => Ok(()),
            StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN => Err(AppError::RiotKey),
            StatusCode::TOO_MANY_REQUESTS => Ok(()), // a chave existe; só está no limite
            s => Err(AppError::RiotUnavailable(s.as_u16())),
        }
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
        let key = api_key::require()?;
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
