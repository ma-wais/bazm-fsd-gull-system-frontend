import { useState } from "react";
import { Layout } from "./components/Layout.jsx";
import { Toast } from "./components/Toast.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { AccountsPage } from "./pages/AccountsPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { FinancePage } from "./pages/FinancePage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { MembersPage } from "./pages/MembersPage.jsx";
import { OrganizationPage } from "./pages/OrganizationPage.jsx";
import { PasswordNotice } from "./pages/PasswordNotice.jsx";

const viewMap = {
  dashboard: DashboardPage,
  organization: OrganizationPage,
  members: MembersPage,
  finance: FinancePage,
  accounts: AccountsPage
};

export function App() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState("dashboard");
  const [toast, setToast] = useState(null);

  if (loading) {
    return <div className="loading-screen">Loading Bazm Faisalabad...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  const ActivePage = viewMap[activeView] || DashboardPage;

  return (
    <Layout activeView={activeView} onViewChange={setActiveView}>
      <PasswordNotice />
      <ActivePage notify={(message, type = "info") => setToast({ message, type })} />
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </Layout>
  );
}
