import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Crosshair, Eye, History, RefreshCw, Search, Star, Swords, Trophy } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { ProfileCard } from "../../components/ProfileCard";
import { Badge } from "../../components/Badge";
import { WinLossBar } from "../../components/WinLossBar";
import { StatCard } from "../../components/StatCard";
import { MatchRow } from "../../components/MatchRow";
import { TopChampions } from "../../components/TopChampions";
import { WinRateTrendChart } from "../../components/charts/WinRateTrendChart";
import { errorMessage, useAsync } from "../../hooks/useAsync";
import { SYNC_COUNT, usePlayerRefresh } from "../../hooks/usePlayerRefresh";
import { useActivePlayer } from "../../app/ActivePlayer";
import {
  getPlayerProfile,
  getRecentMatches,
  listPlayers,
} from "../../services/playerApi";
import { regionName } from "../../lib/regions";
import { formatDecimal, formatPercent, formatRelative } from "../../lib/format";
import { aggregate, championStats } from "../../lib/stats";
import type { MatchSummary } from "../../types/models";

const isoFromMs = (ms: number) => new Date(ms).toISOString();
const PAGE = 10;

function MatchesSection({ matches, puuid }: { matches: MatchSummary[]; puuid: string }) {
  const [visible, setVisible] = useState(PAGE);
  const stats = aggregate(matches);
  const top = championStats(matches).slice(0, 5);
  return (
    <>
      <div className="grid grid--stats">
        <StatCard label="Taxa de vitória" icon={Trophy} value={formatPercent(stats.winRate)} hint={`${stats.wins}V ${stats.losses}D`} />
        <StatCard
          label="KDA médio"
          icon={Swords}
          value={formatDecimal(stats.kda)}
          hint={`${formatDecimal(stats.kills)} / ${formatDecimal(stats.deaths)} / ${formatDecimal(stats.assists)}`}
        />
        <StatCard label="CS por minuto" icon={Crosshair} value={formatDecimal(stats.csPerMin)} hint={`${formatDecimal(stats.damagePerMin)} dano/min`} />
        <StatCard
          label="Visão por minuto"
          icon={Eye}
          value={formatDecimal(stats.visionPerMin)}
          hint={`${formatPercent(stats.killParticipation)} de participação em abates`}
        />
      </div>

      <div className="grid grid--2">
        <Card flush title="Partidas" subtitle={`${matches.length} salvas no banco local`}>
          <div className="match-list">
            {matches.slice(0, visible).map((m) => (
              <MatchRow key={m.matchId} match={m} focusPuuid={puuid} />
            ))}
          </div>
          {visible < matches.length && (
            <div style={{ padding: 12, textAlign: "center", borderTop: "1px solid var(--border)" }}>
              <button className="btn" type="button" onClick={() => setVisible((v) => v + PAGE)}>
                Mostrar mais
              </button>
            </div>
          )}
        </Card>
        <div className="grid" style={{ alignContent: "start" }}>
          {matches.length >= 10 && (
            <Card title="Tendência de vitórias" subtitle="Média móvel de 10 partidas · linha tracejada = 50%">
              <WinRateTrendChart matches={matches.slice(0, 30)} />
            </Card>
          )}
          <Card title="Campeões mais jogados" subtitle={`Nas ${matches.length} partidas salvas`}>
            <TopChampions champions={top} />
          </Card>
        </div>
      </div>
    </>
  );
}

