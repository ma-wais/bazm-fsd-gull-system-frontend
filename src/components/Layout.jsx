import { Building2, LayoutDashboard, LogOut, ShieldCheck, UserPlus, Users, WalletCards } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { roleLabel } from "../utils/roles.js";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "members", label: "Members", icon: Users },
  { id: "finance", label: "Finance", icon: WalletCards },
  { id: "accounts", label: "Accounts", icon: UserPlus }
];

export function Layout({ activeView, onViewChange, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <ShieldCheck size={28} aria-hidden="true" />
          <div>
            <strong>Bazm Faisalabad</strong>
            <span>Student organization system</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.id}
                className={activeView === item.id ? "active" : ""}
                onClick={() => onViewChange(item.id)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <strong>{user?.name}</strong>
            <span>{roleLabel(user?.role)}</span>
          </div>
          <button type="button" className="secondary-button full-width" onClick={logout}>
            <LogOut size={16} aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}
