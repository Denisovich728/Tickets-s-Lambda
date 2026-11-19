import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Settings, Ticket, Layers, Users } from 'lucide-react';
import { cn } from '../utils/cn';

export default function EventNavTabs({ eventName }) {
    const { id } = useParams();
    const location = useLocation();

    if (!id) return null;

    const tabs = [
        { path: `/events/${id}/edit`, label: 'Configuración & Mapa', icon: Settings },
        { path: `/events/${id}/tickets`, label: 'Tickets QR', icon: Ticket },
        { path: `/events/${id}/map`, label: 'Monitor en Vivo', icon: Layers },
        { path: `/events/${id}/staff`, label: 'Personal', icon: Users },
    ];

    return (
        <div className="mb-6 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl">
            <div className="flex items-center gap-3 pl-1">
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/70 transition-all"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Eventos
                </Link>
                {eventName && (
                    <>
                        <span className="text-slate-700">/</span>
                        <span className="text-sm font-semibold text-slate-200 truncate max-w-[200px]">
                            {eventName}
                        </span>
                    </>
                )}
            </div>

            <nav className="flex flex-wrap items-center gap-1.5">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path;
                    const Icon = tab.icon;
                    return (
                        <Link
                            key={tab.path}
                            to={tab.path}
                            className={cn(
                                "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border",
                                isActive
                                    ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm"
                                    : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/70"
                            )}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
