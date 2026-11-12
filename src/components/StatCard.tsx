import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  hint?: string;
  /** Variação em relação ao período anterior, já formatada (ex.: "+3 p.p."). */
  delta?: { text: string; positive: boolean };
}

export function StatCard({ label, value, icon: Icon, hint, delta }: StatCardProps) {
  return (
    <div className="card">
      <div className="stat__label">
        {Icon && <Icon size={15} />}
        {label}
      </div>
      <div className="stat__value num">{value}</div>
      <div className="stat__hint">
        {delta && (
          <span className={`delta ${delta.positive ? "delta--up" : "delta--down"}`}>
            {delta.positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {delta.text}
          </span>
        )}
        {delta && hint && " "}
        {hint}
      </div>
    </div>
  );
}
