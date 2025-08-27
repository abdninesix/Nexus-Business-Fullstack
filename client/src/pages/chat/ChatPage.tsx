// src/pages/chat/ChatPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Phone, Video, Info, Smile, MessageCircle } from 'lucide-react';

import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { ChatUserList } from '../../components/chat/ChatUserList';
import { useAuth } from '../../context/AuthContext';
import { fetchConversations, fetchMessages, sendMessageRequest, Conversation, Message, markAsRead } from '../../api/messages';
import { fetchUserById } from '../../api/user';

export const ChatPage: React.FC = () => {
  const { userId: activeUserId } = useParams<{ userId: string }>();
  const { user: currentUser, fetchAndUpdateUnreadCount } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (activeUserId) {
      markAsRead(activeUserId).then(() => {
        // After marking as read, refetch the global count
        fetchAndUpdateUnreadCount();
      });
    }
  }, [activeUserId]);

  // 1. Fetch the list of conversations for the sidebar
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
  });

  // 2. Fetch the active chat partner's full user object for the header
  const { data: chatPartner } = useQuery({
    queryKey: ['user', activeUserId],
    queryFn: () => fetchUserById(activeUserId!),
    enabled: !!activeUserId, // Only run if a user is selected
  });

  // 3. Fetch the messages for the active conversation
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['messages', activeUserId],
    queryFn: () => fetchMessages(activeUserId!),
    enabled: !!activeUserId,
  });

  // 4. Mutation for sending a new message
  const sendMessageMutation = useMutation({
    mutationFn: sendMessageRequest,
    onSuccess: () => {
      // Invalidate both messages and conversations to refetch the latest data
      queryClient.invalidateQueries({ queryKey: ['messages', activeUserId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeUserId) return;
    sendMessageMutation.mutate({ receiverId: activeUserId, content: newMessage });
    setNewMessage('');
  };

  if (!currentUser) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in">
      {/* Sidebar */}
      <div className="hidden md:block w-1/3 lg:w-1/4 border-r border-gray-200">
        <ChatUserList conversations={conversations} />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {chatPartner ? (
          <>
            {/* Header */}
            <div className="border-b p-4 flex justify-between items-center">
              <div className="flex items-center">
                <Avatar src={chatPartner.avatarUrl} alt={chatPartner.name} size="md" status={chatPartner.isOnline ? 'online' : 'offline'} className="mr-3" />
                <div>
                  <h2 className="text-lg font-medium">{chatPartner.name}</h2>
                  <p className="text-sm text-gray-500">{chatPartner.isOnline ? 'Online' : 'Offline'}</p>
                </div>
              </div>
              <div className="flex space-x-2">{/* Icons */}</div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map(message => (
                    <ChatMessage
                      key={message._id}
                      message={message}
                      isCurrentUser={message.sender === currentUser._id}
                      senderAvatar={message.sender === currentUser._id ? currentUser.avatarUrl : chatPartner.avatarUrl}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <h3 className="text-lg font-medium">No messages yet</h3>
                  <p className="text-gray-500 mt-1">Send a message to start the conversation.</p>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} fullWidth />
                <Button type="submit" disabled={!newMessage.trim() || sendMessageMutation.isPending}><Send size={18} /></Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center">
            <MessageCircle size={48} className="text-gray-400 mb-4" />
            <h2 className="text-xl font-medium">Select a conversation</h2>
            <p className="text-gray-500 mt-2">Choose a contact from the list to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
};