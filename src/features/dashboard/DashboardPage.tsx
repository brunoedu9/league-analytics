import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Crosshair, Eye, History, RefreshCw, Swords, Trophy } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { StatCard } from "../../components/StatCard";
import { MatchRow } from "../../components/MatchRow";
import { TopChampions } from "../../components/TopChampions";
import { ProfileCard } from "../../components/ProfileCard";
import { RequireActivePlayer } from "../../components/RequireActivePlayer";
import { LpHistoryChart } from "../../components/charts/LpHistoryChart";
import { WinRateTrendChart } from "../../components/charts/WinRateTrendChart";
import { errorMessage, useAsync } from "../../hooks/useAsync";
import { SYNC_COUNT, usePlayerRefresh } from "../../hooks/usePlayerRefresh";
import { getPlayerProfile, getRankHistory, getRecentMatches } from "../../services/playerApi";
import { aggregate, championStats } from "../../lib/stats";
import { toLpPoints } from "../../lib/ladder";
import { formatDecimal, formatPercent, formatRelative } from "../../lib/format";

/** Partidas consideradas no resumo do Dashboard. */
const WINDOW = 20;

/** Diferença entre as 10 partidas mais recentes e as 10 anteriores. */
function deltaOf(current: number, previous: number, format: (v: number) => string, higherIsBetter = true) {
  const diff = current - previous;
  if (Math.abs(diff) < 1e-9) return undefined;
  const sign = diff > 0 ? "+" : "−";
  return { text: `${sign}${format(Math.abs(diff))}`, positive: diff > 0 === higherIsBetter };
}

async function loadDashboard(puuid: string) {
  const [profile, matches, rankHistory] = await Promise.all([
    getPlayerProfile(puuid),
    getRecentMatches(puuid, 30),
    getRankHistory(puuid),
  ]);
  return { profile, matches, lpHistory: toLpPoints(rankHistory) };
}

function Dashboard({ puuid }: { puuid: string }) {
  const [reloadKey, setReloadKey] = useState(0);
  const state = useAsync(() => loadDashboard(puuid), [puuid, reloadKey]);
  const player = state.status === "success" ? state.data.profile.player : null;
  const { refresh, busy, label, notice } = usePlayerRefresh(player, () => setReloadKey((k) => k + 1));

  if (state.status === "loading") {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: 48, minHeight: 48 }} />
        <div className="skeleton" style={{ height: 260 }} />
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }
  if (state.status === "error") return <div className="placeholder">{errorMessage(state.error)}</div>;

  const { profile, matches: allMatches, lpHistory } = state.data;
  const recent = allMatches.slice(0, WINDOW);
  const stats = aggregate(recent);
  const hasDeltas = recent.length >= 20;
  const last10 = aggregate(recent.slice(0, 10));
  const prev10 = aggregate(recent.slice(10, 20));
  const topChampions = championStats(recent).slice(0, 5);
  const synced = profile.player.lastSyncedAt;

  return (
    <div className="page">
      <PageHeader
        title="Dashboard"
        description={
          recent.length
            ? `Resumo das últimas ${recent.length} partidas · ${synced ? `sincronizado ${formatRelative(new Date(synced).toISOString())}` : "não sincronizado"}`
            : "Jogador principal"
        }
        actions={
          <button className="btn btn--primary" type="button" onClick={refresh} disabled={busy}>
            <RefreshCw size={15} className={busy ? "spin" : undefined} />
            {label}
          </button>
        }
      />

      {notice && (
        <div className="notice notice--warning" role="status">
          <AlertTriangle size={16} />
          <div>
            <strong>Exibindo dados salvos.</strong> {notice}
          </div>
        </div>
      )}

      <div className="grid grid--hero">
        <ProfileCard profile={profile} />
        <Card title="Evolução de PDL" subtitle="Ranqueada Solo/Duo · registrada a cada atualização">
          {lpHistory.length >= 2 ? (
            <LpHistoryChart data={lpHistory} />
          ) : (
            <div className="empty">
              O gráfico aparece a partir da segunda mudança de PDL registrada. Atualize depois de jogar algumas
              ranqueadas Solo/Duo.
            </div>
          )}
        </Card>
      </div>

      {recent.length === 0 ? (
        <Card title="Partidas">
          <div className="empty">
            <History size={22} style={{ marginBottom: 8 }} />
            <div>Nenhuma partida salva ainda.</div>
            <div className="muted" style={{ marginTop: 4 }}>
              Clique em <strong>Atualizar</strong> para baixar as últimas {SYNC_COUNT} partidas.
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid--stats">
            <StatCard
              label="Taxa de vitória"
              icon={Trophy}
              value={formatPercent(stats.winRate)}
              delta={hasDeltas ? deltaOf(last10.winRate, prev10.winRate, (v) => `${Math.round(v * 100)} p.p.`) : undefined}
              hint={hasDeltas ? "últimas 10 vs. 10 anteriores" : `${stats.wins}V ${stats.losses}D`}
            />
            <StatCard
              label="KDA médio"
              icon={Swords}
              value={formatDecimal(stats.kda)}
              hint={`${formatDecimal(stats.kills)} / ${formatDecimal(stats.deaths)} / ${formatDecimal(stats.assists)}`}
            />
            <StatCard
              label="CS por minuto"
              icon={Crosshair}
              value={formatDecimal(stats.csPerMin)}
              delta={hasDeltas ? deltaOf(last10.csPerMin, prev10.csPerMin, formatDecimal) : undefined}
              hint={hasDeltas ? "últimas 10 vs. 10 anteriores" : `${formatDecimal(stats.damagePerMin)} dano/min`}
            />
            <StatCard
              label="Visão por minuto"
              icon={Eye}
              value={formatDecimal(stats.visionPerMin)}
              hint={`${formatPercent(stats.killParticipation)} de participação em abates`}
            />
          </div>

          <div className="grid grid--2">
            <Card
              flush
              title="Partidas recentes"
              actions={
                <Link to="/matches" className="btn">
                  Ver todas
                </Link>
              }
            >
              <div className="match-list">
                {recent.slice(0, 7).map((m) => (
                  <MatchRow key={m.matchId} match={m} />
                ))}
              </div>
            </Card>

            <div className="grid" style={{ alignContent: "start" }}>
              {allMatches.length >= 10 && (
                <Card title="Tendência de vitórias" subtitle="Média móvel de 10 partidas · linha tracejada = 50%">
                  <WinRateTrendChart matches={allMatches} />
                </Card>
              )}
              <Card title="Campeões mais jogados" subtitle={`Nas últimas ${recent.length} partidas`}>
                <TopChampions champions={topChampions} />
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Visão geral do jogador principal, lida do banco local. */
export function DashboardPage() {
  return <RequireActivePlayer title="Dashboard">{(puuid) => <Dashboard key={puuid} puuid={puuid} />}</RequireActivePlayer>;
}
