import { useCallback, useEffect, useState } from 'react';
import { AuthContext } from './auth';
import { authAPI } from '../services/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearAuth = useCallback((reason, error) => {
    console.log('AuthContext setUser(null):', reason, error?.response?.status || error?.message || '');
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data.user);
      setProfile(response.data.profile);
    } catch (error) {
      const status = error.response?.status;

      if (status === 401 || status === 403) {
        clearAuth('stored token rejected by /api/auth/me', error);
      } else {
        console.error('Auth check failed without clearing token:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [clearAuth]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    localStorage.setItem('token', response.data.session.access_token);
    setUser(response.data.user);
    setProfile(response.data.profile);
    return response.data;
  };

  const signup = async (userData) => {
    const response = await authAPI.signup(userData);
    return response.data;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout request failed; clearing local auth state anyway:', error);
    } finally {
      clearAuth('logout requested');
    }
  };

  const refreshProfile = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAPI.getCurrentUser();
        setProfile(response.data.profile);
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, signup, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
