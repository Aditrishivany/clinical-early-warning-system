// AuthContext.jsx — JWT-aware auth with localStorage persistence

import { createContext, useContext, useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api/v1';
const TOKEN_KEY = 'clinicalai_token';
const USER_KEY  = 'clinicalai_user';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true while restoring session

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser  = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        // Verify token not expired (decode payload without library)
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        if (payload.exp && Date.now() / 1000 < payload.exp) {
          setUser(JSON.parse(storedUser));
        } else {
          _clearStorage();
        }
      }
    } catch {
      _clearStorage();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (staffId, password) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ staff_id: staffId.trim(), password: password.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.detail || 'Invalid credentials' };
      }

      if (data.success) {
        localStorage.setItem(TOKEN_KEY, data.access_token);
        localStorage.setItem(USER_KEY,  JSON.stringify(data.user));
        setUser(data.user);
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch {
      return { success: false, error: 'Cannot connect to server. Is the API running?' };
    }
  };

  const logout = () => {
    _clearStorage();
    setUser(null);
  };

  const getToken = () => localStorage.getItem(TOKEN_KEY);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

function _clearStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export const useAuth = () => useContext(AuthContext);
