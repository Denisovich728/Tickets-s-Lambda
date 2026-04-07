import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { Calendar, Map, Ticket, Users, PlusCircle, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

export default function Dashboard() {
    const [events, setEvents] = useState([]);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events');
            setEvents(res.data);
        } catch (error) {
            console.error("Error fetching events", error);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const openConfirm = (id) => {
        setEventToDelete(id);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!eventToDelete) return;
        try {
            await api.delete(`/events/${eventToDelete}`);
            setIsConfirmOpen(false);
            setEventToDelete(null);
            fetchEvents();
        } catch (error) {
            console.error("Error deleting event", error);
            alert("Error al eliminar el evento.");
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center border-b border-slate-700 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-100 tracking-tight">Dashboard</h1>
                    {/* <p className="text-slate-400 mt-1">Bienvenido</p> */}
                </div>
                <Link to="/events/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-200 flex items-center font-medium">
                    <PlusCircle className="w-5 h-5 mr-2" /> Nuevo Evento
                </Link>
            </header>

            <div>
                <h2 className="text-xl font-semibold text-gray-200 mb-6 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-indigo-400" /> Mis Eventos
                </h2>

                {events.length === 0 ? (
                    <div className="text-center py-16 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                        <Calendar className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                        <p className="text-slate-400 text-lg">No tienes eventos programados aún.</p>
                        <Link to="/events/new" className="text-indigo-400 hover:text-indigo-300 font-medium mt-2 inline-block">
                            Crear mi primer evento &rarr;
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => (
                            <div key={event.id} className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700/50 hover:border-indigo-500/30 transition-all duration-300 group relative">
                                <button 
                                    onClick={() => openConfirm(event.id)}
                                    className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <div className="flex justify-between items-start mb-4 pr-10">
                                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors uppercase tracking-tight">{event.name}</h3>
                                </div>
                                
                                <div className="mb-4">
                                    <span className="px-3 py-1 bg-slate-900/50 text-[10px] font-bold uppercase tracking-widest rounded-full text-slate-400 border border-slate-700">
                                        {event.type}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <p className="text-slate-400 text-sm flex items-center">
                                        <Calendar className="w-4 h-4 mr-2 opacity-70" />
                                        {new Date(event.date).toLocaleDateString()}
                                    </p>
                                    <p className="text-slate-400 text-sm flex items-center">
                                        <Users className="w-4 h-4 mr-2 opacity-70" />
                                        Capacidad: <span className="text-slate-200 ml-1 font-medium">{event.capacity}</span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <Link to={`/events/${event.id}/tickets`} className="flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 px-3 rounded-lg text-sm font-medium transition-colors">
                                        <Ticket className="w-4 h-4 mr-2" /> Tickets
                                    </Link>
                                    <Link to={`/events/${event.id}/map`} className="flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 px-3 rounded-lg text-sm font-medium transition-colors">
                                        <Map className="w-4 h-4 mr-2" /> Monitor
                                    </Link>
                                    <Link to={`/events/${event.id}/edit`} className="col-span-2 flex items-center justify-center border border-slate-600 hover:bg-slate-700/50 text-slate-300 py-2 px-3 rounded-lg text-sm font-medium transition-colors mt-2">
                                        <Map className="w-4 h-4 mr-2" /> Editar Mapa & Configuración
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmModal 
                isOpen={isConfirmOpen}
                title="Eliminar Evento"
                message="¿Estás seguro de que deseas eliminar este evento? Todos los boletos y registros asociados se perderán permanentemente."
                onConfirm={handleDelete}
                onCancel={() => setIsConfirmOpen(false)}
                confirmText="Eliminar permanentemente"
            />
        </div>
    );
}
