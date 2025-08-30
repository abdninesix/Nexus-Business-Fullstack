// src/pages/calendar/CalendarPage.tsx
import React, { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from 'react-modal';

import { fetchMeetings, createMeeting, deleteMeeting, Meeting, NewMeetingData } from '../../api/meetings';
import { fetchAllUsers } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CustomDateTimePicker } from '../../components/ui/DateTimePicker';
import { User } from '../../types';
import { Clock, Users, X } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { enUS } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebouce';

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
Modal.setAppElement('#root');

export const CalendarPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    // Set initial end time to be 1 hour after start time
    const initialStartTime = new Date();
    const initialEndTime = new Date(initialStartTime.getTime() + 60 * 60 * 1000);

    const [newEvent, setNewEvent] = useState({ title: '', start: initialStartTime, end: initialEndTime });
    const [selectedParticipants, setSelectedParticipants] = useState<User[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const debouncedUserSearch = useDebounce(userSearch, 300);

    const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
        queryKey: ['meetings'],
        queryFn: fetchMeetings,
    });

    const { data: allUsers = [] } = useQuery<User[]>({
        queryKey: ['allUsers'],
        queryFn: fetchAllUsers,
        enabled: isModalOpen, // Crucial for performance!
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

    const events = useMemo(() => meetings.map(meeting => ({
        title: meeting.title,
        start: new Date(meeting.start),
        end: new Date(meeting.end),
        resource: meeting,
    })), [meetings]);

    const filteredUsers = useMemo(() =>
        allUsers.filter(user =>
            user.name.toLowerCase().includes(debouncedUserSearch.toLowerCase()) &&
            !selectedParticipants.some(p => p._id === user._id) // Don't show already selected users
        ), [debouncedUserSearch, selectedParticipants]
    );

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

    const closeDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedMeeting(null);
    };

    const handleToggleParticipant = (user: User) => {
        setSelectedParticipants(prev =>
            prev.some(p => p._id === user._id)
                ? prev.filter(p => p._id !== user._id)
                // Add new user, but don't allow more than, say, 5 participants for sanity
                : [...prev, user]
        );
    };

    const handleCreateMeeting = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedParticipants.length === 0) {
            toast.error("Please select at least one participant.");
            return;
        }
        const dataToSend: NewMeetingData = {
            ...newEvent,
            participantIds: selectedParticipants.map(p => p._id),
        };
        createMeetingMutation.mutate(dataToSend);
    };

    const openModal = () => setIsModalOpen(true);
    const closeAndResetModal = () => {
        setIsModalOpen(false);
        setNewEvent({ title: '', start: initialStartTime, end: initialEndTime });
        setSelectedParticipants([]);
        setUserSearch('');
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
                        <label className="block text-sm font-medium mb-1">Participants</label>
                        <div className="border rounded-md p-2 space-y-2">
                            {/* Selected Participants Pills */}
                            <div className="flex flex-wrap gap-2">
                                {selectedParticipants.map(p => (
                                    <div key={p._id} className="flex items-center bg-gray-200 rounded-full pl-3 pr-2 py-1 text-sm">
                                        <span>{p.name}</span>
                                        <button type="button" onClick={() => handleToggleParticipant(p)} className="ml-2 text-gray-500 hover:text-gray-800"><X size={14} /></button>
                                    </div>
                                ))}
                            </div>
                            {/* Search Input */}
                            <Input placeholder="Search for users to invite..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                            {/* User List */}
                            <div className="max-h-32 overflow-y-auto">
                                {filteredUsers.map(user => (
                                    <button
                                        type="button"
                                        key={user._id}
                                        onClick={() => handleToggleParticipant(user)}
                                        className="w-full flex items-center p-2 text-left hover:bg-gray-100 rounded-md"
                                    >
                                        <Avatar src={user.avatarUrl} alt={user.name} size="sm" className="mr-3" />
                                        <div>
                                            <p className="text-sm font-medium">{user.name}</p>
                                            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
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
                        </div>

                        {/* Show delete button ONLY if the current user is the organizer */}
                        <div className="flex justify-between sm:justify-end gap-4 pt-4 border-t">
                            {currentUser._id === selectedMeeting.organizer._id && (
                                <Button
                                    variant="error"
                                    onClick={handleDeleteMeeting}
                                    isLoading={deleteMeetingMutation.isPending}
                                >
                                    Delete Meeting
                                </Button>
                            )}
                            <Link to={`/call/${selectedMeeting._id}`}>
                                <Button>Join Meeting</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};