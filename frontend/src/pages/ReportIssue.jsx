import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { MapPin, ArrowLeft, Image as ImageIcon, CheckCircle, Loader2, AlertCircle, Trash2, Search } from 'lucide-react';

export default function ReportIssue() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Steps state
    const [step, setStep] = useState(1); // 1: Map Picker, 2: Details Form
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);

    // Form fields state
    const [title, setTitle] = useState('');
    const [sector, setSector] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    // Route guards
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    // Initialize Map Picker in Step 1
    useEffect(() => {
        if (step === 1 && !mapInstance.current && mapRef.current && window.L) {
            // Leaflet Icon workaround
            delete window.L.Icon.Default.prototype._getIconUrl;
            window.L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            // Map center defaults
            const defaultLat = user?.latitude || 9.03;
            const defaultLng = user?.longitude || 38.74;

            mapInstance.current = window.L.map(mapRef.current, {
                zoomControl: false
            }).setView([defaultLat, defaultLng], 12);

            window.L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(mapInstance.current);

            // Click listener to set location
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

            // Trigger reflow to fix rendering glitches
            setTimeout(() => {
                if (mapInstance.current) {
                    mapInstance.current.invalidateSize();
                }
            }, 100);
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                markerRef.current = null;
            }
        };
    }, [step, user]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!latitude || !longitude) {
            setError('Please pick a location on the map first.');
            setStep(1);
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Register the issue
            const payload = {
                title,
                category: sector, // Match categories used in mapPage
                sector,
                description,
                latitude,
                longitude
            };

            const response = await api.post('/feedback', payload);
            const feedbackId = response.data.id;

            // 2. Upload image if selected
            if (imageFile) {
                const formData = new FormData();
                formData.append('file', imageFile);

                await api.post('/files/upload', formData, {
                    params: { feedbackId },
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }

            // Redirect to details page
            navigate(`/issue/${feedbackId}`);
        } catch (err) {
            console.error('Error reporting issue:', err);
            setError(err.response?.data?.message || 'Failed to submit issue. Please try again.');
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-teal-500 selection:text-slate-900">
            {/* Header */}
            <header className="border-b border-slate-900 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/dashboard"
                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <span className="font-bold text-lg text-white">Report New Issue</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${step === 1 ? 'bg-teal-400' : 'bg-slate-700'}`} />
                        <span className={`h-2 w-2 rounded-full ${step === 2 ? 'bg-teal-400' : 'bg-slate-700'}`} />
                        <span className="text-xs text-slate-400 ml-1">Step {step} of 2</span>
                    </div>
                </div>
            </header>

            {/* Error Banner */}
            {error && (
                <div className="max-w-xl mx-auto w-full mt-4 px-6">
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-start gap-3 text-sm">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Step Content */}
            <main className="flex-grow flex flex-col items-center justify-center p-6">
                {step === 1 ? (
                    /* Step 1: Map Picker */
                    <div className="w-full max-w-3xl flex flex-col h-[75vh] bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl relative">
                        <div className="p-4 border-b border-slate-800 bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
                            <div>
                                <h3 className="font-bold text-base text-white">Select Location</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Click on the map to pin the issue location.</p>
                            </div>
                            {latitude && longitude ? (
                                <div className="text-xs text-teal-400 font-semibold bg-teal-500/10 border border-teal-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fadeIn">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Location pinned! ({latitude.toFixed(4)}, {longitude.toFixed(4)})</span>
                                </div>
                            ) : (
                                <div className="text-xs text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                                    No location selected
                                </div>
                            )}
                        </div>

                        {/* Place search input (static, exactly under select location header) */}
                        <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/45 flex gap-2 w-full shrink-0">
                            <input
                                type="text"
                                placeholder="Search location (e.g. city, street)..."
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

                        {/* Leaflet map picker */}
                        <div className="flex-grow relative">
                            <div ref={mapRef} className="w-full h-full" style={{ background: '#020617' }} />
                        </div>

                        {/* Continue Button */}
                        <div className="p-4 border-t border-slate-800 bg-slate-900 text-right shrink-0">
                            <button
                                onClick={() => setStep(2)}
                                disabled={!latitude || !longitude}
                                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition disabled:opacity-40 disabled:pointer-events-none hover:-translate-y-0.5"
                            >
                                Continue to Details
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Step 2: Details Form */
                    <div className="w-full max-w-xl bg-slate-900 border border-slate-850 rounded-2xl p-8 shadow-2xl relative">
                        <h3 className="font-bold text-xl text-white mb-2">Issue Details</h3>
                        <p className="text-xs text-slate-400 mb-6">Describe the issue and add a photo so administrators can assess it.</p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Brief summary (e.g. Broken streetlight)"
                                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder-slate-600 focus:border-teal-500/50 outline-none transition"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Sector / Category</label>
                                <select
                                    required
                                    value={sector}
                                    onChange={(e) => setSector(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3 px-3.5 text-sm text-slate-200 focus:border-teal-500/50 outline-none transition"
                                >
                                    <option value="" disabled>Select sector</option>
                                    <option value="electricity">Electricity</option>
                                    <option value="transport">Transport</option>
                                    <option value="water">Water</option>
                                    <option value="sanitation">Sanitation</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Explain the issue in detail..."
                                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder-slate-600 focus:border-teal-500/50 outline-none transition resize-none"
                                />
                            </div>

                            {/* Image Upload Area */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Photo Attachment</label>
                                {!imagePreview ? (
                                    <div className="border border-dashed border-slate-800 hover:border-teal-500/40 rounded-xl p-6 text-center cursor-pointer transition bg-slate-950/40 relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        />
                                        <ImageIcon className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                                        <p className="text-xs text-slate-400 font-semibold">Click to upload an image</p>
                                        <p className="text-[10px] text-slate-650 mt-1">PNG, JPG or WEBP up to 5MB</p>
                                    </div>
                                ) : (
                                    <div className="border border-slate-850 rounded-xl p-3 bg-slate-950 relative flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={imagePreview}
                                                alt="Upload Preview"
                                                className="w-16 h-16 object-cover rounded-lg border border-slate-800"
                                            />
                                            <div>
                                                <p className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">
                                                    {imageFile?.name}
                                                </p>
                                                <p className="text-[10px] text-slate-500">
                                                    {(imageFile?.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 border border-slate-800 hover:border-rose-500/10 rounded-lg transition"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center justify-between pt-4 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-350 px-5 py-3 rounded-xl transition"
                                >
                                    Back to Map
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-grow bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Submitting Issue...</span>
                                        </>
                                    ) : (
                                        <span>Submit Report</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}
