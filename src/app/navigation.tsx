import type { ReactNode } from "react";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { PlayerPage } from "../features/player/PlayerPage";
import { MatchesPage } from "../features/matches/MatchesPage";
import { MatchAnalysisPage } from "../features/match-analysis/MatchAnalysisPage";
import { PerformancePage } from "../features/performance/PerformancePage";
import { ChampionsPage } from "../features/champions/ChampionsPage";
import { RankingsPage } from "../features/rankings/RankingsPage";
import { ComparisonPage } from "../features/comparison/ComparisonPage";
import { SettingsPage } from "../features/settings/SettingsPage";

export interface NavItem {
  path: string;
  label: string;
  element: ReactNode;
}

/** Os 9 módulos definidos no SRS (seção 7), na ordem da sidebar. */
export const navigation: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", element: <DashboardPage /> },
  { path: "/player", label: "Perfil do jogador", element: <PlayerPage /> },
  { path: "/matches", label: "Histórico de partidas", element: <MatchesPage /> },
  { path: "/match-analysis", label: "Análise de partidas", element: <MatchAnalysisPage /> },
  { path: "/performance", label: "Desempenho", element: <PerformancePage /> },
  { path: "/champions", label: "Campeões", element: <ChampionsPage /> },
  { path: "/rankings", label: "Rankings", element: <RankingsPage /> },
  { path: "/comparison", label: "Comparação", element: <ComparisonPage /> },
  { path: "/settings", label: "Configurações", element: <SettingsPage /> },
];
