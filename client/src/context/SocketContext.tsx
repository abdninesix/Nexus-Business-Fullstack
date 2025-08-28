// src/context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { Bell, Calendar, MessageCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Notification {
    senderName: string;
    type: 'newMessage' | 'newMeeting' | 'requestAccepted';
    message: string;
    createdAt: string;
    relatedData?: {
        chatId?: string;
        meetingId?: string;
    };
}

interface SocketContextType {
    socket: Socket | null;
    setSocket: (socket: Socket | null) => void; // Expose setters
    notifications: Notification[];
    setNotifications: (notifications: React.SetStateAction<Notification[]>) => void; // Expose setters
    clearNotifications: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error("useSocket must be used within a SocketProvider");
    return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const clearNotifications = () => {
        setNotifications([]);
    };

    const value = { socket, setSocket, notifications, setNotifications, clearNotifications };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

// This is a "headless" component. It renders nothing, but contains all the logic.
const SocketHandler: React.FC = () => {
    const { user, fetchAndUpdateUnreadCount } = useAuth();
    // It's safe to use these hooks here because this component will be inside the router
    const { setSocket, setNotifications } = useSocket();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            // const newSocket = io("http://localhost:3000");
            const newSocket = io("https://nexus-server-a951.onrender.com");
            setSocket(newSocket);
            newSocket.emit("addNewUser", user._id);

            // The notification listener logic is moved here
            newSocket.on("getNotification", (data: Notification) => {
                setNotifications((prev) => [data, ...prev]);

                let icon = <Bell />;
                let path = '/notifications';

                if (data.type === 'newMessage') {
                    icon = <MessageCircle />;
                    path = data.relatedData?.chatId ? `/chat/${data.relatedData.chatId}` : '/messages';
                    fetchAndUpdateUnreadCount();
                } else if (data.type === 'newMeeting') {
                    icon = <Calendar />;
                    path = '/calendar';
                }

                toast.custom((t) => (
                    <div
                        className={`${t.visible ? 'animate-enter' : 'animate-leave'
                            } max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden cursor-pointer`}
                        onClick={() => {
                            navigate(path);
                            toast.dismiss(t.id);
                        }}
                    >
                        {/* Icon Section with Colored Background */}
                        <div className="w-12 h-full flex items-center justify-center bg-primary-600">
                            {React.cloneElement(icon, { size: 24, className: "text-white" })}
                        </div>
                        {/* Main Content */}
                        <div className="flex-1 w-0 p-3 bg-gray-900">
                            <div className="flex items-start">
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white">
                                        {data.senderName}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-300">
                                        {data.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Close Button */}
                        <div className="flex items-center p-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent navigation when only closing
                                    toast.dismiss(t.id);
                                }}
                                className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                ), { duration: 5000, position: 'top-right' });
            });

            return () => {
                newSocket.disconnect();
                setSocket(null);
            };
        }
    }, [user, setSocket, setNotifications, fetchAndUpdateUnreadCount, navigate]);

    return null; // This component does not render any UI
};

export { SocketHandler };