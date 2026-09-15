import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Workspace, LoginPayload, RegisterPayload } from '../types';
import { loginUser, registerCompany, fetchCurrentUser } from '../api/auth';

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'vanguard_auth_token';
const USER_KEY = 'vanguard_auth_user';
const WORKSPACE_KEY = 'vanguard_auth_workspace';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [workspace, setWorkspace] = useState<Workspace | null>(() => {
    const saved = localStorage.getItem(WORKSPACE_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveAuthSession = (jwtToken: string, userData: User, workspaceData: Workspace) => {
    localStorage.setItem(TOKEN_KEY, jwtToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspaceData));
    setToken(jwtToken);
    setUser(userData);
    setWorkspace(workspaceData);
  };

  const clearAuthSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(WORKSPACE_KEY);
    setToken(null);
    setUser(null);
    setWorkspace(null);
  };

  useEffect(() => {
    const handleAuthExpired = () => {
      clearAuthSession();
    };
    window.addEventListener('vanguard-auth-expired', handleAuthExpired);

    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        try {
          const authData = await fetchCurrentUser();
          saveAuthSession(storedToken, authData.user, authData.workspace);
        } catch {
          clearAuthSession();
        }
      }
      setIsLoading(false);
    };

    initAuth();

    return () => {
      window.removeEventListener('vanguard-auth-expired', handleAuthExpired);
    };
  }, []);

  const login = async (payload: LoginPayload) => {
    const data = await loginUser(payload);
    saveAuthSession(data.token, data.user, data.workspace);
  };

  const register = async (payload: RegisterPayload) => {
    const data = await registerCompany(payload);
    saveAuthSession(data.token, data.user, data.workspace);
  };

  const demoLogin = async () => {
    // 1-click Demo Login for default seeded Acme Corp Admin
    await login({
      email: 'admin@acmecorp.com',
      password: 'password123',
    });
  };

  const logout = () => {
    clearAuthSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
