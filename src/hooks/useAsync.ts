import { useEffect, useState, type DependencyList } from "react";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "success"; data: T };

/**
 * Executa uma função assíncrona ao montar o componente (e quando `deps` mudar)
 * e expõe o estado.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList = []): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    fn().then(
      (data) => !cancelled && setState({ status: "success", data }),
      (error: unknown) => !cancelled && setState({ status: "error", error }),
    );
    return () => {
      cancelled = true;
    };
    // `fn` costuma ser uma closure nova a cada render; quem chama declara as dependências reais.
  }, deps);

  return state;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
