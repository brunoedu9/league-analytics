/**
 * Jogador principal: o jogador cujos dados aparecem no Dashboard, no
 * Histórico de partidas e em Campeões. Fica salvo nas configurações do banco
 * local (`active_player`), então sobrevive a reinícios e funciona offline.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getSetting, setSetting } from "../services/databaseService";
import { isTauri } from "../services/tauri";

const SETTING_KEY = "active_player";

interface ActivePlayerValue {
  /** PUUID do jogador principal; `null` se ainda não foi definido. */
  puuid: string | null;
  /** `false` enquanto a configuração ainda está sendo lida. */
  ready: boolean;
  setActive: (puuid: string) => Promise<void>;
}

const ActivePlayerContext = createContext<ActivePlayerValue | null>(null);

export function ActivePlayerProvider({ children }: { children: ReactNode }) {
  const [puuid, setPuuid] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isTauri()) {
      setReady(true);
      return;
    }
    getSetting(SETTING_KEY)
      .then((value) => setPuuid(value))
      .catch(() => setPuuid(null))
      .finally(() => setReady(true));
  }, []);

  const setActive = useCallback(async (value: string) => {
    await setSetting(SETTING_KEY, value);
    setPuuid(value);
  }, []);

  return (
    <ActivePlayerContext.Provider value={{ puuid, ready, setActive }}>{children}</ActivePlayerContext.Provider>
  );
}

export function useActivePlayer(): ActivePlayerValue {
  const value = useContext(ActivePlayerContext);
  if (!value) throw new Error("useActivePlayer precisa estar dentro de ActivePlayerProvider");
  return value;
}
