import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, setToken } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [creatableRoles, setCreatableRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    const data = await apiRequest("/auth/me");
    setUser(data.user);
    setCreatableRoles(data.creatableRoles || []);
    return data.user;
  }

  async function login(email, password) {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: { email, password }
    });
    setToken(data.token);
    setUser(data.user);
    setCreatableRoles(data.creatableRoles || []);
    return data.user;
  }

  async function changePassword(currentPassword, newPassword) {
    await apiRequest("/auth/password", {
      method: "PATCH",
      body: { currentPassword, newPassword }
    });
    await refreshUser();
  }

  function logout() {
    setToken(null);
    setUser(null);
    setCreatableRoles([]);
  }

  useEffect(() => {
    refreshUser()
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      creatableRoles,
      loading,
      login,
      logout,
      refreshUser,
      changePassword
    }),
    [user, creatableRoles, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
