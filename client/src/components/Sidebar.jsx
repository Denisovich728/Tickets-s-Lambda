import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import {
    LogOut, Home, PlusCircle, ScanLine, Clock,
    Ticket as TicketIcon, Users, Menu, X, Database
} from 'lucide-react';
import { cn } from '../utils/cn';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false); // Mobile toggle
    const [isCollapsed, setIsCollapsed] = useState(false); // Desktop toggle

    if (!user) return null;

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'client', 'staff'] },
        { path: '/events/new', label: 'Nuevo Evento', icon: PlusCircle, roles: ['admin', 'client'] },
        { path: '/users', label: 'Usuarios', icon: Users, roles: ['admin'] },
        { path: '/staff-profiles', label: 'Personal', icon: Users, roles: ['admin'] },
        { path: '/scanner', label: 'Escáner', icon: ScanLine, roles: ['admin', 'client', 'staff'] },
        { path: '/clock-in', label: 'Reloj Checador', icon: Clock, roles: ['admin', 'client', 'staff'] },
        { path: '/admin/db', label: 'Base de Datos', icon: Database, roles: ['admin'] },
    ];

    const toggleOpen = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden bg-slate-800 text-white p-4 flex justify-between items-center shadow-md">
                <span className="font-bold text-2xl tracking-tighter">Tλ</span>
                <button onClick={toggleOpen}>
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Sidebar Container */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 bg-slate-900/80 backdrop-blur-2xl text-gray-100 transition-all duration-500 ease-in-out transform md:translate-x-0 border-r border-slate-800 flex flex-col",
                isOpen ? "translate-x-0 w-72" : "-translate-x-full md:w-72",
                isCollapsed && "md:w-20"
            )}>
                {/* Desktop Header / Collapse Toggle */}
                <div className="hidden md:flex items-center justify-between p-6 border-b border-white/5 h-24">
                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <span className="font-black text-2xl tracking-tighter text-white uppercase italic">Lambda λ</span>
                            <span className="text-[10px] font-bold text-slate-500 tracking-[0.4em] uppercase -mt-1">System Console</span>
                        </div>
                    )}
                    <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white">
                        <Menu size={22} />
                    </button>
                </div>

                {/* User Info */}
                <div className={cn("p-6 border-b border-white/5 flex items-center gap-4", isCollapsed && "justify-center")}>
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-950 shadow-2xl shrink-0">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden">
                            <p className="font-bold text-sm truncate text-white">{user.username}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{user.role}</p>
                        </div>
                    )}
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-4">
                    {navItems.filter(item => {
                        const userRole = (user.role || '').toLowerCase();
                        return item.roles.includes(userRole);
                    }).map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group relative border",
                                    isActive
                                        ? "bg-white text-slate-950 border-white shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] font-bold scale-[1.02]"
                                        : "border-transparent text-slate-500 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5 shrink-0 transition-transform duration-300",
                                    isActive ? "text-slate-950" : "group-hover:scale-110"
                                )} />
                                {!isCollapsed && <span className="text-sm tracking-tight">{item.label}</span>}

                                {isCollapsed && (
                                    <div className="absolute left-full ml-4 px-3 py-2 bg-slate-950 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 shadow-2xl border border-slate-800 transition-opacity">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={logout}
                        className={cn(
                            "flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all group",
                            isCollapsed && "justify-center"
                        )}
                    >
                        <LogOut className="w-5 h-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
                        {!isCollapsed && <span className="text-sm font-bold tracking-tight">Cerrar Sesión</span>}
                    </button>
                </div>
            </div>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
