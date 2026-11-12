import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Crosshair, Eye, History, RefreshCw, Search, Swords, Trophy } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { RankBadge } from "../../components/RankBadge";
import { WinLossBar } from "../../components/WinLossBar";
import { StatCard } from "../../components/StatCard";
import { MatchRow } from "../../components/MatchRow";
import { TopChampions } from "../../components/TopChampions";
import { WinRateTrendChart } from "../../components/charts/WinRateTrendChart";
import { errorMessage, useAsync } from "../../hooks/useAsync";
import {
  getPlayerProfile,
  getRecentMatches,
  listPlayers,
  onSyncProgress,
  searchPlayer,
  syncMatches,
  type PlayerProfile,
  type StoredPlayer,
  type SyncProgress,
} from "../../services/playerApi";
import { regionName } from "../../lib/regions";
import { formatDecimal, formatPercent, formatRelative } from "../../lib/format";
import { aggregate, championStats } from "../../lib/stats";
import type { MatchSummary } from "../../types/models";

const isoFromMs = (ms: number) => new Date(ms).toISOString();
const SYNC_COUNT = 20;
const PAGE = 10;

function ProfileIcon({ player }: { player: StoredPlayer }) {
  return (
    <div className="profile__icon">
      {player.gameName[0]?.toUpperCase()}
      <span className="profile__level num">{player.summonerLevel}</span>
    </div>
  );
}

function ProfileCard({ profile }: { profile: PlayerProfile }) {
  const { player, ranks } = profile;
  return (
    <Card>
      <div className="profile">
        <ProfileIcon player={player} />
        <div>
          <div className="profile__name">
            {player.gameName} <span className="profile__tag">#{player.tagLine}</span>
          </div>
          <div className="profile__meta">
            {regionName(player.platform)} · Nível {player.summonerLevel}
          </div>
        </div>
      </div>
      {ranks.length === 0 ? (
        <>
          <div className="divider" />
          <div className="muted">Sem partidas ranqueadas nesta temporada.</div>
        </>
      ) : (
        ranks.map((rank) => (
          <div key={rank.queue}>
            <div className="divider" />
            <RankBadge rank={rank} />
            <div style={{ marginTop: 12 }}>
              <WinLossBar wins={rank.wins} losses={rank.losses} />
            </div>
          </div>
        ))
      )}
    </Card>
  );
}

function MatchesSection({ matches }: { matches: MatchSummary[] }) {
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
              <MatchRow key={m.matchId} match={m} />
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
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const profileState = useAsync(() => getPlayerProfile(puuid), [puuid, reloadKey]);
  const matchesState = useAsync(() => getRecentMatches(puuid, 100), [puuid, reloadKey]);
  const navWarning = (location.state as { warning?: string | null } | null)?.warning ?? null;

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    onSyncProgress((p) => p.puuid === puuid && setProgress(p)).then((fn) => (unlisten = fn));
    return () => unlisten?.();
  }, [puuid]);

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

  /** Atualiza perfil e elo e baixa as partidas que faltam. */
  async function refresh() {
    setBusy(true);
    setNotice(null);
    setProgress(null);
    try {
      const updated = await searchPlayer({ gameName: player.gameName, tagLine: player.tagLine }, player.platform);
      if (updated.warning) {
        // Riot inacessível: não adianta tentar baixar partidas.
        setNotice(updated.warning);
        return;
      }
      await syncMatches(puuid, SYNC_COUNT);
    } catch (err) {
      setNotice(errorMessage(err));
    } finally {
      setBusy(false);
      setProgress(null);
      setReloadKey((k) => k + 1);
    }
  }

  const warning = notice ?? (reloadKey === 0 ? navWarning : null);
  const buttonLabel = !busy
    ? "Atualizar"
    : progress && progress.total > 0
      ? `Baixando partidas ${progress.done}/${progress.total}`
      : "Atualizando…";

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
          <button className="btn btn--primary" type="button" onClick={refresh} disabled={busy}>
            <RefreshCw size={15} className={busy ? "spin" : undefined} />
            {buttonLabel}
          </button>
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
          <ProfileCard profile={profile} />
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
            <ProfileCard profile={profile} />
            <Card title="Últimas partidas" subtitle="Resultado e KDA das partidas mais recentes">
              <RecentForm matches={matches.slice(0, 20)} />
            </Card>
          </div>
          <MatchesSection matches={matches} />
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
      <div className="muted" style={{ fontSize: 12 }}>
        O Dashboard ainda usa dados fictícios. <Link to="/dashboard">Ver Dashboard</Link>
      </div>
    </div>
  );
}

/** RF01/RF02/RF03 — Pesquisa, perfil e partidas do jogador. */
export function PlayerPage() {
  const { puuid } = useParams();
  return puuid ? <PlayerByPuuid key={puuid} puuid={puuid} /> : <RecentPlayers />;
}
