// src/components/entrepreneur/EntrepreneurCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ExternalLink } from 'lucide-react';
import { User } from '../../types'; // <-- Use the base User type
import { Card, CardBody, CardFooter } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface EntrepreneurCardProps {
  entrepreneur: User; // <-- The prop is now a general User
  showActions?: boolean;
}

export const EntrepreneurCard: React.FC<EntrepreneurCardProps> = ({
  entrepreneur,
  showActions = true
}) => {
  const navigate = useNavigate();

  // Safely access the nested profile data
  const profile = entrepreneur.entrepreneurProfile;

  const handleViewProfile = () => {
    navigate(`/profile/entrepreneur/${entrepreneur._id}`); // <-- Use _id
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/chat/${entrepreneur._id}`); // <-- Use _id
  };

  // Render nothing if the user somehow doesn't have an entrepreneur profile
  if (!profile) {
    return null;
  }

  return (
    <Card
      className="transition-all duration-300 h-full flex flex-col" // Added flex classes for consistency
      onClick={handleViewProfile}
    >
      <CardBody className="flex flex-col flex-grow">
        <div className="flex items-start">
          <Avatar
            src={entrepreneur.avatarUrl}
            alt={entrepreneur.name}
            size="lg"
            status={entrepreneur.isOnline ? 'online' : 'offline'}
            className="mr-4"
          />

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{entrepreneur.name}</h3>
            {/* All subsequent properties now come from `profile` */}
            <p className="text-sm text-gray-500 mb-2">{profile.startupName}</p>

            <div className="flex flex-wrap gap-2 mb-3">
              {profile.industry && <Badge variant="primary" size="sm">{profile.industry}</Badge>}
              {profile.location && <Badge variant="gray" size="sm">{profile.location}</Badge>}
              {profile.foundedYear && <Badge variant="accent" size="sm">Founded {profile.foundedYear}</Badge>}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-900 mb-1">Pitch Summary</h4>
          <p className="text-sm text-gray-600 line-clamp-3">{profile.pitchSummary}</p>
        </div>

        <div className="mt-auto pt-3 flex justify-between items-center"> {/* Pushes to bottom */}
          <div>
            <span className="text-xs text-gray-500">Funding Need</span>
            <p className="text-sm font-medium text-gray-900">${profile.fundingNeeded}</p>
          </div>

          <div>
            <span className="text-xs text-gray-500">Team Size</span>
            <p className="text-sm font-medium text-gray-900">{profile.teamSize} people</p>
          </div>
        </div>
      </CardBody>

      {showActions && (
        <CardFooter className="border-t border-gray-100 bg-gray-50 flex justify-between">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<MessageCircle size={16} />}
            onClick={handleMessage}
          >
            Message
          </Button>

          <Button
            variant="primary"
            size="sm"
            rightIcon={<ExternalLink size={16} />}
            onClick={handleViewProfile}
          >
            View Profile
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};