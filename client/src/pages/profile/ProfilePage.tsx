// src/pages/profile/ProfilePage.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// You can create a shared LoadingSpinner component to reuse it
const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
);

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // This effect runs when the component mounts or when the user object changes.
    if (user) {
      // Construct the full, specific profile path
      const profilePath = `/profile/${user.role}/${user._id}`;
      
      // Redirect the user to their specific profile page
      // `replace: true` prevents the user from being able to click "back" to this redirecting page
      navigate(profilePath, { replace: true });
    }
  }, [user, navigate]);

  // While the user object is loading, show a spinner.
  // This prevents a blank screen flash before the redirect happens.
  return <LoadingSpinner />;
};