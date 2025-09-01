// src/pages/call/VideoCallPage.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

type AspectRatio = 'landscape' | 'portrait' | 'square' | 'unknown';

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

    const [localAspectRatio, setLocalAspectRatio] = useState<AspectRatio>('unknown');
    const [remoteAspectRatio, setRemoteAspectRatio] = useState<AspectRatio>('unknown');

    // --- THIS IS THE CORE CLEANUP FUNCTION ---

    const setupPeerConnection = useCallback((targetSocketId: string) => {
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
    }, [socket]);

    const createOffer = useCallback(async (targetSocketId: string) => {
        const pc = setupPeerConnection(targetSocketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket?.emit('offer', { target: targetSocketId, sdp: pc.localDescription, name: currentUser?.name });
    }, [socket, setupPeerConnection, currentUser]);

    const createAnswer = useCallback(async (offer: { socketId: string; sdp: RTCSessionDescriptionInit }) => {
        const pc = setupPeerConnection(offer.socketId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket?.emit('answer', { target: offer.socketId, sdp: pc.localDescription });
    }, [socket, setupPeerConnection]);

    const cleanup = useCallback(() => {
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
    }, [socket, meetingId]);

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
        const handleOffer = async (offer: { socketId: string; sdp: RTCSessionDescriptionInit; name: string; }) => {
            console.log(`Received offer from ${offer.name}, creating answer...`);
            setConnectionStatus('Receiving call...');
            setRemoteUser({ socketId: offer.socketId, name: offer.name });
            createAnswer(offer);
        };
        const handleAnswer = async (answer: { sdp: RTCSessionDescriptionInit }) => {
            console.log('Received answer...');
            setConnectionStatus('Connected');
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
            socket.off('user-joined');
            socket.off('user-left');
            socket.off('offer');
            socket.off('answer');
            socket.off('ice-candidate');
            cleanup();
        };
    }, [socket, meetingId, currentUser, location.state, cleanup, createOffer, createAnswer]);

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

    const handleVideoMetadata = (event: React.SyntheticEvent<HTMLVideoElement, Event>, streamType: 'local' | 'remote') => {
        const video = event.currentTarget;
        const { videoWidth, videoHeight } = video;

        if (videoWidth > videoHeight) {
            streamType === 'local' ? setLocalAspectRatio('landscape') : setRemoteAspectRatio('landscape');
        } else if (videoHeight > videoWidth) {
            streamType === 'local' ? setLocalAspectRatio('portrait') : setRemoteAspectRatio('portrait');
        } else {
            streamType === 'local' ? setLocalAspectRatio('square') : setRemoteAspectRatio('square');
        }
    };

    const mainContainerClass = remoteAspectRatio === 'portrait' ? 'flex-col' : 'flex-row';

    return (
        <div className="bg-gray-900 rounded-lg h-[85vh] md:h-[80vh] w-full flex flex-col items-center justify-center p-2 sm:p-4 text-white relative">

            {/* --- RESPONSIVE VIDEO CONTAINER --- */}
            <div className="relative w-full flex-1 flex flex-col md:flex-row gap-2 overflow-hidden">
                {/* Remote Video (Main View) */}
                <div className="w-full h-full bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
                    <video ref={remoteVideoRef} autoPlay playsInline onLoadedMetadata={(e) => handleVideoMetadata(e, 'remote')} className="w-full h-full object-contain" />
                    <div className="absolute top-2 left-2 bg-black bg-opacity-50 p-2 rounded-lg z-10">
                        <p className="text-sm">{remoteUser?.name}</p>
                        <p className="text-xs">{connectionStatus}</p>
                    </div>
                </div>

                {/* Local Video (Picture-in-Picture on Desktop, Stacked on Mobile) */}
                <div className="bg-black rounded-lg overflow-hidden flex-shrink-0 w-full h-1/3 md:w-1/4 md:h-full">
                    <video ref={localVideoRef} autoPlay playsInline muted onLoadedMetadata={(e) => handleVideoMetadata(e, 'local')} className="w-full h-full object-contain" />
                </div>
            </div>

            {/* Controls */}
            <div className="flex-shrink-0 flex items-center gap-4 p-3 mt-2">
                <Button onClick={toggleMute} variant={isMuted ? 'error' : 'secondary'} className="rounded-full size-12 sm:size-14">{isMuted ? <MicOff /> : <Mic />}</Button>
                <Button onClick={toggleVideo} variant={isVideoOff ? 'error' : 'secondary'} className="rounded-full size-12 sm:size-14">{isVideoOff ? <VideoOff /> : <Video />}</Button>
                <Button onClick={handleHangUp} variant="error" className="rounded-full size-12 sm:size-14"><PhoneOff /></Button>
            </div>
        </div>
    );
};