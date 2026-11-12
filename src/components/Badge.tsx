import type { ReactNode } from "react";

type Variant = "default" | "win" | "loss" | "accent";

export function Badge({ variant = "default", children }: { variant?: Variant; children: ReactNode }) {
  return <span className={`badge${variant === "default" ? "" : ` badge--${variant}`}`}>{children}</span>;
}

/** Resultado da partida: cor + texto, nunca só cor. */
export function ResultBadge({ win }: { win: boolean }) {
  return <Badge variant={win ? "win" : "loss"}>{win ? "Vitória" : "Derrota"}</Badge>;
}
