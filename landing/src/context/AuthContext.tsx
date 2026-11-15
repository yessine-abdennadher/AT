import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { authService, type AuthUser } from '../services/authService';

type AuthStatus = 'loading' | 'signed-out' | 'signed-in';
type AuthMode = 'login' | 'register';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  authModalOpen: boolean;
  authMode: AuthMode;
  pendingAction: (() => void | Promise<void>) | null;
  favoriteIds: string[];
  toggleFavorite: (activityId: string) => Promise<boolean>;
  openAuth: (mode?: AuthMode, action?: () => void | Promise<void>) => void;
  closeAuth: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  completeAdminMfa: (challengeId: string, otp: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  reloadUser: () => Promise<AuthUser | null>;
  saveProfile: (updates: Pick<AuthUser, 'name' | 'city'>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [pendingAction, setPendingAction] = useState<(() => void | Promise<void>) | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const bootstrap = async () => {
      try {
        const current = await authService.getMe();
        if (mounted.current) {
          setUser(current);
          setStatus('signed-in');
          setFavoriteIds(await authService.getFavoriteIds().catch(() => []));
        }
      } catch {
        try {
          await authService.refresh();
          const current = await authService.getMe();
          if (mounted.current) {
            setUser(current);
            setStatus('signed-in');
            setFavoriteIds(await authService.getFavoriteIds().catch(() => []));
          }
        } catch {
          if (mounted.current) {
            setUser(null);
            setStatus('signed-out');
          }
        }
      }
    };
    void bootstrap();
    return () => { mounted.current = false; };
  }, []);

  const openAuth = useCallback((mode: AuthMode = 'login', action?: () => void | Promise<void>) => {
    setAuthMode(mode);
    setPendingAction(() => action || null);
    setAuthModalOpen(true);
  }, []);
  const closeAuth = useCallback(() => {
    setAuthModalOpen(false);
    setPendingAction(null);
  }, []);

  const acceptUser = useCallback(async (nextUser: AuthUser) => {
    setUser(nextUser);
    setStatus('signed-in');
    setFavoriteIds(await authService.getFavoriteIds().catch(() => []));
    setAuthModalOpen(false);
    const action = pendingAction;
    setPendingAction(null);
    if (action) await action();
  }, [pendingAction]);

  const signIn = useCallback(async (email: string, password: string) => {
    await acceptUser(await authService.login(email, password));
  }, [acceptUser]);
  const completeAdminMfa = useCallback(async (challengeId: string, otp: string) => {
    await acceptUser(await authService.verifyAdminMfa(challengeId, otp));
  }, [acceptUser]);
  const signUp = useCallback(async (name: string, email: string, password: string) => {
    await acceptUser(await authService.register(name, email, password));
  }, [acceptUser]);
  const signOut = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // The backend clears browser cookies even if session revocation fails.
    } finally {
      setUser(null);
      setFavoriteIds([]);
      setStatus('signed-out');
    }
  }, []);
  const reloadUser = useCallback(async () => {
    try {
      const current = await authService.getMe();
      setUser(current);
      setStatus('signed-in');
      setFavoriteIds(await authService.getFavoriteIds().catch(() => []));
      return current;
    } catch {
      setUser(null);
      setStatus('signed-out');
      return null;
    }
  }, []);
  const saveProfile = useCallback(async (updates: Pick<AuthUser, 'name' | 'city'>) => {
    const updated = await authService.updateProfile(updates);
    setUser(updated);
  }, []);

  const toggleFavorite = useCallback(async (activityId: string) => {
    const result = await authService.toggleFavorite(activityId);
    setFavoriteIds((current) => result.isFavorite
      ? Array.from(new Set([...current, activityId]))
      : current.filter((id) => id !== activityId));
    return result.isFavorite;
  }, []);

  const value = useMemo(() => ({
    user, status, authModalOpen, authMode, pendingAction, favoriteIds, toggleFavorite, openAuth, closeAuth, signIn, completeAdminMfa, signUp, signOut, reloadUser, saveProfile,
  }), [user, status, authModalOpen, authMode, pendingAction, favoriteIds, toggleFavorite, openAuth, closeAuth, signIn, completeAdminMfa, signUp, signOut, reloadUser, saveProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider.');
  return context;
}
