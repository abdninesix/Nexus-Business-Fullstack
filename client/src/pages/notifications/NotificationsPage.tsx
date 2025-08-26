// src/pages/notifications/NotificationsPage.tsx
import React from 'react';
import { Bell, MessageCircle, UserPlus, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns'; // Use for dynamic time formatting

import { Card, CardBody } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useSocket } from '../../context/SocketContext';

export const NotificationsPage: React.FC = () => {
  // 1. Get live notifications from the SocketContext
  const { notifications } = useSocket();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'newMessage': // <-- Match the type sent from the backend
        return <MessageCircle size={16} className="text-primary-600" />;
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
          notifications.map((notification, index) => (
            <Card
              key={index} // Use index as key for now, or a unique ID if provided by socket
              className="transition-colors duration-200 bg-primary-50" // All new notifications are "unread"
            >
              <CardBody className="flex items-start p-4">
                {/* For a generic notification, an icon might be better than an avatar */}
                <div className="p-3 bg-white rounded-full mr-4 flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {notification.senderName}
                    </span>
                    <Badge variant="primary" size="sm" rounded>New</Badge>
                  </div>

                  {/* The 'content' is now the full message from the socket */}
                  <p className="text-gray-600 mt-1">
                    {notification.message}
                  </p>

                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <span className="capitalize">{notification.type.replace('newMessage', 'New Message')}</span>
                    <span>•</span>
                    {/* Use date-fns for dynamic, accurate time */}
                    <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        ) : (
          // Display an empty state if there are no notifications
          <Card>
            <CardBody className="text-center p-12">
              <Bell size={48} className="mx-auto text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No new notifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                We'll let you know when something new happens.
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
};