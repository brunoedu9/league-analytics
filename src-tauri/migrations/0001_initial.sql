-- 0001 — Esquema inicial do League Analytics.
-- Convenções:
--   * Datas em INTEGER (milissegundos desde a época Unix, UTC).
--   * Booleanos em INTEGER (0/1).
--   * Identidade do jogador pelo PUUID (o Riot ID pode mudar).
-- Uma migration publicada nunca é alterada: mudanças vão em uma nova migration.

-- Jogadores consultados pelo usuário.
CREATE TABLE players (
    puuid            TEXT PRIMARY KEY,
    game_name        TEXT    NOT NULL,
    tag_line         TEXT    NOT NULL,
    platform         TEXT    NOT NULL,           -- br1, na1, euw1...
    profile_icon_id  INTEGER NOT NULL DEFAULT 0,
    summoner_level   INTEGER NOT NULL DEFAULT 0,
    updated_at       INTEGER NOT NULL,           -- último update do perfil
    last_synced_at   INTEGER                     -- última sincronização de partidas bem-sucedida
);
CREATE INDEX idx_players_riot_id ON players (lower(game_name), lower(tag_line));

-- Uma linha por partida (nunca duplicada por jogador).
CREATE TABLE matches (
    match_id      TEXT PRIMARY KEY,              -- ex.: BR1_3048213790
    platform      TEXT    NOT NULL,
    queue_id      INTEGER NOT NULL,              -- 420 Solo/Duo, 440 Flex, 450 ARAM...
    game_mode     TEXT    NOT NULL,
    game_version  TEXT    NOT NULL,              -- patch, ex.: 16.22.712.4130
    started_at    INTEGER NOT NULL,
    duration_sec  INTEGER NOT NULL,
    stored_at     INTEGER NOT NULL
);
CREATE INDEX idx_matches_started_at ON matches (started_at DESC);

-- Os (até) 10 participantes de cada partida: identidade, campeão e função.
CREATE TABLE participants (
    id                 INTEGER PRIMARY KEY,
    match_id           TEXT    NOT NULL REFERENCES matches (match_id) ON DELETE CASCADE,
    puuid              TEXT    NOT NULL,
    participant_index  INTEGER NOT NULL,         -- 1..10
    team_id            INTEGER NOT NULL,         -- 100 azul, 200 vermelho
    riot_id_game_name  TEXT,
    riot_id_tagline    TEXT,
    champion_id        INTEGER NOT NULL,
    champion_name      TEXT    NOT NULL,         -- nome interno, ex.: LeeSin
    team_position      TEXT    NOT NULL DEFAULT '',  -- TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY ou ''
    win                INTEGER NOT NULL,
    UNIQUE (match_id, puuid)
);
CREATE INDEX idx_participants_puuid ON participants (puuid);

-- Estatísticas de um participante na partida (1:1 com participants).
CREATE TABLE player_stats (
    participant_id       INTEGER PRIMARY KEY REFERENCES participants (id) ON DELETE CASCADE,
    champ_level          INTEGER NOT NULL,
    kills                INTEGER NOT NULL,
    deaths               INTEGER NOT NULL,
    assists              INTEGER NOT NULL,
    minions_killed       INTEGER NOT NULL,       -- totalMinionsKilled
    neutral_minions      INTEGER NOT NULL,       -- neutralMinionsKilled (CS = soma dos dois)
    gold_earned          INTEGER NOT NULL,
    damage_to_champions  INTEGER NOT NULL,
    damage_taken         INTEGER NOT NULL,
    vision_score         INTEGER NOT NULL,
    wards_placed         INTEGER NOT NULL,
    wards_killed         INTEGER NOT NULL,
    control_wards        INTEGER NOT NULL,
    turret_takedowns     INTEGER NOT NULL,
    dragon_kills         INTEGER NOT NULL,
    baron_kills          INTEGER NOT NULL
);

-- Fotografias do elo. Só grava quando algo muda (ver repositório).
CREATE TABLE rank_history (
    id             INTEGER PRIMARY KEY,
    puuid          TEXT    NOT NULL,
    queue_type     TEXT    NOT NULL,             -- RANKED_SOLO_5x5, RANKED_FLEX_SR
    tier           TEXT    NOT NULL,
    division       TEXT,                         -- NULL em Mestre+
    league_points  INTEGER NOT NULL,
    wins           INTEGER NOT NULL,
    losses         INTEGER NOT NULL,
    recorded_at    INTEGER NOT NULL
);
CREATE INDEX idx_rank_history_player ON rank_history (puuid, queue_type, recorded_at DESC);

-- Dados estáticos dos campeões (Data Dragon).
CREATE TABLE champions (
    champion_id  INTEGER PRIMARY KEY,
    key          TEXT NOT NULL UNIQUE,           -- nome interno, ex.: LeeSin
    name         TEXT NOT NULL,                  -- nome de exibição, ex.: Lee Sin
    title        TEXT NOT NULL DEFAULT '',
    image        TEXT NOT NULL DEFAULT '',       -- arquivo do ícone no Data Dragon
    version      TEXT NOT NULL                   -- versão do Data Dragon
);

-- Controle das sincronizações com a Riot API.
CREATE TABLE sync_history (
    id             INTEGER PRIMARY KEY,
    puuid          TEXT,
    kind           TEXT    NOT NULL,             -- profile, matches, champions...
    status         TEXT    NOT NULL CHECK (status IN ('running', 'success', 'error')),
    started_at     INTEGER NOT NULL,
    finished_at    INTEGER,
    matches_added  INTEGER NOT NULL DEFAULT 0,
    error          TEXT
);
CREATE INDEX idx_sync_history_started ON sync_history (started_at DESC);

-- Configurações do usuário (chave/valor).
CREATE TABLE settings (
    key         TEXT PRIMARY KEY,
    value       TEXT    NOT NULL,
    updated_at  INTEGER NOT NULL
);
