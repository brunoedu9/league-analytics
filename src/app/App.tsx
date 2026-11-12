import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { navigation } from "./navigation";
import { PlayerPage } from "../features/player/PlayerPage";
import { ActivePlayerProvider } from "./ActivePlayer";

export function App() {
  return (
    <ActivePlayerProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            {navigation.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
            <Route path="/player/:puuid" element={<PlayerPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ActivePlayerProvider>
  );
}
