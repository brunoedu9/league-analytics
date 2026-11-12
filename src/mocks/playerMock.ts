/**
 * Dados fictícios para desenvolver a interface sem credenciais da Riot.
 * Gerados de forma determinística (mesma semente → mesmos dados) para que
 * telas e screenshots fiquem estáveis entre execuções.
 */
import type { LpPoint, MatchQueue, MatchSummary, Player, Position, RankEntry } from "../types/models";
import { fromLadderValue, toLadderValue } from "../lib/ladder";
import { TIER_LABEL } from "../lib/format";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261112);
const between = (min: number, max: number) => Math.round(min + rand() * (max - min));
const pick = <T>(items: readonly T[]) => items[Math.floor(rand() * items.length)];

/** Campeões e posições mais jogados pelo jogador fictício (pesos = frequência). */
const POOL: { champion: string; position: Position; weight: number; skill: number }[] = [
  { champion: "Ahri", position: "MIDDLE", weight: 9, skill: 0.62 },
  { champion: "Syndra", position: "MIDDLE", weight: 6, skill: 0.55 },
  { champion: "Orianna", position: "MIDDLE", weight: 5, skill: 0.5 },
  { champion: "Viktor", position: "MIDDLE", weight: 4, skill: 0.47 },
  { champion: "Lee Sin", position: "JUNGLE", weight: 3, skill: 0.44 },
  { champion: "Jinx", position: "BOTTOM", weight: 2, skill: 0.52 },
  { champion: "Thresh", position: "UTILITY", weight: 2, skill: 0.4 },
  { champion: "Kai'Sa", position: "BOTTOM", weight: 2, skill: 0.5 },
];

function weightedChampion() {
  const total = POOL.reduce((sum, c) => sum + c.weight, 0);
  let roll = rand() * total;
  for (const c of POOL) {
    roll -= c.weight;
    if (roll <= 0) return c;
  }
  return POOL[0];
}

const NOW = Date.now();
const HOUR = 3_600_000;

function generateMatches(count: number): MatchSummary[] {
  const matches: MatchSummary[] = [];
  let t = NOW - 2 * HOUR;
  for (let i = 0; i < count; i++) {
    const c = weightedChampion();
    const win = rand() < c.skill;
    const durationSec = between(21 * 60, 38 * 60);
    const minutes = durationSec / 60;
    const isSupport = c.position === "UTILITY";
    const kills = isSupport ? between(0, 4) : between(win ? 4 : 1, win ? 13 : 8);
    const deaths = between(win ? 0 : 3, win ? 5 : 9);
    const assists = isSupport ? between(8, 22) : between(3, 14);
    const teamKills = Math.max(kills + assists, between(18, 38));
    const queue: MatchQueue = rand() < 0.8 ? "SOLO" : pick(["FLEX", "NORMAL"] as const);
    matches.push({
      matchId: `BR1_30${(48213790 - i * 7).toString()}`,
      queue,
      playedAt: new Date(t).toISOString(),
      durationSec,
      win,
      champion: c.champion,
      position: c.position,
      kills,
      deaths,
      assists,
      cs: isSupport ? between(20, 45) : Math.round(minutes * (5.8 + rand() * 2.6)),
      gold: Math.round(minutes * (isSupport ? 260 : 380 + rand() * 90)),
      damage: Math.round(minutes * (isSupport ? 350 : 700 + rand() * 500)),
      visionScore: Math.round(minutes * (isSupport ? 2.4 : 0.7 + rand() * 0.6)),
      killParticipation: Math.min(1, (kills + assists) / teamKills),
    });
    t -= between(1, 20) * HOUR;
  }
  return matches; // da mais recente para a mais antiga
}

export const mockMatches: MatchSummary[] = generateMatches(60);

export const mockPlayer: Player = {
  puuid: "mock-puuid-0001",
  gameName: "Invocador Fictício",
  tagLine: "BR1",
  platform: "br1",
  profileIconId: 5367,
  summonerLevel: 347,
  lastSyncedAt: new Date(NOW - 2 * HOUR).toISOString(),
};

/** Histórico de PDL derivado das partidas ranqueadas solo: +/- PDL por resultado. */
function generateLpHistory(matches: MatchSummary[]): { history: LpPoint[]; current: number } {
  const solo = matches.filter((m) => m.queue === "SOLO").reverse();
  let value = toLadderValue("GOLD", "III", 40);
  const history: LpPoint[] = solo.map((m) => {
    value += m.win ? between(18, 24) : -between(15, 21);
    const { tier, division, lp } = fromLadderValue(value);
    return {
      date: m.playedAt,
      ladderValue: value,
      label: `${TIER_LABEL[tier]}${division ? ` ${division}` : ""} · ${lp} PDL`,
    };
  });
  return { history, current: value };
}

const lp = generateLpHistory(mockMatches);
export const mockLpHistory: LpPoint[] = lp.history;

const current = fromLadderValue(lp.current);
const soloGames = mockMatches.filter((m) => m.queue === "SOLO");
const flexGames = mockMatches.filter((m) => m.queue === "FLEX");

export const mockRanks: RankEntry[] = [
  {
    queue: "RANKED_SOLO_5x5",
    tier: current.tier,
    division: current.division,
    leaguePoints: current.lp,
    wins: 112 + soloGames.filter((m) => m.win).length,
    losses: 104 + soloGames.filter((m) => !m.win).length,
  },
  {
    queue: "RANKED_FLEX_SR",
    tier: "SILVER",
    division: "I",
    leaguePoints: 63,
    wins: 21 + flexGames.filter((m) => m.win).length,
    losses: 18 + flexGames.filter((m) => !m.win).length,
  },
];
