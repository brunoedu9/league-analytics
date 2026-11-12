import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { ChampionIcon } from "../../components/ChampionIcon";
import { WinLossBar } from "../../components/WinLossBar";
import { AsyncView } from "../../components/AsyncView";
import { useAsync } from "../../hooks/useAsync";
import { getChampionStats } from "../../services/playerService";
import {
  formatDecimal,
  formatKda,
  formatPercent,
  formatRelative,
  kdaRatio,
  positionLabel,
} from "../../lib/format";
import type { ChampionStats } from "../../types/models";

type SortKey = "games" | "winRate" | "kda" | "csPerMin";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "games", label: "Partidas" },
  { key: "winRate", label: "Win rate" },
  { key: "kda", label: "KDA" },
  { key: "csPerMin", label: "CS/min" },
];

function sortValue(c: ChampionStats, key: SortKey): number {
  switch (key) {
    case "games":
      return c.games;
    case "winRate":
      return c.wins / c.games;
    case "kda": {
      const ratio = kdaRatio(c.kills, c.deaths, c.assists);
      return Number.isFinite(ratio) ? ratio : Number.MAX_VALUE;
    }
    case "csPerMin":
      return c.csPerMin;
  }
}

/** RF05 — Estatísticas por campeão. */
function Champions({ champions }: { champions: ChampionStats[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("games");
  const [desc, setDesc] = useState(true);

  const sorted = useMemo(
    () =>
      [...champions].sort((a, b) => {
        const diff = sortValue(a, sortKey) - sortValue(b, sortKey);
        return desc ? -diff : diff;
      }),
    [champions, sortKey, desc],
  );

  function toggleSort(key: SortKey) {
    if (key === sortKey) setDesc(!desc);
    else {
      setSortKey(key);
      setDesc(true);
    }
  }

  return (
    <div className="page">
      <PageHeader title="Campeões" description={`${champions.length} campeões nas partidas armazenadas`} />
      <Card flush>
        <table className="table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 20 }}>Campeão</th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`right is-sortable${sortKey === col.key ? " is-sorted" : ""}`}
                  onClick={() => toggleSort(col.key)}
                  aria-sort={sortKey === col.key ? (desc ? "descending" : "ascending") : "none"}
                >
                  {col.label}
                  {sortKey === col.key &&
                    (desc ? <ChevronDown size={12} style={{ verticalAlign: -2 }} /> : <ChevronUp size={12} style={{ verticalAlign: -2 }} />)}
                </th>
              ))}
              <th style={{ width: 200 }}>Vitórias / derrotas</th>
              <th className="right" style={{ paddingRight: 20 }}>
                Última partida
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.champion}>
                <td style={{ paddingLeft: 20 }}>
                  <div className="table__champ">
                    <ChampionIcon name={c.champion} src={c.championIcon} size={34} />
                    <div>
                      {c.champion}
                      <div className="muted" style={{ fontSize: 12, fontWeight: 400 }}>
                        {positionLabel(c.mainPosition)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="right num">{c.games}</td>
                <td className="right num">{formatPercent(c.wins / c.games)}</td>
                <td className="right num">
                  {formatKda(c.kills, c.deaths, c.assists)}
                  <div className="muted" style={{ fontSize: 11 }}>
                    {formatDecimal(c.kills)} / {formatDecimal(c.deaths)} / {formatDecimal(c.assists)}
                  </div>
                </td>
                <td className="right num">{formatDecimal(c.csPerMin)}</td>
                <td>
                  <div className="num" style={{ fontSize: 12, marginBottom: 4 }}>
                    {c.wins}V <span className="muted">/</span> {c.losses}D
                  </div>
                  <WinLossBar wins={c.wins} losses={c.losses} compact />
                </td>
                <td className="right secondary" style={{ paddingRight: 20 }}>
                  {formatRelative(c.lastPlayedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function ChampionsPage() {
  const state = useAsync(getChampionStats);
  return <AsyncView state={state}>{(data) => <Champions champions={data} />}</AsyncView>;
}
