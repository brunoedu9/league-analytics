//! Controle de ritmo das requisições, por valor de roteamento (br1, americas...).
//!
//! A Riot aplica os limites da aplicação separadamente para cada roteamento.
//! Com chave de desenvolvimento/pessoal: 20 requisições/1 s e 100/2 min.

use std::collections::VecDeque;
use std::time::{Duration, Instant};

/// Uma janela deslizante: no máximo `max` requisições a cada `period`.
#[derive(Debug, Clone, Copy)]
pub struct Window {
    pub max: usize,
    pub period: Duration,
}

/// Limites da chave de desenvolvimento e da chave pessoal.
pub const DEV_KEY_WINDOWS: [Window; 2] = [
    Window {
        max: 20,
        period: Duration::from_secs(1),
    },
    Window {
        max: 100,
        period: Duration::from_secs(120),
    },
];

/// Guarda os instantes das requisições recentes de um roteamento.
#[derive(Debug)]
pub struct RateLimiter {
    windows: Vec<Window>,
    sent: VecDeque<Instant>,
}

impl RateLimiter {
    pub fn new(windows: &[Window]) -> Self {
        Self {
            windows: windows.to_vec(),
            sent: VecDeque::new(),
        }
    }

    /// Tenta reservar uma requisição em `now`.
    /// `None` = pode enviar (e a requisição foi registrada);
    /// `Some(d)` = espere `d` e tente de novo.
    pub fn try_acquire(&mut self, now: Instant) -> Option<Duration> {
        let longest = self
            .windows
            .iter()
            .map(|w| w.period)
            .max()
            .unwrap_or_default();
        while let Some(&oldest) = self.sent.front() {
            if now.duration_since(oldest) >= longest {
                self.sent.pop_front();
            } else {
                break;
            }
        }

        let mut wait = Duration::ZERO;
        for w in &self.windows {
            let in_window: Vec<&Instant> = self
                .sent
                .iter()
                .filter(|t| now.duration_since(**t) < w.period)
                .collect();
            if in_window.len() >= w.max {
                // Libera quando a requisição mais antiga desta janela sair dela.
                let oldest = in_window[in_window.len() - w.max];
                wait = wait.max(w.period - now.duration_since(*oldest));
            }
        }

        if wait.is_zero() {
            self.sent.push_back(now);
            None
        } else {
            Some(wait)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn allows_up_to_the_short_window_then_waits() {
        let mut rl = RateLimiter::new(&DEV_KEY_WINDOWS);
        let t0 = Instant::now();
        for _ in 0..20 {
            assert_eq!(rl.try_acquire(t0), None);
        }
        let wait = rl
            .try_acquire(t0)
            .expect("21ª requisição no mesmo segundo espera");
        assert_eq!(wait, Duration::from_secs(1));
        assert_eq!(rl.try_acquire(t0 + Duration::from_secs(1)), None);
    }

    #[test]
    fn enforces_the_two_minute_window() {
        let mut rl = RateLimiter::new(&DEV_KEY_WINDOWS);
        let t0 = Instant::now();
        // 100 requisições espaçadas (20 por segundo, em 5 segundos).
        for i in 0..100u64 {
            let t = t0 + Duration::from_millis(i / 20 * 1000);
            assert_eq!(rl.try_acquire(t), None, "requisição {i}");
        }
        let t = t0 + Duration::from_secs(10);
        let wait = rl
            .try_acquire(t)
            .expect("101ª requisição espera a janela de 2 min");
        assert_eq!(wait, Duration::from_secs(110));
    }
}
