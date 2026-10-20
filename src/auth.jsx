import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';
import { disconnectSocket } from './socket';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!sessionStorage.getItem('token'));

  useEffect(() => {
    if (!sessionStorage.getItem('token')) return;
    api('/auth/me')
      .then(setUser)
      .catch(() => sessionStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = (data) => {
    sessionStorage.setItem('token', data.token);
    setUser(data.user);
  };
  const logout = () => {
    sessionStorage.removeItem('token');
    disconnectSocket();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, setUser, loading, login, logout }}>{children}</Ctx.Provider>;
}
