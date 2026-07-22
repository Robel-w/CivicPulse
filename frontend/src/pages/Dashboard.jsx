import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { MapPin, Search, PlusCircle, Bell, LogOut, ShieldAlert, MessageSquare, Calendar, ChevronRight } from 'lucide-react';

export default function Dashboard() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [involvedIssues, setInvolvedIssues] = useState([]);
    const [loadingInvolved, setLoadingInvolved] = useState(false);

    // Route guards
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    useEffect(() => {
        if (!user) return;
        setLoadingInvolved(true);
        api.get('/feedback/involved')
            .then(res => {
                // Sort by newest first
                const sorted = (res.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setInvolvedIssues(sorted);
            })
            .catch(err => {
                console.error("Failed to fetch involved issues", err);
            })
            .finally(() => {
                setLoadingInvolved(false);
            });
    }, [user]);

    if (!user) return null;

    const isAdmin = user.role === 'ADMIN';

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-slate-900">
            {/* Header */}
            <header className="border-b border-slate-900 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-teal-500/10 p-2 rounded-lg border border-teal-500/20 text-teal-400">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-white">CivicPulse</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/profile" className="flex items-center gap-2.5 group">
                            {user.profilePicture ? (
                                <img 
                                    src={user.profilePicture} 
                                    alt={user.username} 
                                    className="w-9 h-9 rounded-full object-cover border border-slate-800 group-hover:border-teal-500 transition shrink-0" 
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-teal-500/10 border border-slate-800 text-teal-400 flex items-center justify-center font-bold text-xs uppercase group-hover:border-teal-500 transition shrink-0">
                                    {user.username.substring(0, 2)}
                                </div>
                            )}
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-white group-hover:text-teal-400 transition capitalize">{user.username}</p>
                                <p className="text-[10px] text-slate-455 capitalize mt-0.5 leading-none">
                                    {isAdmin ? `Admin — ${user.sector} sector` : 'Citizen'}
                                </p>
                            </div>
                        </Link>
                        <button 
                            onClick={() => {
                                logout();
                                navigate('/');
                            }}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg border border-slate-800 hover:border-rose-500/10 transition"
                            title="Sign Out"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Dashboard Actions */}
            <main className="flex-grow flex items-center justify-center px-6 py-12 relative overflow-hidden">
                {/* Decorative gradients */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-xl w-full text-center space-y-8 relative z-10">
                    <div className="space-y-3">
                        <h2 className="text-3xl font-extrabold text-white">
                            Welcome, <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent capitalize">{user.username}</span>
                        </h2>
                        <p className="text-slate-400 text-sm max-w-sm mx-auto">
                            {isAdmin 
                                ? `Manage public reported alerts in the ${user.sector} sector.`
                                : "Help improve your city. Search current feedback or submit a new report."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4">
                        {/* Option 1: Search Issues (Both User and Admin) */}
                        <Link 
                            to="/map"
                            className="group bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-teal-500/30 rounded-2xl p-6 text-center transition hover:-translate-y-1 shadow-lg shadow-black/40 flex flex-col items-center justify-center gap-4"
                        >
                            <div className="bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20 group-hover:scale-110 p-4 rounded-xl border border-teal-500/20 transition duration-300">
                                <Search className="h-7 w-7" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white group-hover:text-teal-400 transition">Search Issues</h3>
                                <p className="text-slate-400 text-xs mt-1">Browse issues and filter by categories on the map</p>
                            </div>
                        </Link>

                        {/* Option 2: Citizen -> Report Issue, Admin -> Notifications */}
                        {!isAdmin ? (
                            <Link 
                                to="/report"
                                className="group bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-teal-500/30 rounded-2xl p-6 text-center transition hover:-translate-y-1 shadow-lg shadow-black/40 flex flex-col items-center justify-center gap-4"
                            >
                                <div className="bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-110 p-4 rounded-xl border border-emerald-500/20 transition duration-300">
                                    <PlusCircle className="h-7 w-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white group-hover:text-emerald-400 transition">Report Issue</h3>
                                    <p className="text-slate-400 text-xs mt-1">Submit feedback with a pin location and an image</p>
                                </div>
                            </Link>
                        ) : (
                            <Link 
                                to="/admin/notifications"
                                className="group bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-teal-500/30 rounded-2xl p-6 text-center transition hover:-translate-y-1 shadow-lg shadow-black/40 flex flex-col items-center justify-center gap-4"
                            >
                                <div className="bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:scale-110 p-4 rounded-xl border border-indigo-500/20 transition duration-300">
                                    <Bell className="h-7 w-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition">Notifications</h3>
                                    <p className="text-slate-400 text-xs mt-1">View alerts reported within the {user.sector} sector</p>
                                </div>
                            </Link>
                        )}
                    </div>

                    {/* My Discussions Section */}
                    <div className="border-t border-slate-900 pt-8 text-left space-y-4">
                        <h3 className="font-bold text-lg text-white flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-teal-400" />
                            <span>My Involved Discussions</span>
                        </h3>
                        {loadingInvolved ? (
                            <div className="flex items-center gap-2 py-4 justify-center text-sm text-slate-500">
                                <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                                <span>Loading your discussions...</span>
                            </div>
                        ) : involvedIssues.length === 0 ? (
                            <p className="text-sm text-slate-500 py-4 text-center border border-dashed border-slate-850 rounded-xl bg-slate-900/10">
                                You haven't reported or participated in any discussions yet.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-1">
                                {involvedIssues.map(issue => (
                                    <div 
                                        key={issue.id}
                                        onClick={() => navigate(`/issue/${issue.id}`)}
                                        className="bg-slate-900 hover:bg-slate-850/80 border border-slate-850 rounded-xl p-4 transition cursor-pointer flex justify-between items-center group duration-200"
                                    >
                                        <div className="space-y-1 min-w-0 flex-grow pr-3">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-teal-500/10 text-teal-400 uppercase border border-teal-500/20">
                                                    {issue.status || 'OPEN'}
                                                </span>
                                                <span className="text-[10px] text-slate-500 capitalize">{issue.sector || issue.category}</span>
                                            </div>
                                            <h4 className="font-bold text-sm text-white truncate group-hover:text-teal-400 transition">{issue.title}</h4>
                                            <p className="text-xs text-slate-450 line-clamp-1">{issue.description}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-650 group-hover:text-teal-400 transition shrink-0" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-950 py-6 text-center text-xs text-slate-500 bg-slate-950/20">
                <p>&copy; {new Date().getFullYear()} CivicPulse. All rights reserved.</p>
            </footer>
        </div>
    );
}
