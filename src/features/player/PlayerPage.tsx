import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, History, RefreshCw, Search } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { RankBadge } from "../../components/RankBadge";
import { WinLossBar } from "../../components/WinLossBar";
import { errorMessage, useAsync } from "../../hooks/useAsync";
import {
  getPlayerProfile,
  listPlayers,
  searchPlayer,
  type PlayerProfile,
  type StoredPlayer,
} from "../../services/playerApi";
import { regionName } from "../../lib/regions";
import { formatRelative } from "../../lib/format";

const isoFromMs = (ms: number) => new Date(ms).toISOString();

function ProfileIcon({ player }: { player: StoredPlayer }) {
  return (
    <div className="profile__icon">
      {player.gameName[0]?.toUpperCase()}
      <span className="profile__level num">{player.summonerLevel}</span>
    </div>
  );
}

function Profile({ profile, onRefresh, refreshing, warning }: {
  profile: PlayerProfile;
  onRefresh: () => void;
  refreshing: boolean;
  warning: string | null;
}) {
  const { player, ranks } = profile;
  return (
    <div className="page">
      <PageHeader
        title="Perfil do jogador"
        description={`Atualizado ${formatRelative(isoFromMs(player.updatedAt))} · dados salvos no banco local`}
        actions={
          <button className="btn btn--primary" type="button" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? "spin" : undefined} />
            {refreshing ? "Atualizando…" : "Atualizar"}
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

      <div className="grid grid--hero">
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

        <Card title="Partidas" subtitle="Histórico e estatísticas deste jogador">
          <div className="empty">
            <History size={22} style={{ marginBottom: 8 }} />
            <div>A sincronização de partidas é o próximo passo da integração com a Riot.</div>
            <div className="muted" style={{ marginTop: 4 }}>
              {player.lastSyncedAt
                ? `Última sincronização ${formatRelative(isoFromMs(player.lastSyncedAt))}`
                : "Nenhuma partida sincronizada ainda."}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function PlayerByPuuid({ puuid }: { puuid: string }) {
  const location = useLocation();
  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshWarning, setRefreshWarning] = useState<string | null>(null);
  const state = useAsync(() => getPlayerProfile(puuid), [puuid, reloadKey]);
  const navWarning = (location.state as { warning?: string | null } | null)?.warning ?? null;

  if (state.status === "loading") return <div className="page"><div className="skeleton" style={{ height: 320 }} /></div>;
  if (state.status === "error") return <div className="placeholder">{errorMessage(state.error)}</div>;

  const { player } = state.data;

  async function refresh() {
    setRefreshing(true);
    try {
      const updated = await searchPlayer({ gameName: player.gameName, tagLine: player.tagLine }, player.platform);
      setRefreshWarning(updated.warning);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setRefreshWarning(errorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <Profile
      profile={state.data}
      onRefresh={refresh}
      refreshing={refreshing}
      warning={refreshWarning ?? (reloadKey === 0 ? navWarning : null)}
    />
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

/** RF01/RF02 — Pesquisa e perfil do jogador. */
export function PlayerPage() {
  const { puuid } = useParams();
  return puuid ? <PlayerByPuuid puuid={puuid} /> : <RecentPlayers />;
}
