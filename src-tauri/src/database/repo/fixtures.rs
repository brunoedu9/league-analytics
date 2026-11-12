//! Dados de teste compartilhados pelos repositórios.

use crate::database::models::{NewMatch, NewParticipant, ParticipantStats, PlayerRecord};

pub fn player(puuid: &str, game_name: &str, tag_line: &str) -> PlayerRecord {
    PlayerRecord {
        puuid: puuid.into(),
        game_name: game_name.into(),
        tag_line: tag_line.into(),
        platform: "br1".into(),
        profile_icon_id: 28,
        summoner_level: 100,
        updated_at: 1,
        last_synced_at: None,
    }
}

/// Partida Solo/Duo com 10 participantes. `me` joga Lee Sin na selva do time 100
/// com 10/2/8 e 150 + 60 CS; os outros 4 aliados têm 5 abates cada.
pub fn sample_match(match_id: &str, me: &str, me_win: bool, started_at: i64) -> NewMatch {
    let participants = (1..=10)
        .map(|i| {
            let is_me = i == 1;
            let team_id = if i <= 5 { 100 } else { 200 };
            let win = (team_id == 100) == me_win;
            NewParticipant {
                puuid: if is_me {
                    me.into()
                } else {
                    format!("{match_id}-p{i}")
                },
                participant_index: i,
                team_id,
                riot_id_game_name: Some(format!("Jogador{i}")),
                riot_id_tagline: Some("BR1".into()),
                champion_id: if is_me { 64 } else { 100 + i },
                champion_name: if is_me {
                    "LeeSin".into()
                } else {
                    format!("Champ{i}")
                },
                team_position: if is_me { "JUNGLE".into() } else { "TOP".into() },
                win,
                stats: ParticipantStats {
                    champ_level: 15,
                    kills: if is_me { 10 } else { 5 },
                    deaths: if is_me { 2 } else { 4 },
                    assists: if is_me { 8 } else { 6 },
                    minions_killed: 150,
                    neutral_minions: if is_me { 60 } else { 0 },
                    gold_earned: 12_000,
                    damage_to_champions: 20_000,
                    damage_taken: 25_000,
                    vision_score: 30,
                    ..Default::default()
                },
            }
        })
        .collect();
    NewMatch {
        match_id: match_id.into(),
        platform: "br1".into(),
        queue_id: 420,
        game_mode: "CLASSIC".into(),
        game_version: "16.22.1.1".into(),
        started_at,
        duration_sec: 1_800,
        participants,
    }
}
