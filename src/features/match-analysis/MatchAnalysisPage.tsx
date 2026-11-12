import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Coins, Crown, Flame, Skull, Swords, TowerControl } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { Badge, ResultBadge } from "../../components/Badge";
import { ChampionIcon } from "../../components/ChampionIcon";
import { MatchRow } from "../../components/MatchRow";
import { AsyncView } from "../../components/AsyncView";
import { RequireActivePlayer } from "../../components/RequireActivePlayer";
import { GoldDiffChart, type GoldDiffPoint } from "../../components/charts/GoldDiffChart";
import { errorMessage, useAsync } from "../../hooks/useAsync";
import { useActivePlayer } from "../../app/ActivePlayer";
import {
  getMatchDetails,
  getMatchTimeline,
  getRecentMatches,
  type MatchDetails,
  type ParticipantDetail,
  type Timeline,
} from "../../services/playerApi";
import {
  QUEUE_LABEL,
  formatCompact,
  formatDecimal,
  formatDuration,
  formatInt,
  formatKda,
  positionLabel,
} from "../../lib/format";

const TEAMS = [
  { id: 100, name: "Time azul", className: "team--blue" },
  { id: 200, name: "Time vermelho", className: "team--red" },
] as const;

const playerName = (p: ParticipantDetail) =>
  p.riotIdGameName ? `${p.riotIdGameName}${p.riotIdTagline ? `#${p.riotIdTagline}` : ""}` : "Jogador";

function teamTotals(players: ParticipantDetail[]) {
  const sum = (fn: (p: ParticipantDetail) => number) => players.reduce((acc, p) => acc + fn(p), 0);
  return {
    win: players[0]?.win ?? false,
    kills: sum((p) => p.kills),
    gold: sum((p) => p.gold),
    damage: sum((p) => p.damage),
    turrets: sum((p) => p.turretTakedowns),
    dragons: sum((p) => p.dragonKills),
    barons: sum((p) => p.baronKills),
  };
}

/** Diferença de ouro (azul − vermelho) a cada quadro da linha do tempo. */
function goldDiff(timeline: Timeline, participants: ParticipantDetail[]): GoldDiffPoint[] {
  const teamOf = new Map(participants.map((p) => [p.participantIndex, p.teamId]));
  const minutesPerFrame = timeline.frameIntervalMs / 60000;
  return timeline.goldFrames.map((frame, i) => ({
    minute: Math.round(i * minutesPerFrame),
    diff: frame.reduce((acc, gold, idx) => {
      const team = teamOf.get(idx + 1);
      return team === 100 ? acc + gold : team === 200 ? acc - gold : acc;
    }, 0),
  }));
}

