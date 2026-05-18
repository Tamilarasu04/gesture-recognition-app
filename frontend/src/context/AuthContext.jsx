import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { login as apiLogin, register as apiRegister } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('gesture_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('gesture_token'));

  const persist = useCallback((userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('gesture_user', JSON.stringify(userData));
    localStorage.setItem('gesture_token', accessToken);
  }, []);

  const login = async (email, password) => {
    const res = await apiLogin(email, password);
    persist(res.data.user, res.data.access_token);
    return res;
  };

  const register = async (email, password, name) => {
    const res = await apiRegister(email, password, name);
    persist(res.data.user, res.data.access_token);
    return res;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('gesture_user');
    localStorage.removeItem('gesture_token');
  };

  const value = useMemo(
    () => ({ user, token, isAuthenticated: !!token, login, register, logout }),
    [user, token, persist]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
