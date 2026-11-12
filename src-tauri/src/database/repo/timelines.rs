use rusqlite::{Connection, OptionalExtension, params};
use serde::Serialize;

use crate::database::now_ms;
use crate::error::{AppError, AppResult};

/// Resumo da linha do tempo: ouro total de cada participante por quadro.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Timeline {
    pub frame_interval_ms: i64,
    /// `gold_frames[quadro][participante - 1]`.
    pub gold_frames: Vec<Vec<i64>>,
}

pub fn get(conn: &Connection, match_id: &str) -> AppResult<Option<Timeline>> {
    let row: Option<(i64, String)> = conn
        .query_row(
            "SELECT frame_interval_ms, gold_frames FROM match_timelines WHERE match_id = ?1",
            [match_id],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .optional()?;
    row.map(|(frame_interval_ms, json)| {
        let gold_frames = serde_json::from_str(&json)
            .map_err(|e| AppError::Other(format!("linha do tempo corrompida: {e}")))?;
        Ok(Timeline {
            frame_interval_ms,
            gold_frames,
        })
    })
    .transpose()
}

pub fn save(conn: &Connection, match_id: &str, timeline: &Timeline) -> AppResult<()> {
    let json =
        serde_json::to_string(&timeline.gold_frames).map_err(|e| AppError::Other(e.to_string()))?;
    conn.execute(
        "INSERT OR REPLACE INTO match_timelines (match_id, frame_interval_ms, gold_frames, stored_at)
         VALUES (?1, ?2, ?3, ?4)",
        params![match_id, timeline.frame_interval_ms, json, now_ms()],
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::Database;
    use crate::database::repo::{fixtures, matches};

    #[test]
    fn save_get_and_cascade() {
        let db = Database::open_in_memory().unwrap();
        db.with(|c| {
            matches::insert(c, &fixtures::sample_match("BR1_1", "me", true, 1))?;
            assert_eq!(get(c, "BR1_1")?, None);
            let t = Timeline {
                frame_interval_ms: 60_000,
                gold_frames: vec![vec![500; 10], vec![900; 10]],
            };
            save(c, "BR1_1", &t)?;
            assert_eq!(get(c, "BR1_1")?, Some(t));
            c.execute("DELETE FROM matches", [])?;
            assert_eq!(get(c, "BR1_1")?, None, "removida junto com a partida");
            Ok(())
        })
        .unwrap();
    }
}
