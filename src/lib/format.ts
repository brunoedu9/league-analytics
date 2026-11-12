import type { Division, MatchQueue, Position, Tier } from "../types/models";

const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });
const dec1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dec2 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const int = new Intl.NumberFormat("pt-BR");
const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export const formatPercent = (value: number) => pct.format(value);
export const formatDecimal = (value: number) => dec1.format(value);
export const formatInt = (value: number) => int.format(value);
export const formatCompact = (value: number) => compact.format(value);

/** KDA = (abates + assistências) / mortes. Sem mortes, exibe "Perfeito". */
export function kdaRatio(kills: number, deaths: number, assists: number): number {
  return deaths === 0 ? Infinity : (kills + assists) / deaths;
}

export function formatKda(kills: number, deaths: number, assists: number): string {
  const ratio = kdaRatio(kills, deaths, assists);
  return Number.isFinite(ratio) ? dec2.format(ratio) : "Perfeito";
}

export function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.round(totalSec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatRelative(iso: string, now = Date.now()): string {
  const diffMin = Math.round((now - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ontem" : `há ${d} dias`;
}

export const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

export const TIER_LABEL: Record<Tier, string> = {
  IRON: "Ferro",
  BRONZE: "Bronze",
  SILVER: "Prata",
  GOLD: "Ouro",
  PLATINUM: "Platina",
  EMERALD: "Esmeralda",
  DIAMOND: "Diamante",
  MASTER: "Mestre",
  GRANDMASTER: "Grão-Mestre",
  CHALLENGER: "Desafiante",
};

/** Cores decorativas dos emblemas de elo (não usadas para codificar dados em gráficos). */
export const TIER_COLOR: Record<Tier, string> = {
  IRON: "#7d726d",
  BRONZE: "#a8714f",
  SILVER: "#9fb0bd",
  GOLD: "#d8b25a",
  PLATINUM: "#4fb3a9",
  EMERALD: "#2fbf71",
  DIAMOND: "#7aa2f7",
  MASTER: "#b06fd8",
  GRANDMASTER: "#e05d5d",
  CHALLENGER: "#f2d37a",
};

export function formatRank(tier: Tier, division: Division | null): string {
  return division ? `${TIER_LABEL[tier]} ${division}` : TIER_LABEL[tier];
}

export const POSITION_LABEL: Record<Position, string> = {
  TOP: "Topo",
  JUNGLE: "Selva",
  MIDDLE: "Meio",
  BOTTOM: "Atirador",
  UTILITY: "Suporte",
};

export const QUEUE_LABEL: Record<MatchQueue, string> = {
  SOLO: "Ranqueada Solo/Duo",
  FLEX: "Ranqueada Flex",
  NORMAL: "Normal",
  ARAM: "ARAM",
  OTHER: "Outro modo",
};

export const QUEUE_SHORT: Record<MatchQueue, string> = {
  SOLO: "Solo/Duo",
  FLEX: "Flex",
  NORMAL: "Normal",
  ARAM: "ARAM",
  OTHER: "Outro modo",
};
