import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LpPoint } from "../../types/models";
import { formatShortDate } from "../../lib/format";
import { ChartTooltip, axisProps, gridProps } from "./ChartTooltip";
import { ladderTickLabel } from "../../lib/ladder";

/** Evolução de PDL ao longo do tempo (série única: o título do card nomeia a série). */
export function LpHistoryChart({ data }: { data: LpPoint[] }) {
  const values = data.map((d) => d.ladderValue);
  const min = Math.floor((Math.min(...values) - 30) / 100) * 100;
  const max = Math.ceil((Math.max(...values) + 30) / 100) * 100;
  const ticks: number[] = [];
  for (let v = min; v <= max; v += 100) ticks.push(v);

  return (
    <div className="chart" role="img" aria-label={`Evolução de PDL: de ${data[0]?.label} a ${data.at(-1)?.label}`}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="lpFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="date" tickFormatter={formatShortDate} minTickGap={32} {...axisProps} />
          <YAxis
            domain={[min, max]}
            ticks={ticks}
            tickFormatter={ladderTickLabel}
            width={56}
            {...axisProps}
          />
          <Tooltip
            cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
            content={({ active, payload }) => {
              const point = payload?.[0]?.payload as LpPoint | undefined;
              return (
                <ChartTooltip
                  active={active}
                  title={point && formatShortDate(point.date)}
                  value={point?.label}
                />
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="ladderValue"
            stroke="var(--series-1)"
            strokeWidth={2}
            fill="url(#lpFill)"
            dot={false}
            activeDot={{ r: 5, fill: "var(--series-1)", stroke: "var(--surface-1)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
