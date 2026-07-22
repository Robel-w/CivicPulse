import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { MapPin, User, Mail, Lock, CheckCircle, Loader2, AlertCircle, ShieldAlert, Search } from 'lucide-react';

export default function Register() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerRef = useRef(null);

    const handleSearchLocation = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=et&limit=1`);
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
                    } else {
                        markerRef.current = window.L.marker([newLat, newLng], { draggable: true }).addTo(mapInstance.current);
                        markerRef.current.on('dragend', (event) => {
                            const marker = event.target;
                            const position = marker.getLatLng();
                            setLatitude(position.lat);
                            setLongitude(position.lng);
                        });
                    }
                }
            } else {
                alert("Place not found in Ethiopia. Please try a different query.");
            }
        } catch (e) {
            console.error("Geocoding failed", e);
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    useEffect(() => {
        if (!mapInstance.current && mapRef.current && window.L) {
            // Leaflet Icon workaround
            delete window.L.Icon.Default.prototype._getIconUrl;
            window.L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            // Default center
            const defaultLat = 9.03;
            const defaultLng = 38.74;

            mapInstance.current = window.L.map(mapRef.current, {
                zoomControl: false
            }).setView([defaultLat, defaultLng], 11);

            window.L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(mapInstance.current);

            mapInstance.current.on('click', (e) => {
                const { lat, lng } = e.latlng;
                setLatitude(lat);
                setLongitude(lng);

                if (markerRef.current) {
                    markerRef.current.setLatLng(e.latlng);
                } else {
                    markerRef.current = window.L.marker(e.latlng, { draggable: true }).addTo(mapInstance.current);
                    markerRef.current.on('dragend', (event) => {
                        const marker = event.target;
                        const position = marker.getLatLng();
                        setLatitude(position.lat);
                        setLongitude(position.lng);
                    });
                }
            });
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                markerRef.current = null;
            }
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!latitude || !longitude) {
            setError('Please pick your location on the map.');
            return;
        }



        setLoading(true);
        setError('');

        try {
            await api.post('/auth/register', {
                username,
                email,
                password,
                role: 'USER',
                sector: null,
                latitude,
                longitude
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Registration failed. Try a different username/email.');
        } finally {
            setLoading(false);
        }
    };

    return (<div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6 py-12 relative overflow-hidden selection:bg-teal-500 selection:text-slate-900">
        {/* Background glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl shadow-teal-950/10 relative z-10">
            {/* Branding */}
            <div className="text-center space-y-2 mb-8">
                <Link to="/" className="inline-flex items-center gap-2 text-teal-400 font-bold text-xl hover:opacity-90 transition">
                    <MapPin className="h-6 w-6" />
                    <span>CivicPulse</span>
                </Link>
                <p className="text-slate-400 text-sm">Join the platform to report and resolve local issues.</p>
            </div>

            {/* Success Banner */}
            {success && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded-xl flex items-start gap-3 text-sm animate-pulse">
                    <CheckCircle className="h-5 w-5 shrink-0 mt-0.5 text-emerald-400" />
                    <div>
                        <span className="font-semibold block">Registration Successful!</span>
                        <span>Redirecting to the login screen...</span>
                    </div>
                </div>
            )}

            {/* Error Banner */}
            {error && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-start gap-3 text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Username</label>
                    <div className="relative">
                        <User className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                        <input
                            type="text"
                            required
                            minLength={3}
                            maxLength={50}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="choose_username"
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-650 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@domain.com"
                            className="w-full bg-slate-950 border border-slate-855 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-650 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                        <input
                            type="password"
                            required
                            minLength={5}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="minimum 5 characters"
                            className="w-full bg-slate-950 border border-slate-855 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-650 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Living Area / Home Location
                    </label>
                    {latitude && longitude ? (
                        <div className="text-[11px] text-teal-400 font-semibold bg-teal-500/10 border border-teal-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Area selected! ({latitude.toFixed(4)}, {longitude.toFixed(4)})</span>
                        </div>
                    ) : (
                        <div className="text-[11px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                            Click on the map to pin your home area
                        </div>
                    )}

                    {/* Place search input (static, exactly under select location text) */}
                    <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-lg shadow-lg flex gap-1.5 w-full">
                        <input
                            type="text"
                            placeholder="Search city/area..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSearchLocation();
                                }
                            }}
                            className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-[10px] text-slate-100 placeholder-slate-550 focus:border-teal-500/50 outline-none w-full"
                        />
                        <button
                            type="button"
                            onClick={handleSearchLocation}
                            disabled={searching}
                            className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 shrink-0"
                        >
                            {searching ? (
                                <div className="w-2.5 h-2.5 border border-slate-950 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Search className="h-2.5 w-2.5" />
                            )}
                        </button>
                    </div>

                    <div className="relative w-full h-44 rounded-xl border border-slate-850 overflow-hidden" style={{ background: '#020617' }}>
                        <div ref={mapRef} className="w-full h-full relative z-10" />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || success}
                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl transition shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none hover:-translate-y-0.5 active:translate-y-0"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Creating Account...</span>
                        </>
                    ) : (
                        <>
                            <span>Register</span>
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-450 border-t border-slate-800/80 pt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-teal-400 hover:underline font-medium">
                    Sign In
                </Link>
            </div>
        </div>
    </div>
    );
}
