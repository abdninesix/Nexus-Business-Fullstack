// src/context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { Bell, Calendar, CalendarX, CheckCircle, DollarSign, Handshake, Info, MessageCircle, UserPlus, X, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

// 1. Define the base structure for all notifications
interface BaseNotification {
    senderName: string;
    message: string;
    createdAt: string;
}

// 2. Define the specific shapes for each notification type
interface NewMessageNotification extends BaseNotification { type: 'newMessage'; relatedData: { chatId: string; }; }
interface NewMeetingNotification extends BaseNotification { type: 'newMeeting'; relatedData: { meetingId: string; }; }
interface MeetingCancelledNotification extends BaseNotification { type: 'meetingCancelled'; }
interface MeetingResponseNotification extends BaseNotification { type: 'meetingResponse'; }
interface MeetingConfirmedNotification extends BaseNotification { type: 'meetingConfirmed'; }
interface NewDealNotification extends BaseNotification { type: 'newDeal' | 'dealStatusUpdate'; relatedData: { dealId: string; }; }
interface NewTransactionNotification extends BaseNotification { type: 'newTransaction'; relatedData: { dealId: string; }; }
interface NewConnectionRequestNotification extends BaseNotification { type: 'newConnectionRequest'; relatedData: { investorId: string; }; }
interface ConnectionRequestAcceptedNotification extends BaseNotification { type: 'connectionRequestAccepted'; relatedData: { entrepreneurId: string; }; }
interface ConnectionRequestRejectedNotification extends BaseNotification { type: 'connectionRequestRejected'; relatedData: { entrepreneurId: string; }; }

// 3. The final Discriminated Union Type
type LiveNotification =
    | NewMessageNotification
    | NewMeetingNotification
    | MeetingCancelledNotification
    | MeetingResponseNotification
    | MeetingConfirmedNotification
    | NewDealNotification
    | NewTransactionNotification
    | NewConnectionRequestNotification
    | ConnectionRequestAcceptedNotification
    | ConnectionRequestRejectedNotification;

interface SocketContextType {
    socket: Socket | null;
    setSocket: (socket: Socket | null) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error("useSocket must be used within a SocketProvider");
    return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);

    const value = { socket, setSocket };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

// This is a "headless" component. It renders nothing, but contains all the logic.
const SocketHandler: React.FC = () => {
    const { user, fetchAndUpdateUnreadCount } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient(); // <-- 4. Get the query client instance
    const { socket, setSocket } = useSocket();

    useEffect(() => {
        if (user) {

            const socketUrl =
                import.meta.env.MODE === "production"
                    ? import.meta.env.VITE_SOCKET_URL_PROD
                    : import.meta.env.VITE_SOCKET_URL_DEV;
                    
            const newSocket = io(socketUrl);
            setSocket(newSocket);
            newSocket.emit("addNewUser", user._id);

            // The notification listener logic is moved here
            newSocket.on("getNotification", (data: LiveNotification) => {
                // Invalidate the 'notifications' query. This tells Tanstack Query to refetch
                // the data on the NotificationsPage, making it update with the new notification.
                queryClient.invalidateQueries({ queryKey: ['notifications'] });

                let icon = <Bell />;
                let path = '/notifications';

                switch (data.type) {
                    case 'newMessage':
                        icon = <MessageCircle />;
                        path = `/chat/${data.relatedData.chatId}`;
                        fetchAndUpdateUnreadCount();
                        break;

                    case 'newMeeting':
                        icon = <Calendar />;
                        path = '/calendar';
                        queryClient.invalidateQueries({ queryKey: ['meetings'] });
                        break;

                    case 'meetingCancelled':
                        icon = <CalendarX className="text-red-500" />;
                        path = '/calendar';
                        queryClient.invalidateQueries({ queryKey: ['meetings'] });
                        break;

                    case 'meetingResponse':
                        icon = <Info className="text-blue-500" />;
                        path = '/calendar';
                        queryClient.invalidateQueries({ queryKey: ['meetings'] });
                        break;

                    case 'meetingConfirmed':
                        icon = <CheckCircle className="text-green-500" />;
                        path = '/calendar';
                        queryClient.invalidateQueries({ queryKey: ['meetings'] });
                        break;

                    case 'newDeal':
                    case 'dealStatusUpdate':
                        icon = <Handshake />;
                        path = '/deals';
                        queryClient.invalidateQueries({ queryKey: ['deals', 'receivedDeals'] });
                        break;

                    case 'newTransaction':
                        icon = <DollarSign className="text-green-500" />;
                        path = '/deals';
                        queryClient.invalidateQueries({ queryKey: ['deals', 'receivedDeals'] });
                        break;

                    case 'newConnectionRequest':
                        icon = <UserPlus />;
                        path = `/profile/investor/${data.relatedData.investorId}`;
                        queryClient.invalidateQueries({ queryKey: ['collaborationRequests'] });
                        break;

                    case 'connectionRequestAccepted':
                        icon = <CheckCircle className="text-green-500" />;
                        path = `/profile/entrepreneur/${data.relatedData.entrepreneurId}`;
                        queryClient.invalidateQueries({ queryKey: ['sentRequests'] });
                        break;

                    case 'connectionRequestRejected':
                        icon = <XCircle className="text-red-500" />;
                        path = `/profile/entrepreneur/${data.relatedData.entrepreneurId}`;
                        queryClient.invalidateQueries({ queryKey: ['sentRequests'] });
                        break;
                }

                toast.custom((t) => (
                    <div
                        className={`${t.visible ? 'animate-enter' : 'animate-leave'
                            } max-w-sm w-full  bg-gray-900 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden cursor-pointer`}
                        onClick={() => {
                            navigate(path);
                            toast.dismiss(t.id);
                        }}
                    >
                        {/* Icon Section with Colored Background */}
                        <div className="w-12 h-full flex items-center justify-center text-primary-600">
                            {React.cloneElement(icon, { size: 24 })}
                        </div>
                        {/* Main Content */}
                        <div className="flex-1 w-0 p-3">
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
                                className="p-2 rounded-full text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
    }, [user, queryClient, fetchAndUpdateUnreadCount, navigate]);

    return null; // This component does not render any UI
};

export { SocketHandler };