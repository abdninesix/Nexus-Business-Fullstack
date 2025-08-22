// src/pages/ResetPasswordPage.tsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Lock, AlertCircle } from 'lucide-react';

import { resetPasswordRequest } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>(); // Use useParams for /:token

  const { mutate, isPending, error } = useMutation({
    mutationFn: resetPasswordRequest,
    onSuccess: () => {
      toast.success("Password has been reset successfully!");
      navigate('/login');
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    mutate({ token, password });
  };
  
  if (!token) {
    // This view is for handling cases where the URL is entered without a token
    return <div>Invalid or missing reset token.</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Lock className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>
        
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded">
              <AlertCircle className="inline-block mr-2" />
              {/* @ts-ignore */}
              {error.response?.data?.message || 'Invalid or expired token'}
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              startAdornment={<Lock size={18} />}
            />
            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              fullWidth
              startAdornment={<Lock size={18} />}
            />
            <Button
              type="submit"
              fullWidth
              isLoading={isPending}
            >
              Reset password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};