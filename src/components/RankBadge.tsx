import type { CSSProperties } from "react";
import type { RankEntry } from "../types/models";
import { TIER_COLOR, TIER_LABEL, formatRank } from "../lib/format";

const QUEUE_NAME = { RANKED_SOLO_5x5: "Solo/Duo", RANKED_FLEX_SR: "Flex" } as const;

/** Emblema provisório (hexágono na cor do elo). Será trocado pelos emblemas oficiais. */
export function RankBadge({ rank }: { rank: RankEntry }) {
  const style = { "--tier-color": TIER_COLOR[rank.tier] } as CSSProperties;
  return (
    <div className="rank">
      <div className="rank__emblem" style={style} aria-hidden>
        {TIER_LABEL[rank.tier][0]}
        {rank.division ?? ""}
      </div>
      <div>
        <div className="rank__queue">{QUEUE_NAME[rank.queue]}</div>
        <div className="rank__tier">{formatRank(rank.tier, rank.division)}</div>
        <div className="rank__lp num">{rank.leaguePoints} PDL</div>
      </div>
    </div>
  );
}
