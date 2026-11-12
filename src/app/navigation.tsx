import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  GitCompareArrows,
  History,
  LayoutDashboard,
  Medal,
  Microscope,
  Settings,
  Swords,
  User,
} from "lucide-react";
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
  icon: LucideIcon;
  section: "Jogador" | "Análise" | "Competitivo" | "Sistema";
  /** Módulo ainda não implementado (aparece com a etiqueta "em breve"). */
  soon?: boolean;
  element: ReactNode;
}

/** Os 9 módulos definidos no SRS (seção 7), na ordem da sidebar. */
export const navigation: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Jogador", element: <DashboardPage /> },
  { path: "/player", label: "Perfil do jogador", icon: User, section: "Jogador", element: <PlayerPage /> },
  { path: "/matches", label: "Histórico de partidas", icon: History, section: "Jogador", element: <MatchesPage /> },
  { path: "/match-analysis", label: "Análise de partidas", icon: Microscope, section: "Análise", element: <MatchAnalysisPage /> },
  { path: "/performance", label: "Desempenho", icon: BarChart3, section: "Análise", soon: true, element: <PerformancePage /> },
  { path: "/champions", label: "Campeões", icon: Swords, section: "Análise", element: <ChampionsPage /> },
  { path: "/rankings", label: "Rankings", icon: Medal, section: "Competitivo", soon: true, element: <RankingsPage /> },
  { path: "/comparison", label: "Comparação", icon: GitCompareArrows, section: "Competitivo", soon: true, element: <ComparisonPage /> },
  { path: "/settings", label: "Configurações", icon: Settings, section: "Sistema", element: <SettingsPage /> },
];
