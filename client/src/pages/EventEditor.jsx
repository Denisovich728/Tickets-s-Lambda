import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import LayoutEditor from '../components/LayoutEditor';
import StaffManager from '../components/StaffManager';
import { Trash2, Users, Map } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import EventNavTabs from '../components/EventNavTabs';

export default function EventEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [event, setEvent] = useState({
        name: '',
        date: '',
        type: 'General',
        capacity: 100,
        accessRules: null
    });
    const [layoutData, setLayoutData] = useState(null);

    useEffect(() => {
        if (id) {
            api.get(`/events/${id}`).then(res => {
                const data = res.data;
                setEvent({
                    name: data.name,
                    date: data.date ? data.date.split('T')[0] : '', 
                    type: data.type,
                    capacity: data.capacity,
                    accessRules: data.accessRules
                });
                // Check both fields for backward compatibility
                if (data.layout) {
                    setLayoutData(data.layout);
                } else if (data.accessRules && data.accessRules.layout) {
                    setLayoutData(data.accessRules.layout);
                }
            });
        }
    }, [id]);

    const handleDelete = async () => {
        try {
            await api.delete(`/events/${id}`);
            setIsConfirmOpen(false);
            navigate('/dashboard');
        } catch (error) {
            console.error("Error deleting event", error);
            alert("Error al eliminar el evento.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...event,
            layout: layoutData
        };

        try {
            if (id) {
                await api.put(`/events/${id}`, payload);
            } else {
                await api.post('/events', payload);
            }
            navigate('/dashboard');
        } catch (error) {
            console.error("Error saving event", error);
            alert("Error al guardar el evento. Por favor intente de nuevo.");
        }
    };

    return (
        <div>
            {id && <EventNavTabs eventName={event.name} />}
            <div className="bg-slate-900/70 backdrop-blur-2xl p-8 rounded-2xl border border-slate-800/80 shadow-xl relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-slate-800/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10">
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="text-center md:text-left">
                        <h2 className="text-4xl font-bold text-white tracking-tighter uppercase">
                            {id ? 'Editar' : 'Nuevo'} <span className="text-slate-500 font-light">Evento</span>
                        </h2>
                        <p className="text-slate-500 text-xs font-bold tracking-[0.3em] uppercase mt-2">Configuración y Diseño de Espacio</p>
                    </div>
                    
                    {id && (
                        <button 
                            type="button"
                            onClick={() => setIsConfirmOpen(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-all font-bold text-xs uppercase tracking-widest"
                        >
                            <Trash2 size={16} /> Eliminar Evento
                        </button>
                    )}
                </header>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                        <div className="space-y-2 group">
                            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 ml-1 group-focus-within:text-slate-300 transition-colors">Nombre del Evento</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-all font-medium"
                                placeholder="Ej. Gran Gala Lambda"
                                value={event.name}
                                onChange={e => setEvent({ ...event, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2 group">
                            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 ml-1 group-focus-within:text-slate-300 transition-colors">Fecha del Evento</label>
                            <input
                                type="date"
                                required
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-100 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-all font-medium [color-scheme:dark]"
                                value={event.date}
                                onChange={e => setEvent({ ...event, date: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2 group">
                            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 ml-1 group-focus-within:text-slate-300 transition-colors">Categoría</label>
                            <select
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-100 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-all font-medium appearance-none"
                                value={event.type}
                                onChange={e => setEvent({ ...event, type: e.target.value })}
                            >
                                <option value="General">General</option>
                                <option value="Boda">Boda</option>
                                <option value="Concierto">Concierto</option>
                                <option value="Convivio">Convivio</option>
                                <option value="Antro">Antro</option>
                            </select>
                        </div>

                        <div className="space-y-2 group">
                            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 ml-1 group-focus-within:text-slate-300 transition-colors">Capacidad Máxima</label>
                            <input
                                type="number"
                                required
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-all font-medium"
                                placeholder="0"
                                value={event.capacity}
                                onChange={e => setEvent({ ...event, capacity: parseInt(e.target.value, 10) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-800/50 pt-10">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                                <Map size={24} className="text-indigo-400" />
                                Creador de Mapa de Mesas y Asientos
                            </h3>
                            <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-3 py-1 rounded-full uppercase tracking-widest font-bold italic">
                                {layoutData ? 'Mapa configurado' : 'Sin mapa'}
                            </span>
                        </div>
                        <LayoutEditor
                            initialData={layoutData}
                            onSave={(json) => setLayoutData(json)}
                        />
                    </div>

                    <div className="border-t border-slate-800/50 pt-10">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                                <Users size={24} className="text-indigo-400" />
                                Personal del Evento
                            </h3>
                            <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-3 py-1 rounded-full uppercase tracking-widest font-bold italic">Roster de Control</span>
                        </div>
                        {id ? (
                            <StaffManager />
                        ) : (
                            <div className="bg-slate-950/50 border-2 border-dashed border-slate-800 p-12 rounded-[2rem] text-center">
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Guarde el evento primero para asignar personal</p>
                            </div>
                        )}
                    </div>

                    <footer className="flex justify-end gap-4 pt-8 border-t border-slate-800/50">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="px-8 py-3.5 text-slate-400 hover:text-white font-bold text-sm uppercase tracking-widest transition-colors"
                        >
                            Descartar
                        </button>
                        <button
                            type="submit"
                            className="px-10 py-3.5 bg-slate-100 hover:bg-white text-slate-950 font-black rounded-xl shadow-xl shadow-black/20 transform active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
                        >
                            Guardar Evento
                        </button>
                    </footer>
                </form>
            </div>

            <ConfirmModal 
                isOpen={isConfirmOpen}
                title="Eliminar este Evento"
                message="¿Estás completamente seguro? Esta acción borrará permanentemente el evento, sus configuraciones y todos los tickets que se hayan generado hasta ahora."
                onConfirm={handleDelete}
                onCancel={() => setIsConfirmOpen(false)}
                confirmText="Sí, eliminar evento"
            />
        </div>
        </div>
    );
}
