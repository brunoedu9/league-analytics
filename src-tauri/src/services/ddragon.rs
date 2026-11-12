//! Data Dragon: dados estáticos da Riot (nomes e ícones de campeões).
//!
//! É um CDN público, sem chave e sem limite de requisições da API.
//! Os dados ficam na tabela `champions`; só são baixados de novo quando sai
//! uma versão nova (a cada patch).

use std::collections::HashMap;

use serde::Deserialize;

use crate::database::repo::champions::{self, ChampionRecord};
use crate::database::{Database, repo};
use crate::error::{AppError, AppResult};

const BASE: &str = "https://ddragon.leagueoflegends.com";
const LOCALE: &str = "pt_BR";

#[derive(Deserialize)]
struct ChampionFile {
    data: HashMap<String, ChampionEntry>,
}

#[derive(Deserialize)]
struct ChampionEntry {
    id: String,  // nome interno, ex.: LeeSin
    key: String, // id numérico em texto, ex.: "64"
    name: String,
    #[serde(default)]
    title: String,
    image: ChampionImage,
}

#[derive(Deserialize)]
struct ChampionImage {
    full: String,
}

async fn get_json<T: for<'de> Deserialize<'de>>(http: &reqwest::Client, url: &str) -> AppResult<T> {
    let res = http
        .get(url)
        .send()
        .await
        .map_err(|e| AppError::Network(e.to_string()))?;
    if !res.status().is_success() {
        return Err(AppError::Other(format!(
            "Data Dragon respondeu {}",
            res.status()
        )));
    }
    res.json::<T>()
        .await
        .map_err(|e| AppError::Other(format!("resposta inesperada do Data Dragon: {e}")))
}

fn parse_champions(file: ChampionFile) -> Vec<ChampionRecord> {
    let mut list: Vec<ChampionRecord> = file
        .data
        .into_values()
        .filter_map(|c| {
            Some(ChampionRecord {
                champion_id: c.key.parse().ok()?,
                key: c.id,
                name: c.name,
                title: c.title,
                image: c.image.full,
            })
        })
        .collect();
    list.sort_by_key(|c| c.champion_id);
    list
}

/// Garante que a tabela de campeões está na versão mais recente.
/// Devolve `true` se baixou dados novos.
pub async fn ensure_champions(db: &Database, http: &reqwest::Client) -> AppResult<bool> {
    let versions: Vec<String> = get_json(http, &format!("{BASE}/api/versions.json")).await?;
    let latest = versions
        .into_iter()
        .next()
        .ok_or_else(|| AppError::Other("Data Dragon sem versões".into()))?;
    if db.with(|c| repo::champions::stored_version(c))?.as_deref() == Some(latest.as_str()) {
        return Ok(false);
    }
    let file: ChampionFile = get_json(
        http,
        &format!("{BASE}/cdn/{latest}/data/{LOCALE}/champion.json"),
    )
    .await?;
    let list = parse_champions(file);
    db.with(|c| champions::replace_all(c, &latest, &list))?;
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_champion_file() {
        let json = r#"{ "type": "champion", "version": "16.22.1", "data": {
            "MonkeyKing": { "id": "MonkeyKing", "key": "62", "name": "Wukong",
                            "title": "o Rei Macaco", "image": { "full": "MonkeyKing.png" } },
            "LeeSin": { "id": "LeeSin", "key": "64", "name": "Lee Sin",
                        "title": "o Monge Cego", "image": { "full": "LeeSin.png" } }
        } }"#;
        let list = parse_champions(serde_json::from_str(json).unwrap());
        assert_eq!(list.len(), 2);
        assert_eq!(list[0].name, "Wukong");
        assert_eq!(list[0].key, "MonkeyKing");
        assert_eq!(list[1].champion_id, 64);
    }
}
