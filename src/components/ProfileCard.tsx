import type { ReactNode } from "react";
import type { PlayerProfile } from "../services/playerApi";
import { regionName } from "../lib/regions";
import { Card } from "./Card";
import { RankBadge } from "./RankBadge";
import { WinLossBar } from "./WinLossBar";

/** Identificação do jogador + elo de cada fila ranqueada. */
export function ProfileCard({ profile, badge }: { profile: PlayerProfile; badge?: ReactNode }) {
  const { player, ranks } = profile;
  return (
    <Card>
      <div className="profile">
        <div className="profile__icon">
          {player.gameName[0]?.toUpperCase()}
          <span className="profile__level num">{player.summonerLevel}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="profile__name">
            {player.gameName} <span className="profile__tag">#{player.tagLine}</span>
          </div>
          <div className="profile__meta">
            {regionName(player.platform)} · Nível {player.summonerLevel}
          </div>
          {badge && <div style={{ marginTop: 6 }}>{badge}</div>}
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