function TeamSummary({ details }: { details: MatchDetails }) {
  return (
    <div className="team-summary">
      {TEAMS.map((team) => {
        const t = teamTotals(details.participants.filter((p) => p.teamId === team.id));
        return (
          <div key={team.id} className={`team-summary__side ${team.className}`}>
            <div className="team-summary__head">
              <span className="team-dot" />
              <strong>{team.name}</strong>
              <ResultBadge win={t.win} />
            </div>
            <div className="team-summary__stats num">
              <span title="Abates">
                <Skull size={14} /> {t.kills}
              </span>
              <span title="Ouro">
                <Coins size={14} /> {formatCompact(t.gold)}
              </span>
              <span title="Torres">
                <TowerControl size={14} /> {t.turrets}
              </span>
              <span title="Dragões">
                <Flame size={14} /> {t.dragons}
              </span>
              <span title="Barões">
                <Crown size={14} /> {t.barons}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TeamTable({
  team,
  players,
  minutes,
  maxDamage,
  focusPuuid,
}: {
  team: (typeof TEAMS)[number];
  players: ParticipantDetail[];
  minutes: number;
  maxDamage: number;
  focusPuuid: string | null;
}) {
  return (
    <Card flush className={team.className}>
      <div className="card__header">
        <h2 className="card__title">
          <span className="team-dot" /> {team.name}
        </h2>
        <ResultBadge win={players[0]?.win ?? false} />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th style={{ paddingLeft: 20 }}>Campeão</th>
            <th className="right">KDA</th>
            <th className="right">CS</th>
            <th className="right">Ouro</th>
            <th style={{ width: "24%" }}>Dano a campeões</th>
            <th className="right" style={{ paddingRight: 20 }}>
              Visão
            </th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.puuid} className={p.puuid === focusPuuid ? "is-focus" : undefined}>
              <td style={{ paddingLeft: 20 }}>
                <div className="table__champ">
                  <ChampionIcon name={p.champion} src={p.championIcon} size={32} />
                  <div style={{ minWidth: 0 }}>
                    <div className="ellipsis">{p.champion}</div>
                    <div className="muted ellipsis" style={{ fontSize: 12, fontWeight: 400 }}>
                      {playerName(p)} · {positionLabel(p.position)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="right num">
                {p.kills}/{p.deaths}/{p.assists}
                <div className="muted" style={{ fontSize: 11 }}>
                  {formatKda(p.kills, p.deaths, p.assists)}
                </div>
              </td>
              <td className="right num">
                {p.cs}
                <div className="muted" style={{ fontSize: 11 }}>
                  {formatDecimal(p.cs / minutes)}/min
                </div>
              </td>
              <td className="right num">{formatCompact(p.gold)}</td>
              <td>
                <div className="num" style={{ fontSize: 12, marginBottom: 4 }}>
                  {formatInt(p.damage)}
                </div>
                <div className="meter">
                  <div className="meter__fill" style={{ width: `${(p.damage / maxDamage) * 100}%` }} />
                </div>
              </td>
              <td className="right num" style={{ paddingRight: 20 }}>
                {p.visionScore}
                <div className="muted" style={{ fontSize: 11 }}>
                  {p.controlWards} sentinelas de controle
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

const COMPARE: { label: string; value: (p: ParticipantDetail, minutes: number) => number; format: (v: number) => string }[] = [
  { label: "Abates + assistências", value: (p) => p.kills + p.assists, format: formatInt },
  { label: "Mortes", value: (p) => p.deaths, format: formatInt },
  { label: "CS por minuto", value: (p, m) => p.cs / m, format: formatDecimal },
  { label: "Ouro", value: (p) => p.gold, format: formatInt },
  { label: "Dano a campeões", value: (p) => p.damage, format: formatInt },
  { label: "Placar de visão", value: (p) => p.visionScore, format: formatInt },
];

/** Jogador em foco contra o adversário da mesma posição. */
function HeadToHead({ me, rival, minutes }: { me: ParticipantDetail; rival: ParticipantDetail; minutes: number }) {
  return (
    <Card title="Contra o adversário direto" subtitle={`${positionLabel(me.position)} · barra maior = valor maior`}>
      <div className="h2h__players">
        <div className="h2h__player">
          <ChampionIcon name={me.champion} src={me.championIcon} size={36} />
          <div className="ellipsis">
            <strong>{me.champion}</strong>
            <div className="muted ellipsis" style={{ fontSize: 12 }}>
              {playerName(me)}
            </div>
          </div>
        </div>
        <div className="h2h__player h2h__player--right">
          <div className="ellipsis" style={{ textAlign: "right" }}>
            <strong>{rival.champion}</strong>
            <div className="muted ellipsis" style={{ fontSize: 12 }}>
              {playerName(rival)}
            </div>
          </div>
          <ChampionIcon name={rival.champion} src={rival.championIcon} size={36} />
        </div>
      </div>
      <div className="h2h__rows">
        {COMPARE.map((row) => {
          const a = row.value(me, minutes);
          const b = row.value(rival, minutes);
          const total = a + b || 1;
          return (
            <div key={row.label} className="h2h__row">
              <span className="num h2h__value">{row.format(a)}</span>
              <div className="h2h__bars" aria-hidden>
                <div className="h2h__bar h2h__bar--me" style={{ width: `${(a / total) * 100}%` }} />
                <div className="h2h__bar h2h__bar--rival" style={{ width: `${(b / total) * 100}%` }} />
              </div>
              <span className="num h2h__value h2h__value--right">{row.format(b)}</span>
              <span className="h2h__label">{row.label}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function GoldCard({ details }: { details: MatchDetails }) {
  const state = useAsync(() => getMatchTimeline(details.matchId), [details.matchId]);
  return (
    <Card title="Vantagem de ouro" subtitle="Acima da linha: time azul na frente · abaixo: time vermelho">
      {state.status === "loading" && <div className="skeleton" style={{ minHeight: 240 }} />}
      {state.status === "error" && (
        <div className="empty">
          Linha do tempo indisponível: {errorMessage(state.error)}
          <div className="muted" style={{ marginTop: 4 }}>
            Ela é baixada da Riot na primeira análise da partida e depois fica salva para uso offline.
          </div>
        </div>
      )}
      {state.status === "success" && <GoldDiffChart data={goldDiff(state.data, details.participants)} />}
    </Card>
  );
}

function Analysis({ details, focusPuuid }: { details: MatchDetails; focusPuuid: string | null }) {
  const navigate = useNavigate();
  const minutes = details.durationSec / 60;
  const maxDamage = Math.max(...details.participants.map((p) => p.damage), 1);
  const me = details.participants.find((p) => p.puuid === focusPuuid) ?? null;
  const rival =
    me && me.position
      ? details.participants.find((p) => p.teamId !== me.teamId && p.position === me.position) ?? null
      : null;
  const date = new Date(details.playedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  const patch = details.gameVersion.split(".").slice(0, 2).join(".");

  return (
    <div className="page">
      <PageHeader
        title="Análise de partida"
        description={`${QUEUE_LABEL[details.queue] ?? details.gameMode} · ${date} · ${formatDuration(details.durationSec)} · patch ${patch}`}
        actions={
          <button className="btn" type="button" onClick={() => navigate(-1)}>
            <ArrowLeft size={15} />
            Voltar
          </button>
        }
      />

      {me && (
        <div className="notice">
          <Swords size={16} />
          <div>
            <strong>{playerName(me)}</strong> jogou de <strong>{me.champion}</strong>
            {me.position && ` (${positionLabel(me.position)})`} — <Badge variant={me.win ? "win" : "loss"}>{me.win ? "Vitória" : "Derrota"}</Badge>{" "}
            com {me.kills}/{me.deaths}/{me.assists}.
          </div>
        </div>
      )}

      <TeamSummary details={details} />

      <div className={`grid ${me && rival ? "grid--2" : ""}`}>
        <GoldCard details={details} />
        {me && rival && <HeadToHead me={me} rival={rival} minutes={minutes} />}
      </div>

      {TEAMS.map((team) => (
        <TeamTable
          key={team.id}
          team={team}
          players={details.participants.filter((p) => p.teamId === team.id)}
          minutes={minutes}
          maxDamage={maxDamage}
          focusPuuid={focusPuuid}
        />
      ))}
    </div>
  );
}

function MatchById({ matchId }: { matchId: string }) {
  const [params] = useSearchParams();
  const { puuid: activePuuid } = useActivePlayer();
  const focusPuuid = params.get("p") ?? activePuuid;
  const state = useAsync(() => getMatchDetails(matchId), [matchId]);
  return <AsyncView state={state}>{(details) => <Analysis details={details} focusPuuid={focusPuuid} />}</AsyncView>;
}

/** Sem partida escolhida: lista as partidas do jogador principal para selecionar. */
function MatchPicker({ puuid }: { puuid: string }) {
  const state = useAsync(() => getRecentMatches(puuid, 30), [puuid]);
  return (
    <div className="page">
      <PageHeader title="Análise de partidas" description="Escolha uma partida para ver os 10 participantes e a evolução do ouro." />
      <AsyncView state={state}>
        {(matches) =>
          matches.length === 0 ? (
            <div className="placeholder">
              Nenhuma partida salva ainda. <Link to="/dashboard">Atualize o jogador principal</Link>.
            </div>
          ) : (
            <Card flush title="Partidas recentes" subtitle="Clique em uma partida para analisá-la">
              <div className="match-list">
                {matches.map((m) => (
                  <MatchRow key={m.matchId} match={m} focusPuuid={puuid} />
                ))}
              </div>
            </Card>
          )
        }
      </AsyncView>
    </div>
  );
}

/** RF04 — Análise individual de partidas. */
export function MatchAnalysisPage() {
  const { matchId } = useParams();
  if (matchId) return <MatchById key={matchId} matchId={matchId} />;
  return (
    <RequireActivePlayer title="Análise de partidas">{(puuid) => <MatchPicker key={puuid} puuid={puuid} />}</RequireActivePlayer>
  );
}
