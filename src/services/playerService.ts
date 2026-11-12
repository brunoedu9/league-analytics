/**
 * Serviço de dados do jogador.
 *
 * Hoje devolve dados fictícios. Na etapa de integração, cada função passa a
 * chamar um comando Rust via `invoke()`, que lê do SQLite local — a interface
 * não muda, porque o contrato (tipos de retorno) é o mesmo.
 */
import type { ChampionStats, MatchSummary, PlayerOverview } from "../types/models";
import { mockLpHistory, mockMatches, mockPlayer, mockRanks } from "../mocks/playerMock";
import { championStats } from "../lib/stats";

const delay = <T>(value: T, ms = 150) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

export function getPlayerOverview(): Promise<PlayerOverview> {
  return delay({
    player: mockPlayer,
    ranks: mockRanks,
    recentMatches: mockMatches.slice(0, 20),
    lpHistory: mockLpHistory,
  });
}

export function getMatches(): Promise<MatchSummary[]> {
  return delay(mockMatches);
}

export function getChampionStats(): Promise<ChampionStats[]> {
  return delay(championStats(mockMatches));
}
