//! Formatos de resposta da Riot API (apenas os campos usados).

use serde::Deserialize;

/// account-v1
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountDto {
    pub puuid: String,
    pub game_name: Option<String>,
    pub tag_line: Option<String>,
}

/// summoner-v4
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SummonerDto {
    pub profile_icon_id: i64,
    pub summoner_level: i64,
}

/// league-v4 entries/by-puuid
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LeagueEntryDto {
    pub queue_type: String,
    pub tier: String,
    pub rank: Option<String>,
    pub league_points: i64,
    pub wins: i64,
    pub losses: i64,
}

/// match-v5 /matches/{matchId}
#[derive(Debug, Deserialize)]
pub struct MatchDto {
    pub metadata: MatchMetadataDto,
    pub info: MatchInfoDto,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MatchMetadataDto {
    pub match_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MatchInfoDto {
    pub platform_id: String,
    pub queue_id: i64,
    #[serde(default)]
    pub game_mode: String,
    #[serde(default)]
    pub game_version: String,
    pub game_start_timestamp: i64,
    /// Em segundos quando `game_end_timestamp` existe; em milissegundos em partidas antigas.
    pub game_duration: i64,
    pub game_end_timestamp: Option<i64>,
    pub participants: Vec<ParticipantDto>,
}

/// Campos numéricos com `default`: a Riot omite alguns em modos especiais.
#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct ParticipantDto {
    pub puuid: String,
    pub participant_id: i64,
    pub team_id: i64,
    pub riot_id_game_name: Option<String>,
    pub riot_id_tagline: Option<String>,
    pub champion_id: i64,
    pub champion_name: String,
    pub team_position: String,
    pub win: bool,
    pub champ_level: i64,
    pub kills: i64,
    pub deaths: i64,
    pub assists: i64,
    pub total_minions_killed: i64,
    pub neutral_minions_killed: i64,
    pub gold_earned: i64,
    pub total_damage_dealt_to_champions: i64,
    pub total_damage_taken: i64,
    pub vision_score: i64,
    pub wards_placed: i64,
    pub wards_killed: i64,
    pub vision_wards_bought_in_game: i64,
    pub turret_takedowns: i64,
    pub dragon_kills: i64,
    pub baron_kills: i64,
}
