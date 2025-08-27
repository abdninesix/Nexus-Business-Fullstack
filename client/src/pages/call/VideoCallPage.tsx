// src/pages/call/VideoCallPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';

// Configuration for STUN servers (helps browsers find each other)
const servers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export const VideoCallPage: React.FC = () => {
    const { meetingId } = useParams<{ meetingId: string }>();
    const { socket } = useSocket();
    const navigate = useNavigate();

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    // --- THIS IS THE CORE CLEANUP FUNCTION ---
    const cleanup = () => {
        console.log('Running cleanup...');
        // Stop all media tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                console.log(`Stopping track: ${track.kind}`);
                track.stop();
            });
            localStreamRef.current = null;
        }
        // Close the peer connection
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        // If you have a specific "leave-room" event
        if (socket && meetingId) {
            socket.emit('leave-room', meetingId);
        }
    };

    const setupPeerConnection = () => {
        if (peerConnectionRef.current) return peerConnectionRef.current; // Don't create if it exists

        const pc = new RTCPeerConnection(servers);

        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                // This is a bit tricky, we need to know who to send it to.
                // We'll handle this by joining a room and broadcasting.
                socket.emit('ice-candidate', { roomId: meetingId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
                setRemoteStream(event.streams[0]);
            }
        };

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        peerConnectionRef.current = pc;
        return pc;
    };

    useEffect(() => {
        if (!socket || !meetingId) return;

        // --- All event handlers are defined inside useEffect to capture the correct scope ---

        const handleOffer = async (offer: { sdp: RTCSessionDescriptionInit }) => {
            console.log('Received offer...');
            const pc = setupPeerConnection();

            // If we receive an offer while not in a stable state, we might be colliding.
            // A simple politeness check:
            if (pc.signalingState !== 'stable') {
                console.warn('Ignoring incoming offer while not in stable state.');
                return;
            }

            await pc.setRemoteDescription(new RTCSessionDescription(offer.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { roomId: meetingId, sdp: pc.localDescription });
        };

        const handleAnswer = async (answer: { sdp: RTCSessionDescriptionInit }) => {
            console.log('Received answer...');
            const pc = peerConnectionRef.current;
            if (pc && pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(answer.sdp));
            } else {
                console.warn('Ignoring answer in wrong state:', pc?.signalingState);
            }
        };

        const handleIceCandidate = async (event: { candidate: RTCIceCandidateInit }) => {
            const pc = peerConnectionRef.current;
            if (pc && event.candidate) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(event.candidate));
                } catch (e) {
                    console.error('Error adding received ice candidate', e);
                }
            }
        };

        // This event now triggers the offer from the new joiner
        const handleUserJoined = async () => {
            console.log('Another user joined, I will create an offer...');
            const pc = setupPeerConnection();
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('offer', { roomId: meetingId, sdp: pc.localDescription });
        };

        socket.on('user-joined', handleUserJoined);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);

        // Get media and join the room
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                localStreamRef.current = stream;
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
                socket.emit('join-room', meetingId);
            })
            .catch(err => console.error("Failed to get media:", err));

        return () => {
            // Cleanup listeners
            socket.off('user-joined', handleUserJoined);
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('ice-candidate', handleIceCandidate);
            cleanup();
        };
    }, [socket, meetingId]);

    const handleHangUp = () => {
        cleanup();
        navigate('/calendar');
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoOff(!isVideoOff);
        }
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 text-white relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full">
                {/* Local Video */}
                <div className="bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                </div>
                {/* Remote Video */}
                <div className="bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    {!remoteStream && <p className="absolute text-gray-400">Waiting for other user to join...</p>}
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 p-3">
                <Button onClick={toggleMute} variant={isMuted ? 'error' : 'secondary'} className="rounded-full size-14">{isMuted ? <MicOff /> : <Mic />}</Button>
                <Button onClick={toggleVideo} variant={isVideoOff ? 'error' : 'secondary'} className="rounded-full size-14">{isVideoOff ? <VideoOff /> : <Video />}</Button>
                <Button onClick={handleHangUp} variant="error" className="rounded-full size-14"><PhoneOff /></Button>
            </div>
        </div>
    );
};