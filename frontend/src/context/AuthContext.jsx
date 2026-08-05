import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { UserRole } from "../models/userRole";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const sessionKey = "smartCinemaSession";
const readSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem(sessionKey) || "null");
  } catch {
    sessionStorage.removeItem(sessionKey);
    return null;
  }
};

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(readSession);

  const establishSession = (nextSession) => {
    sessionStorage.setItem(sessionKey, JSON.stringify(nextSession));
    setSessionState(nextSession);
  };

  const updateSession = (changes) => {
    setSessionState((current) => {
      if (!current) return current;
      const updated = { ...current, ...changes };
      sessionStorage.setItem(sessionKey, JSON.stringify(updated));
      return updated;
    });
  };

  const clearSession = () => {
    sessionStorage.removeItem(sessionKey);
    setSessionState(null);
  };

  useEffect(() => {
    if (!session?.expiresAtUtc) return undefined;
    const remaining = new Date(session.expiresAtUtc).getTime() - Date.now();
    if (remaining <= 0) {
      clearSession();
      return undefined;
    }
    const timeout = window.setTimeout(clearSession, remaining);
    return () => window.clearTimeout(timeout);
  }, [session?.expiresAtUtc]);

  const value = useMemo(() => {
    const isCinemaManager = session?.role === UserRole.CinemaManager || session?.role === "CinemaManager";
    const isAdministrator = session?.role === UserRole.Administrator || session?.role === "Administrator";
    return {
      session,
      accessToken: session?.accessToken ?? null,
      isAuthenticated: Boolean(session),
      isCinemaManager,
      isAdministrator,
      establishSession,
      updateSession,
      clearSession,
    };
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
