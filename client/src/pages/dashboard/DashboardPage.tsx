// src/pages/dashboard/DashboardPage.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
);

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'entrepreneur') {
        navigate('/dashboard/entrepreneur', { replace: true });
      } else if (user.role === 'investor') {
        navigate('/dashboard/investor', { replace: true });
      } else {
        // Fallback for safety, maybe to login or a generic home
        navigate('/login', { replace: true });
      }
    }
  }, [user, navigate]);

  // Show a loading spinner while the user object is being loaded and the redirect is happening
  return <LoadingSpinner />;
};