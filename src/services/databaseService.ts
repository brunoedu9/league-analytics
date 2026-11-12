import { call } from "./tauri";

/** Resumo do banco local (comando Rust `db_status`). */
export interface DbStatus {
  path: string | null;
  schemaVersion: number;
  players: number;
  matches: number;
  participants: number;
  rankSnapshots: number;
  sizeBytes: number | null;
  lastSyncAt: number | null; // ms desde a época Unix
}

export const getDbStatus = () => call<DbStatus>("db_status");

export const getSetting = (key: string) => call<string | null>("get_setting", { key });

export const setSetting = (key: string, value: string) => call<void>("set_setting", { key, value });
