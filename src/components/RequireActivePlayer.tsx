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
            <ol className="onboarding">
              <li>
                Cadastre sua chave da Riot API em <Link to="/settings">Configurações</Link>.
              </li>
              <li>Pesquise seu Riot ID na barra superior (ex.: Fulano#BR1).</li>
              <li>
                O primeiro jogador pesquisado vira o principal; dá para trocar depois em{" "}
                <Link to="/player">Perfil do jogador</Link>.
              </li>
            </ol>
          </>
        ) : (
          <div>Disponível apenas no aplicativo desktop (npm run tauri dev).</div>
        )}
      </div>
    </div>
  );
}
