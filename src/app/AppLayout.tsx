import { NavLink, Outlet } from "react-router-dom";
import { Crosshair } from "lucide-react";
import { navigation, type NavItem } from "./navigation";
import { Topbar } from "./Topbar";

const sections = navigation.reduce<Record<string, NavItem[]>>((acc, item) => {
  (acc[item.section] ??= []).push(item);
  return acc;
}, {});

export function AppLayout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <Crosshair size={18} strokeWidth={2.4} />
          </div>
          <div className="sidebar__name">
            League
            <small>Analytics</small>
          </div>
        </div>
        {Object.entries(sections).map(([section, items]) => (
          <div key={section}>
            <div className="sidebar__section">{section}</div>
            <nav className="sidebar__nav">
              {items.map(({ path, label, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) => `sidebar__link${isActive ? " is-active" : ""}`}
                >
                  <Icon size={17} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
        <div className="sidebar__footer">v0.1.0 · dados fictícios</div>
      </aside>
      <div className="main">
        <Topbar />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
