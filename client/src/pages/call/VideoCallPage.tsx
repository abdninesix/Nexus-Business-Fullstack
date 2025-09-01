// src/pages/call/VideoCallPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

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
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    const [remoteUser, setRemoteUser] = useState<{ socketId: string, name?: string } | null>(null);
    const [connectionStatus, setConnectionStatus] = useState('Waiting for another user to join...');
    const [isMuted, setIsMuted] = useState(location.state?.isMicOn === false);
    const [isVideoOff, setIsVideoOff] = useState(location.state?.isCamOn === false);

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

    const setupPeerConnection = (targetSocketId: string) => {
        if (peerConnectionRef.current) peerConnectionRef.current.close(); // Close existing before creating new

        const pc = new RTCPeerConnection(servers);

        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.emit('ice-candidate', { target: targetSocketId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
                setConnectionStatus('Connected'); // Update status on successful track add
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

    const createOffer = async (targetSocketId: string) => {
        const pc = setupPeerConnection(targetSocketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket?.emit('offer', { target: targetSocketId, sdp: pc.localDescription });
    };

    const createAnswer = async (offer: { socketId: string; sdp: RTCSessionDescriptionInit }) => {
        const pc = setupPeerConnection(offer.socketId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket?.emit('answer', { target: offer.socketId, sdp: pc.localDescription });
    };

    useEffect(() => {
        if (!socket || !meetingId) return;

        const { micId, camId, isMicOn = true, isCamOn = true } = location.state || {};

        // --- All event handlers are defined inside useEffect to capture the correct scope ---

        const handleUserJoined = (data: { socketId: string, name: string }) => {
            console.log(`User ${data.name} joined, creating offer for socket ${data.socketId}`);
            setConnectionStatus('Connecting...');
            setRemoteUser({ socketId: data.socketId, name: data.name });
            createOffer(data.socketId);
        };

        // --- (handleOffer, handleAnswer, handleIceCandidate are now defined outside but called here) ---
        const handleOffer = async (offer: { socketId: string; sdp: RTCSessionDescriptionInit }) => {
            console.log('Received offer, creating answer...');
            createAnswer(offer);
        };
        const handleAnswer = async (answer: { sdp: RTCSessionDescriptionInit }) => {
            console.log('Received answer...');
            await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(answer.sdp));
        };
        const handleIceCandidate = async (event: { candidate: RTCIceCandidateInit }) => {
            if (peerConnectionRef.current && event.candidate) {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(event.candidate));
            }
        };

        const handleUserLeft = () => {
            setConnectionStatus('The other user has left the call.');
            setRemoteUser(null);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            cleanup();
        };

        socket.on('user-joined', handleUserJoined);
        socket.on('user-left', handleUserLeft);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);

        // Get media and join the room
        navigator.mediaDevices.getUserMedia({
            audio: micId ? { deviceId: { exact: micId } } : true,
            video: camId ? { deviceId: { exact: camId } } : true,
        }).then(stream => {
            stream.getAudioTracks().forEach(track => track.enabled = isMicOn);
            stream.getVideoTracks().forEach(track => track.enabled = isCamOn);
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            socket.emit('join-room', { roomId: meetingId, name: currentUser?.name });
        });

        return () => {
            socket.off('user-joined', handleUserJoined);
            socket.off('user-left', handleUserLeft);
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('ice-candidate', handleIceCandidate);
            cleanup();
        };
    }, [socket, meetingId, currentUser]);

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
        <div className="bg-gray-900 h-full flex flex-col items-center justify-center p-4 text-white relative">
            {/* Dynamic Layout: Picture-in-Picture */}
            <div className="w-full h-full bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 p-2 rounded-lg">
                    <p>{remoteUser?.name || 'Remote User'}</p>
                </div>
                {!remoteUser && <div className="absolute text-center"><p className="text-xl">{connectionStatus}</p></div>}
            </div>

            <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-20 right-4 w-48 h-auto bg-black rounded-lg border-2 border-gray-700 object-cover" />

            {/* Controls */}
            <div className="flex items-center gap-4 p-3">
                <Button onClick={toggleMute} variant={isMuted ? 'error' : 'secondary'} className="rounded-full size-14">{isMuted ? <MicOff /> : <Mic />}</Button>
                <Button onClick={toggleVideo} variant={isVideoOff ? 'error' : 'secondary'} className="rounded-full size-14">{isVideoOff ? <VideoOff /> : <Video />}</Button>
                <Button onClick={handleHangUp} variant="error" className="rounded-full size-14"><PhoneOff /></Button>
            </div>
        </div>
    );
};