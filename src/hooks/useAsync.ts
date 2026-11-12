import { useEffect, useState } from "react";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "success"; data: T };

/** Executa uma função assíncrona ao montar o componente e expõe o estado. */
export function useAsync<T>(fn: () => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fn().then(
      (data) => !cancelled && setState({ status: "success", data }),
      (error: unknown) => !cancelled && setState({ status: "error", error }),
    );
    return () => {
      cancelled = true;
    };
    // A função de serviço é estável (importada de módulo); executa uma vez.
  }, []);

  return state;
}
