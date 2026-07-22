import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { 
    MapPin, 
    ArrowLeft, 
    User, 
    Mail, 
    Lock, 
    Camera, 
    CheckCircle, 
    AlertCircle, 
    Loader2,
    Search
} from 'lucide-react';

export default function Profile() {
    const { user, login } = useContext(AuthContext);
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [profilePicture, setProfilePicture] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerRef = useRef(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        setUsername(user.username || '');
        setEmail(user.email || '');
        setLatitude(user.latitude || 9.03);
        setLongitude(user.longitude || 38.74);
        setProfilePicture(user.profilePicture || '');
    }, [user, navigate]);

    useEffect(() => {
        if (!mapInstance.current && mapRef.current && window.L && latitude && longitude) {
            // Leaflet Icon workaround
            delete window.L.Icon.Default.prototype._getIconUrl;
            window.L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            mapInstance.current = window.L.map(mapRef.current).setView([latitude, longitude], 12);

            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(mapInstance.current);

            // Initial marker
            markerRef.current = window.L.marker([latitude, longitude], { draggable: true }).addTo(mapInstance.current);
            
            markerRef.current.on('dragend', (event) => {
                const marker = event.target;
                const position = marker.getLatLng();
                setLatitude(position.lat);
                setLongitude(position.lng);
            });

            mapInstance.current.on('click', (e) => {
                const { lat, lng } = e.latlng;
                setLatitude(lat);
                setLongitude(lng);
                markerRef.current.setLatLng(e.latlng);
            });
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                markerRef.current = null;
            }
        };
    }, [latitude, longitude]);

    const handleSearchLocation = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const newLat = parseFloat(lat);
                const newLng = parseFloat(lon);
                setLatitude(newLat);
                setLongitude(newLng);

                if (mapInstance.current) {
                    mapInstance.current.setView([newLat, newLng], 14);
                    if (markerRef.current) {
                        markerRef.current.setLatLng([newLat, newLng]);
                    }
                }
            } else {
                alert("Place not found. Please try a different query.");
            }
        } catch (e) {
            console.error("Geocoding failed", e);
        } finally {
            setSearching(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setError('');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setProfilePicture(response.data.fileDownloadUri);
        } catch (err) {
            console.error("Profile picture upload failed", err);
            setError("Failed to upload profile picture.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        setError('');

        try {
            const response = await api.put(`/user/profile/${user.username}`, {
                username,
                email,
                password: password || null,
                latitude,
                longitude,
                profilePicture
            });

            login(response.data);
            setSuccess(true);
            setPassword('');
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-teal-500 selection:text-slate-900">
            {/* Header with Navigation option */}
            <header className="border-b border-slate-900 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link 
                            to="/dashboard" 
                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Back to Dashboard</span>
                        </Link>
                    </div>
                    <span className="font-bold text-base tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                        My Profile Settings
                    </span>
                    <Link to="/" className="text-xs text-slate-450 hover:text-slate-200 transition font-medium">
                        Back to Landing
                    </Link>
                </div>
            </header>

            <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Left Panel: Profile Picture & Stats */}
                    <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden h-fit">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 to-emerald-500" />
                        
                        {/* Avatar container */}
                        <div className="relative group mt-4 mb-6">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-slate-850 bg-slate-950 flex items-center justify-center relative">
                                {profilePicture ? (
                                    <img 
                                        src={profilePicture} 
                                        alt="Profile avatar" 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center text-teal-400 font-bold text-3xl uppercase">
                                        {username.substring(0, 2)}
                                    </div>
                                )}

                                {uploading && (
                                    <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 text-teal-400 animate-spin" />
                                    </div>
                                )}
                            </div>
                            
                            {/* Upload overlay button */}
                            <label className="absolute bottom-0 right-0 p-2 bg-teal-500 text-slate-950 hover:bg-teal-450 rounded-full cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition">
                                <Camera className="h-4 w-4" />
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageUpload} 
                                    className="hidden" 
                                />
                            </label>
                        </div>

                        <h3 className="font-bold text-lg text-white capitalize">{username}</h3>
                        <p className="text-xs text-teal-400 font-semibold bg-teal-500/5 px-2.5 py-1 rounded-full border border-teal-500/10 mt-1 uppercase tracking-wider">
                            {user.role}
                        </p>
                        
                        {user.sector && (
                            <p className="text-xs text-slate-400 mt-2">
                                Sector: <span className="text-slate-200 capitalize font-medium">{user.sector}</span>
                            </p>
                        )}
                        <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
                            Click the camera icon to upload a custom profile picture. Supported formats: JPG, PNG.
                        </p>
                    </div>

                    {/* Right Panel: Settings Form */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Success Banner */}
                        {success && (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded-xl flex items-start gap-3 text-sm animate-pulse">
                                <CheckCircle className="h-5 w-5 shrink-0 mt-0.5 text-emerald-400" />
                                <div>
                                    <span className="font-semibold block">Profile Saved!</span>
                                    <span>Your profile details have been successfully synchronized.</span>
                                </div>
                            </div>
                        )}

                        {/* Error Banner */}
                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-xl flex items-start gap-3 text-sm">
                                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-400" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-8 shadow-xl">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Username</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                            <input 
                                                type="text" 
                                                required
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-9 pr-4 text-sm text-slate-200 focus:border-teal-500/50 outline-none transition"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                            <input 
                                                type="email" 
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-9 pr-4 text-sm text-slate-200 focus:border-teal-500/50 outline-none transition"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">New Password (leave blank to keep current)</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                        <input 
                                            type="password" 
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-9 pr-4 text-sm text-slate-200 focus:border-teal-500/50 outline-none transition"
                                        />
                                    </div>
                                </div>

                                {/* Living Area map location */}
                                <div className="space-y-3 pt-2">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                                            {user.role === 'ADMIN' ? 'Admin Workspace Location' : 'Living Area / Home Location'}
                                        </label>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Search or drag/click on map to update your primary base of operation</p>
                                    </div>

                                    {/* Place Search overlay inside map frame */}
                                    <div className="relative w-full h-56 rounded-xl border border-slate-850 overflow-hidden" style={{ background: '#020617' }}>
                                        
                                        {/* Place search container */}
                                        <div className="absolute top-3 left-3 z-20 w-72 max-w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2 rounded-xl shadow-lg flex gap-1.5">
                                            <input 
                                                type="text" 
                                                placeholder="Search area (e.g. Paris)..." 
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleSearchLocation();
                                                    }
                                                }}
                                                className="bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-xs text-slate-100 placeholder-slate-550 focus:border-teal-500/50 outline-none w-full"
                                            />
                                            <button 
                                                type="button"
                                                onClick={handleSearchLocation}
                                                disabled={searching}
                                                className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
                                            >
                                                {searching ? (
                                                    <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Search className="h-3 w-3" />
                                                )}
                                            </button>
                                        </div>

                                        <div ref={mapRef} className="w-full h-full" />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 flex items-center justify-center gap-2 disabled:opacity-55"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Saving Settings...</span>
                                        </>
                                    ) : (
                                        <span>Save Profile Settings</span>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
