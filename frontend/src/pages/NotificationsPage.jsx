import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { MapPin, ArrowLeft, Clock, Calendar, CheckCircle2, ChevronRight, MessageSquare, AlertTriangle } from 'lucide-react';

export default function NotificationsPage() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Guard route: admin only
    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else if (user.role !== 'ADMIN') {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const fetchSectorIssues = async () => {
        if (!user?.sector) return;
        setLoading(true);
        setError('');
        try {
            const response = await api.get(`/feedback/sector/${user.sector}`);
            // Sort by newest first
            const sorted = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setIssues(sorted);
        } catch (err) {
            console.error('Error fetching sector feedback:', err);
            setError('Failed to load issues for your sector.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.role === 'ADMIN') {
            fetchSectorIssues();
        }
    }, [user]);

    if (!user || user.role !== 'ADMIN') return null;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-slate-900">
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
                        <div>
                            <span className="font-bold text-lg text-white">Notifications Dashboard</span>
                            <span className="text-xs text-teal-400 capitalize block -mt-1 font-medium">
                                Sector: {user.sector}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* List Content */}
            <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-8 relative overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

                {error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-start gap-3 text-sm mb-6">
                        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-400 text-sm">Loading issues in your sector...</p>
                    </div>
                ) : issues.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-slate-850 rounded-2xl bg-slate-900/20 max-w-lg mx-auto mt-6">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                        <h4 className="font-bold text-lg text-white">All Clear!</h4>
                        <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
                            No issues have been reported in the <span className="font-semibold text-teal-400 uppercase">{user.sector}</span> sector yet.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-905">
                            <span className="text-xs font-semibold text-slate-450 uppercase tracking-wider">
                                {issues.length} {issues.length === 1 ? 'Alert' : 'Alerts'} Pending
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {issues.map(issue => (
                                <div 
                                    key={issue.id}
                                    onClick={() => navigate(`/issue/${issue.id}`)}
                                    className="bg-slate-900 hover:bg-slate-850/80 border border-slate-850 hover:border-slate-800 rounded-xl p-5 transition cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:-translate-y-0.5 duration-200"
                                >
                                    <div className="flex gap-4 items-start min-w-0 flex-grow">
                                        {issue.imageUrl && (
                                            <img 
                                                src={issue.imageUrl} 
                                                alt={issue.title}
                                                className="w-16 h-16 object-cover rounded-lg border border-slate-800 shrink-0 self-center"
                                            />
                                        )}
                                        <div className="space-y-2 min-w-0 flex-grow">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-400 uppercase border border-teal-500/20">
                                                    {issue.status || 'OPEN'}
                                                </span>
                                                <span className="text-xs text-slate-450 flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {new Date(issue.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-base text-white">{issue.title}</h3>
                                            <p className="text-xs text-slate-400 line-clamp-1 max-w-xl">{issue.description}</p>

                                            <div className="flex items-center gap-4 text-[11px] text-slate-450 pt-1">
                                                <span className="flex items-center gap-1 font-semibold text-slate-350">
                                                    <MapPin className="h-3.5 w-3.5 text-rose-450" />
                                                    ({issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)})
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    By: <span className="font-medium text-slate-300">{issue.username}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                        <div className="bg-slate-950 p-2.5 border border-slate-800 rounded-lg text-slate-400 flex items-center gap-1.5 text-xs">
                                            <MessageSquare className="h-4 w-4 text-teal-400" />
                                            <span>{issue.messages ? issue.messages.length : 0}</span>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-slate-550 hidden sm:block" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-950 py-6 text-center text-xs text-slate-500 bg-slate-950/20 mt-12">
                <p>&copy; {new Date().getFullYear()} CivicPulse. All rights reserved.</p>
            </footer>
        </div>
    );
}
