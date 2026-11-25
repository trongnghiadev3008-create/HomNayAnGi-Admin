import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../lib/axios';
import { authService } from '../services/api';
import { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readInitialUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => readInitialUser());

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('hnag:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('hnag:unauthorized', handleUnauthorized);
  }, [logout]);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const res = await authService.login(email, password);
    if (!res.token || !res.user) {
      throw new Error('Phản hồi đăng nhập không hợp lệ từ máy chủ.');
    }
    if (res.user.role !== 'ADMIN') {
      throw new Error(
        `Tài khoản "${res.user.email}" có quyền "${res.user.role}". Chỉ tài khoản ADMIN mới được truy cập trang Quản trị.`
      );
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [user, token, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth phải được sử dụng bên trong <AuthProvider>');
  }
  return ctx;
}
