import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('rivvo_user');
    const token = localStorage.getItem('rivvo_token');
    if (stored && token) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { token, user: loggedInUser } = await authService.login({ email, password });
    localStorage.setItem('rivvo_token', token);
    localStorage.setItem('rivvo_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (username, email, password) => {
    const { token, user: newUser } = await authService.register({ username, email, password });
    localStorage.setItem('rivvo_token', token);
    localStorage.setItem('rivvo_user', JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  };

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem('rivvo_token');
    localStorage.removeItem('rivvo_user');
    setUser(null);
  };

  const forgotPassword = (email) => authService.forgotPassword({ email });

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, forgotPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
