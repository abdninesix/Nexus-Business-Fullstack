import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MessageCircle, Users, Calendar, Building2, MapPin, UserCircle, FileText, DollarSign, Send } from 'lucide-react';

import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { fetchUserById } from '../../api/users';
import { User } from '../../types';
import { fetchRequestStatus, createCollaborationRequest, deleteCollaborationRequest } from '../../api/collaborations';

// A loading skeleton that mimics the page layout
const ProfileSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <Card><CardBody className="p-6"><div className="flex space-x-6"><div className="w-24 h-24 bg-gray-200 rounded-full"></div><div className="flex-1 space-y-3 mt-2"><div className="h-6 bg-gray-200 rounded w-1/3"></div><div className="h-4 bg-gray-200 rounded w-1/2"></div><div className="flex gap-2"><div className="h-5 bg-gray-200 rounded w-20"></div><div className="h-5 bg-gray-200 rounded w-24"></div></div></div></div></CardBody></Card>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2 space-y-6"><Card><CardBody className="p-6 space-y-2"><div className="h-4 bg-gray-200 rounded w-full"></div><div className="h-4 bg-gray-200 rounded w-5/6"></div></CardBody></Card></div><div className="space-y-6"><Card><CardBody className="p-6"><div className="h-20 bg-gray-200 rounded"></div></CardBody></Card></div></div>
  </div>
);


