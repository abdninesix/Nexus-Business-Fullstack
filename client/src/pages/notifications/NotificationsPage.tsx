// src/pages/notifications/NotificationsPage.tsx
import React, { useEffect } from 'react';
import { Bell, MessageCircle, UserPlus, DollarSign, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Card, CardBody } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useSocket } from '../../context/SocketContext';
import { useQuery } from '@tanstack/react-query';
import { fetchAllUsers } from '../../api/user'; // We need this to get user avatars

export const NotificationsPage: React.FC = () => {
  const { notifications, clearNotifications } = useSocket();

  useEffect(() => {
    clearNotifications();
  }, []);

  // Fetch all users to easily look up avatars by sender name.
  // This will be cached by Tanstack Query, so it's efficient.
  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: fetchAllUsers,
  });

  // Create a quick lookup map for user avatars
  const userAvatarMap = new Map(users.map(user => [user.name, user.avatarUrl]));

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'newMessage':
        return <MessageCircle size={16} className="text-primary-600" />;
      case 'newMeeting':
        return <Calendar size={16} className="text-green-600" />;
      case 'connection':
        return <UserPlus size={16} className="text-secondary-600" />;
      case 'investment':
        return <DollarSign size={16} className="text-accent-600" />;
      default:
        return <Bell size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated with your network activity</p>
        </div>

        <Button variant="outline" size="sm">
          Mark all as read
        </Button>
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification, index) => {
            // Find the sender's avatar from our map
            const senderAvatar = userAvatarMap.get(notification.senderName);

            return (
              <Card
                key={index}
                // For now, all live notifications are considered "unread"
                className="transition-colors duration-200 bg-primary-50"
              >
                <CardBody className="flex items-start p-4">
                  <Avatar
                    // Use the found avatar, or a default/placeholder if not found
                    src={senderAvatar}
                    alt={notification.senderName}
                    size="md"
                    className="flex-shrink-0 mr-4"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {notification.senderName}
                      </span>
                      <Badge variant="primary" size="sm" rounded>New</Badge>
                    </div>

                    {/* The full message content from the socket notification */}
                    <p className="text-gray-600 mt-1">
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      {getNotificationIcon(notification.type)}
                      {/* Use date-fns for a dynamic "x minutes ago" timestamp */}
                      <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardBody className="text-center p-12">
              <Bell size={48} className="mx-auto text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No new notifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                You're all caught up! We'll notify you here when something new happens.
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
};