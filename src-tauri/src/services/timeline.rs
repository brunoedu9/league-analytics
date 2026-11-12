//! Linha do tempo da partida (RF04: evolução de métricas).
//!
//! Busca na Riot só na primeira vez que a partida é analisada e guarda um
//! resumo no banco. Depois disso, funciona offline.

use std::collections::HashMap;

use serde::Deserialize;

use crate::database::repo::timelines::{self, Timeline};
use crate::database::{Database, repo};
use crate::error::{AppError, AppResult};
use crate::services::riot::RiotClient;
use crate::services::riot::routing::match_region;

#[derive(Deserialize)]
struct TimelineDto {
    info: TimelineInfo,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct TimelineInfo {
    frame_interval: i64,
    frames: Vec<FrameDto>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct FrameDto {
    participant_frames: HashMap<String, ParticipantFrameDto>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ParticipantFrameDto {
    #[serde(default)]
    total_gold: i64,
}

/// Converte a resposta da Riot no resumo guardado: ouro por participante (1..N) a cada quadro.
fn summarize(dto: TimelineDto) -> Timeline {
    let gold_frames = dto
        .info
        .frames
        .into_iter()
        .map(|frame| {
            let count = frame
                .participant_frames
                .keys()
                .filter_map(|k| k.parse::<usize>().ok())
                .max()
                .unwrap_or(0);
            let mut gold = vec![0; count];
            for (key, pf) in frame.participant_frames {
                if let Ok(i) = key.parse::<usize>()
                    && (1..=count).contains(&i)
                {
                    gold[i - 1] = pf.total_gold;
                }
            }
            gold
        })
        .collect();
    Timeline {
        frame_interval_ms: dto.info.frame_interval,
        gold_frames,
    }
}

/// Linha do tempo da partida: do banco, ou da Riot (e então salva no banco).
pub async fn get_or_fetch(db: &Database, riot: &RiotClient, match_id: &str) -> AppResult<Timeline> {
    if let Some(cached) = db.with(|c| timelines::get(c, match_id))? {
        return Ok(cached);
    }
    let details = db
        .with(|c| repo::matches::details(c, match_id))?
        .ok_or(AppError::NotFound)?;
    let dto: TimelineDto = riot
        .get(
            match_region(&details.platform),
            &format!("/lol/match/v5/matches/{match_id}/timeline"),
        )
        .await?;
    let timeline = summarize(dto);
    db.with(|c| timelines::save(c, match_id, &timeline))?;
    Ok(timeline)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn summarizes_gold_per_participant() {
        let json = r#"{ "metadata": {}, "info": { "frameInterval": 60000, "frames": [
            { "timestamp": 0, "participantFrames": {
                "1": { "totalGold": 500, "xp": 0 }, "2": { "totalGold": 500 }, "10": { "totalGold": 500 } } },
            { "timestamp": 60000, "participantFrames": {
                "2": { "totalGold": 820 }, "1": { "totalGold": 760 }, "10": { "totalGold": 700 } } }
        ] } }"#;
        let t = summarize(serde_json::from_str(json).unwrap());
        assert_eq!(t.frame_interval_ms, 60_000);
        assert_eq!(t.gold_frames.len(), 2);
        assert_eq!(t.gold_frames[1].len(), 10);
        assert_eq!(t.gold_frames[1][0], 760);
        assert_eq!(t.gold_frames[1][1], 820);
        assert_eq!(t.gold_frames[1][9], 700);
        assert_eq!(t.gold_frames[1][4], 0, "participante ausente vira 0");
    }
}
