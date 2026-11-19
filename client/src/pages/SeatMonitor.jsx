import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import * as fabric from 'fabric';
import { Loader2, RefreshCw, Layers } from 'lucide-react';
import EventNavTabs from '../components/EventNavTabs';

export default function SeatMonitor() {
    const { id } = useParams();
    const canvasRef = useRef(null);
    const [canvas, setCanvas] = useState(null);
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [stats, setStats] = useState({ total: 0, sold: 0, entered: 0 });

    useEffect(() => {
        const c = new fabric.Canvas(canvasRef.current, {
            height: 600,
            width: 1000,
            backgroundColor: '#f8fafc',
            selection: false, // Read only
            defaultCursor: 'default'
        });
        setCanvas(c);

        loadData(c);

        return () => c.dispose();
    }, [id]);

    const loadData = async (c) => {
        setLoading(true);
        try {
            // 1. Fetch Event (Layout)
            const eventRes = await api.get(`/events/${id}`);
            setEvent(eventRes.data);
            const layout = eventRes.data.layout
                ? (typeof eventRes.data.layout === 'string' ? JSON.parse(eventRes.data.layout) : eventRes.data.layout)
                : null;

            // 2. Fetch Tickets (Status) - Need endpoint for ALL tickets of event
            // We assume /tickets/event/:id exists or we filter from generic.
            // Wait, we don't have a specific endpoint for "Get All Tickets for Event" in my robust list?
            // "TicketGenerator" allows generating.
            // "AdminDBViewer" fetches /events.
            // I need to add `GET /tickets/event/:id` or similar to logic?
            // Let's assume `api.get('/tickets')` returns all? No.
            // I will use `api.get('/events/${id}/tickets')` if implemented?
            // Or I can add it to `tickets.js` quickly. 
            // Actually, I'll check `server/routes/tickets.js` content from earlier view.
            // It has `POST /generate` and `POST /validate`. It DOES NOT have specific `GET /:eventId`.
            // I need to add that endpoint to `tickets.js` for this Monitor to work efficiently.

            // Temporary workaround: IF backend missing, I can't show status.
            // I'll add the endpoint to backend in this step too.

            const ticketsRes = await api.get(`/tickets/event/${id}`);
            const tickets = ticketsRes.data;

            // Stats
            const sold = tickets.filter(t => t.status !== 'revoked').length;
            const entered = tickets.filter(t => t.status === 'used').length;

            if (layout && c) {
                await c.loadFromJSON(layout);
                let totalSeats = 0;

                const updateShapeColor = (target, ticket) => {
                    if (ticket && ticket.status !== 'revoked') {
                        if (ticket.status === 'used') {
                            target.set('fill', '#ef4444'); // Red - Entered
                            if (target.stroke) target.set('stroke', '#7f1d1d');
                        } else {
                            target.set('fill', '#eab308'); // Yellow - Sold
                            if (target.stroke) target.set('stroke', '#a16207');
                        }
                    } else {
                        target.set('fill', '#22c55e'); // Green - Available
                        if (target.stroke) target.set('stroke', '#15803d');
                    }
                };

                const updateSeatVisual = (obj) => {
                    if (!obj.seatLabel) return;
                    totalSeats++;
                    const ticket = tickets.find(t => t.seatId === obj.seatLabel && t.status !== 'revoked');

                    if (typeof obj.getObjects === 'function') {
                        obj.getObjects().forEach(child => {
                            const childType = child.type?.toLowerCase();
                            if (childType !== 'text' && childType !== 'i-text') {
                                updateShapeColor(child, ticket);
                            }
                        });
                        obj.set('dirty', true);
                    } else {
                        updateShapeColor(obj, ticket);
                    }
                };

                const walkObjects = (objs) => {
                    objs.forEach(obj => {
                        obj.set({ selectable: false, evented: false });
                        if (obj.seatLabel) {
                            updateSeatVisual(obj);
                        } else if (typeof obj.getObjects === 'function') {
                            walkObjects(obj.getObjects());
                        }
                    });
                };

                walkObjects(c.getObjects());
                c.requestRenderAll();
                setStats({ total: totalSeats, sold, entered });
            } else {
                setStats({ total: 0, sold, entered });
            }

        } catch (error) {
            console.error("Error loading monitor data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        if (canvas) loadData(canvas);
    };

    if (!event && loading) return <div className="p-8 text-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin mx-auto" /> Cargando Monitor...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <EventNavTabs eventName={event?.name} />
            <header className="border-b border-slate-800 pb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-100 flex items-center">
                        <Layers className="w-8 h-8 mr-3 text-indigo-500" />
                        Monitor de Asientos
                    </h2>
                    <p className="text-slate-400 mt-2">Vista en vivo de ocupación y ventas.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors shadow-lg shadow-indigo-500/20"
                >
                    <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <p className="text-slate-400 text-sm uppercase font-bold tracking-wider">Boletos Vendidos</p>
                    <p className="text-3xl font-black text-white mt-2">{stats.sold}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <p className="text-slate-400 text-sm uppercase font-bold tracking-wider">Asistencia (Check-in)</p>
                    <p className="text-3xl font-black text-emerald-400 mt-2">{stats.entered}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <p className="text-slate-400 text-sm uppercase font-bold tracking-wider">Ocupación</p>
                    <p className="text-3xl font-black text-indigo-400 mt-2">{stats.sold > 0 ? Math.round((stats.entered / stats.sold) * 100) : 0}%</p>
                </div>
            </div>

            {/* Legend */}
            <div className="flex gap-6 justify-center">
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-500"></div><span className="text-slate-300">Disponible</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-yellow-500"></div><span className="text-slate-300">Vendido</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500"></div><span className="text-slate-300">Ingresó (Check-in)</span></div>
            </div>

            {/* Canvas */}
            <div className="rounded-xl overflow-hidden shadow-2xl border-4 border-slate-700 bg-slate-900">
                <div className="bg-slate-800 text-slate-400 text-xs px-2 py-1 flex justify-between">
                    <span>Mapa en Vivo</span>
                    <span>1000 x 600 px</span>
                </div>
                <div className="overflow-auto max-h-[600px] bg-slate-900/50 flex justify-center p-4">
                    <canvas ref={canvasRef} />
                </div>
            </div>
        </div>
    );
}
