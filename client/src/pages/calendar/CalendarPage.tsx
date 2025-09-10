import React, { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from 'react-modal';

import { fetchMeetings, createMeeting, deleteMeeting, Meeting, NewMeetingData, respondToMeeting } from '../../api/meetings';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CustomDateTimePicker } from '../../components/ui/DateTimePicker';
import { User } from '../../types';
import { Clock, Users } from 'lucide-react';
import { enUS } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { CollaborationRequest, fetchReceivedRequests, fetchSentRequests } from '../../api/collaborations';

// Setup for react-big-calendar
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// Modal styles
const modalStyles = {
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 50, // High z-index to cover everything
    },
    content: {
        top: '50%', left: '50%', right: 'auto', bottom: 'auto',
        marginRight: '-50%', transform: 'translate(-50%, -50%)',
        width: '90%', maxWidth: '500px',
        border: 'none', padding: '2rem', borderRadius: '0.5rem',
        zIndex: 51, // Even higher z-index for the modal content itself
    },
};

export const CalendarPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    // Set initial end time to be 1 hour after start time
    const initialStartTime = new Date();
    const initialEndTime = new Date(initialStartTime.getTime() + 60 * 60 * 1000);

    const [newEvent, setNewEvent] = useState({ title: '', start: initialStartTime, end: initialEndTime, participantId: '' });

    const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
        queryKey: ['meetings'],
        queryFn: fetchMeetings,
    });

    const connectionsQueryFn = currentUser?.role === 'investor'
        ? fetchSentRequests
        : fetchReceivedRequests;

    const connectionsQueryKey = currentUser?.role === 'investor'
        ? 'sentRequests'
        : 'receivedRequests';

    const { data: requests = [] } = useQuery<CollaborationRequest[]>({
        queryKey: [connectionsQueryKey],
        queryFn: connectionsQueryFn,
        enabled: isModalOpen && !!currentUser, // Only run when modal is open and user exists
    });

    const createMeetingMutation = useMutation({
        mutationFn: createMeeting,
        onSuccess: () => {
            toast.success("Meeting scheduled successfully!");
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            setIsModalOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to schedule meeting.");
        }
    });

    const deleteMeetingMutation = useMutation({
        mutationFn: deleteMeeting,
        onSuccess: () => {
            toast.success("Meeting deleted successfully!");
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            closeDetailModal(); // Close the modal on success
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete meeting.");
        }
    });

    const respondMutation = useMutation({
        mutationFn: respondToMeeting,
        onSuccess: () => {
            toast.success("Your response has been recorded.");
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            closeDetailModal();
        },
        onError: (err: any) => toast.error(err.response?.data?.message || "Action failed."),
    });

    const events = useMemo(() => meetings.map(meeting => ({
        title: meeting.title,
        start: new Date(meeting.start),
        end: new Date(meeting.end),
        resource: meeting,
    })), [meetings]);

    const connections = useMemo(() =>
        requests
            .filter(req => req.status === 'accepted')
            .map(req => currentUser?.role === 'investor' ? req.entrepreneurId : req.investorId)
            .filter((user): user is User => typeof user === 'object' && user !== null),
        [requests, currentUser]);

    const handleSelectEvent = (event: { resource: Meeting }) => {
        setSelectedMeeting(event.resource); // Get the original meeting object
        setIsDetailModalOpen(true);
    };

    const handleDeleteMeeting = () => {
        if (!selectedMeeting) return;
        if (window.confirm("Are you sure you want to delete this meeting?")) {
            deleteMeetingMutation.mutate(selectedMeeting._id);
        }
    };

    const handleJoinMeeting = () => {
        if (!selectedMeeting) return;

        if (selectedMeeting.status !== 'confirmed') {
            toast.error("This meeting has not been confirmed by all participants yet.");
            return;
        }

        if (new Date(selectedMeeting.end) < new Date()) {
            toast.error("This meeting has already ended.");
            return;
        }

        navigate(`/lobby/${selectedMeeting._id}`);
    };

    const closeDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedMeeting(null);
    };

    const handleCreateMeeting = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEvent.participantId) {
            toast.error("Please select a participant for the meeting.");
            return;
        }
        const dataToSend: NewMeetingData = {
            title: newEvent.title,
            start: newEvent.start,
            end: newEvent.end,
            participantIds: [newEvent.participantId],
        };
        createMeetingMutation.mutate(dataToSend);
    };

    const handleRespondToMeeting = (status: 'accepted' | 'rejected') => {
        if (!selectedMeeting) return;
        respondMutation.mutate({ id: selectedMeeting._id, status });
    };

    const openModal = () => setIsModalOpen(true);
    const closeAndResetModal = () => {
        setIsModalOpen(false);
        setNewEvent({ title: '', start: initialStartTime, end: initialEndTime, participantId: '' });
    };

    if (!currentUser) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Meeting Calendar</h1>
                    <p className="text-gray-600">Schedule and manage your meetings.</p>
                </div>
                <Button className='w-fit' onClick={openModal}>Schedule Meeting</Button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-lg h-[calc(100vh-12rem)]">
                {isLoading ? <p>Loading...</p> :
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        onSelectEvent={handleSelectEvent}
                        className="modern-calendar"
                    />}
            </div>

            <Modal isOpen={isModalOpen} onRequestClose={closeAndResetModal} style={modalStyles}>
                <h2 className="text-xl font-bold mb-4">New Meeting</h2>
                <form onSubmit={handleCreateMeeting} className="space-y-4">
                    <Input label="Meeting Title" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} required />
                    <div>
                        <label className="block text-sm font-medium mb-1">Start Time</label>
                        <CustomDateTimePicker value={newEvent.start} onChange={date => setNewEvent({ ...newEvent, start: date })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">End Time</label>
                        <CustomDateTimePicker value={newEvent.end} onChange={date => setNewEvent({ ...newEvent, end: date })} />
                    </div>

                    {/* --- NEW PARTICIPANT SELECTOR --- */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Select Participant</label>
                        <select
                            value={newEvent.participantId}
                            onChange={e => setNewEvent({ ...newEvent, participantId: e.target.value })}
                            required
                            className="w-full border-gray-300 rounded-md p-2 bg-white"
                        >
                            <option value="" disabled>-- Choose a Connection --</option>
                            {connections.map(person => (
                                <option key={person._id} value={person._id}>
                                    {person.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={closeAndResetModal}>Cancel</Button>
                        <Button type="submit" isLoading={createMeetingMutation.isPending}>Schedule</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDetailModalOpen} onRequestClose={closeDetailModal} style={modalStyles}>
                {selectedMeeting && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">{selectedMeeting.title}</h2>

                        <div className="text-gray-600 space-y-2">
                            <div className="flex items-center">
                                <Clock size={16} className="mr-2" />
                                <span>{format(new Date(selectedMeeting.start), 'PPP p')} - {format(new Date(selectedMeeting.end), 'p')}</span>
                            </div>
                            <div className="flex items-center">
                                <Users size={16} className="mr-2" />
                                <span>With: {selectedMeeting.participants.map(p => p.name).join(', ')}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="mr-2">Status:</span>
                                <Badge>{selectedMeeting.status}</Badge>
                            </div>
                        </div>

                        {(() => {
                            const myResponse = selectedMeeting.participantResponses.find(p => p.userId === currentUser._id);
                            const isOrganizer = selectedMeeting.organizer._id === currentUser._id;

                            return (
                                <div className="flex flex-wrap justify-end gap-2 pt-4 border-t">
                                    <Button variant="outline" onClick={closeDetailModal}>Close</Button>

                                    {/* Accept/Decline for invitees with pending status */}
                                    {myResponse?.status === 'pending' && !isOrganizer && (
                                        <>
                                            <Button variant="error" onClick={() => handleRespondToMeeting('rejected')} isLoading={respondMutation.isPending}>Decline</Button>
                                            <Button variant="success" onClick={() => handleRespondToMeeting('accepted')} isLoading={respondMutation.isPending}>Accept</Button>
                                        </>
                                    )}

                                    {/* Delete for the organizer */}
                                    {isOrganizer && (
                                        <Button variant="error" onClick={handleDeleteMeeting} isLoading={deleteMeetingMutation.isPending}>
                                            Delete Meeting
                                        </Button>
                                    )}

                                    {/* --- CONSOLIDATED & FUNCTIONAL Join Button --- */}
                                    {<Button
                                        onClick={handleJoinMeeting}
                                        disabled={selectedMeeting.status !== 'confirmed'}
                                    >
                                        Join the meeting
                                    </Button>}
                                </div>
                            );
                        })()}

                    </div>
                )}
            </Modal>
        </div>
    );
};