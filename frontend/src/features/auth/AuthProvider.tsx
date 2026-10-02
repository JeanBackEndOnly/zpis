import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { UNAUTHORIZED_EVENT } from '../../lib/axios';
import { tokenStorage } from '../../lib/token';
import { authService } from '../../services/authService';
import type { User } from '../../types/user';
import { AuthContext } from './authContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Only "loading" if there is a saved token we need to verify
  const [loading, setLoading] = useState(() => !!tokenStorage.get());

  useEffect(() => {
    if (!tokenStorage.get()) return;
    authService
      .me()
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  // Fired by the axios interceptor when the API answers 401
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    tokenStorage.set(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // token may already be invalid, clear locally anyway
    }
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}