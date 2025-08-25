// src/components/investor/InvestorCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ExternalLink } from 'lucide-react';
import { User } from '../../types'; // <-- Use the general User type
import { Card, CardBody, CardFooter } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface InvestorCardProps {
  investor: User; // <-- The prop type is updated
  showActions?: boolean;
}

export const InvestorCard: React.FC<InvestorCardProps> = ({
  investor,
  showActions = true
}) => {
  const navigate = useNavigate();
  
  // Safely access the nested profile data
  const profile = investor.investorProfile;

  const handleViewProfile = () => {
    navigate(`/profile/investor/${investor._id}`); // <-- Use _id
  };
  
  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    navigate(`/chat/${investor._id}`); // <-- Use _id
  };
  
  // Safety check: Don't render the card if there's no investor profile
  if (!profile) {
    return null;
  }

  return (
    <Card 
      hoverable 
      className="transition-all duration-300 h-full flex flex-col" // Added flex to ensure footer sticks to bottom
      onClick={handleViewProfile}
    >
      <CardBody className="flex flex-col flex-grow"> {/* Added flex-grow */}
        <div className="flex items-start">
          <Avatar
            src={investor.avatarUrl}
            alt={investor.name}
            size="lg"
            status={investor.isOnline ? 'online' : 'offline'}
            className="mr-4"
          />
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{investor.name}</h3>
            {/* All data is now read from `profile` or `investor` */}
            <p className="text-sm text-gray-500 mb-2">Investor • {profile.totalInvestments || 0} investments</p>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.investmentStage?.map((stage, index) => (
                <Badge key={index} variant="secondary" size="sm">{stage}</Badge>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-900 mb-1">Investment Interests</h4>
          <div className="flex flex-wrap gap-2">
            {profile.investmentInterests?.map((interest, index) => (
              <Badge key={index} variant="primary" size="sm">{interest}</Badge>
            ))}
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-600 line-clamp-2">{investor.bio}</p>
        </div>
        
        <div className="mt-auto pt-3 flex justify-between items-center"> {/* mt-auto pushes this to the bottom */}
          <div>
            <span className="text-xs text-gray-500">Investment Range</span>
            <p className="text-sm font-medium text-gray-900">{profile.minimumInvestment} - {profile.maximumInvestment}</p>
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