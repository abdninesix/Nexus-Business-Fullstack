import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, Bell, MessageCircle, LogOut, Building2, CircleDollarSign, Settings, HelpCircle, FileText, Video, Handshake, Receipt } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useQuery } from '@tanstack/react-query';
import { fetchNotifications } from '../../api/notifications';

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, unreadMessageCount } = useAuth();
  const navigate = useNavigate();

  // This is efficient because Tanstack Query will cache the result.
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    enabled: !!user, // Only fetch if the user is logged in
    select: (data) => data.filter(n => !n.isRead), // We only care about unread ones
  });

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // User dashboard route based on role
  const dashboardRoute = user?.role === 'entrepreneur'
    ? '/dashboard/entrepreneur'
    : user?.role === 'investor'
      ? '/dashboard/investor'
      : '/login';

  // User profile route based on role and ID
  const profileRoute = user
    ? `/profile/${user.role}/${user._id}`
    : '/login';

  const navLinksDesktop = [
    {
      icon: user?.role === 'entrepreneur' ? <Building2 size={18} /> : <CircleDollarSign size={18} />,
      text: 'Dashboard',
      path: dashboardRoute,
      badge: 0,
    },
    {
      icon: <MessageCircle size={18} />,
      text: 'Messages',
      path: user ? '/messages' : '/login',
      badge: unreadMessageCount,
    },
    {
      icon: <Bell size={18} />,
      text: 'Notifications',
      path: user ? '/notifications' : '/login',
      badge: notifications.length,
    },
    {
      icon: <Video size={18} />,
      text: 'Meetings',
      path: user ? '/calendar' : '/login',
      badge: 0,
    }
  ];

  const navLinksMobile = [
    {
      icon: user?.role === 'entrepreneur' ? <Building2 size={18} /> : <CircleDollarSign size={18} />,
      text: 'Dashboard',
      path: dashboardRoute,
      badge: 0,
    },
    {
      icon: <MessageCircle size={18} />,
      text: 'Messages',
      path: user ? '/messages' : '/login',
      badge: unreadMessageCount,
    },
    {
      icon: <Bell size={18} />,
      text: 'Notifications',
      path: user ? '/notifications' : '/login',
      badge: notifications.length,
    },
    {
      icon: <FileText size={18} />,
      text: 'Documents',
      path: user ? '/documents' : '/login',
      badge: 0,
    },
    {
      icon: <Handshake size={18} />,
      text: 'Deals',
      path: user ? '/deals' : '/login',
      badge: 0,
    },
    {
      icon: <Receipt size={18} />,
      text: 'Transactions',
      path: user ? '/transactions' : '/login',
      badge: 0,
    },
    {
      icon: <Video size={18} />,
      text: 'Meetings',
      path: user ? '/calendar' : '/login',
      badge: 0,
    }
  ];

  const bottomLinks = [
    {
      icon: <Settings size={18} />,
      text: 'Settings',
      path: '/settings',
    },
    {
      icon: <HelpCircle size={18} />,
      text: 'Help & Support',
      path: '/help',
    }
  ];

  return (
    <nav className="bg-white shadow-md">
      <div className="mx-auto px-6">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                  <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900">Business Nexus</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:ml-6">
            {user ? (
              <div className="flex items-center space-x-4">
                {navLinksDesktop.map((link, index) => (
                  <Link
                    key={index}
                    to={link.path}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
                  >
                    <span className="mr-2">{link.icon}</span>
                    {link.text}
                  </Link>
                ))}

                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  leftIcon={<LogOut size={18} />}
                >
                  Logout
                </Button>

                <Link to={profileRoute} className="flex items-center space-x-2 ml-2">
                  <Avatar
                    src={user.avatarUrl}
                    alt={user.name}
                    size="sm"
                    status={user.isOnline ? 'online' : 'offline'}
                  />
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <Button variant="outline">Log in</Button>
                </Link>
                <Link to="/register">
                  <Button>Sign up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="relative inline-flex items-center justify-center rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="block size-8" />
              ) : (
                <Menu className="block size-8" />
              )}
              {(unreadMessageCount + notifications.length > 0) && !isMenuOpen && (
                <div className="absolute bottom-1 left-1 block h-2.5 w-2.5 rounded-full bg-primary-600 ring-2 ring-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute w-full z-20 bg-white border-b border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user ? (
              <>
                <Link to={profileRoute} onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2">
                  <Avatar
                    src={user.avatarUrl}
                    alt={user.name}
                    size="sm"
                    status={user.isOnline ? 'online' : 'offline'}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </Link>

                <div className="border-t border-gray-200 pt-2">
                  {navLinksMobile.map((link, index) => (
                    <Link
                      key={index}
                      to={link.path}
                      className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <span className="mr-3">{link.icon}</span>
                        {link.text}
                      </div>
                      {link.badge > 0 && (
                        <span className="ml-3 bg-primary-600 text-white text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-2 space-y-1">
                  {bottomLinks.map((link, index) => (
                    <Link
                      key={index}
                      to={link.path}
                      className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="mr-3">{link.icon}</span>
                      {link.text}
                    </Link>
                  ))}
                  <button
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="flex w-full items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                  >
                    <LogOut size={18} className="mr-3" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col space-y-2 px-3 py-2">
                <Link
                  to="/login"
                  className="w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button variant="outline" fullWidth>Log in</Button>
                </Link>
                <Link
                  to="/register"
                  className="w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button fullWidth>Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};