import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home, Building2, CircleDollarSign, Users, MessageCircle,
  Bell, FileText, Settings, HelpCircle,
  VideoIcon,
  Handshake,
  Receipt
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchNotifications } from '../../api/notifications';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  badgeCount?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, text, badgeCount }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center py-2.5 px-4 rounded-md transition-colors duration-200 ${isActive
          ? 'bg-primary-50 text-primary-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <span className="mr-3">{icon}</span>
          <span className="text-sm font-medium">{text}</span>
        </div>
        {(badgeCount && badgeCount > 0) ? (
          <span className="bg-primary-600 text-white text-xs font-bold size-5 flex items-center justify-center rounded-full">
            {badgeCount}
          </span>
        ) : (<span className="size-5"></span>)
        }
      </div>
    </NavLink>
  );
};

export const Sidebar: React.FC = () => {
  const { user, unreadMessageCount } = useAuth();

  const { data: unreadNotificationsCount = 0 } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    enabled: !!user,
    // Use the `select` option to transform the data into just the count of unread items
    select: (data) => data.filter(n => !n.isRead).length,
    // Optional: refetch periodically to keep it fresh
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  if (!user) return null;

  // Define sidebar items based on user role
  const entrepreneurItems = [
    { to: '/dashboard/entrepreneur', icon: <Home size={20} />, text: 'Dashboard' },
    { to: '/profile/entrepreneur/' + user._id, icon: <Building2 size={20} />, text: 'My Startup' },
    { to: '/investors', icon: <CircleDollarSign size={20} />, text: 'Find Investors' },
    { to: '/messages', icon: <MessageCircle size={20} />, text: 'Messages', badge: unreadMessageCount },
    { to: '/notifications', icon: <Bell size={20} />, text: 'Notifications', badge: unreadNotificationsCount },
    { to: '/documents', icon: <FileText size={20} />, text: 'Documents' },
    { to: '/deals', icon: <Handshake size={20} />, text: 'Deals' },
    { to: '/transactions', icon: <Receipt size={20} />, text: 'Transactions' },
    { to: '/calendar', icon: <VideoIcon size={20} />, text: 'Meetings' },
  ];

  const investorItems = [
    { to: '/dashboard/investor', icon: <Home size={20} />, text: 'Dashboard' },
    { to: '/profile/investor/' + user._id, icon: <CircleDollarSign size={20} />, text: 'My Portfolio' },
    { to: '/entrepreneurs', icon: <Users size={20} />, text: 'Find Startups' },
    { to: '/messages', icon: <MessageCircle size={20} />, text: 'Messages', badge: unreadMessageCount },
    { to: '/notifications', icon: <Bell size={20} />, text: 'Notifications', badge: unreadNotificationsCount },
    { to: '/documents', icon: <FileText size={20} />, text: 'Documents' },
    { to: '/deals', icon: <Handshake size={20} />, text: 'Deals' },
    { to: '/transactions', icon: <Receipt size={20} />, text: 'Transactions' },
    { to: '/calendar', icon: <VideoIcon size={20} />, text: 'Meetings' },
  ];

  const sidebarItems = user.role === 'entrepreneur' ? entrepreneurItems : investorItems;

  // Common items at the bottom
  const commonItems = [
    { to: '/settings', icon: <Settings size={20} />, text: 'Settings' },
    { to: '/help', icon: <HelpCircle size={20} />, text: 'Help & Support' },
  ];

  return (
    <div className="w-64 bg-white h-full border-r border-gray-200 hidden md:block">
      <div className="h-full flex flex-col">
        <div className="flex-1 py-4 overflow-y-auto">
          <div className="px-3 space-y-1">
            {sidebarItems.map((item, index) => (
              <SidebarItem
                key={index}
                to={item.to}
                icon={item.icon}
                text={item.text}
                badgeCount={item.badge}
              />
            ))}
          </div>

          <div className="mt-8 px-3">
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Settings
            </h3>
            <div className="mt-2 space-y-1">
              {commonItems.map((item, index) => (
                <SidebarItem
                  key={index}
                  to={item.to}
                  icon={item.icon}
                  text={item.text}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-xs text-gray-600">Need assistance?</p>
            <h4 className="text-sm font-medium text-gray-900 mt-1">Contact Support</h4>
            <a
              href="mailto:support@businessnexus.com"
              className="mt-2 inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-500"
            >
              support@businessnexus.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};