function PlayerByPuuid({ puuid }: { puuid: string }) {
  const location = useLocation();
  const [reloadKey, setReloadKey] = useState(0);
  const profileState = useAsync(() => getPlayerProfile(puuid), [puuid, reloadKey]);
  const matchesState = useAsync(() => getRecentMatches(puuid, 100), [puuid, reloadKey]);
  const navWarning = (location.state as { warning?: string | null } | null)?.warning ?? null;
  const active = useActivePlayer();
  const loadedPlayer = profileState.status === "success" ? profileState.data.player : null;
  const { refresh, busy, label, notice } = usePlayerRefresh(loadedPlayer, () => setReloadKey((k) => k + 1));

  if (profileState.status === "loading") {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }
  if (profileState.status === "error") return <div className="placeholder">{errorMessage(profileState.error)}</div>;

  const profile = profileState.data;
  const { player } = profile;
  const matches = matchesState.status === "success" ? matchesState.data : [];

  const warning = notice ?? (reloadKey === 0 ? navWarning : null);
  const isActive = active.puuid === puuid;

  return (
    <div className="page">
      <PageHeader
        title="Perfil do jogador"
        description={
          player.lastSyncedAt
            ? `Partidas sincronizadas ${formatRelative(isoFromMs(player.lastSyncedAt))} · dados salvos no banco local`
            : `Perfil atualizado ${formatRelative(isoFromMs(player.updatedAt))} · partidas ainda não sincronizadas`
        }
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            {!isActive && (
              <button className="btn" type="button" onClick={() => active.setActive(puuid)}>
                <Star size={15} />
                Definir como principal
              </button>
            )}
            <button className="btn btn--primary" type="button" onClick={refresh} disabled={busy}>
              <RefreshCw size={15} className={busy ? "spin" : undefined} />
              {label}
            </button>
          </div>
        }
      />

      {warning && (
        <div className="notice notice--warning" role="status">
          <AlertTriangle size={16} />
          <div>
            <strong>Exibindo dados salvos.</strong> {warning}
          </div>
        </div>
      )}

      {matches.length === 0 ? (
        <div className="grid grid--hero">
          <ProfileCard profile={profile} badge={isActive ? <Badge variant="accent"><Star size={11} /> Jogador principal</Badge> : undefined} />
          <Card title="Partidas" subtitle="Histórico e estatísticas deste jogador">
            <div className="empty">
              <History size={22} style={{ marginBottom: 8 }} />
              {player.lastSyncedAt ? (
                <div>Nenhuma partida encontrada na Riot para este jogador.</div>
              ) : (
                <>
                  <div>Nenhuma partida salva ainda.</div>
                  <div className="muted" style={{ marginTop: 4 }}>
                    Clique em <strong>Atualizar</strong> para baixar as últimas {SYNC_COUNT} partidas.
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      ) : (
        <>
          <div className="grid grid--hero">
            <ProfileCard profile={profile} badge={isActive ? <Badge variant="accent"><Star size={11} /> Jogador principal</Badge> : undefined} />
            <Card title="Últimas partidas" subtitle="Resultado e KDA das partidas mais recentes">
              <RecentForm matches={matches.slice(0, 20)} />
            </Card>
          </div>
          <MatchesSection matches={matches} puuid={puuid} />
        </>
      )}
    </div>
  );
}

/** Sequência de resultados (V/D) das últimas partidas, da mais recente para a mais antiga. */
function RecentForm({ matches }: { matches: MatchSummary[] }) {
  const stats = aggregate(matches);
  return (
    <div>
      <div className="form-strip" role="list" aria-label="Resultados recentes">
        {matches.map((m) => (
          <span
            key={m.matchId}
            role="listitem"
            className={`form-chip ${m.win ? "is-win" : "is-loss"}`}
            title={`${m.champion} · ${m.kills}/${m.deaths}/${m.assists}`}
          >
            {m.win ? "V" : "D"}
          </span>
        ))}
      </div>
      <div className="divider" />
      <WinLossBar wins={stats.wins} losses={stats.losses} />
      <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
        Mais recente à esquerda. Passe o mouse para ver campeão e KDA.
      </div>
    </div>
  );
}

function RecentPlayers() {
  const navigate = useNavigate();
  const state = useAsync(() => listPlayers(12));
  return (
    <div className="page">
      <PageHeader title="Perfil do jogador" description="Pesquise um Riot ID na barra superior (ex.: Fulano#BR1)." />
      <Card title="Pesquisas recentes" subtitle="Jogadores salvos no banco local — disponíveis mesmo sem internet">
        {state.status === "loading" && <div className="skeleton" style={{ minHeight: 120 }} />}
        {state.status === "error" && <div className="empty">{errorMessage(state.error)}</div>}
        {state.status === "success" && state.data.length === 0 && (
          <div className="empty">
            <Search size={22} style={{ marginBottom: 8 }} />
            <div>Nenhum jogador pesquisado ainda.</div>
          </div>
        )}
        {state.status === "success" && state.data.length > 0 && (
          <div className="player-list">
            {state.data.map((p) => (
              <button key={p.puuid} type="button" className="player-item" onClick={() => navigate(`/player/${p.puuid}`)}>
                <div className="profile__icon profile__icon--sm">{p.gameName[0]?.toUpperCase()}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="player-item__name">
                    {p.gameName} <span className="profile__tag">#{p.tagLine}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {regionName(p.platform)} · Nível {p.summonerLevel} · {formatRelative(isoFromMs(p.updatedAt))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/** RF01/RF02/RF03 — Pesquisa, perfil e partidas do jogador. */
export function PlayerPage() {
  const { puuid } = useParams();
  return puuid ? <PlayerByPuuid key={puuid} puuid={puuid} /> : <RecentPlayers />;
}
