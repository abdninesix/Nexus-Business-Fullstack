import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const PublicRoute: React.FC = () => {
  const { user, isAuthenticated, isInitializing } = useAuth();

  // 1. Show a loading spinner while the context is verifying the token on initial load.
  //    This prevents a "flash" of the login page before redirecting.
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // 2. If initialization is done AND the user IS authenticated, redirect them away.
  if (isAuthenticated && user) {
    const dashboardPath = user.role === 'entrepreneur' 
        ? '/dashboard/entrepreneur' 
        : '/dashboard/investor';
    return <Navigate to={dashboardPath} replace />;
  }

  // 3. If the user is NOT authenticated, render the child route (e.g., your LoginPage).
  return <Outlet />;
};