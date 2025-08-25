import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { User, Lock, Bell, Globe, Palette, CreditCard } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { updateUserProfile, changeUserPassword } from '../../api/user';
import { uploadFileRequest, removeProfilePicture } from '../../api/upload';

import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { ProfileState } from '../../types';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for controlled form inputs
  const [profile, setProfile] = useState<ProfileState>({ name: '', email: '', bio: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Populate form state when user data is loaded
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        // Populate entrepreneur fields
        startupName: user.entrepreneurProfile?.startupName || '',
        industry: user.entrepreneurProfile?.industry || '',
        location: user.entrepreneurProfile?.location || '',
        fundingNeeded: user.entrepreneurProfile?.fundingNeeded || '',
        // Populate investor fields
        investmentInterests: user.investorProfile?.investmentInterests?.join(', ') || '',
        minimumInvestment: user.investorProfile?.minimumInvestment || '',
        maximumInvestment: user.investorProfile?.maximumInvestment || '',
      });
    }
  }, [user]);

  // === MUTATIONS for API calls ===
  const profileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (updatedUser) => {
      toast.success('Profile updated successfully!');
      updateUser(updatedUser);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update profile.'),
  });

  const passwordMutation = useMutation({
    mutationFn: changeUserPassword,
    onSuccess: () => {
      toast.success('Password updated successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update password.'),
  });

  const uploadMutation = useMutation({
    mutationFn: uploadFileRequest,
    onSuccess: (data) => profileMutation.mutate({ avatarUrl: data.url }),
    onError: (error: any) => toast.error(error.response?.data?.message || 'Image upload failed.'),
  });

  const removePictureMutation = useMutation({
    mutationFn: removeProfilePicture,
    onSuccess: (updatedUser) => {
      toast.success("Profile picture removed!");
      updateUser(updatedUser); // Update the global state
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to remove picture.'),
  });

  // === EVENT HANDLERS ===
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadMutation.mutate(e.target.files[0]);
    }
  };

  const handleProfileSubmit = () => {
    // Prepare the data to be sent
    const dataToSend: any = { ...profile };
    // Convert comma-separated string back to an array for the backend
    if (user?.role === 'investor' && dataToSend.investmentInterests) {
      dataToSend.investmentInterests = dataToSend.investmentInterests.split(',').map((item: string) => item.trim());
    }
    profileMutation.mutate(dataToSend);
  };

  const handlePasswordSubmit = () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    passwordMutation.mutate({
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword,
    });
  };

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings navigation */}
        <Card className="lg:col-span-1">
          <CardBody className="p-2">
            <nav className="space-y-1">
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-md">
                <User size={18} className="mr-3" />
                Profile
              </button>
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <Lock size={18} className="mr-3" />
                Security
              </button>
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <Bell size={18} className="mr-3" />
                Notifications
              </button>
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <Globe size={18} className="mr-3" />
                Language
              </button>
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <Palette size={18} className="mr-3" />
                Appearance
              </button>
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <CreditCard size={18} className="mr-3" />
                Billing
              </button>
            </nav>
          </CardBody>
        </Card>

        {/* Main settings content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Profile Settings</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar src={user.avatarUrl} alt={user.name} size="xl" />
                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} isLoading={uploadMutation.isPending}>
                      Change
                    </Button>
                    {user.avatarUrl && (
                      <Button type="button" variant="error" size="sm" onClick={() => removePictureMutation.mutate()} isLoading={removePictureMutation.isPending}>
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">JPG, GIF or PNG. Max size of 5MB</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Full Name" name="name" value={profile.name} onChange={handleProfileChange} />
                <Input label="Email" name="email" type="email" value={profile.email} onChange={handleProfileChange} />
                <Input label="Role" value={user.role} disabled />
                <Input label="Location" name="location" value={profile.location} onChange={handleProfileChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  name="bio"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  rows={4}
                  value={profile.bio}
                  onChange={handleProfileChange}
                ></textarea>
              </div>
              {/* --- DYNAMIC ENTREPRENEUR FIELDS --- */}
              {user.role === 'entrepreneur' && (
                <div className="space-y-6 pt-6 border-t">
                  <h3 className="text-md font-medium text-gray-900">Startup Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Startup Name" name="startupName" value={profile.startupName} onChange={handleProfileChange} />
                    <Input label="Industry" name="industry" value={profile.industry} onChange={handleProfileChange} />
                    <Input label="Location" name="location" value={profile.location} onChange={handleProfileChange} />
                    <Input label="Funding Needed" name="fundingNeeded" value={profile.fundingNeeded} onChange={handleProfileChange} />
                  </div>
                </div>
              )}
              {/* --- DYNAMIC INVESTOR FIELDS --- */}
              {user.role === 'investor' && (
                <div className="space-y-6 pt-6 border-t">
                  <h3 className="text-md font-medium text-gray-900">Investor Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Investment Interests"
                      name="investmentInterests"
                      value={profile.investmentInterests}
                      onChange={handleProfileChange}
                      placeholder="e.g., SaaS, FinTech, AI"
                    />
                    <Input label="Minimum Investment" name="minimumInvestment" value={profile.minimumInvestment} onChange={handleProfileChange} placeholder="$250K" />
                    <Input label="Maximum Investment" name="maximumInvestment" value={profile.maximumInvestment} onChange={handleProfileChange} placeholder="$1.5M" />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleProfileSubmit} isLoading={profileMutation.isPending}>Save Changes</Button>
              </div>
            </CardBody>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    <Badge variant="error" className="mt-1">Not Enabled</Badge>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4">
                  <Input label="Current Password" name="currentPassword" type="password" value={passwords.currentPassword} onChange={handlePasswordChange} />
                  <Input label="New Password" name="newPassword" type="password" value={passwords.newPassword} onChange={handlePasswordChange} />
                  <Input label="Confirm New Password" name="confirmPassword" type="password" value={passwords.confirmPassword} onChange={handlePasswordChange} />
                  <div className="flex justify-end">
                    <Button onClick={handlePasswordSubmit} isLoading={passwordMutation.isPending}>Update Password</Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};