import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { Clock, CheckCircle2, AlertTriangle, User, Hash, ArrowRight, Loader2, ShieldCheck, HelpCircle, Camera, X, RefreshCw, Smartphone } from 'lucide-react';
import QRScanner from '../components/QRScanner';

export default function StaffClock() {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [staffId, setStaffId] = useState('');
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [message, setMessage] = useState(null); 

    useEffect(() => {
        fetchActiveEvents();
    }, []);

    const fetchActiveEvents = async () => {
        try {
            const res = await api.get('/events');
            const today = new Date();
            today.setHours(0,0,0,0);
            const filtered = res.data.filter(e => new Date(e.date) >= today);
            setEvents(filtered);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDetected = (decodedText) => {
        try {
            const data = JSON.parse(decodedText);
            if (data.type === 'staff' && data.id) {
                setStaffId(data.id.toString());
                setScanning(false);
                // Auto check-in trigger could be added here if desired
            }
        } catch (e) {
            // Raw ID scan fallback
            setStaffId(decodedText);
            setScanning(false);
        }
    };

    const handleAction = async (actionType, idToUse = staffId) => {
        if (!selectedEvent || !idToUse) return;
        
        setLoading(true);
        setMessage(null);
        try {
            const endpoint = actionType === 'in' ? '/staff/checkin' : '/staff/checkout';
            await api.post(endpoint, {
                eventId: selectedEvent.id,
                userId: idToUse
            });
            
            setMessage({ 
                type: 'success', 
                text: actionType === 'in' ? '¡Bienvenido! Entrada Registrada.' : '¡Buen Trabajo! Salida Registrada.' 
            });
            setStaffId('');
            setTimeout(() => setMessage(null), 5000);
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.error || 'Error al procesar el registro.' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] p-6 md:p-12 bg-[#0a0a0f] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 blur-[150px] rounded-full"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 blur-[150px] rounded-full"></div>

            <div className="relative z-10 w-full max-w-5xl space-y-12 animate-in fade-in zoom-in-95 duration-1000">
                
                {message && (
                    <div className={`p-8 rounded-[3rem] border-2 shadow-2xl animate-in slide-in-from-top-12 duration-500 flex items-center gap-6 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
                        {message.type === 'success' ? <CheckCircle2 size={48} className="shrink-0" /> : <AlertTriangle size={48} className="shrink-0" />}
                        <p className="text-3xl font-black uppercase tracking-tight leading-none">{message.text}</p>
                    </div>
                )}

                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-8 py-3 rounded-full mb-4">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Terminal de Bio-Acceso Lambda</span>
                    </div>
                    <h1 className="text-7xl md:text-9xl font-black tracking-tighter uppercase leading-none">CHECK-IN</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Step 1: Event Selection */}
                    <div className="lg:col-span-5 bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[4rem] shadow-3xl">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-14 h-14 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                                <ArrowRight size={28} />
                            </div>
                            <h3 className="text-3xl font-black uppercase tracking-tight">Evento Activo</h3>
                        </div>
                        
                        <div className="space-y-4 overflow-y-auto max-h-[450px] scrollbar-hide pr-2">
                            {events.map((e) => (
                                <button
                                    key={e.id}
                                    onClick={() => setSelectedEvent(e)}
                                    className={`w-full text-left p-8 rounded-[2.5rem] border-2 transition-all group scale-active ${selectedEvent?.id === e.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-2xl scale-102' : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'}`}
                                >
                                    <h4 className="text-2xl font-black uppercase leading-none mb-3">{e.name}</h4>
                                    <p className={`text-[10px] font-black uppercase tracking-widest opacity-60`}>
                                        {new Date(e.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })} • {new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Identification */}
                    <div className="lg:col-span-7 bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[4rem] shadow-3xl flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-emerald-600/20 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                    <Smartphone size={28} />
                                </div>
                                <h3 className="text-3xl font-black uppercase tracking-tight">Acceso QR</h3>
                            </div>
                            {selectedEvent && (
                                <button
                                    onClick={() => setScanning(!scanning)}
                                    className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all scale-active ${scanning ? 'bg-red-600 text-white' : 'bg-white text-slate-900'}`}
                                >
                                    {scanning ? 'Cerrar Cámara' : 'Escanear QR'}
                                </button>
                            )}
                        </div>

                        {scanning ? (
                            <div className="flex-1 flex flex-col items-center justify-center mb-6">
                                <QRScanner onScan={handleDetected} onClose={() => setScanning(false)} />
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col justify-center space-y-10">
                                <div className="relative group">
                                    <Hash className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={28} />
                                    <input
                                        type="text"
                                        placeholder="Ingresa ID o usa el QR"
                                        className="w-full bg-black/60 border-2 border-white/10 focus:border-indigo-500 text-5xl font-black p-10 pl-20 rounded-[3rem] outline-none transition-all placeholder:text-slate-800 tracking-tighter"
                                        value={staffId}
                                        onChange={e => setStaffId(e.target.value)}
                                        disabled={!selectedEvent || loading}
                                    />
                                    {!selectedEvent && (
                                        <div className="absolute inset-0 bg-black/80 backdrop-blur-[4px] rounded-[3rem] flex items-center justify-center p-8 text-center">
                                             <p className="text-xs font-black uppercase tracking-[0.5em] text-slate-500">Selecciona un evento para habilitar</p>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <button
                                        onClick={() => handleAction('in')}
                                        disabled={!staffId || loading}
                                        className="h-48 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 text-white rounded-[3.5rem] shadow-2xl transition-all scale-active flex flex-col items-center justify-center gap-4 group"
                                    >
                                        {loading ? <Loader2 className="animate-spin text-white" size={48} /> : <CheckCircle2 size={48} className="group-hover:scale-110 transition-transform" />}
                                        <span className="font-black text-3xl uppercase tracking-tighter">Entrada</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => handleAction('out')}
                                        disabled={!staffId || loading}
                                        className="h-48 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-white rounded-[3.5rem] shadow-2xl transition-all scale-active flex flex-col items-center justify-center gap-4 group"
                                    >
                                        {loading ? <Loader2 className="animate-spin text-white" size={48} /> : <Clock size={48} className="group-hover:scale-110 transition-transform" />}
                                        <span className="font-black text-3xl uppercase tracking-tighter">Salida</span>
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                <footer className="flex justify-center items-center gap-6 opacity-30 pt-10">
                    <RefreshCw size={20} className="animate-spin-slow" />
                    <p className="text-xs font-black uppercase tracking-[0.8em]">Sincronización en tiempo real activa λ</p>
                </footer>
            </div>
        </div>
    );
}
