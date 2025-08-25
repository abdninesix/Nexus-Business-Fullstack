// src/components/chat/ChatUserList.tsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Conversation } from '../../api/messages'; // <-- Use the dynamic Conversation type
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

interface ChatUserListProps {
  conversations: Conversation[];
}

export const ChatUserList: React.FC<ChatUserListProps> = ({ conversations }) => {
  const navigate = useNavigate();
  const { userId: activeUserId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  
  if (!currentUser) return null;
  
  const handleSelectUser = (userId: string) => {
    navigate(`/chat/${userId}`);
  };

  return (
    <div className="bg-white border-r border-gray-200 w-full h-full overflow-y-auto">
      <div className="py-4">
        <h2 className="px-4 text-lg font-semibold text-gray-800 mb-4">Messages</h2>
        
        <div className="space-y-1">
          {conversations.length > 0 ? (
            conversations.map(conversation => {
              // Get the other participant object directly from the populated array
              const otherUser = conversation.participants.find(p => p._id !== currentUser._id);
              if (!otherUser) return null;
              
              const lastMessage = conversation.lastMessage;
              // Use _id to check for the active user
              const isActive = activeUserId === otherUser._id;
              
              return (
                <div
                  key={conversation._id} // <-- Use _id
                  className={`px-4 py-3 flex cursor-pointer transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-50 border-l-4 border-primary-600'
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
                  onClick={() => handleSelectUser(otherUser._id)} // <-- Use _id
                >
                  <Avatar
                    src={otherUser.avatarUrl}
                    alt={otherUser.name}
                    size="md"
                    status={otherUser.isOnline ? 'online' : 'offline'}
                    className="mr-3 flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {otherUser.name}
                      </h3>
                      
                      {lastMessage?.createdAt && ( // <-- Check for createdAt
                        <span className="text-xs text-gray-500">
                          {/* Use createdAt from the lastMessage object */}
                          {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mt-1">
                      {lastMessage?.content ? (
                        <p className="text-xs text-gray-600 truncate">
                          {/* Check sender ID against current user's _id */}
                          {lastMessage.sender === currentUser._id ? 'You: ' : ''}
                          {lastMessage.content}
                        </p>
                      ) : <p className="text-xs text-gray-500 italic">No messages yet</p>}
                      
                      {/* Note: The 'isRead' status is part of the individual Message model, not the
                          Conversation's lastMessage summary. A more advanced implementation
                          with WebSockets would be needed to show a real-time "New" badge here. */}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">No conversations yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};