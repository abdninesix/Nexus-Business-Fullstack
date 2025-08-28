import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { User, Lock, Bell, Globe, Palette, CreditCard } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { updateUserProfile, changeUserPassword } from '../../api/users';
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
  const [profile, setProfile] = useState<ProfileState>({
    name: '', email: '', bio: '',
    investmentInterests: [], investmentStage: [], portfolioCompanies: []
  });
  const [newInterest, setNewInterest] = useState('');
  const [newStage, setNewStage] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Populate form state when user data is loaded
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.entrepreneurProfile?.location || '',
        // Entrepreneur fields
        startupName: user.entrepreneurProfile?.startupName || '',
        pitchSummary: user.entrepreneurProfile?.pitchSummary || '',
        fundingNeeded: user.entrepreneurProfile?.fundingNeeded || '',
        industry: user.entrepreneurProfile?.industry || '',
        foundedYear: user.entrepreneurProfile?.foundedYear || null,
        teamSize: user.entrepreneurProfile?.teamSize || 0,
        // Investor fields
        investmentInterests: user.investorProfile?.investmentInterests || [],
        investmentStage: user.investorProfile?.investmentStage || [],
        portfolioCompanies: user.investorProfile?.portfolioCompanies || [],
        totalInvestments: user.investorProfile?.totalInvestments || 0,
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
    onSuccess: (data) => profileMutation.mutate({ avatarUrl: data.avatarUrl }),
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
    const { name, value } = e.target;
    // For number fields, convert the value
    const isNumberField = ['foundedYear', 'teamSize', 'totalInvestments'].includes(name);
    setProfile(prev => ({ ...prev, [name]: isNumberField ? parseInt(value) || 0 : value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadMutation.mutate(e.target.files[0]);
    }
  };

  // Generic handler to add an item to an array field
  const handleAddItem = (field: keyof ProfileState, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    if (!value.trim()) return; // Don't add empty items
    const currentArray = (profile[field] as string[]) || [];
    setProfile(prev => ({ ...prev, [field]: [...currentArray, value.trim()] }));
    setter(''); // Clear the input field
  };

  // Generic handler to remove an item from an array field
  const handleRemoveItem = (field: keyof ProfileState, index: number) => {
    const currentArray = (profile[field] as string[]) || [];
    setProfile(prev => ({ ...prev, [field]: currentArray.filter((_, i) => i !== index) }));
  };

  const handleProfileSubmit = () => {
    // The profile state is already in the correct format for the API call
    profileMutation.mutate(profile);
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
                  className="w-full rounded-md border p-2 shadow-sm  focus:border-primary-500 focus:ring-primary-500"
                  rows={4}
                  value={profile.bio}
                  onChange={handleProfileChange}
                ></textarea>
              </div>
              {/* --- ENTREPRENEUR FIELDS --- */}
              {user.role === 'entrepreneur' && (
                <div className="space-y-6 pt-6 border-t">
                  <h3 className="text-md font-medium">Startup Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Startup Name" name="startupName" value={profile.startupName} onChange={handleProfileChange} />
                    <Input label="Industry" name="industry" value={profile.industry} onChange={handleProfileChange} />
                    <Input label="Pitch Summary (1-2 sentences)" name="pitchSummary" value={profile.pitchSummary} onChange={handleProfileChange} />
                    <Input label="Funding Needed" name="fundingNeeded" value={profile.fundingNeeded} onChange={handleProfileChange} />
                    <Input label="Founded Year" name="foundedYear" type="number" value={profile.foundedYear || ''} onChange={handleProfileChange} />
                    <Input label="Team Size" name="teamSize" type="number" value={profile.teamSize || ''} onChange={handleProfileChange} />
                  </div>
                </div>
              )}
              {/* --- INVESTOR FIELDS --- */}
              {user.role === 'investor' && (
                <div className="space-y-6 pt-6 border-t">
                  <h3 className="text-md font-medium">Investor Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Minimum Investment" name="minimumInvestment" value={profile.minimumInvestment} onChange={handleProfileChange} />
                    <Input label="Maximum Investment" name="maximumInvestment" value={profile.maximumInvestment} onChange={handleProfileChange} />
                    <Input label="Total Investments (Number)" name="totalInvestments" type="number" value={profile.totalInvestments || ''} onChange={handleProfileChange} />
                  </div>
                  {/* Investment Stages (Array) */}
                  <div>
                    <label className="block text-sm font-medium">Investment Stages</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.investmentStage?.map((stage, index) => (
                        <Badge key={index} onRemove={() => handleRemoveItem('investmentStage', index)}>{stage}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input placeholder="Add a stage (e.g., Seed)" value={newStage} onChange={e => setNewStage(e.target.value)} />
                      <Button type="button" onClick={() => handleAddItem('investmentStage', newStage, setNewStage)}>Add</Button>
                    </div>
                  </div>
                  {/* Investment Interests (Array) */}
                  <div>
                    <label className="block text-sm font-medium">Investment Interests</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.investmentInterests?.map((stage, index) => (
                        <Badge key={index} onRemove={() => handleRemoveItem('investmentInterests', index)}>{stage}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input placeholder="Add an interest (e.g., AgTech)" value={newInterest} onChange={e => setNewInterest(e.target.value)} />
                      <Button type="button" onClick={() => handleAddItem('investmentInterests', newInterest, setNewInterest)}>Add</Button>
                    </div>
                  </div>
                  {/* Portfolio Companies (Array) */}
                  <div>
                    <label className="block text-sm font-medium">Portfolio Companies</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.portfolioCompanies?.map((stage, index) => (
                        <Badge key={index} onRemove={() => handleRemoveItem('portfolioCompanies', index)}>{stage}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input placeholder="Add a company (e.g., BioGenics)" value={newCompany} onChange={e => setNewCompany(e.target.value)} />
                      <Button type="button" onClick={() => handleAddItem('portfolioCompanies', newCompany, setNewCompany)}>Add</Button>
                    </div>
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