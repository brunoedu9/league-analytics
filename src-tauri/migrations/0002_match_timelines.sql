-- 0002 — Linha do tempo das partidas (match-v5 timeline), em cache.
--
-- Guardamos só o necessário para os gráficos de evolução: o ouro total de cada
-- participante a cada quadro (normalmente 1 por minuto). A resposta completa da
-- Riot tem centenas de KB; este resumo tem poucos KB.

CREATE TABLE match_timelines (
    match_id           TEXT PRIMARY KEY REFERENCES matches (match_id) ON DELETE CASCADE,
    frame_interval_ms  INTEGER NOT NULL,
    -- JSON: [[ouro do participante 1, ..., ouro do participante 10], ...] por quadro.
    gold_frames        TEXT    NOT NULL,
    stored_at          INTEGER NOT NULL
);
