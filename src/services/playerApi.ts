/**
 * Pesquisa e perfil de jogadores reais (comandos Rust).
 * A pesquisa grava no banco local; a página de perfil sempre lê do banco.
 */
import { call } from "./tauri";
import type { Platform, RiotId } from "../types/riot";
import type { Division, QueueType, RankEntry, Tier } from "../types/models";

export interface StoredPlayer {
  puuid: string;
  gameName: string;
  tagLine: string;
  platform: Platform;
  profileIconId: number;
  summonerLevel: number;
  updatedAt: number; // ms desde a época Unix
  lastSyncedAt: number | null;
}

interface RankSnapshot {
  queueType: QueueType;
  tier: Tier;
  division: Division | null;
  leaguePoints: number;
  wins: number;
  losses: number;
}

interface RawProfile {
  player: StoredPlayer;
  ranks: RankSnapshot[];
  source: "riot" | "local";
  warning: string | null;
}

export interface PlayerProfile {
  player: StoredPlayer;
  ranks: RankEntry[];
  /** "riot" = atualizado agora; "local" = dados salvos (Riot inacessível ou leitura do banco). */
  source: "riot" | "local";
  warning: string | null;
}

const toProfile = (raw: RawProfile): PlayerProfile => ({
  ...raw,
  ranks: raw.ranks.map((r) => ({
    queue: r.queueType,
    tier: r.tier,
    division: r.division,
    leaguePoints: r.leaguePoints,
    wins: r.wins,
    losses: r.losses,
  })),
});

/** Interpreta "Nome#TAG". Devolve uma mensagem de erro se o formato não servir. */
export function parseRiotId(input: string): RiotId | string {
  const text = input.trim();
  const hash = text.lastIndexOf("#");
  if (hash <= 0 || hash === text.length - 1) return "Use o formato Nome#TAG (ex.: Fulano#BR1)";
  return { gameName: text.slice(0, hash).trim(), tagLine: text.slice(hash + 1).trim() };
}

export async function searchPlayer(id: RiotId, platform: Platform): Promise<PlayerProfile> {
  const raw = await call<RawProfile>("search_player", {
    gameName: id.gameName,
    tagLine: id.tagLine,
    platform,
  });
  return toProfile(raw);
}

export async function getPlayerProfile(puuid: string): Promise<PlayerProfile> {
  return toProfile(await call<RawProfile>("get_player_profile", { puuid }));
}

export const listPlayers = (limit = 12) => call<StoredPlayer[]>("list_players", { limit });
