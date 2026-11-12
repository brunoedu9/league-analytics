import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MatchSummary } from "../../types/models";
import { formatPercent } from "../../lib/format";
import { ChartTooltip, axisProps, gridProps } from "./ChartTooltip";

interface Point {
  game: number;
  winRate: number;
  champion: string;
  win: boolean;
}

/**
 * Taxa de vitória móvel (janela de `window` partidas), da mais antiga para a mais recente.
 * Os pontos iniciais, com janela incompleta, são omitidos para não exibir 0% ou 100% enganosos.
 */
function rollingWinRate(matches: MatchSummary[], window: number): Point[] {
  const chronological = [...matches].reverse();
  const firstFull = Math.min(window, chronological.length) - 1;
  return chronological.slice(firstFull).map((m, offset) => {
    const i = firstFull + offset;
    const slice = chronological.slice(Math.max(0, i - window + 1), i + 1);
    return {
      game: i + 1,
      winRate: slice.filter((s) => s.win).length / slice.length,
      champion: m.champion,
      win: m.win,
    };
  });
}

export function WinRateTrendChart({ matches, window = 10 }: { matches: MatchSummary[]; window?: number }) {
  const data = rollingWinRate(matches, window);
  return (
    <div className="chart" role="img" aria-label={`Taxa de vitória móvel das últimas ${data.length} partidas`}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="game" {...axisProps} minTickGap={24} />
          <YAxis
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1]}
            tickFormatter={formatPercent}
            width={44}
            {...axisProps}
          />
          <ReferenceLine y={0.5} stroke="var(--text-muted)" strokeDasharray="4 4" />
          <Tooltip
            cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as Point | undefined;
              return (
                <ChartTooltip
                  active={active}
                  title={p && `Partida ${p.game} · ${p.champion} (${p.win ? "Vitória" : "Derrota"})`}
                  value={p && `${formatPercent(p.winRate)} nas últimas ${Math.min(window, p.game)}`}
                />
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="winRate"
            stroke="var(--series-1)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: "var(--series-1)", stroke: "var(--surface-1)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
