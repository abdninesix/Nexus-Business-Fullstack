import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, AuthContextType, AuthSuccessData } from '../types';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { logoutUser } from '../api/auth';
import { fetchUnreadCount } from '../api/messages';

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_STORAGE_KEY = 'business_nexus_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [isInitializing, setIsInitializing] = useState(true);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // useEffect #1: Handles initial session verification ONLY.
  useEffect(() => {
    const verifyUserSession = async () => {
      const storedToken = localStorage.getItem('business_nexus_token');
      if (!storedToken) {
        setIsInitializing(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/profile');
        setUser(data);
        setToken(storedToken);
      } catch (error) {
        localStorage.removeItem('business_nexus_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    };
    verifyUserSession();
  }, []);

  // useEffect #2: Fetches secondary data AFTER the user is confirmed.
  useEffect(() => {
    if (user) { // This is the key: only run if 'user' is not null
      const fetchInitialData = async () => {
        try {
          console.log("AUTH_CONTEXT_LOG: User is available, fetching unread count...");
          const { count } = await fetchUnreadCount();
          console.log(`AUTH_CONTEXT_LOG: Received unread count: ${count}`);
          setUnreadMessageCount(count);
        } catch (error) {
          console.error("AUTH_CONTEXT_LOG: Failed to fetch unread count:", error);
          setUnreadMessageCount(0); // Fail gracefully
        }
      };
      fetchInitialData();
    } else {
      setUnreadMessageCount(0); // Ensure count is reset on logout
    }
  }, [user]);

  // This function is called by the LoginPage's useMutation
  const login = (data: AuthSuccessData) => {
    // This updates the state, which in turn will trigger useEffect #2
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Failed to update status on backend", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      delete api.defaults.headers.common['Authorization']; // Clean up header
      toast.success('Logged out successfully');
    }
  };

  const updateUser = (newUserData: User) => {
    setUser(newUserData);
  };

  // This function is for manual refreshes of the count (e.g., after marking messages as read)
  const fetchAndUpdateUnreadCount = async () => {
    try {
      const { count } = await fetchUnreadCount();
      setUnreadMessageCount(count);
    } catch (error) {
      console.error("Failed to update unread count", error);
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token,
    isInitializing,
    unreadMessageCount,
    fetchAndUpdateUnreadCount,
  };

  return <AuthContext.Provider value={value}>{!isInitializing && children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};