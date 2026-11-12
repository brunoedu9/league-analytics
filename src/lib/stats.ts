import type { ChampionStats, MatchSummary, Position } from "../types/models";

export interface AggregateStats {
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  csPerMin: number;
  visionPerMin: number;
  damagePerMin: number;
  killParticipation: number;
}

/** Médias de um conjunto de partidas. Em produção, o Rust calcula isso em SQL. */
export function aggregate(matches: MatchSummary[]): AggregateStats {
  const games = matches.length;
  if (games === 0) {
    return {
      games: 0, wins: 0, losses: 0, winRate: 0, kills: 0, deaths: 0, assists: 0,
      kda: 0, csPerMin: 0, visionPerMin: 0, damagePerMin: 0, killParticipation: 0,
    };
  }
  const sum = (fn: (m: MatchSummary) => number) => matches.reduce((acc, m) => acc + fn(m), 0);
  const minutes = sum((m) => m.durationSec / 60);
  const wins = sum((m) => (m.win ? 1 : 0));
  const kills = sum((m) => m.kills);
  const deaths = sum((m) => m.deaths);
  const assists = sum((m) => m.assists);
  return {
    games,
    wins,
    losses: games - wins,
    winRate: wins / games,
    kills: kills / games,
    deaths: deaths / games,
    assists: assists / games,
    kda: deaths === 0 ? kills + assists : (kills + assists) / deaths,
    csPerMin: sum((m) => m.cs) / minutes,
    visionPerMin: sum((m) => m.visionScore) / minutes,
    damagePerMin: sum((m) => m.damage) / minutes,
    killParticipation: sum((m) => m.killParticipation) / games,
  };
}

/** Agrupa partidas por campeão (RF05). */
export function championStats(matches: MatchSummary[]): ChampionStats[] {
  const groups = new Map<string, MatchSummary[]>();
  for (const m of matches) {
    const list = groups.get(m.champion) ?? [];
    list.push(m);
    groups.set(m.champion, list);
  }
  return [...groups.entries()]
    .map(([champion, list]) => {
      const agg = aggregate(list);
      const positionCount = new Map<Position, number>();
      for (const m of list) positionCount.set(m.position, (positionCount.get(m.position) ?? 0) + 1);
      const mainPosition = [...positionCount.entries()].sort((a, b) => b[1] - a[1])[0][0];
      return {
        champion,
        games: agg.games,
        wins: agg.wins,
        losses: agg.losses,
        kills: agg.kills,
        deaths: agg.deaths,
        assists: agg.assists,
        csPerMin: agg.csPerMin,
        mainPosition,
        lastPlayedAt: list[0].playedAt,
      };
    })
    .sort((a, b) => b.games - a.games);
}
