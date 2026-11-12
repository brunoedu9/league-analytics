import { Link } from "react-router-dom";
import { Crosshair, Eye, RefreshCw, Swords, Trophy } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { StatCard } from "../../components/StatCard";
import { RankBadge } from "../../components/RankBadge";
import { WinLossBar } from "../../components/WinLossBar";
import { MatchRow } from "../../components/MatchRow";
import { TopChampions } from "../../components/TopChampions";
import { AsyncView } from "../../components/AsyncView";
import { LpHistoryChart } from "../../components/charts/LpHistoryChart";
import { WinRateTrendChart } from "../../components/charts/WinRateTrendChart";
import { useAsync } from "../../hooks/useAsync";
import { getPlayerOverview } from "../../services/playerService";
import { aggregate, championStats } from "../../lib/stats";
import {
  formatDecimal,
  formatPercent,
  formatRelative,
} from "../../lib/format";
import type { PlayerOverview } from "../../types/models";

/** Diferença entre as 10 partidas mais recentes e as 10 anteriores. */
function deltaOf(current: number, previous: number, format: (v: number) => string, higherIsBetter = true) {
  const diff = current - previous;
  if (Math.abs(diff) < 1e-9) return undefined;
  const sign = diff > 0 ? "+" : "−";
  return { text: `${sign}${format(Math.abs(diff))}`, positive: diff > 0 === higherIsBetter };
}

function Dashboard({ data }: { data: PlayerOverview }) {
  const { player, ranks, recentMatches, lpHistory } = data;
  const stats = aggregate(recentMatches);
  const last10 = aggregate(recentMatches.slice(0, 10));
  const prev10 = aggregate(recentMatches.slice(10, 20));
  const topChampions = championStats(recentMatches).slice(0, 5);

  return (
    <div className="page">
      <PageHeader
        title="Dashboard"
        description={`Resumo das últimas ${stats.games} partidas · sincronizado ${formatRelative(player.lastSyncedAt)}`}
        actions={
          <button className="btn btn--primary" type="button">
            <RefreshCw size={15} />
            Sincronizar
          </button>
        }
      />

      <div className="grid grid--hero">
        <Card>
          <div className="profile">
            <div className="profile__icon">
              {player.gameName[0]}
              <span className="profile__level num">{player.summonerLevel}</span>
            </div>
            <div>
              <div className="profile__name">
                {player.gameName} <span className="profile__tag">#{player.tagLine}</span>
              </div>
              <div className="profile__meta">Brasil · Nível {player.summonerLevel}</div>
            </div>
          </div>
          {ranks.map((rank) => (
            <div key={rank.queue}>
              <div className="divider" />
              <RankBadge rank={rank} />
              <div style={{ marginTop: 12 }}>
                <WinLossBar wins={rank.wins} losses={rank.losses} />
              </div>
            </div>
          ))}
        </Card>

        <Card title="Evolução de PDL" subtitle="Ranqueada Solo/Duo · últimas partidas">
          <LpHistoryChart data={lpHistory} />
        </Card>
      </div>

      <div className="grid grid--stats">
        <StatCard
          label="Taxa de vitória"
          icon={Trophy}
          value={formatPercent(stats.winRate)}
          delta={deltaOf(last10.winRate, prev10.winRate, (v) => `${Math.round(v * 100)} p.p.`)}
          hint="últimas 10 vs. 10 anteriores"
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
          delta={deltaOf(last10.csPerMin, prev10.csPerMin, formatDecimal)}
          hint="últimas 10 vs. 10 anteriores"
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
            {recentMatches.slice(0, 7).map((m) => (
              <MatchRow key={m.matchId} match={m} />
            ))}
          </div>
        </Card>

        <div className="grid" style={{ alignContent: "start" }}>
          <Card title="Tendência de vitórias" subtitle="Média móvel de 10 partidas · linha tracejada = 50%">
            <WinRateTrendChart matches={recentMatches} />
          </Card>
          <Card title="Campeões mais jogados" subtitle={`Nas últimas ${stats.games} partidas`}>
            <TopChampions champions={topChampions} />
          </Card>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const state = useAsync(getPlayerOverview);
  return <AsyncView state={state}>{(data) => <Dashboard data={data} />}</AsyncView>;
}
