import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pulso_token');
    if (token) {
      api.defaults.headers.Authorization = `Bearer ${token}`;
      api.get('/auth/me')
        .then(r => setUser(r.data))
        .catch(() => { localStorage.removeItem('pulso_token'); delete api.defaults.headers.Authorization; })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('pulso_token', data.token);
    api.defaults.headers.Authorization = `Bearer ${data.token}`;
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('pulso_token');
    delete api.defaults.headers.Authorization;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
