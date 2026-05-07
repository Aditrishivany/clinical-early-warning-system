// File: src/dashboard/src/context/AuthContext.jsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (staffId, password) => {
    try {
      console.log('Attempting login:', staffId);

      const response = await fetch(
        'http://127.0.0.1:8000/api/v1/auth/login',
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            staff_id: staffId.trim(),
            password: password.trim(),
          }),
        }
      );

      const data = await response.json();
      console.log('Login response:', data);

      if (!response.ok) {
        return {
          success: false,
          error: data.detail || 'Invalid credentials'
        };
      }

      if (data.success) {
        setUser(data.user);
        return { success: true };
      }

      return { success: false, error: 'Login failed' };

    } catch (err) {
      console.error('Login error:', err);
      return {
        success: false,
        error: 'Cannot connect to server. Is API running?'
      };
    }
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);