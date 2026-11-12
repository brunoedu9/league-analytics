import type { Division, LpPoint, Tier } from "../types/models";
import { TIER_LABEL } from "./format";

/**
 * Converte elo em um valor contínuo para gráficos de evolução.
 * Cada divisão vale 100; cada tier (Ferro..Diamante) vale 400.
 * Mestre+ é tratado como um único bloco acima de Diamante I.
 */
const TIERS: Tier[] = ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND", "MASTER"];
const DIVISIONS: Division[] = ["IV", "III", "II", "I"];

export function toLadderValue(tier: Tier, division: Division | null, lp: number): number {
  const tierIndex = TIERS.indexOf(tier === "GRANDMASTER" || tier === "CHALLENGER" ? "MASTER" : tier);
  const divisionIndex = division ? DIVISIONS.indexOf(division) : 0;
  return tierIndex * 400 + divisionIndex * 100 + lp;
}

export function fromLadderValue(value: number): { tier: Tier; division: Division | null; lp: number } {
  const tierIndex = Math.min(Math.floor(value / 400), TIERS.length - 1);
  const tier = TIERS[tierIndex];
  if (tier === "MASTER") return { tier, division: null, lp: Math.round(value - tierIndex * 400) };
  const rest = value - tierIndex * 400;
  const divisionIndex = Math.min(Math.floor(rest / 100), 3);
  return { tier, division: DIVISIONS[divisionIndex], lp: Math.round(rest - divisionIndex * 100) };
}

/** Rótulo curto para o eixo Y (ex.: "Ouro II"). */
export function ladderTickLabel(value: number): string {
  const { tier, division } = fromLadderValue(value);
  return division ? `${TIER_LABEL[tier]} ${division}` : TIER_LABEL[tier];
}

/** Converte o histórico de elo salvo no banco em pontos do gráfico de PDL. */
export function toLpPoints(
  points: { recordedAt: number; tier: Tier; division: Division | null; leaguePoints: number }[],
): LpPoint[] {
  return points.map((p) => ({
    date: new Date(p.recordedAt).toISOString(),
    ladderValue: toLadderValue(p.tier, p.division, p.leaguePoints),
    label: `${p.division ? `${TIER_LABEL[p.tier]} ${p.division}` : TIER_LABEL[p.tier]} · ${p.leaguePoints} PDL`,
  }));
}
