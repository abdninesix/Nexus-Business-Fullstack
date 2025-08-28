// src/context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { Bell, Calendar, MessageCircle } from 'lucide-react';
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
    notifications: Notification[];
    clearNotifications: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error("useSocket must be used within a SocketProvider");
    return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, fetchAndUpdateUnreadCount } = useAuth();
    const navigate = useNavigate();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        // Only connect if the user is logged in
        if (user) {
            // const newSocket = io("http://localhost:3000");
            const newSocket = io("https://nexus-server-a951.onrender.com");
            setSocket(newSocket);

            // Identify this client to the server
            newSocket.emit("addNewUser", user._id);

            // Cleanup on dismount or user change
            return () => {
                newSocket.disconnect();
            };
        } else {
            // If user logs out, disconnect socket
            socket?.disconnect();
            setSocket(null);
        }
    }, [user]);

    // Effect for listening to notifications
    useEffect(() => {
        if (!socket) return;

        socket.on("getNotification", (data: Notification) => {
            setNotifications((prev) => [data, ...prev]);

            let icon = <Bell />;
            let path = '/notifications';

            if (data.type === 'newMessage') {
                icon = <MessageCircle />;
                // We'll need the sender's ID to navigate to the chat.
                // This needs to be added to the backend emit.
                path = data.relatedData?.chatId ? `/chat/${data.relatedData.chatId}` : '/messages';
                fetchAndUpdateUnreadCount();
            } else if (data.type === 'newMeeting') {
                icon = <Calendar />;
                path = '/calendar';
            }

            toast.custom((t) => (
                <div
                    className={`${t.visible ? 'animate-enter' : 'animate-leave'
                        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
                    onClick={() => {
                        navigate(path);
                        toast.dismiss(t.id); // Dismiss the toast on click
                    }}
                >
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5 text-primary-600">
                                {icon}
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    {data.senderName}
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    {data.message}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex border-l border-gray-200">
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent navigation
                                toast.dismiss(t.id);
                            }}
                            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            Close
                        </button>
                    </div>
                </div>
            ), { duration: 6000 }); // Keep the longer duration
        });

        // Cleanup listener
        return () => { socket.off("getNotification"); };
    }, [socket, fetchAndUpdateUnreadCount, navigate]);

    const clearNotifications = () => {
        setNotifications([]);
    };

    const value = { socket, notifications, clearNotifications };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};