import { invoke } from "@tauri-apps/api/core";

/** True quando a interface roda dentro do app desktop (e não no navegador do `npm run dev`). */
export const isTauri = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export class NotInDesktopError extends Error {
  constructor() {
    super("Disponível apenas no aplicativo desktop (npm run tauri dev).");
  }
}

/** `invoke` com erro amigável fora do app desktop. Os comandos Rust devolvem erros como texto. */
export async function call<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri()) throw new NotInDesktopError();
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    throw new Error(typeof error === "string" ? error : String(error));
  }
}
