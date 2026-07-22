import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { MapPin, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
    const { user, login } = useContext(AuthContext);
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', { email, password });
            // response.data contains the AuthResponse DTO: id, username, email, role, sector
            login(response.data);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6 relative overflow-hidden selection:bg-teal-500 selection:text-slate-900">
            {/* Background glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl shadow-teal-950/10 relative z-10">
                {/* Branding */}
                <div className="text-center space-y-2 mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 text-teal-400 font-bold text-xl hover:opacity-90 transition">
                        <MapPin className="h-6 w-6" />
                        <span>CivicPulse</span>
                    </Link>
                    <p className="text-slate-400 text-sm">Welcome back! Sign in to access your dashboard.</p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-start gap-3 text-sm">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
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
                                className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-650 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition outline-none"
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
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-650 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition outline-none"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl transition shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Authenticating...</span>
                            </>
                        ) : (
                            <>
                                <span>Sign In</span>
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-450 border-t border-slate-800/80 pt-6">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-teal-400 hover:underline font-medium">
                        Create one
                    </Link>
                </div>
            </div>
        </div>
    );
}
