import { useEffect, useState } from "react";
import {
  onSyncProgress,
  searchPlayer,
  syncMatches,
  type StoredPlayer,
  type SyncProgress,
} from "../services/playerApi";
import { errorMessage } from "./useAsync";

/** Quantas partidas recentes cada atualização verifica. */
export const SYNC_COUNT = 20;

/**
 * Atualiza perfil e elo na Riot e baixa as partidas que faltam.
 * `onDone` é chamado ao final (com sucesso ou não) para recarregar os dados locais.
 */
export function usePlayerRefresh(player: StoredPlayer | null, onDone: () => void) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const puuid = player?.puuid;

  useEffect(() => {
    if (!puuid) return;
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    onSyncProgress((p) => p.puuid === puuid && setProgress(p)).then((fn) => {
      if (cancelled) fn();
      else unlisten = fn;
    });
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [puuid]);

  async function refresh() {
    if (!player || busy) return;
    setBusy(true);
    setNotice(null);
    setProgress(null);
    try {
      const updated = await searchPlayer({ gameName: player.gameName, tagLine: player.tagLine }, player.platform);
      if (updated.warning) {
        // Riot inacessível: não adianta tentar baixar partidas.
        setNotice(updated.warning);
        return;
      }
      await syncMatches(player.puuid, SYNC_COUNT);
    } catch (err) {
      setNotice(errorMessage(err));
    } finally {
      setBusy(false);
      setProgress(null);
      onDone();
    }
  }

  const label = !busy
    ? "Atualizar"
    : progress && progress.total > 0
      ? `Baixando partidas ${progress.done}/${progress.total}`
      : "Atualizando…";

  return { refresh, busy, label, notice };
}
