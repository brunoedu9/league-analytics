import type { MatchSummary } from "../types/models";
import {
  POSITION_LABEL,
  QUEUE_SHORT,
  formatCompact,
  formatDecimal,
  formatDuration,
  formatKda,
  formatPercent,
  formatRelative,
} from "../lib/format";
import { ChampionIcon } from "./ChampionIcon";
import { ResultBadge } from "./Badge";

export function MatchRow({ match }: { match: MatchSummary }) {
  const minutes = match.durationSec / 60;
  return (
    <div className={`match-row ${match.win ? "is-win" : "is-loss"}`}>
      <div className="match-row__stripe" />
      <ChampionIcon name={match.champion} size={40} />
      <div>
        <div className="match-row__champ">{match.champion}</div>
        <div className="match-row__sub">
          {QUEUE_SHORT[match.queue]} · {POSITION_LABEL[match.position]}
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
    </div>
  );
}
