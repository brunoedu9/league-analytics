use rusqlite::{Connection, OptionalExtension, params};

use crate::database::models::RankSnapshot;
use crate::error::AppResult;

fn latest_for_queue(
    conn: &Connection,
    puuid: &str,
    queue_type: &str,
) -> AppResult<Option<RankSnapshot>> {
    Ok(conn
        .query_row(
            "SELECT queue_type, tier, division, league_points, wins, losses
               FROM rank_history
              WHERE puuid = ?1 AND queue_type = ?2
              ORDER BY recorded_at DESC, id DESC LIMIT 1",
            [puuid, queue_type],
            |r| {
                Ok(RankSnapshot {
                    queue_type: r.get(0)?,
                    tier: r.get(1)?,
                    division: r.get(2)?,
                    league_points: r.get(3)?,
                    wins: r.get(4)?,
                    losses: r.get(5)?,
                })
            },
        )
        .optional()?)
}

/// Registra o elo atual. Só grava quando difere do último registro da fila,
/// para o histórico refletir mudanças reais (e não cada sincronização).
pub fn record(conn: &Connection, puuid: &str, rank: &RankSnapshot, at: i64) -> AppResult<bool> {
    if latest_for_queue(conn, puuid, &rank.queue_type)?.as_ref() == Some(rank) {
        return Ok(false);
    }
    conn.execute(
        "INSERT INTO rank_history
            (puuid, queue_type, tier, division, league_points, wins, losses, recorded_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            puuid,
            rank.queue_type,
            rank.tier,
            rank.division,
            rank.league_points,
            rank.wins,
            rank.losses,
            at
        ],
    )?;
    Ok(true)
}

/// Um ponto do histórico de elo (para o gráfico de evolução de PDL).
#[derive(Debug, Clone, PartialEq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RankPoint {
    pub recorded_at: i64,
    pub tier: String,
    pub division: Option<String>,
    pub league_points: i64,
    pub wins: i64,
    pub losses: i64,
}

/// Histórico de uma fila, do mais antigo para o mais recente (até `limit` pontos).
pub fn history(
    conn: &Connection,
    puuid: &str,
    queue_type: &str,
    limit: u32,
) -> AppResult<Vec<RankPoint>> {
    let mut stmt = conn.prepare(
        "SELECT recorded_at, tier, division, league_points, wins, losses FROM (
            SELECT * FROM rank_history
             WHERE puuid = ?1 AND queue_type = ?2
             ORDER BY recorded_at DESC, id DESC LIMIT ?3
         ) ORDER BY recorded_at ASC, id ASC",
    )?;
    let rows = stmt.query_map(params![puuid, queue_type, limit], |r| {
        Ok(RankPoint {
            recorded_at: r.get(0)?,
            tier: r.get(1)?,
            division: r.get(2)?,
            league_points: r.get(3)?,
            wins: r.get(4)?,
            losses: r.get(5)?,
        })
    })?;
    Ok(rows.collect::<Result<_, _>>()?)
}

/// Elo mais recente de cada fila do jogador.
pub fn latest(conn: &Connection, puuid: &str) -> AppResult<Vec<RankSnapshot>> {
    let mut result = Vec::new();
    for queue in ["RANKED_SOLO_5x5", "RANKED_FLEX_SR"] {
        if let Some(rank) = latest_for_queue(conn, puuid, queue)? {
            result.push(rank);
        }
    }
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::Database;

    fn gold(lp: i64, wins: i64) -> RankSnapshot {
        RankSnapshot {
            queue_type: "RANKED_SOLO_5x5".into(),
            tier: "GOLD".into(),
            division: Some("II".into()),
            league_points: lp,
            wins,
            losses: 10,
        }
    }

    #[test]
    fn records_only_changes() {
        let db = Database::open_in_memory().unwrap();
        db.with(|c| {
            assert!(record(c, "me", &gold(40, 10), 1)?);
            assert!(!record(c, "me", &gold(40, 10), 2)?, "mesmo elo não duplica");
            assert!(record(c, "me", &gold(61, 11), 3)?);
            let count: i64 = c.query_row("SELECT count(*) FROM rank_history", [], |r| r.get(0))?;
            assert_eq!(count, 2);
            assert_eq!(latest(c, "me")?, vec![gold(61, 11)]);
            let points = history(c, "me", "RANKED_SOLO_5x5", 10)?;
            assert_eq!(
                points.iter().map(|p| p.league_points).collect::<Vec<_>>(),
                vec![40, 61],
                "do mais antigo para o mais recente"
            );
            assert_eq!(history(c, "me", "RANKED_SOLO_5x5", 1)?[0].league_points, 61);
            Ok(())
        })
        .unwrap();
    }
}
