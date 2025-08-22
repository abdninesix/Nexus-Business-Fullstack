// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, AuthContextType, AuthSuccessData } from '../types';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_STORAGE_KEY = 'business_nexus_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // On initial load, verify the stored token
    const verifyToken = async () => {
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          // You should have a '/me' or '/profile' endpoint to get the user
          const { data } = await api.get('/auth/profile');
          setUser(data);
        } catch (error) {
          // Token is invalid, so clear it
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setToken(null);
          delete api.defaults.headers.common['Authorization'];
        }
      }
      setIsInitializing(false);
    };
    verifyToken();
  }, []);

  // This function is called by useMutation's onSuccess callback
  const login = (data: AuthSuccessData) => {
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    delete api.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const updateUser = (newUserData: User) => {
    setUser(newUserData);
  };

  const value = {
    user,
    token,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token,
    isInitializing,
  };

  // Render children only after the initial token check is complete
  return <AuthContext.Provider value={value}>{!isInitializing && children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};