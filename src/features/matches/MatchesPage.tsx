import { useMemo, useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { MatchRow } from "../../components/MatchRow";
import { Segmented } from "../../components/Segmented";
import { WinLossBar } from "../../components/WinLossBar";
import { AsyncView } from "../../components/AsyncView";
import { useAsync } from "../../hooks/useAsync";
import { getRecentMatches } from "../../services/playerApi";
import { RequireActivePlayer } from "../../components/RequireActivePlayer";
import { aggregate } from "../../lib/stats";
import { formatDecimal } from "../../lib/format";
import type { MatchQueue, MatchSummary } from "../../types/models";

type QueueFilter = "ALL" | MatchQueue;
type ResultFilter = "ALL" | "WIN" | "LOSS";

/** RF03 — Histórico de partidas armazenadas localmente. */
function Matches({ matches, puuid }: { matches: MatchSummary[]; puuid: string }) {
  const [queue, setQueue] = useState<QueueFilter>("ALL");
  const [result, setResult] = useState<ResultFilter>("ALL");

  const filtered = useMemo(
    () =>
      matches.filter(
        (m) =>
          (queue === "ALL" || m.queue === queue) &&
          (result === "ALL" || (result === "WIN") === m.win),
      ),
    [matches, queue, result],
  );
  const stats = aggregate(filtered);

  return (
    <div className="page">
      <PageHeader title="Histórico de partidas" description={`${matches.length} partidas armazenadas localmente`} />

      <div className="filters">
        <Segmented
          ariaLabel="Fila"
          value={queue}
          onChange={setQueue}
          options={[
            { value: "ALL", label: "Todas" },
            { value: "SOLO", label: "Solo/Duo" },
            { value: "FLEX", label: "Flex" },
            { value: "NORMAL", label: "Normal" },
            { value: "ARAM", label: "ARAM" },
          ]}
        />
        <Segmented
          ariaLabel="Resultado"
          value={result}
          onChange={setResult}
          options={[
            { value: "ALL", label: "Todos" },
            { value: "WIN", label: "Vitórias" },
            { value: "LOSS", label: "Derrotas" },
          ]}
        />
      </div>

      <Card
        flush
        title={`${filtered.length} partidas`}
        subtitle={
          filtered.length
            ? `KDA ${formatDecimal(stats.kda)} · ${formatDecimal(stats.csPerMin)} CS/min`
            : undefined
        }
        actions={
          filtered.length ? (
            <div style={{ width: 240 }}>
              <WinLossBar wins={stats.wins} losses={stats.losses} />
            </div>
          ) : undefined
        }
      >
        <div className="match-list" style={{ marginTop: 4 }}>
          {filtered.length === 0 ? (
            <div className="empty">
              {matches.length === 0
                ? "Nenhuma partida salva ainda. Atualize o jogador principal no Dashboard."
                : "Nenhuma partida com esses filtros."}
            </div>
          ) : (
            filtered.map((m) => <MatchRow key={m.matchId} match={m} focusPuuid={puuid} />)
          )}
        </div>
      </Card>
    </div>
  );
}

function MatchesForPlayer({ puuid }: { puuid: string }) {
  const state = useAsync(() => getRecentMatches(puuid, 500), [puuid]);
  return <AsyncView state={state}>{(data) => <Matches matches={data} puuid={puuid} />}</AsyncView>;
}

export function MatchesPage() {
  return (
    <RequireActivePlayer title="Histórico de partidas">
      {(puuid) => <MatchesForPlayer key={puuid} puuid={puuid} />}
    </RequireActivePlayer>
  );
}
