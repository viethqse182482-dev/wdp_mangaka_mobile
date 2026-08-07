import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearAuthSession, fetchCurrentUser, getAuthUser } from '../services/authService';
import { emitAuthEvent, subscribeAuthEvent } from '../services/authEvents';
import { AuthUser } from '../types/auth';
import { ApiError } from '../services/apiClient';

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  refreshUser: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const refreshUser = useCallback(async () => {
    const stored = await getAuthUser();
    setUser(stored);
    if (!stored) return null;

    try {
      const current = await fetchCurrentUser();
      setUser(current);
      return current;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await clearAuthSession();
        setUser(null);
        return null;
      }
      return stored;
    }
  }, []);

  const logout = useCallback(async () => {
    await clearAuthSession();
    setUser(null);
    emitAuthEvent({ type: 'logout' });
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      const stored = await getAuthUser();
      if (!active) return;
      setUser(stored);
      setReady(true);
      if (stored) await refreshUser();
    })();

    const unsubscribe = subscribeAuthEvent((event) => {
      if (event.type === 'logout') {
        setUser(null);
      } else {
        if (event.user) setUser(event.user);
        void refreshUser();
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [refreshUser]);

  const value = useMemo(
    () => ({ user, ready, refreshUser, logout }),
    [logout, ready, refreshUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
