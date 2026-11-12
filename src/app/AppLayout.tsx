import { NavLink, Outlet } from "react-router-dom";
import { navigation } from "./navigation";

export function AppLayout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">League Analytics</div>
        <nav className="sidebar__nav">
          {navigation.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `sidebar__link${isActive ? " is-active" : ""}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
