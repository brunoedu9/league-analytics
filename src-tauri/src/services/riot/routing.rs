//! Valores de roteamento da Riot API.
//!
//! - Plataforma (`br1`, `euw1`...): summoner-v4, league-v4.
//! - Regional (`americas`, `europe`, `asia`, `sea`): account-v1, match-v5.

/// Plataformas aceitas. Igual ao tipo `Platform` do frontend.
pub const PLATFORMS: &[&str] = &[
    "br1", "na1", "la1", "la2", "euw1", "eun1", "tr1", "ru", "me1", "kr", "jp1", "oc1", "sg2",
    "tw2", "vn2",
];

pub fn is_valid_platform(platform: &str) -> bool {
    PLATFORMS.contains(&platform)
}

/// Roteamento regional para account-v1 (só americas, europe e asia).
pub fn account_region(platform: &str) -> &'static str {
    match platform {
        "euw1" | "eun1" | "tr1" | "ru" | "me1" => "europe",
        "kr" | "jp1" | "oc1" | "sg2" | "tw2" | "vn2" => "asia",
        _ => "americas",
    }
}

/// Roteamento regional para match-v5 (inclui sea para Oceania e Sudeste Asiático).
#[allow(dead_code)] // usado pela sincronização de partidas (próximo passo)
pub fn match_region(platform: &str) -> &'static str {
    match platform {
        "euw1" | "eun1" | "tr1" | "ru" | "me1" => "europe",
        "kr" | "jp1" => "asia",
        "oc1" | "sg2" | "tw2" | "vn2" => "sea",
        _ => "americas",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_platforms_to_regions() {
        assert_eq!(account_region("br1"), "americas");
        assert_eq!(account_region("euw1"), "europe");
        assert_eq!(account_region("oc1"), "asia");
        assert_eq!(match_region("oc1"), "sea");
        assert_eq!(match_region("kr"), "asia");
        assert!(is_valid_platform("br1"));
        assert!(!is_valid_platform("xx1"));
    }
}
