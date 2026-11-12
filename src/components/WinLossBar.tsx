import { formatPercent } from "../lib/format";

interface WinLossBarProps {
  wins: number;
  losses: number;
  compact?: boolean;
}

export function WinLossBar({ wins, losses, compact }: WinLossBarProps) {
  const total = wins + losses;
  const winRate = total === 0 ? 0 : wins / total;
  return (
    <div className={`wl-bar${compact ? " wl-bar--compact" : ""}`}>
      {!compact && (
        <div className="wl-bar__labels num">
          <span>
            <strong>{wins}V</strong> <span className="muted">/</span> <strong>{losses}D</strong>
          </span>
          <span className="secondary">{formatPercent(winRate)} de vitórias</span>
        </div>
      )}
      <div className="wl-bar__track" role="img" aria-label={`${wins} vitórias, ${losses} derrotas`}>
        {wins > 0 && <div className="wl-bar__win" style={{ flex: wins }} />}
        {losses > 0 && <div className="wl-bar__loss" style={{ flex: losses }} />}
      </div>
    </div>
  );
}
