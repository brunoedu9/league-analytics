import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

export function Card({ title, subtitle, actions, flush, className = "", children }: CardProps) {
  return (
    <section className={`card${flush ? " card--flush" : ""} ${className}`}>
      {(title || actions) && (
        <div className="card__header">
          <div>
            {title && <h2 className="card__title">{title}</h2>}
            {subtitle && <div className="card__subtitle">{subtitle}</div>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
