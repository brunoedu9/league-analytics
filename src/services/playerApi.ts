/**
 * Pesquisa e perfil de jogadores reais (comandos Rust).
 * A pesquisa grava no banco local; a página de perfil sempre lê do banco.
 */
import { listen } from "@tauri-apps/api/event";
import { call, isTauri } from "./tauri";
import type { Platform, RiotId } from "../types/riot";
import type { Division, MatchSummary, Position, QueueType, RankEntry, Tier } from "../types/models";

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

export interface RankPoint {
  recordedAt: number; // ms desde a época Unix
  tier: Tier;
  division: Division | null;
  leaguePoints: number;
  wins: number;
  losses: number;
}

/** Histórico de elo (Solo/Duo por padrão), do mais antigo ao mais recente. */
export const getRankHistory = (puuid: string, queue: QueueType = "RANKED_SOLO_5x5") =>
  call<RankPoint[]>("get_rank_history", { puuid, queue });

/** Partidas do jogador salvas no banco local (mais recentes primeiro). */
export const getRecentMatches = (puuid: string, limit = 50) =>
  call<MatchSummary[]>("get_recent_matches", { puuid, limit });

export interface SyncResult {
  added: number;
  alreadyStored: number;
  finishedAt: number;
}

export interface SyncProgress {
  puuid: string;
  done: number;
  total: number;
}

/** Baixa da Riot as partidas que ainda não estão no banco (até `count`). */
export const syncMatches = (puuid: string, count = 20) =>
  call<SyncResult>("sync_player_matches", { puuid, count });

/** Acompanha o progresso da sincronização. Devolve a função para parar de ouvir. */
export async function onSyncProgress(handler: (p: SyncProgress) => void): Promise<() => void> {
  if (!isTauri()) return () => {};
  return listen<SyncProgress>("sync-progress", (event) => handler(event.payload));
}

export interface ParticipantDetail {
  participantIndex: number;
  puuid: string;
  riotIdGameName: string | null;
  riotIdTagline: string | null;
  teamId: number; // 100 = azul, 200 = vermelho
  champion: string;
  championIcon: string | null;
  position: Position | "";
  win: boolean;
  champLevel: number;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gold: number;
  damage: number;
  damageTaken: number;
  visionScore: number;
  wardsPlaced: number;
  wardsKilled: number;
  controlWards: number;
  turretTakedowns: number;
  dragonKills: number;
  baronKills: number;
}

export interface MatchDetails {
  matchId: string;
  platform: string;
  queue: MatchSummary["queue"];
  queueId: number;
  gameMode: string;
  gameVersion: string;
  playedAt: string;
  durationSec: number;
  participants: ParticipantDetail[];
}

export interface Timeline {
  frameIntervalMs: number;
  /** goldFrames[quadro][participantIndex - 1] */
  goldFrames: number[][];
}

/** Partida completa, do banco local. */
export const getMatchDetails = (matchId: string) => call<MatchDetails>("get_match_details", { matchId });

/** Ouro por participante ao longo da partida (cache local; 1ª vez busca na Riot). */
export const getMatchTimeline = (matchId: string) => call<Timeline>("get_match_timeline", { matchId });
