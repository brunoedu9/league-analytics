import type { ReactNode } from "react";
import type { AsyncState } from "../hooks/useAsync";

/** Renderiza carregamento (skeleton), erro ou o conteúdo de um AsyncState. */
export function AsyncView<T>({ state, children }: { state: AsyncState<T>; children: (data: T) => ReactNode }) {
  if (state.status === "loading") {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: 48, minHeight: 48 }} />
        <div className="skeleton" style={{ height: 260 }} />
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }
  if (state.status === "error") {
    return <div className="placeholder">Não foi possível carregar os dados locais.</div>;
  }
  return <>{children(state.data)}</>;
}
