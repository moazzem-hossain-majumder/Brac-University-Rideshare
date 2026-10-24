import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || null; } catch { return null; }
  });

  // Persist sessionRole so page refresh keeps the user in dashboard
  const [sessionRole, setSessionRole] = useState(() => {
    return localStorage.getItem('sessionRole') || null;
  });

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.removeItem('sessionRole'); // reset role on every new login
    setUser(userData);
    setSessionRole(null);
  };

  const selectRole = (role) => {
    localStorage.setItem('sessionRole', role);
    setSessionRole(role);
  };

  const updateUser = (updatedData) => {
    const merged = { ...user, ...updatedData };
    localStorage.setItem('user', JSON.stringify(merged));
    setUser(merged);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('sessionRole');
    setUser(null);
    setSessionRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, sessionRole, login, selectRole, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
