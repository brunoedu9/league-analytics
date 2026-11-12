interface ChartTooltipProps {
  active?: boolean;
  title?: string;
  value?: string;
  detail?: string;
}

/** Tooltip padrão dos gráficos: título discreto + valor em destaque. */
export function ChartTooltip({ active, title, value, detail }: ChartTooltipProps) {
  if (!active || !value) return null;
  return (
    <div className="chart-tooltip">
      {title && <div className="chart-tooltip__title">{title}</div>}
      <div className="chart-tooltip__value num">{value}</div>
      {detail && <div className="muted">{detail}</div>}
    </div>
  );
}

/** Estilos compartilhados: eixos e grade recessivos. */
export const axisProps = {
  stroke: "var(--text-muted)",
  tick: { fill: "var(--text-muted)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

export const gridProps = {
  stroke: "var(--border)",
  strokeDasharray: "0",
  vertical: false,
} as const;
