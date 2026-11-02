import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('quickcare_token') || null);
  const [role, setRole] = useState(localStorage.getItem('quickcare_role') || null);
  const [profileId, setProfileId] = useState(localStorage.getItem('quickcare_profile_id') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('quickcare_token');
      if (storedToken) {
        try {
          const res = await authService.getCurrentUser();
          if (res && res.data) {
            setUser(res.data);
            setRole(res.data.role);
          }
        } catch (err) {
          console.warn('Session check failed, clearing invalid session.');
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    // Clean old state first to prevent token pollution
    localStorage.removeItem('quickcare_token');
    localStorage.removeItem('quickcare_role');
    localStorage.removeItem('quickcare_profile_id');
    setUser(null);
    setToken(null);
    setRole(null);
    setProfileId(null);

    const res = await authService.login({ email, password });
    if (res && res.success && res.data) {
      const { token: newToken, user: newUser, role: newRole, profileId: newPid } = res.data;
      setToken(newToken);
      setUser(newUser);
      setRole(newRole);
      setProfileId(newPid);

      localStorage.setItem('quickcare_token', newToken);
      localStorage.setItem('quickcare_role', newRole);
      if (newPid) {
        localStorage.setItem('quickcare_profile_id', newPid);
      }
      return res.data;
    }
    throw new Error(res?.message || 'Login failed');
  };

  const register = async (registerData) => {
    const res = await authService.register(registerData);
    if (res && res.success && res.data) {
      const { token: newToken, user: newUser, role: newRole, profileId: newPid } = res.data;
      setToken(newToken);
      setUser(newUser);
      setRole(newRole);
      setProfileId(newPid);

      localStorage.setItem('quickcare_token', newToken);
      localStorage.setItem('quickcare_role', newRole);
      if (newPid) {
        localStorage.setItem('quickcare_profile_id', newPid);
      }
      return res.data;
    }
    throw new Error(res?.message || 'Registration failed');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRole(null);
    setProfileId(null);
    localStorage.removeItem('quickcare_token');
    localStorage.removeItem('quickcare_role');
    localStorage.removeItem('quickcare_profile_id');
  };

  const updateUser = (updated) => {
    setUser((prev) => ({ ...prev, ...updated }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        profileId,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
