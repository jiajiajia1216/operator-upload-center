import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Operator } from '../types';
import {
  getOperators, getCurrentUser, setCurrentUser,
  initializeOperators, loadStoresForOperators,
} from '../utils/storage';

interface AuthContextType {
  user: Operator | null;
  operators: Operator[];
  loading: boolean;
  login: (operator: Operator) => void;
  loginWithStores: (operator: Operator) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isManager: boolean;
  isOperator: boolean;
  managedRegions: string[];
  visibleRegions: string[];
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  operators: [],
  loading: true,
  login: () => {},
  loginWithStores: async () => {},
  logout: () => {},
  isAdmin: false,
  isManager: false,
  isOperator: false,
  managedRegions: [],
  visibleRegions: [],
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Operator | null>(() => getCurrentUser());
  const [operators, setOperators] = useState<Operator[]>(() => getOperators());
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin' || user?.isAdmin || false;
  const isManager = user?.role === 'manager' || false;
  const isOperator = !isAdmin && !isManager;

  const managedRegions = user?.managedRegions || [];
  const visibleRegions = isAdmin ? [] : managedRegions.length > 0 ? managedRegions : (user?.region ? [user.region] : []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const localOps = getOperators();
      if (localOps.length > 0) {
        setOperators(localOps);
        setLoading(false);
      }

      const version = await initializeOperators();
      if (cancelled) return;

      const freshOps = getOperators();
      setOperators(freshOps);
      setLoading(false);

      const currentUser = getCurrentUser();
      if (currentUser) {
        const current = freshOps.find((o) => o.id === currentUser.id);
        if (!current) {
          setCurrentUser(null);
          setUser(null);
        } else {
          // 刷新页面时也要确保 user 的 stores 是最新的
          const opsWithStores = await loadStoresForOperators(freshOps);
          if (cancelled) return;
          setOperators(opsWithStores);
          const fullUser = opsWithStores.find(o => o.id === currentUser.id);
          if (fullUser && fullUser.stores && fullUser.stores.length > 0) {
            setCurrentUser(fullUser);
            setUser(fullUser);
          }
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback((operator: Operator) => {
    setCurrentUser(operator);
    setUser(operator);
  }, []);

  const loginWithStores = useCallback(async (operator: Operator) => {
    setCurrentUser(operator);
    setUser(operator);

    const ops = getOperators();
    const updated = await loadStoresForOperators(ops);
    setOperators(updated);

    const fullUser = updated.find(o => o.id === operator.id);
    if (fullUser) {
      setCurrentUser(fullUser);
      setUser(fullUser);
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, operators, loading, login, loginWithStores, logout,
      isAdmin, isManager, isOperator, managedRegions, visibleRegions,
    }}>
      {children}
    </AuthContext.Provider>
  );
}