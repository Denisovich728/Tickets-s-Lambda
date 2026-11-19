import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import {
    LogOut, LayoutDashboard, PlusCircle, ScanLine, Clock,
    Users, UserCog, Menu, X, Database, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { cn } from '../utils/cn';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!user) return null;

    const userRole = (user.role || '').toLowerCase();

    const sections = [
        {
            title: 'Operación',
            items: [
                { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'client', 'staff'] },
                { path: '/events/new', label: 'Nuevo Evento', icon: PlusCircle, roles: ['admin', 'client'] },
                { path: '/scanner', label: 'Escáner QR', icon: ScanLine, roles: ['admin', 'client', 'staff'] },
            ],
        },
        {
            title: 'Equipo & Asistencia',
            items: [
                { path: '/staff-profiles', label: 'Personal', icon: Users, roles: ['admin'] },
                { path: '/clock-in', label: 'Reloj Checador', icon: Clock, roles: ['admin', 'client', 'staff'] },
            ],
        },
        {
            title: 'Administración',
            items: [
                { path: '/users', label: 'Usuarios', icon: UserCog, roles: ['admin'] },
                { path: '/admin/db', label: 'Base de Datos', icon: Database, roles: ['admin'] },
            ],
        },
    ];

    const toggleOpen = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden bg-slate-900/95 border-b border-slate-800 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-40 backdrop-blur-xl">
                <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-black text-sm text-indigo-300">Tλ</span>
                    <span className="font-bold text-base tracking-tight">Tickets Lambda</span>
                </div>
                <button
                    onClick={toggleOpen}
                    className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/70 text-slate-300 hover:text-white"
                >
                    {isOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
            </div>

            {/* Sidebar Container */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 bg-slate-950/90 backdrop-blur-2xl text-slate-100 transition-all duration-300 ease-in-out transform md:translate-x-0 border-r border-slate-800/80 flex flex-col",
                isOpen ? "translate-x-0 w-64" : "-translate-x-full md:w-64",
                isCollapsed && "md:w-20"
            )}>
                {/* Brand Header */}
                <div className="hidden md:flex items-center justify-between px-5 h-20 border-b border-slate-800/70">
                    {!isCollapsed && (
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-black text-indigo-300">
                                λ
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-base tracking-tight text-white">Tickets Lambda</span>
                                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Console</span>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 hover:bg-slate-800/80 rounded-xl transition-colors text-slate-400 hover:text-white border border-transparent hover:border-slate-700/60"
                        title={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
                    >
                        {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                    </button>
                </div>

                {/* User Profile Card */}
                <div className={cn("px-4 py-4 border-b border-slate-800/70 flex items-center gap-3", isCollapsed && "justify-center")}>
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center font-bold text-indigo-300 shrink-0">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden">
                            <p className="font-semibold text-sm truncate text-slate-100">{user.username}</p>
                            <span className="inline-block text-[10px] text-indigo-300/90 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider mt-0.5">
                                {user.role}
                            </span>
                        </div>
                    )}
                </div>

                {/* Grouped Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
                    {sections.map((section) => {
                        const visibleItems = section.items.filter(item => item.roles.includes(userRole));
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={section.title} className="space-y-1.5">
                                {!isCollapsed && (
                                    <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                        {section.title}
                                    </p>
                                )}
                                {visibleItems.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group relative border text-sm",
                                                isCollapsed && "justify-center px-2",
                                                isActive
                                                    ? "bg-indigo-600/20 text-white border-indigo-500/40 font-semibold shadow-sm"
                                                    : "border-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                                            )}
                                        >
                                            <item.icon className={cn(
                                                "w-4 h-4 shrink-0 transition-colors",
                                                isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"
                                            )} />
                                            {!isCollapsed && <span className="truncate">{item.label}</span>}

                                            {isCollapsed && (
                                                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-slate-100 text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700/80 transition-opacity">
                                                    {item.label}
                                                </div>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>

                {/* Footer / Logout */}
                <div className="p-3 border-t border-slate-800/70">
                    <button
                        onClick={logout}
                        className={cn(
                            "flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-slate-400 hover:text-red-400 transition-all text-sm font-medium",
                            isCollapsed && "justify-center px-2"
                        )}
                    >
                        <LogOut className="w-4 h-4 shrink-0" />
                        {!isCollapsed && <span>Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
