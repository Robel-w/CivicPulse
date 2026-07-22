import React, { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MapPin, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

export default function Home() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Redirect to dashboard if already logged in
    React.useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-slate-900">
            {/* Navigation Header */}
            <header className="border-b border-slate-800/80 backdrop-blur-md sticky top-0 bg-slate-950/80 z-50">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-teal-500/10 p-2 rounded-lg border border-teal-500/20 text-teal-400">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                            CivicPulse
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition">
                            Sign In
                        </Link>
                        <Link 
                            to="/register" 
                            className="bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-semibold px-4 py-2 rounded-lg transition shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            Sign Up
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Body */}
            <main className="flex-grow flex items-center justify-center px-6 py-12 relative overflow-hidden">
                {/* Background decorative glows */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-2xl text-center space-y-8 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-500/5 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <ShieldCheck className="h-4 w-4" /> Better Cities, Together
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                        Empowering Citizens. <br />
                        <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                            Resolving Issues Together.
                        </span>
                    </h1>
                    <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
                        CivicPulse connects citizens directly with sector administrators to report, track, and discuss local public issues in real-time. Select sectors, pin locations, and resolve issues collaboratively.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link 
                            to="/login"
                            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-semibold px-8 py-3.5 rounded-xl transition flex items-center justify-center gap-2 hover:-translate-y-0.5"
                        >
                            Get Started <ArrowRight className="h-4 w-4 text-teal-400" />
                        </Link>
                        <Link 
                            to="/register"
                            className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold px-8 py-3.5 rounded-xl transition shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                            Create an Account
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
                <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p>&copy; {new Date().getFullYear()} CivicPulse Labs. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <span className="hover:text-slate-400 transition cursor-pointer">Privacy Policy</span>
                        <span className="hover:text-slate-400 transition cursor-pointer">Terms of Service</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
