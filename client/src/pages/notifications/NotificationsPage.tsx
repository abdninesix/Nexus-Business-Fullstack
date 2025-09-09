// src/pages/notifications/NotificationsPage.tsx
import React from 'react';
import { Bell, MessageCircle, UserPlus, DollarSign, Calendar, CalendarX, Handshake, CheckCircle, XCircle, Trash2, Info, Edit, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Card, CardBody } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteNotification, fetchNotifications, markAllNotificationsAsRead, Notification } from '../../api/notifications';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // 1. Fetch persistent notifications from the API
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  // 2. Mutation to mark all as read
  const markAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      // On success, invalidate the query to refetch and update the UI
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => toast.error("Failed to mark notifications as read."),
  });

  // 3. Mutation to delete a specific notification
  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      toast.success("Notification deleted.");
      // Invalidate the query to refetch the list and remove the deleted item from the UI
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete notification.");
    }
  });

  const handleMarkAllAsRead = () => {
    markAsReadMutation.mutate();
  };

  const handleDeleteNotification = (e: React.MouseEvent, notificationId: string) => {
    e.preventDefault();
    e.stopPropagation();

    deleteNotificationMutation.mutate(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'newMessage': return <MessageCircle size={18} className="text-primary-600" />;
      case 'newMeeting': return <Calendar size={18} className="text-green-600" />;
      case 'meetingCancelled': return <CalendarX size={18} className="text-red-500" />;
      case 'meetingResponse': return <Info size={18} className="text-blue-500" />;
      case 'meetingConfirmed': return <CheckCircle size={18} className="text-green-600" />;
      case 'newDeal': return <Handshake size={18} className="text-blue-500" />;
      case 'dealStatusUpdate': return <Handshake size={18} className="text-yellow-500" />;
      case 'newTransaction': return <DollarSign size={18} className="text-green-600" />;
      case 'newConnectionRequest': return <UserPlus size={18} className="text-secondary-600" />;
      case 'connectionRequestAccepted': return <CheckCircle size={18} className="text-green-600" />;
      case 'connectionRequestRejected': return <XCircle size={18} className="text-red-500" />;
      case 'newSignatureRequest': return <Edit size={18} className="text-yellow-500" />;
      case 'documentSigned': return <Check size={18} className="text-green-600" />;
      default: return <Bell size={18} className="text-gray-600" />;
    }
  };

  const hasUnread = notifications.some(n => !n.isRead);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated with your network activity</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllAsRead}
          isLoading={markAsReadMutation.isPending}
          disabled={!hasUnread}
          className='w-fit'
        >
          Mark all as read
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading && <p>Loading notifications...</p>}
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <Link to={notification.link || '#'} key={notification._id}>
              <Card className={`transition-colors duration-200 ${!notification.isRead ? 'bg-primary-50 hover:bg-primary-100' : 'bg-white hover:bg-gray-50'}`}>
                <CardBody className="flex items-start p-4">
                  <Avatar
                    // Use the found avatar, or a default/placeholder if not found
                    src={notification.sender?.avatarUrl}
                    alt={notification.sender.name}
                    size="md"
                    className="flex-shrink-0 mr-4"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {notification.sender.name}
                      </span>
                      {!notification.isRead && (<Badge variant="primary" size="sm" rounded>New</Badge>)}
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
                  <div className="ml-auto pl-4 flex-shrink-0 self-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600"
                      onClick={(e) => handleDeleteNotification(e, notification._id)}
                      isLoading={deleteNotificationMutation.isPending && deleteNotificationMutation.variables === notification._id}
                      aria-label="Delete notification"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  {!notification.isRead && <div className="size-4 bg-primary-500 rounded-full ml-2 self-center flex-shrink-0" />}
                </CardBody>
              </Card>
            </Link>
          ))
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