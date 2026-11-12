/**
 * Modelos de domínio usados pela interface.
 * Espelham o que os comandos Rust devolvem a partir do SQLite (docs/DATABASE.md).
 */
export type Tier =
  | "IRON" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "EMERALD"
  | "DIAMOND" | "MASTER" | "GRANDMASTER" | "CHALLENGER";

export type Division = "I" | "II" | "III" | "IV";

export type QueueType = "RANKED_SOLO_5x5" | "RANKED_FLEX_SR";

export type Position = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY";

export type MatchQueue = "SOLO" | "FLEX" | "NORMAL" | "ARAM" | "OTHER";

export interface RankEntry {
  queue: QueueType;
  tier: Tier;
  division: Division | null; // null para Mestre+
  leaguePoints: number;
  wins: number;
  losses: number;
}

export interface LpPoint {
  date: string; // ISO 8601
  /** PDL acumulado em escala contínua (tier * 400 + divisão * 100 + PDL) para plotar. */
  ladderValue: number;
  label: string; // ex.: "Ouro II · 54 PDL"
}

/** Partida do ponto de vista de um jogador (linha de matches + participants + player_stats). */
export interface MatchSummary {
  matchId: string;
  queue: MatchQueue;
  playedAt: string; // ISO 8601
  durationSec: number;
  win: boolean;
  champion: string;
  /** URL do ícone no Data Dragon; ausente até os campeões serem baixados. */
  championIcon?: string | null;
  /** Vazio em modos sem posição (ARAM, Arena). */
  position: Position | "";
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gold: number;
  damage: number;
  visionScore: number;
  killParticipation: number; // 0..1
}

export interface ChampionStats {
  champion: string;
  games: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  assists: number;
  csPerMin: number;
  mainPosition: Position | "";
  championIcon?: string | null;
  lastPlayedAt: string;
}
