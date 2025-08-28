// src/context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { Bell } from 'lucide-react';

interface Notification {
    senderName: string;
    type: string;
    message: string;
    createdAt: string;
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
            toast.success(data.message, { icon: <Bell /> });
            if (data.type === 'newMessage') {
                fetchAndUpdateUnreadCount();
            }
        });

        // Cleanup listener
        return () => {
            socket.off("getNotification");
        };
    }, [socket]);

    const clearNotifications = () => {
        setNotifications([]);
    };

    const value = { socket, notifications, clearNotifications };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};