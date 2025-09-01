// src/pages/call/CallLobby.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Mic, Video, Phone, MicOff, VideoOff, ArrowLeft, Camera } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const CallLobby: React.FC = () => {
    const { meetingId } = useParams<{ meetingId: string }>();
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
    const [cams, setCams] = useState<MediaDeviceInfo[]>([]);
    const [selectedMic, setSelectedMic] = useState('');
    const [selectedCam, setSelectedCam] = useState('');
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);
    const [hasPermissions, setHasPermissions] = useState(false);

    const getDevices = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioDevices = devices.filter(device => device.kind === 'audioinput');
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setMics(audioDevices);
            setCams(videoDevices);
            setSelectedMic(audioDevices[0]?.deviceId || '');
            setSelectedCam(videoDevices[0]?.deviceId || '');
        } catch (err) {
            console.error("Error enumerating devices:", err);
        }
    };

    useEffect(() => {
        getDevices();
    }, []);

    // This is the new function triggered by user click
    const handleEnableMedia = async () => {
        try {
            // Requesting a dummy stream just to get permissions
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setHasPermissions(true);
            await getDevices(); // Get the full device list now
            // We'll let the useEffect handle setting the actual stream
            stream.getTracks().forEach(track => track.stop()); // Stop the dummy stream
        } catch (err) {
            console.error("Permission denied or error:", err);
            // Optionally show an error message to the user
        }
    };

    useEffect(() => {

        if (!hasPermissions) return;
        const getMedia = async () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
                    video: selectedCam ? { deviceId: { exact: selectedCam } } : true,
                });
                stream.getAudioTracks().forEach(track => track.enabled = isMicOn);
                stream.getVideoTracks().forEach(track => track.enabled = isCamOn);
                setLocalStream(stream);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Failed to get media stream:", err);
            }
        };
        if (selectedCam || selectedMic) {
            getMedia();
        }
        return () => {
            localStream?.getTracks().forEach(track => track.stop());
        }
    }, [hasPermissions, selectedMic, selectedCam, isMicOn, isCamOn]);

    const handleJoinCall = () => {
        // We pass the device IDs and initial mic/cam state in the URL's state
        // This avoids having to request permissions again on the next page
        navigate(`/call/${meetingId}`, {
            state: {
                micId: selectedMic,
                camId: selectedCam,
                isMicOn,
                isCamOn
            }
        });
    };

    return (
        <div className="bg-gray-900 rounded-lg h-full flex flex-col items-center justify-center p-4 text-white">
            {hasPermissions && <h1 className="text-3xl font-bold mb-4">Ready to join your meeting?</h1>}
            <div className="w-full max-w-2xl bg-black rounded-lg overflow-hidden relative aspect-video">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {!hasPermissions && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <Camera size={48} className="mb-4 text-gray-400" />
                        <p className="mb-4">Camera and microphone permissions are required.</p>
                        <Button onClick={handleEnableMedia}>Grant permission</Button>
                    </div>
                )}
                {hasPermissions && !isCamOn && <div className="absolute inset-0 bg-gray-800 flex items-center justify-center"><p>Camera is off</p></div>}
            </div>

            {hasPermissions && (
                <>
                    <div className="mt-6 flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
                        <select value={selectedMic} onChange={e => setSelectedMic(e.target.value)} className="bg-gray-800 border-gray-700 rounded-md p-2 w-full">
                            {mics.map(mic => <option key={mic.deviceId} value={mic.deviceId}>{mic.label}</option>)}
                        </select>
                        <select value={selectedCam} onChange={e => setSelectedCam(e.target.value)} className="bg-gray-800 border-gray-700 rounded-md p-2 w-full">
                            {cams.map(cam => <option key={cam.deviceId} value={cam.deviceId}>{cam.label}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-4 mt-6">
                        <Button onClick={() => setIsMicOn(!isMicOn)} variant={isMicOn ? 'secondary' : 'error'} className="rounded-full w-14 h-14">{isMicOn ? <Mic /> : <MicOff />}</Button>
                        <Button onClick={() => setIsCamOn(!isCamOn)} variant={isCamOn ? 'secondary' : 'error'} className="rounded-full w-14 h-14">{isCamOn ? <Video /> : <VideoOff />}</Button>
                    </div>

                    <div className='mt-8 text-lg flex items-center justify-center gap-4'>
                        <Link to="/calendar">
                            <Button onClick={handleJoinCall}><ArrowLeft className="mr-2" /> Go back</Button>
                        </Link>
                        <Button onClick={handleJoinCall}>
                            <Phone className="mr-2" /> Join Meeting
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};