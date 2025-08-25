// src/pages/messages/MessagesPage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';

import { ChatUserList } from '../../components/chat/ChatUserList';
import { fetchConversations, Conversation } from '../../api/messages';

// Skeleton loader for the user list to show while fetching
const ChatListSkeleton = () => (
  <div className="p-4 space-y-4 animate-pulse">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="flex items-center">
        <div className="w-14 h-14 bg-gray-200 rounded-full"></div>
        <div className="flex-1 ml-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    ))}
  </div>
);

export const MessagesPage: React.FC = () => {
  // 1. Fetch the list of conversations for the current user.
  const { data: conversations = [], isLoading, isError } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
  });

  // 2. Conditionally render content based on the query state.
  const renderContent = () => {
    if (isLoading) {
      return <ChatListSkeleton />;
    }

    if (isError) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center text-red-600">
          <h2 className="text-xl font-medium">Failed to load messages</h2>
          <p className="mt-2">Please check your connection and try again.</p>
        </div>
      );
    }

    if (conversations.length > 0) {
      // If conversations exist, render the list component.
      // The navigation logic is already handled inside ChatUserList.
      return <ChatUserList conversations={conversations} />;
    }

    // If there are no conversations, show the "empty" state.
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
          <MessageSquare size={32} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-medium text-gray-900">No messages yet</h2>
        <p className="text-gray-600 mt-2 max-w-xs">
          Start connecting with entrepreneurs and investors to begin conversations.
        </p>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
      {renderContent()}
    </div>
  );
};