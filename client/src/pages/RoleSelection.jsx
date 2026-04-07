import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ScanLine, ArrowRight } from 'lucide-react';

export default function RoleSelection() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Texture */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#334155_0%,transparent_50%)] blur-[100px]"></div>
            </div>

            <div className="text-center mb-16 z-10">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-900 border border-slate-800 rounded-full mb-6">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
                    <span className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold">Sistema de Gestión Central</span>
                </div>
                <h1 className="text-6xl font-bold text-white mb-4 tracking-tighter leading-none">
                    Ticket's <span className="text-slate-500 font-light italic">Lambda</span>
                </h1>
                <p className="text-slate-400 text-lg max-w-md mx-auto font-medium">
                    Gestione sus eventos con precisión quirúrgica y una interfaz de alto desempeño.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full z-10 px-4">
                {/* Organizador Card */}
                <div
                    onClick={() => navigate('/login?role=admin')}
                    className="group relative cursor-pointer"
                >
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-slate-600 to-slate-800 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    <div className="relative bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] flex flex-col items-center text-center transition-all duration-500 transform group-hover:-translate-y-2">
                        <div className="w-20 h-20 bg-slate-800 border border-slate-700 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-2xl group-hover:bg-slate-100 transition-all duration-300">
                            <ShieldCheck className="w-10 h-10 text-slate-300 group-hover:text-slate-950 transition-colors" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">Organizador</h2>
                        <p className="text-slate-500 group-hover:text-slate-300 leading-relaxed font-medium mb-8">
                            Control total sobre eventos, diseño de mapas interactivos y analítica avanzada de ventas.
                        </p>
                        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest group-hover:text-white transition-colors">
                            Acceder al Panel <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                        </div>
                    </div>
                </div>

                {/* Staff Card */}
                <div
                    onClick={() => navigate('/login?role=staff')}
                    className="group relative cursor-pointer"
                >
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-slate-600 to-slate-800 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    <div className="relative bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] flex flex-col items-center text-center transition-all duration-500 transform group-hover:-translate-y-2">
                        <div className="w-20 h-20 bg-slate-800 border border-slate-700 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-2xl group-hover:bg-slate-100 transition-all duration-300">
                            <ScanLine className="w-10 h-10 text-slate-300 group-hover:text-slate-950 transition-colors" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">Staff / Portero</h2>
                        <p className="text-slate-500 group-hover:text-slate-300 leading-relaxed font-medium mb-8">
                            Validación ultra-rápida de tickets QR, registro de accesos y gestión de personal en sitio.
                        </p>
                        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest group-hover:text-white transition-colors">
                            Abrir Consola <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                        </div>
                    </div>
                </div>
            </div>

            <p className="mt-20 text-slate-700 text-xs font-bold tracking-[0.4em] uppercase z-10">
                © 2026 Ticket's Lambda • Professional Management Suite
            </p>
        </div>
    );
}