export const EntrepreneurProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const { data: entrepreneur, isLoading, isError } = useQuery<User>({
    queryKey: ['user', id], // Query key is unique to this user's ID
    queryFn: () => fetchUserById(id!), // Fetch the user data
    enabled: !!id, // Only run the query if the id exists
  });

  // Derived state after data is fetched
  const profile = entrepreneur?.entrepreneurProfile;
  const isCurrentUser = currentUser?._id === entrepreneur?._id;
  const isInvestor = currentUser?.role === 'investor';

  // 1. Query to check if a request has already been sent
  const { data: collaborationInfo, refetch: refetchStatus } = useQuery({
    queryKey: ['collaborationStatus', id],
    queryFn: () => fetchRequestStatus(id!),
    enabled: isInvestor && !isCurrentUser && !!id, // Only run for investors viewing this profile
  });

  // 2. Mutation to send a new collaboration request
  const createRequestMutation = useMutation({
    mutationFn: createCollaborationRequest,
    onSuccess: () => {
      toast.success("Collaboration request sent successfully!");
      refetchStatus(); // Refetch status after sendin
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send request.");
    }
  });

  // 3. Mutation to delete a collaboration request
  const deleteRequestMutation = useMutation({
    mutationFn: deleteCollaborationRequest,
    onSuccess: () => {
      toast.success("Connection removed.");
      refetchStatus(); // Refetch status after deleting
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Failed to remove connection."),
  });

  const handleCollaborationAction = () => {
    if (!id || !collaborationInfo) return;

    // Decide which action to take based on the current status
    switch (collaborationInfo.status) {
      case 'none':
      case 'rejected':
        createRequestMutation.mutate({
          entrepreneurId: id,
          message: `I'm interested in learning more about ${profile?.startupName}...`
        });
        break;
      case 'accepted':
        if (collaborationInfo.requestId) {
          if (window.confirm("Are you sure you want to remove this connection?")) {
            deleteRequestMutation.mutate(collaborationInfo.requestId);
          }
        }
        break;
      case 'pending':
        // Optional: Implement a "withdraw request" feature here if desired
        toast.success("Your request is still pending.");
        break;
    }
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  const getButtonProps = () => {
    switch (collaborationInfo?.status) {
      case 'pending':
        return { text: 'Request Sent', disabled: true, variant: 'outline' as const };
      case 'accepted':
        return { text: 'Remove Connection', disabled: false, variant: 'error' as const };
      case 'rejected':
        return { text: 'Request Again', disabled: false, variant: 'primary' as const };
      case 'none':
      default:
        return { text: 'Request Collaboration', disabled: false, variant: 'primary' as const };
    }
  };
  const buttonProps = getButtonProps();
  const isActionLoading = createRequestMutation.isPending || deleteRequestMutation.isPending;

  if (isError || !entrepreneur || !profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Entrepreneur Not Found</h2>
        <p className="text-gray-600 mt-2">This profile does not exist or is not an entrepreneur.</p>
        <Link to="/entrepreneurs">
          <Button variant="outline" className="mt-4">Back to Discover</Button>
        </Link>
      </div>
    );
  }

  // --- MAIN RENDER ---

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile header */}
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex items-start sm:space-x-6">
            <Avatar src={entrepreneur.avatarUrl} alt={entrepreneur.name} size="xl" status={entrepreneur.isOnline ? 'online' : 'offline'} className="mx-auto sm:mx-0" />
            <div className="mt-4 sm:mt-0 text-left">
              <h1 className="text-2xl font-bold text-gray-900">{entrepreneur.name}</h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Building2 size={16} className="mr-1" />
                Founder at {profile.startupName}
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                <Badge variant="primary">{profile.industry}</Badge>
                <Badge variant="gray"><MapPin size={14} className="mr-1" />{profile.location}</Badge>
                <Badge variant="accent"><Calendar size={14} className="mr-1" />Founded {profile.foundedYear}</Badge>
                <Badge variant="secondary"><Users size={14} className="mr-1" />{profile.teamSize} team members</Badge>
              </div>
            </div>
          </div>
          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && (
              <div className='flex flex-col justify-between gap-4'>
                {!isCurrentUser && isInvestor && (
                  <Button
                    leftIcon={<Send size={18} />}
                    disabled={buttonProps.disabled || isActionLoading}
                    isLoading={isActionLoading}
                    onClick={handleCollaborationAction}
                    variant={buttonProps.variant}
                    className='w-fit'
                  >
                    {buttonProps.text}
                  </Button>
                )}
                <Button
                  variant="outline"
                  leftIcon={<MessageCircle size={18} />}
                  onClick={() => navigate(`/chat/${entrepreneur._id}`)}
                  className='w-fit'
                >
                  Message
                </Button>
              </div>
            )}

            {isCurrentUser && (
              <Button
                variant="outline"
                leftIcon={<UserCircle size={18} />}
                onClick={() => navigate('/settings')}
                className='w-fit'
              >
                Edit Profile
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - left side */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">About</h2></CardHeader>
            <CardBody><p className="text-gray-700">{entrepreneur.bio}</p></CardBody>
          </Card>
          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Startup Overview</h2></CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium text-gray-900">Problem Statement</h3>
                  <p className="text-gray-700 mt-1">
                    {entrepreneur.entrepreneurProfile?.pitchSummary?.split('.')[0]}.
                  </p>
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900">Solution</h3>
                  <p className="text-gray-700 mt-1">
                    {entrepreneur.entrepreneurProfile?.pitchSummary}
                  </p>
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900">Market Opportunity</h3>
                  <p className="text-gray-700 mt-1">
                    The {entrepreneur.entrepreneurProfile?.industry} market is experiencing significant growth, with a projected CAGR of 14.5% through 2027. Our solution addresses key pain points in this expanding market.
                  </p>
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900">Competitive Advantage</h3>
                  <p className="text-gray-700 mt-1">
                    Unlike our competitors, we offer a unique approach that combines innovative technology with deep industry expertise, resulting in superior outcomes for our customers.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Team</h2>
              {profile && typeof profile.teamSize === 'number' && (
                <span className="text-sm text-gray-500">{profile.teamSize} members</span>
              )}
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center p-3 border border-gray-200 rounded-md">
                  <Avatar
                    src={entrepreneur.avatarUrl}
                    alt={entrepreneur.name}
                    size="md"
                    className="mr-3"
                  />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{entrepreneur.name}</h3>
                    <p className="text-xs text-gray-500">Founder & CEO</p>
                  </div>
                </div>

                {profile && typeof profile.teamSize === 'number' && profile.teamSize > 3 && (
                  <div className="flex items-center justify-center p-3 border border-dashed border-gray-200 rounded-md">
                    <p className="text-sm text-gray-500">+ {profile.teamSize - 3} more team members</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar - right side */}
        <div className="space-y-6">
          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Funding</h2></CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Current Round</span>
                  <div className="flex items-center mt-1">
                    <DollarSign size={18} className="text-accent-600 mr-1" />
                    <p className="text-lg font-semibold text-gray-900">{entrepreneur.entrepreneurProfile?.fundingNeeded}</p>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-500">Valuation</span>
                  <p className="text-md font-medium text-gray-900">$8M - $12M</p>
                </div>

                <div>
                  <span className="text-sm text-gray-500">Previous Funding</span>
                  <p className="text-md font-medium text-gray-900">$750K Seed (2022)</p>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Funding Timeline</span>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Pre-seed</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Completed</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Seed</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Completed</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Series A</span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">In Progress</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Documents</h2></CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-primary-50 rounded-md mr-3">
                    <FileText size={18} className="text-primary-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">Pitch Deck</h3>
                    <p className="text-xs text-gray-500">Updated 2 months ago</p>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>

                <div className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-primary-50 rounded-md mr-3">
                    <FileText size={18} className="text-primary-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">Business Plan</h3>
                    <p className="text-xs text-gray-500">Updated 1 month ago</p>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>

                <div className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-primary-50 rounded-md mr-3">
                    <FileText size={18} className="text-primary-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">Financial Projections</h3>
                    <p className="text-xs text-gray-500">Updated 2 weeks ago</p>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </div>

              {!isCurrentUser && isInvestor && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Request access to detailed documents and financials by sending a collaboration request.
                  </p>
                  <Button
                    leftIcon={<Send size={18} />}
                    disabled={buttonProps.disabled || isActionLoading}
                    isLoading={isActionLoading}
                    onClick={handleCollaborationAction}
                    variant={buttonProps.variant}
                    className='w-fit'
                  >
                    {buttonProps.text}
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};