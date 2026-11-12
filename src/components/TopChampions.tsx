import type { ChampionStats } from "../types/models";
import { formatKda, formatPercent, positionLabel } from "../lib/format";
import { ChampionIcon } from "./ChampionIcon";
import { WinLossBar } from "./WinLossBar";

/** Lista compacta dos campeões mais jogados, com vitórias/derrotas. */
export function TopChampions({ champions }: { champions: ChampionStats[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {champions.map((c) => (
        <div key={c.champion} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ChampionIcon name={c.champion} src={c.championIcon} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <strong>{c.champion}</strong> <span className="muted">· {positionLabel(c.mainPosition)}</span>
              </span>
              <span className="num secondary" style={{ whiteSpace: "nowrap" }}>
                {formatPercent(c.wins / c.games)} · {c.games}p · {formatKda(c.kills, c.deaths, c.assists)} KDA
              </span>
            </div>
            <WinLossBar wins={c.wins} losses={c.losses} compact />
          </div>
        </div>
      ))}
    </div>
  );
}
