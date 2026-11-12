use rusqlite::{Connection, OptionalExtension, params};

use crate::error::AppResult;

#[derive(Debug, Clone, PartialEq)]
pub struct ChampionRecord {
    pub champion_id: i64,
    pub key: String,
    pub name: String,
    pub title: String,
    pub image: String,
}

/// Versão do Data Dragon dos campeões salvos (None = tabela vazia).
pub fn stored_version(conn: &Connection) -> AppResult<Option<String>> {
    Ok(conn
        .query_row("SELECT max(version) FROM champions", [], |r| {
            r.get::<_, Option<String>>(0)
        })
        .optional()?
        .flatten())
}

/// Substitui a lista de campeões pela versão informada, em uma transação.
pub fn replace_all(
    conn: &mut Connection,
    version: &str,
    champions: &[ChampionRecord],
) -> AppResult<()> {
    let tx = conn.transaction()?;
    tx.execute("DELETE FROM champions", [])?;
    {
        let mut stmt = tx.prepare(
            "INSERT INTO champions (champion_id, key, name, title, image, version)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        )?;
        for c in champions {
            stmt.execute(params![
                c.champion_id,
                c.key,
                c.name,
                c.title,
                c.image,
                version
            ])?;
        }
    }
    tx.commit()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::Database;
    use crate::database::repo::{fixtures, matches};

    #[test]
    fn replaces_and_feeds_match_summaries() {
        let db = Database::open_in_memory().unwrap();
        db.with(|c| {
            assert_eq!(stored_version(c)?, None);
            let lee = ChampionRecord {
                champion_id: 64,
                key: "LeeSin".into(),
                name: "Lee Sin".into(),
                title: "o Monge Cego".into(),
                image: "LeeSin.png".into(),
            };
            replace_all(c, "16.21.1", std::slice::from_ref(&lee))?;
            replace_all(c, "16.22.1", &[lee])?;
            assert_eq!(stored_version(c)?.as_deref(), Some("16.22.1"));

            matches::insert(c, &fixtures::sample_match("BR1_1", "me", true, 1))?;
            let m = &matches::recent_for_player(c, "me", 1)?[0];
            assert_eq!(m.champion, "Lee Sin");
            assert_eq!(
                m.champion_icon.as_deref(),
                Some("https://ddragon.leagueoflegends.com/cdn/16.22.1/img/champion/LeeSin.png")
            );
            Ok(())
        })
        .unwrap();
    }
}
