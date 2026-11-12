import { Link } from "react-router-dom";
import type { MatchSummary } from "../types/models";
import {
  QUEUE_SHORT,
  formatCompact,
  formatDecimal,
  formatDuration,
  formatKda,
  formatPercent,
  formatRelative,
  positionLabel,
} from "../lib/format";
import { ChampionIcon } from "./ChampionIcon";
import { ResultBadge } from "./Badge";

/** Linha de partida; clicar abre a Análise de partida (com `focusPuuid` em destaque). */
export function MatchRow({ match, focusPuuid }: { match: MatchSummary; focusPuuid?: string }) {
  const minutes = match.durationSec / 60;
  return (
    <Link
      to={`/match-analysis/${match.matchId}${focusPuuid ? `?p=${encodeURIComponent(focusPuuid)}` : ""}`}
      className={`match-row ${match.win ? "is-win" : "is-loss"}`}
      aria-label={`${match.win ? "Vitória" : "Derrota"} de ${match.champion}, ${match.kills}/${match.deaths}/${match.assists}. Abrir análise`}
    >
      <div className="match-row__stripe" />
      <ChampionIcon name={match.champion} src={match.championIcon} size={40} />
      <div>
        <div className="match-row__champ">{match.champion}</div>
        <div className="match-row__sub">
          {QUEUE_SHORT[match.queue]} · {positionLabel(match.position)}
        </div>
      </div>
      <div className="match-row__cell num">
        <span className="match-row__kda">
          {match.kills} / {match.deaths} / {match.assists}
        </span>
        <small>{formatKda(match.kills, match.deaths, match.assists)} KDA</small>
      </div>
      <div className="match-row__cell num">
        {match.cs} CS
        <small>{formatDecimal(match.cs / minutes)}/min</small>
      </div>
      <div className="match-row__cell num">
        {formatCompact(match.damage)}
        <small>dano · {formatPercent(match.killParticipation)} KP</small>
      </div>
      <div className="match-row__cell match-row__right num">
        <ResultBadge win={match.win} />
        <small>
          {formatDuration(match.durationSec)} · {formatRelative(match.playedAt)}
        </small>
      </div>
    </Link>
  );
}
