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

  // --- useEffect #1: Session Verification (CRITICAL PATH) ---
  // This effect's only job is to verify the token and get the user.
  useEffect(() => {
    const verifyUserSession = async () => {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

      if (!storedToken) {
        setIsInitializing(false);
        return; // No token, initialization is done.
      }

      try {
        // NOTE: Using an Axios interceptor is a better practice than setting this header manually.
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        const { data } = await api.get('/auth/profile');

        // If the profile is fetched successfully, the user is authenticated.
        setUser(data);
        setToken(storedToken);

      } catch (error) {
        // If this fails, the token is invalid. Log the user out completely.
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
      } finally {
        // This ALWAYS runs, ensuring the app doesn't get stuck on the spinner.
        setIsInitializing(false);
      }
    };

    verifyUserSession();
  }, []); // Empty dependency array is correct.

  // --- useEffect #2: Fetch Secondary Data (NON-CRITICAL PATH) ---
  // This effect runs only AFTER a user has been successfully authenticated.
  useEffect(() => {
    // If there is no user, do nothing.
    if (!user) {
      setUnreadMessageCount(0); // Ensure count is zeroed out on logout
      return;
    }

    const fetchInitialData = async () => {
      try {
        const { count } = await fetchUnreadCount();
        setUnreadMessageCount(count);
      } catch (error) {
        console.error("Failed to fetch initial unread message count:", error);
        // On failure, we don't log the user out. We just fail gracefully.
        setUnreadMessageCount(0);
      }
    };

    fetchInitialData();
  }, [user]); // The dependency on `user` is the key.


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