//! Estruturas lidas e gravadas no banco.
//! As que vão para o frontend serializam em camelCase, como `src/types/models.ts`.

use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayerRecord {
    pub puuid: String,
    pub game_name: String,
    pub tag_line: String,
    pub platform: String,
    pub profile_icon_id: i64,
    pub summoner_level: i64,
    pub updated_at: i64,
    pub last_synced_at: Option<i64>,
}

/// Partida completa a gravar (vem da Riot API na sincronização).
#[derive(Debug, Clone)]
pub struct NewMatch {
    pub match_id: String,
    pub platform: String,
    pub queue_id: i64,
    pub game_mode: String,
    pub game_version: String,
    pub started_at: i64,
    pub duration_sec: i64,
    pub participants: Vec<NewParticipant>,
}

#[derive(Debug, Clone)]
pub struct NewParticipant {
    pub puuid: String,
    pub participant_index: i64,
    pub team_id: i64,
    pub riot_id_game_name: Option<String>,
    pub riot_id_tagline: Option<String>,
    pub champion_id: i64,
    pub champion_name: String,
    pub team_position: String,
    pub win: bool,
    pub stats: ParticipantStats,
}

#[derive(Debug, Clone, Default)]
pub struct ParticipantStats {
    pub champ_level: i64,
    pub kills: i64,
    pub deaths: i64,
    pub assists: i64,
    pub minions_killed: i64,
    pub neutral_minions: i64,
    pub gold_earned: i64,
    pub damage_to_champions: i64,
    pub damage_taken: i64,
    pub vision_score: i64,
    pub wards_placed: i64,
    pub wards_killed: i64,
    pub control_wards: i64,
    pub turret_takedowns: i64,
    pub dragon_kills: i64,
    pub baron_kills: i64,
}

/// Partida do ponto de vista de um jogador. Mesmo formato de `MatchSummary` no frontend.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MatchSummary {
    pub match_id: String,
    pub queue: &'static str,
    pub played_at: String, // ISO 8601
    pub duration_sec: i64,
    pub win: bool,
    pub champion: String,
    /// URL do ícone no Data Dragon (None até os campeões serem baixados).
    pub champion_icon: Option<String>,
    pub position: String,
    pub kills: i64,
    pub deaths: i64,
    pub assists: i64,
    pub cs: i64,
    pub gold: i64,
    pub damage: i64,
    pub vision_score: i64,
    pub kill_participation: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RankSnapshot {
    pub queue_type: String,
    pub tier: String,
    pub division: Option<String>,
    pub league_points: i64,
    pub wins: i64,
    pub losses: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DbStatus {
    pub path: Option<String>,
    pub schema_version: u32,
    pub players: i64,
    pub matches: i64,
    pub participants: i64,
    pub rank_snapshots: i64,
    pub size_bytes: Option<u64>,
    pub last_sync_at: Option<i64>,
}

/// Fila da partida, no vocabulário do frontend (`MatchQueue`).
pub fn queue_label(queue_id: i64) -> &'static str {
    match queue_id {
        420 => "SOLO",
        440 => "FLEX",
        450 => "ARAM",
        400 | 430 | 490 => "NORMAL",
        _ => "OTHER",
    }
}

/// Partida completa para a tela de análise (RF04).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MatchDetails {
    pub match_id: String,
    pub platform: String,
    pub queue: &'static str,
    pub queue_id: i64,
    pub game_mode: String,
    pub game_version: String,
    pub played_at: String, // ISO 8601
    pub duration_sec: i64,
    pub participants: Vec<ParticipantDetail>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ParticipantDetail {
    pub participant_index: i64,
    pub puuid: String,
    pub riot_id_game_name: Option<String>,
    pub riot_id_tagline: Option<String>,
    pub team_id: i64,
    pub champion: String,
    pub champion_icon: Option<String>,
    pub position: String,
    pub win: bool,
    pub champ_level: i64,
    pub kills: i64,
    pub deaths: i64,
    pub assists: i64,
    pub cs: i64,
    pub gold: i64,
    pub damage: i64,
    pub damage_taken: i64,
    pub vision_score: i64,
    pub wards_placed: i64,
    pub wards_killed: i64,
    pub control_wards: i64,
    pub turret_takedowns: i64,
    pub dragon_kills: i64,
    pub baron_kills: i64,
}
