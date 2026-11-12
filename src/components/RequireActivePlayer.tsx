import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { UserSearch } from "lucide-react";
import { useActivePlayer } from "../app/ActivePlayer";
import { isTauri } from "../services/tauri";
import { PageHeader } from "./PageHeader";

/** Mostra `children(puuid)` quando há jogador principal; senão, orienta o usuário. */
export function RequireActivePlayer({
  title,
  children,
}: {
  title: string;
  children: (puuid: string) => ReactNode;
}) {
  const { puuid, ready } = useActivePlayer();

  if (!ready) {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }
  if (puuid) return <>{children(puuid)}</>;

  return (
    <div className="page">
      <PageHeader title={title} />
      <div className="placeholder">
        <UserSearch size={28} style={{ marginBottom: 10 }} />
        {isTauri() ? (
          <>
            <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>Nenhum jogador principal definido</div>
            <div style={{ marginTop: 6 }}>
              Pesquise seu Riot ID na barra superior (ex.: Fulano#BR1). O primeiro jogador pesquisado vira o
              principal; você pode trocar depois na página <Link to="/player">Perfil do jogador</Link>.
            </div>
          </>
        ) : (
          <div>Disponível apenas no aplicativo desktop (npm run tauri dev).</div>
        )}
      </div>
    </div>
  );
}
