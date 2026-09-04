import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { User, UserRole } from '../types';
import { DEMO_USERS } from '../data/mockData';
import { authService } from '../services/authService';
import { checkApiHealth, setUnauthorizedHandler } from '../services/api';
import { isDemoFallbackError } from '../utils/apiHelpers';

interface AuthContextType {
  user: User | null;
  apiAuth: boolean;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: () => void;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  users: User[];
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'gnk_auth';
const USERS_KEY = 'gnk_users';

function stripPassword(u: User): User {
  const { password: _p, ...safe } = u;
  return safe as User;
}

function loadUser(): User | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function loadUsers(): User[] {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : DEMO_USERS;
  } catch {
    return DEMO_USERS;
  }
}

function saveUser(user: User | null) {
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(stripPassword(user)));
  else localStorage.removeItem(STORAGE_KEY);
}

/** Defer cached profile until JWT is validated when an API token is present. */
function getInitialUser(): User | null {
  if (localStorage.getItem('gnk_token')) return null;
  return loadUser();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [users, setUsers] = useState<User[]>(loadUsers);
  const [apiAuth, setApiAuth] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    saveUser(null);
    authService.logout();
    setApiAuth(false);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => logout());
  }, [logout]);

  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      const online = await checkApiHealth();

      if (!online) {
        if (!cancelled) {
          setUser(loadUser());
          setAuthLoading(false);
        }
        return;
      }

      if (!authService.isAuthenticated()) {
        if (!cancelled) {
          saveUser(null);
          setUser(null);
          setApiAuth(false);
          setAuthLoading(false);
        }
        return;
      }

      try {
        const me = await authService.getMe();
        if (!cancelled) {
          setUser(me);
          setApiAuth(true);
        }
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }

    initAuth();
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const online = await checkApiHealth();
      if (online) {
        try {
          const { user: apiUser } = await authService.login(email, password);
          setUser(apiUser);
          setApiAuth(true);
          return { success: true };
        } catch (err) {
          if (!isDemoFallbackError(err)) {
            return {
              success: false,
              error: err instanceof Error ? err.message : 'Login failed',
            };
          }
        }
      }

      const found = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
      );
      if (!found) {
        return { success: false, error: 'Invalid email or password' };
      }
      const safe = stripPassword(found);
      setUser(safe);
      saveUser(safe);
      setApiAuth(false);
      return { success: true };
    },
    [users],
  );

  const loginAsDemo = useCallback(() => {
    const admin = users.find((u) => u.role === 'admin')!;
    const safe = stripPassword(admin);
    setUser(safe);
    saveUser(safe);
    setApiAuth(false);
  }, [users]);

  const register = useCallback(
    async (data: {
      name: string;
      email: string;
      phone: string;
      password: string;
      role: UserRole;
    }) => {
      const online = await checkApiHealth();
      if (online) {
        try {
          await authService.register(data);
          return { success: true };
        } catch (err) {
          if (!isDemoFallbackError(err)) {
            return {
              success: false,
              error: err instanceof Error ? err.message : 'Registration failed',
            };
          }
        }
      }

      if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
        return { success: false, error: 'Email already registered' };
      }
      const newUser: User = { id: `u${Date.now()}`, ...data };
      const updated = [...users, newUser];
      setUsers(updated);
      localStorage.setItem(USERS_KEY, JSON.stringify(updated));
      return { success: true };
    },
    [users],
  );

  const updateProfile = useCallback(
    (data: Partial<User>) => {
      if (!user) return;
      const updated = stripPassword({ ...user, ...data, password: user.password || '' });
      setUser(updated);
      saveUser(updated);
      const updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, ...data } : u,
      );
      setUsers(updatedUsers);
      localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    },
    [user, users],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        apiAuth,
        authLoading,
        login,
        loginAsDemo,
        register,
        logout,
        updateProfile,
        users,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
