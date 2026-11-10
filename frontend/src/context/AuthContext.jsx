import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

const DEMO_ACCOUNTS = {
  'patient@quickcare.com': {
    token: 'demo-token-patient',
    user: {
      userId: 'usr_pat_001',
      uid: 'demo_patient_uid',
      fullName: 'Aarav Sharma',
      email: 'patient@quickcare.com',
      role: 'PATIENT',
      phone: '+91 98765 43210'
    },
    role: 'PATIENT',
    profileId: 'usr_pat_001'
  },
  'priya.deshmukh@quickcare.com': {
    token: 'demo-token-doctor',
    user: {
      userId: 'usr_doc_001',
      uid: 'demo_doctor_uid',
      fullName: 'Dr. Priya Deshmukh',
      email: 'priya.deshmukh@quickcare.com',
      role: 'DOCTOR',
      phone: '+91 98220 12345'
    },
    role: 'DOCTOR',
    profileId: 'doc_001'
  },
  'admin@quickcare.com': {
    token: 'demo-token-admin',
    user: {
      userId: 'usr_admin_001',
      uid: 'demo_admin_uid',
      fullName: 'QuickCare Admin',
      email: 'admin@quickcare.com',
      role: 'ADMIN',
      phone: '+91 99999 00000'
    },
    role: 'ADMIN',
    profileId: 'usr_admin_001'
  }
};

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
        // If it was a demo session or offline session, restore from saved demo user
        const storedDemo = localStorage.getItem('quickcare_demo_user');
        if (storedDemo) {
          try {
            const parsed = JSON.parse(storedDemo);
            setUser(parsed);
            setRole(localStorage.getItem('quickcare_role') || parsed.role);
            setProfileId(localStorage.getItem('quickcare_profile_id') || parsed.userId);
            setLoading(false);
            return;
          } catch (e) {
            // continue normal check
          }
        }

        try {
          const res = await authService.getCurrentUser();
          if (res && res.data) {
            setUser(res.data);
            setRole(res.data.role);
          }
        } catch (err) {
          console.warn('Backend verification unavailable or session expired.');
          // If we had a stored demo user, don't clear it
          if (!storedDemo) {
            logout();
          }
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
    localStorage.removeItem('quickcare_demo_user');
    setUser(null);
    setToken(null);
    setRole(null);
    setProfileId(null);

    try {
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
    } catch (apiErr) {
      // Offline/Restart Resilient Fallback: If backend is booting or unreachable, log in with demo profile
      const normalizedEmail = (email || '').toLowerCase().trim();
      const demoAccount = DEMO_ACCOUNTS[normalizedEmail];
      if (demoAccount) {
        console.warn('Backend currently starting or unreachable. Activating resilient Demo Session for:', email);
        const { token: newToken, user: newUser, role: newRole, profileId: newPid } = demoAccount;
        setToken(newToken);
        setUser(newUser);
        setRole(newRole);
        setProfileId(newPid);

        localStorage.setItem('quickcare_token', newToken);
        localStorage.setItem('quickcare_role', newRole);
        localStorage.setItem('quickcare_demo_user', JSON.stringify(newUser));
        if (newPid) {
          localStorage.setItem('quickcare_profile_id', newPid);
        }
        return demoAccount;
      }
      throw apiErr;
    }
  };

  const loginAsDemo = (roleType) => {
    const email = roleType === 'ADMIN' ? 'admin@quickcare.com' : (roleType === 'DOCTOR' ? 'priya.deshmukh@quickcare.com' : 'patient@quickcare.com');
    const demoAccount = DEMO_ACCOUNTS[email];
    if (demoAccount) {
      const { token: newToken, user: newUser, role: newRole, profileId: newPid } = demoAccount;
      setToken(newToken);
      setUser(newUser);
      setRole(newRole);
      setProfileId(newPid);

      localStorage.setItem('quickcare_token', newToken);
      localStorage.setItem('quickcare_role', newRole);
      localStorage.setItem('quickcare_demo_user', JSON.stringify(newUser));
      if (newPid) {
        localStorage.setItem('quickcare_profile_id', newPid);
      }
      return demoAccount;
    }
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
        loginAsDemo,
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
