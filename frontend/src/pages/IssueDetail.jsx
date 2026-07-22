import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Send, User, Clock, ArrowLeft, MapPin, ShieldAlert, MessageSquare, Image as ImageIcon, Mic, Loader2 } from 'lucide-react';
import api from '../services/api';
import webSocketService from '../services/websocket';
import { AuthContext } from '../context/AuthContext';

export default function IssueDetail() {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [issue, setIssue] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState('');

    const messagesEndRef = useRef(null);
    const mapRef = useRef(null);
    const mapInstance = useRef(null);

    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [uploadingFile, setUploadingFile] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerIntervalRef = useRef(null);
    const imageInputRef = useRef(null);

    // Audio recording functions
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunksRef.current = [];
            
            const options = { mimeType: 'audio/webm' };
            let recorder;
            try {
                recorder = new MediaRecorder(stream, options);
            } catch (e) {
                recorder = new MediaRecorder(stream);
            }

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());

                if (audioChunksRef.current.length > 0) {
                    await uploadAudioFile(audioBlob);
                }
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Microphone access denied or error:", err);
            alert("Could not access microphone. Please grant permission.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerIntervalRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            audioChunksRef.current = [];
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerIntervalRef.current);
        }
    };

    const uploadAudioFile = async (blob) => {
        setUploadingFile(true);
        try {
            const file = new File([blob], `voice_${Date.now()}.webm`, { type: blob.type });
            const formData = new FormData();
            formData.append('file', file);
            formData.append('feedbackId', id);

            const res = await api.post('/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data && res.data.fileDownloadUri) {
                webSocketService.sendMessage('/app/chat.send', {
                    feedbackId: id,
                    sender: user.username,
                    content: `[VOICE]${res.data.fileDownloadUri}`
                });
            }
        } catch (err) {
            console.error("Failed to upload voice message:", err);
            alert("Failed to send voice message.");
        } finally {
            setUploadingFile(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingFile(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('feedbackId', id);

            const res = await api.post('/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data && res.data.fileDownloadUri) {
                webSocketService.sendMessage('/app/chat.send', {
                    feedbackId: id,
                    sender: user.username,
                    content: `[PHOTO]${res.data.fileDownloadUri}`
                });
            }
        } catch (err) {
            console.error("Failed to upload photo:", err);
            alert("Failed to send photo.");
        } finally {
            setUploadingFile(false);
            if (imageInputRef.current) imageInputRef.current.value = '';
        }
    };

    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, []);

    // Route guards
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    // Fetch issue details & connect websockets
    useEffect(() => {
        if (!user) return;

        const fetchIssue = async () => {
            try {
                const res = await api.get(`/feedback/${id}`);
                setIssue(res.data);
                setMessages(res.data.messages || []);
            } catch (err) {
                console.error("Failed to fetch issue details", err);
                setError('Failed to load issue details.');
            }
        };
        fetchIssue();

        // WebSocket Connection for real-time messages
        webSocketService.connect(() => {
            webSocketService.subscribe(`/topic/feedback/${id}`, (message) => {
                setMessages((prev) => [...prev, message]);
            });
        }, (err) => {
            console.error('STOMP connection error:', err);
        });

        return () => {
            webSocketService.disconnect();
        };
    }, [id, user]);

    // Initialize Leaflet Map once issue data is available
    useEffect(() => {
        if (issue && mapRef.current && window.L && !mapInstance.current) {
            delete window.L.Icon.Default.prototype._getIconUrl;
            window.L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            mapInstance.current = window.L.map(mapRef.current, {
                zoomControl: false,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false
            }).setView([issue.latitude, issue.longitude], 14);

            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(mapInstance.current);

            window.L.marker([issue.latitude, issue.longitude]).addTo(mapInstance.current);
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [issue]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        webSocketService.sendMessage('/app/chat.send', {
            feedbackId: id,
            sender: user.username,
            content: newMessage
        });
        setNewMessage('');
    };

    if (!user) return null;
    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
                <div className="text-center space-y-4 max-w-sm">
                    <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
                    <h3 className="font-bold text-lg">Error Loading Workspace</h3>
                    <p className="text-slate-400 text-sm">{error}</p>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="bg-slate-900 border border-slate-800 hover:bg-slate-850 px-6 py-2.5 rounded-xl font-medium transition text-xs"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!issue) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm">Opening workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-slate-900 h-screen overflow-hidden">
            {/* Header */}
            <header className="border-b border-slate-900 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 shrink-0">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div>
                            <span className="font-bold text-base text-white truncate max-w-[200px] block sm:max-w-none">
                                {issue.title}
                            </span>
                            <span className="text-xs text-slate-450 block -mt-1 font-medium capitalize">
                                Category: {issue.sector || issue.category}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-400 uppercase border border-teal-500/20">
                            {issue.status || 'OPEN'}
                        </span>
                        <Link 
                            to="/dashboard"
                            className="text-xs text-slate-400 hover:text-white transition font-medium hidden sm:block border-l border-slate-800 pl-3"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>
            </header>

            {/* Split panels container */}
            <div className="flex-grow flex flex-col lg:flex-row overflow-hidden max-w-7xl mx-auto w-full px-6 py-6 gap-6">
                {/* Left Panel: Context, Map, and Image */}
                <aside className="w-full lg:w-96 flex flex-col gap-5 overflow-y-auto shrink-0 pr-1 select-none pb-4">
                    {/* Details Card */}
                    <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 space-y-4">
                        <div className="space-y-1.5">
                            <h3 className="font-bold text-sm text-slate-350 uppercase tracking-wider">Description</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">{issue.description}</p>
                        </div>

                        <div className="space-y-2 border-t border-slate-800/80 pt-4 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Reporter</span>
                                <span className="font-semibold text-slate-300 flex items-center gap-1">
                                    <User size={13} className="text-teal-400" />
                                    {issue.username}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Reported Date</span>
                                <span className="font-semibold text-slate-300 flex items-center gap-1">
                                    <Clock size={13} className="text-teal-400" />
                                    {new Date(issue.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Image Attachment Card */}
                    {issue.imageUrl && (
                        <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-2 flex flex-col">
                            <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-xs border-b border-slate-800 pb-2">
                                <ImageIcon className="h-4 w-4 text-teal-400" />
                                <span>Attached Photo</span>
                            </div>
                            <img 
                                src={issue.imageUrl} 
                                alt={issue.title}
                                className="w-full h-44 object-cover rounded-lg border border-slate-800 mt-1 hover:scale-[1.01] transition duration-300 cursor-zoom-in"
                                onClick={() => window.open(issue.imageUrl, '_blank')}
                            />
                        </div>
                    )}

                    {/* Map Pinned Card */}
                    <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-2 flex flex-col">
                        <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-xs border-b border-slate-800 pb-2">
                            <MapPin className="h-4 w-4 text-teal-400" />
                            <span>Pinned Location</span>
                        </div>
                        <div ref={mapRef} className="w-full h-36 rounded-lg border border-slate-800 overflow-hidden relative z-10" />
                        <div className="text-[10px] text-slate-500 text-center font-medium">
                            Coordinates: {issue.latitude.toFixed(5)}, {issue.longitude.toFixed(5)}
                        </div>
                    </div>
                </aside>

                {/* Right Panel: Discussion Room */}
                <main className="flex-grow bg-slate-900 border border-slate-850 rounded-xl flex flex-col overflow-hidden h-full">
                    {/* Live discussion header */}
                    <div className="p-4 border-b border-slate-850 bg-slate-950/20 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-4.5 w-4.5 text-teal-400" />
                            <h3 className="font-bold text-sm text-white">Live Discussion</h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                            STOMP LIVE
                        </div>
                    </div>

                    {/* Chat Messages List */}
                    <div className="flex-grow p-5 overflow-y-auto space-y-4 bg-slate-950/10 flex flex-col">
                        {messages.length === 0 ? (
                            <div className="text-center my-auto py-8 text-slate-500 text-xs">
                                No messages in this room yet. Start the conversation below!
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                const isMe = user && msg.sender === user.username;
                                return (
                                    <div 
                                        key={msg.id || idx} 
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`flex gap-3 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${isMe ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                                                {msg.sender.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                {!isMe && <div className="text-[10px] text-slate-500 ml-1 mb-0.5 font-medium">{msg.sender}</div>}
                                                
                                                {msg.content.startsWith('[PHOTO]') ? (
                                                    <div className={`p-1.5 rounded-2xl border ${isMe ? 'bg-slate-900 border-teal-500/25 rounded-tr-none' : 'bg-slate-800 border-slate-700 rounded-tl-none'} overflow-hidden shadow-sm`}>
                                                        <img 
                                                            src={msg.content.replace('[PHOTO]', '')} 
                                                            alt="Shared photo" 
                                                            className="max-w-[240px] max-h-[180px] object-cover rounded-xl border border-slate-800 hover:scale-[1.01] transition duration-200 cursor-zoom-in"
                                                            onClick={() => window.open(msg.content.replace('[PHOTO]', ''), '_blank')}
                                                        />
                                                    </div>
                                                ) : msg.content.startsWith('[VOICE]') ? (
                                                    <div className={`px-3 py-2.5 rounded-2xl border flex flex-col gap-1.5 ${isMe ? 'bg-slate-900 border-teal-500/25 rounded-tr-none' : 'bg-slate-800 border-slate-700 rounded-tl-none'} shadow-sm`}>
                                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-450">
                                                            <Mic size={12} className="text-teal-400 animate-pulse" />
                                                            <span>Voice Message</span>
                                                        </div>
                                                        <audio 
                                                            src={msg.content.replace('[VOICE]', '')} 
                                                            controls 
                                                            className="w-[200px] h-8 outline-none rounded-lg bg-slate-950/60 custom-audio-player" 
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-medium rounded-tr-none' : 'bg-slate-800 border border-slate-750 text-slate-200 rounded-tl-none shadow-sm'}`}>
                                                        {msg.content}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input form */}
                    <div className="p-4 bg-slate-950/20 border-t border-slate-850 shrink-0 space-y-2">
                        {/* Hidden Inputs */}
                        <input
                            type="file"
                            accept="image/*"
                            ref={imageInputRef}
                            className="hidden"
                            onChange={handlePhotoUpload}
                        />

                        {/* Uploading/Recording indicators */}
                        {uploadingFile && (
                            <div className="text-[10px] text-teal-400 flex items-center gap-1.5 px-1 animate-pulse font-medium">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Uploading attachment...</span>
                            </div>
                        )}

                        {isRecording && (
                            <div className="text-[10px] text-rose-500 flex items-center justify-between px-1 bg-rose-500/5 border border-rose-500/10 p-2 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                                    <span className="font-semibold">Recording Voice ({recordingTime}s)</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={cancelRecording}
                                        className="text-slate-400 hover:text-white px-2 py-0.5 text-[9px] hover:bg-slate-800 rounded transition font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={stopRecording}
                                        className="text-rose-400 hover:text-rose-350 font-bold px-2 py-0.5 text-[9px] hover:bg-rose-500/10 rounded transition"
                                    >
                                        Send Voice
                                    </button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                            {/* Attach Image button */}
                            {!isRecording && (
                                <button
                                    type="button"
                                    onClick={() => imageInputRef.current?.click()}
                                    disabled={uploadingFile}
                                    className="p-3 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition flex items-center justify-center shrink-0 border border-slate-800/80 hover:border-slate-700 bg-slate-950/40"
                                    title="Share Photo"
                                >
                                    <ImageIcon size={16} />
                                </button>
                            )}

                            {/* Voice recording trigger button */}
                            {!isRecording && (
                                <button
                                    type="button"
                                    onClick={startRecording}
                                    disabled={uploadingFile}
                                    className="p-3 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition flex items-center justify-center shrink-0 border border-slate-800/80 hover:border-slate-700 bg-slate-950/40"
                                    title="Record Voice"
                                >
                                    <Mic size={16} />
                                </button>
                            )}

                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                disabled={isRecording || uploadingFile}
                                placeholder={isRecording ? "Recording..." : "Type a message..."}
                                className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-650 focus:border-teal-500/50 outline-none transition disabled:opacity-50"
                            />
                            <button 
                                type="submit" 
                                disabled={!newMessage.trim() || isRecording || uploadingFile}
                                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 p-3 rounded-xl transition disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center shrink-0 font-bold"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}
