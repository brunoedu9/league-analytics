import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip, axisProps, gridProps } from "./ChartTooltip";
import { formatCompact, formatInt } from "../../lib/format";

export interface GoldDiffPoint {
  minute: number;
  /** Ouro do time azul menos o do vermelho. Positivo = vantagem azul. */
  diff: number;
}

/**
 * Vantagem de ouro ao longo da partida. Uma única série divergente em torno de zero:
 * acima = time azul, abaixo = time vermelho (cores dos lados do mapa).
 */
export function GoldDiffChart({ data }: { data: GoldDiffPoint[] }) {
  const max = Math.max(...data.map((d) => d.diff), 0);
  const min = Math.min(...data.map((d) => d.diff), 0);
  const range = max - min || 1;
  const zeroOffset = max / range; // posição do zero no gradiente (0 = topo)
  const bound = Math.ceil(Math.max(Math.abs(max), Math.abs(min), 1000) / 1000) * 1000;

  return (
    <div className="chart" role="img" aria-label="Vantagem de ouro por minuto entre os times">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="goldStroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset={zeroOffset} stopColor="var(--team-blue)" />
              <stop offset={zeroOffset} stopColor="var(--team-red)" />
            </linearGradient>
            <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset={0} stopColor="var(--team-blue)" stopOpacity={0.3} />
              <stop offset={zeroOffset} stopColor="var(--team-blue)" stopOpacity={0.04} />
              <stop offset={zeroOffset} stopColor="var(--team-red)" stopOpacity={0.04} />
              <stop offset={1} stopColor="var(--team-red)" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="minute" tickFormatter={(m: number) => `${m}'`} minTickGap={24} {...axisProps} />
          <YAxis
            domain={[-bound, bound]}
            tickFormatter={(v: number) => (v === 0 ? "0" : `${v > 0 ? "+" : "−"}${formatCompact(Math.abs(v))}`)}
            width={52}
            {...axisProps}
          />
          <ReferenceLine y={0} stroke="var(--text-muted)" />
          <Tooltip
            cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as GoldDiffPoint | undefined;
              if (!p) return null;
              const side = p.diff > 0 ? "Time azul" : p.diff < 0 ? "Time vermelho" : "Empate";
              return (
                <ChartTooltip
                  active={active}
                  title={`Minuto ${p.minute}`}
                  value={p.diff === 0 ? "Ouro empatado" : `${side} +${formatInt(Math.abs(p.diff))} de ouro`}
                />
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="diff"
            stroke="url(#goldStroke)"
            strokeWidth={2}
            fill="url(#goldFill)"
            baseValue={0}
            dot={false}
            activeDot={{ r: 5, fill: "var(--text-primary)", stroke: "var(--surface-1)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
