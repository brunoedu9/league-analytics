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
