import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { MapPin, ArrowLeft, Filter, RefreshCw, Search } from 'lucide-react';

export default function MapPage() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [issues, setIssues] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [loading, setLoading] = useState(false);

    const [latitude, setLatitude] = useState(9.03);
    const [longitude, setLongitude] = useState(38.74);

    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const searchMarkerRef = useRef(null);

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef([]);

    const isWithinEthiopia = (lat, lng) => {
        return lat && lng && lat >= 3 && lat <= 15 && lng >= 33 && lng <= 48;
    };

    useEffect(() => {
        if (user) {
            const userLat = user.latitude;
            const userLng = user.longitude;
            if (isWithinEthiopia(userLat, userLng)) {
                setLatitude(userLat);
                setLongitude(userLng);
            } else {
                setLatitude(9.03);
                setLongitude(38.74);
            }
        }
    }, [user]);

    // Route guards
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    useEffect(() => {
        window.navigateToIssue = (id) => {
            navigate(`/issue/${id}`);
        };
        return () => {
            delete window.navigateToIssue;
        };
    }, [navigate]);

    // Fetch issues
    const fetchIssues = async () => {
        setLoading(true);
        try {
            let response;
            const isCitizen = user?.role === 'USER';
            if (isCitizen && latitude && longitude) {
                // Fetch nearby issues around the selected search center coordinates
                response = await api.get('/feedback/nearby', {
                    params: {
                        lat: latitude,
                        lng: longitude,
                        radiusKm: 15,
                        category: categoryFilter || undefined
                    }
                });
            } else {
                // Fetch all issues or by category
                if (categoryFilter) {
                    response = await api.get(`/feedback`);
                    // Client-side filter
                    const filtered = response.data.filter(item =>
                        item.sector?.toLowerCase() === categoryFilter.toLowerCase() ||
                        item.category?.toLowerCase() === categoryFilter.toLowerCase()
                    );
                    setIssues(filtered);
                    setLoading(false);
                    return;
                } else {
                    response = await api.get('/feedback');
                }
            }
            setIssues(response.data);
        } catch (err) {
            console.error('Error fetching issues:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchLocation = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=et&limit=1`);
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const latitudeVal = parseFloat(lat);
                const longitudeVal = parseFloat(lon);

                setLatitude(latitudeVal);
                setLongitude(longitudeVal);

                if (mapInstance.current) {
                    mapInstance.current.setView([latitudeVal, longitudeVal], 14);

                    // Add or update search center marker
                    if (searchMarkerRef.current) {
                        searchMarkerRef.current.setLatLng([latitudeVal, longitudeVal]);
                    } else {
                        const tempIcon = window.L.divIcon({
                            className: 'custom-search-marker',
                            html: `<div style="background-color: #0d9488; width: 18px; height: 18px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; position: relative;"><div style="background-color: white; width: 6px; height: 6px; border-radius: 50%;"></div></div>`,
                            iconSize: [18, 18],
                            iconAnchor: [9, 9]
                        });
                        searchMarkerRef.current = window.L.marker([latitudeVal, longitudeVal], { icon: tempIcon, draggable: true })
                            .addTo(mapInstance.current);

                        searchMarkerRef.current.on('dragend', (event) => {
                            const marker = event.target;
                            const position = marker.getLatLng();
                            setLatitude(position.lat);
                            setLongitude(position.lng);
                        });
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

    useEffect(() => {
        if (user) {
            fetchIssues();
        }
    }, [categoryFilter, user, latitude, longitude]);

    // Initialize Leaflet Map
    useEffect(() => {
        if (!mapInstance.current && mapRef.current && window.L && user) {
            // Leaflet Icon workaround
            delete window.L.Icon.Default.prototype._getIconUrl;
            window.L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            // Map center defaults (focus on Addis Ababa if user location is outside Ethiopia)
            const defaultLat = (user?.latitude && isWithinEthiopia(user.latitude, user.longitude)) ? user.latitude : 9.03;
            const defaultLng = (user?.longitude && isWithinEthiopia(user.latitude, user.longitude)) ? user.longitude : 38.74;

            mapInstance.current = window.L.map(mapRef.current, {
                zoomControl: false
            }).setView([defaultLat, defaultLng], 12);

            window.L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(mapInstance.current);

            // Invalidate size to ensure clean Leaflet rendering
            setTimeout(() => {
                if (mapInstance.current) {
                    mapInstance.current.invalidateSize();
                }
            }, 100);

            // Create custom icon for the search/center marker so it looks distinct from issue pins
            const centerIcon = window.L.divIcon({
                className: 'custom-center-marker',
                html: `<div style="background-color: #0d9488; width: 18px; height: 18px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; position: relative;"><div style="background-color: white; width: 6px; height: 6px; border-radius: 50%;"></div></div>`,
                iconSize: [18, 18],
                iconAnchor: [9, 9]
            });

            // Initial center marker (draggable)
            searchMarkerRef.current = window.L.marker([defaultLat, defaultLng], { icon: centerIcon, draggable: true })
                .addTo(mapInstance.current)
                .bindPopup(`<span style="color:#0f172a;font-weight:600;font-size:11px;">Search Center (Drag me!)</span>`);

            searchMarkerRef.current.on('dragend', (event) => {
                const marker = event.target;
                const position = marker.getLatLng();
                setLatitude(position.lat);
                setLongitude(position.lng);
            });

            mapInstance.current.on('click', (e) => {
                // Ignore clicks on markers/popups
                if (e.originalEvent.target.closest('.leaflet-marker-icon')) return;

                const { lat, lng } = e.latlng;
                setLatitude(lat);
                setLongitude(lng);

                if (searchMarkerRef.current) {
                    searchMarkerRef.current.setLatLng(e.latlng);
                }
            });
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                searchMarkerRef.current = null;
            }
        };
    }, [user]);

    // Update Map Markers
    useEffect(() => {
        if (mapInstance.current && window.L && issues) {
            // Clear current markers
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];

            // Add new markers
            issues.forEach(issue => {
                if (issue.latitude && issue.longitude) {
                    const marker = window.L.marker([issue.latitude, issue.longitude])
                        .addTo(mapInstance.current)
                        .bindPopup(`
                            <div style="color: #0f172a; padding: 4px; font-family: 'Outfit', sans-serif; min-width: 160px;">
                                <h4 style="margin: 0 0 4px; font-weight: 700; font-size: 13px;">${issue.title}</h4>
                                <p style="margin: 0 0 6px; font-size: 11px; color: #64748b;">Sector: <span style="font-weight: 600; text-transform: capitalize;">${issue.sector || issue.category}</span></p>
                                <button onclick="window.navigateToIssue(${issue.id})" style="display: block; width: 100%; border: none; background: #0d9488; color: white; text-align: center; padding: 5px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; transition: opacity 0.2s;">
                                    View Discussion
                                </button>
                            </div>
                        `);
                    markersRef.current.push(marker);
                }
            });

            // Sync search center marker position if it exists when coordinates change externally
            if (searchMarkerRef.current) {
                searchMarkerRef.current.setLatLng([latitude, longitude]);
            }
        }
    }, [issues, latitude, longitude]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-teal-500 selection:text-slate-900">
            {/* Header */}
            <header className="border-b border-slate-900 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/dashboard"
                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <span className="font-bold text-lg text-white">Search Issues</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchIssues}
                            disabled={loading}
                            className="p-2 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white border border-slate-850 transition disabled:opacity-40"
                            title="Refresh markers"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Content area: Split filters and map */}
            <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
                {/* Sidebar Filter Panel */}
                <aside className="w-full md:w-80 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-teal-400 font-semibold border-b border-slate-800 pb-3">
                            <Filter className="h-4 w-4" />
                            <span>Filters & Settings</span>
                        </div>

                        {/* Sector dropdown filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Sector / Category</label>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-3 text-sm text-slate-200 focus:border-teal-500/50 outline-none transition"
                            >
                                <option value="">All Sectors</option>
                                <option value="electricity">Electricity</option>
                                <option value="transport">Transport</option>
                                <option value="water">Water</option>
                                <option value="sanitation">Sanitation</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Local Proximity Info Indicator */}
                        {user?.role === 'USER' && (
                            <div className="p-4 bg-teal-500/5 border border-teal-500/10 rounded-xl space-y-1">
                                <h4 className="text-xs font-bold text-teal-400">Local Area Focus Active</h4>
                                <p className="text-[10px] text-slate-400 leading-relaxed">
                                    Displaying reported community issues within 15km of your registered location. Drag the center marker to search other regions.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 p-4 bg-teal-500/5 border border-teal-500/10 rounded-xl text-xs text-slate-400 leading-relaxed hidden md:block">
                        <strong>Quick Tip:</strong> Click on any marker pin on the map to show a popup. Click "View Discussion" to access the real-time chat with administrators.
                    </div>
                </aside>

                {/* Map Container */}
                <main className="flex-grow min-h-[400px] md:min-h-0 relative z-10 flex flex-col">
                    {/* Place search input container (static, directly above map container) */}
                    <div className="p-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Select Location</span>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Search city, street or neighborhood..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearchLocation();
                                }}
                                className="flex-grow bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-650 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition outline-none"
                            />
                            <button
                                onClick={handleSearchLocation}
                                disabled={searching}
                                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 disabled:opacity-50"
                            >
                                {searching ? (
                                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Search className="h-4 w-4" />
                                        <span>Search</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div ref={mapRef} className="flex-grow w-full h-full relative" style={{ background: '#020617' }} />
                </main>
            </div>
        </div>
    );
}
