import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { toJpeg } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, Users, Ticket as TicketIcon, Loader2, Trash2, Edit2, Smartphone, CheckCircle2, Archive } from 'lucide-react';
import { generateQRDataURL } from '../utils/qrEngine';
import TicketPreviewModal, { TicketCard } from '../components/TicketPreviewModal';
import EventNavTabs from '../components/EventNavTabs';

export default function TicketGenerator() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [existingTickets, setExistingTickets] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [holderName, setHolderName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Config for consolidated tickets
    const [consolidated, setConsolidated] = useState(false); // If true, 1 ticket for N people

    // Seat Selection
    const [availableSeats, setAvailableSeats] = useState([]);
    const [selectedSeat, setSelectedSeat] = useState('');

    // Modal State
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [justGeneratedTickets, setJustGeneratedTickets] = useState([]);

    // Refs for hidden TicketCard captures (avoids duplicate IDs and Tailwind oklch issues)
    const desktopRefs = useRef({});
    const mobileRefs = useRef({});

    // Editing State
    const [editingTicketId, setEditingTicketId] = useState(null);
    const [editForm, setEditForm] = useState({ holderName: '', pax: 1 });

    const fetchExistingTickets = () => {
        api.get(`/tickets/event/${id}`).then(res => {
            setExistingTickets(res.data);
        }).catch(err => console.error("Error fetching tickets", err));
    };

    useEffect(() => {
        api.get(`/events/${id}`).then(res => {
            setEvent(res.data);
            if (res.data.layout) {
                try {
                    const canvasData = typeof res.data.layout === 'string'
                        ? JSON.parse(res.data.layout)
                        : res.data.layout;
                    const seats = [];
                    const extractSeats = (objs) => {
                        objs.forEach(obj => {
                            if (obj.seatLabel) seats.push(obj.seatLabel);
                            if (obj.objects) extractSeats(obj.objects);
                        });
                    };
                    if (canvasData?.objects) extractSeats(canvasData.objects);
                    setAvailableSeats(Array.from(new Set(seats)).sort());
                } catch (e) {
                    console.error("Error parsing layout", e);
                }
            }
            fetchExistingTickets();
        });
    }, [id]);

    const occupiedSeats = new Set(
        existingTickets
            .filter(t => t.seatId && t.status !== 'revoked')
            .map(t => t.seatId)
    );

    const handleGenerate = async () => {
        const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);
        setIsGenerating(true);
        try {
            const res = await api.post('/tickets/generate', {
                eventId: id,
                quantity: selectedSeat ? 1 : (consolidated ? 1 : parsedQty),
                holderName: holderName || 'Portador',
                seatId: selectedSeat || null,
                pax: selectedSeat ? 1 : (consolidated ? parsedQty : 1)
            });

            // Generate QR data URLs locally with our pure-JS engine
            const ticketsWithQRs = res.data.map((t) => ({
                ...t,
                qrCodeData: generateQRDataURL(t.folio, { width: 256, margin: 0 }),
                pax: selectedSeat ? 1 : (consolidated ? parsedQty : 1)
            }));

            setJustGeneratedTickets(ticketsWithQRs);
            setIsPreviewOpen(true);
            setTickets(ticketsWithQRs);

            // Auto-save to server in background after TicketCard QR effects settle
            setTimeout(() => saveImagesToServer(ticketsWithQRs), 1200);

            if (selectedSeat) setSelectedSeat('');
            fetchExistingTickets();

        } catch (error) {
            console.error("Error generating tickets", error);
            alert(error.response?.data?.error || "Error al generar tickets. Verifique la conexión.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteTicket = async (ticketId) => {
        if (!window.confirm("¿Eliminar este boleto? Esta acción liberará el espacio en la capacidad del evento.")) return;
        try {
            await api.delete(`/tickets/${ticketId}`);
            fetchExistingTickets();
        } catch (error) {
            console.error("Error deleting ticket", error);
        }
    };

    const startEdit = (ticket) => {
        setEditingTicketId(ticket.id);
        setEditForm({ holderName: ticket.holderName, pax: ticket.pax || 1 });
    };

    const handleUpdateTicket = async (ticketId) => {
        try {
            await api.put(`/tickets/${ticketId}`, editForm);
            setEditingTicketId(null);
            fetchExistingTickets();
        } catch (error) {
            console.error("Error updating ticket", error);
        }
    };

    const handleRedownload = (ticket) => {
        const qr = generateQRDataURL(ticket.folio, { width: 256, margin: 0 });
        const tWithQR = { ...ticket, qrCodeData: qr };
        setJustGeneratedTickets([tWithQR]);
        setIsPreviewOpen(true);
    };

    const captureNodeToJpeg = async (node) => {
        if (!node) return null;
        return await toJpeg(node, {
            quality: 0.94,
            pixelRatio: 2,
            backgroundColor: '#0f172a',
            skipFonts: true,
        });
    };

    const saveImagesToServer = async (ticketList) => {
        for (const ticket of ticketList) {
            try {
                await new Promise(r => setTimeout(r, 200));

                const desktopImg = await captureNodeToJpeg(desktopRefs.current[ticket.folio]);
                const mobileImg = await captureNodeToJpeg(mobileRefs.current[ticket.folio]);

                if (desktopImg) {
                    await api.post('/tickets/save-image', {
                        image: desktopImg,
                        folio: ticket.folio,
                        eventName: event.name,
                        mode: 'desktop',
                        ext: 'jpg'
                    });
                }
                if (mobileImg) {
                    await api.post('/tickets/save-image', {
                        image: mobileImg,
                        folio: ticket.folio,
                        eventName: event.name,
                        mode: 'mobile',
                        ext: 'jpg'
                    });
                }
            } catch (err) {
                console.error("BG Save Error:", err);
            }
        }
    };

    const handleDownloadAllZip = async () => {
        if (existingTickets.length === 0) return;
        setIsGenerating(true);
        try {
            setJustGeneratedTickets(existingTickets);
            setIsPreviewOpen(true);
        } catch (error) {
            console.error("Error bulk downloading", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadZip = async (mode = 'desktop') => {
        if (tickets.length === 0) return;
        setIsGenerating(true);
        try {
            const zip = new JSZip();
            for (const ticket of tickets) {
                const node = mode === 'desktop'
                    ? desktopRefs.current[ticket.folio]
                    : mobileRefs.current[ticket.folio];

                if (node) {
                    const dataUrl = await captureNodeToJpeg(node);
                    if (dataUrl) {
                        const base64 = dataUrl.split(',')[1];
                        zip.file(`Boleto-${ticket.folio}-${mode}.jpg`, base64, { base64: true });
                    }
                }
            }
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `Lote-${event.name}-${mode}.zip`);
        } catch (error) {
            console.error("Error ZIP:", error);
            alert("Error al generar el ZIP. Reintente.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!event) return <div className="p-8 text-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin mx-auto" /> Cargo evento...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <EventNavTabs eventName={event.name} />
            <header className="border-b border-slate-800 pb-6">
                <h2 className="text-3xl font-bold text-gray-100 flex items-center">
                    <TicketIcon className="w-8 h-8 mr-3 text-indigo-500" />
                    Generador de Tickets
                </h2>
                <div className="flex flex-col md:flex-row md:items-center justify-between mt-2 gap-4">
                    <p className="text-slate-400 text-lg">Evento: <span className="text-white font-medium">{event.name}</span></p>
                    <div className="bg-slate-800/50 border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Capacidad</span>
                            <span className="text-white font-mono font-bold">{event.capacity}</span>
                        </div>
                        <div className="w-px h-8 bg-slate-700"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Registrados</span>
                            {/* Calculate total pax from existing tickets */}
                            <span className={`font-mono font-bold ${existingTickets.reduce((sum, t) => sum + (t.pax || 1), 0) >= event.capacity ? 'text-red-500' : 'text-emerald-500'}`}>
                                {existingTickets.reduce((sum, t) => sum + (t.pax || 1), 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">

                    {/* Seat Selection (if layout has seats) */}
                    {availableSeats.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Asignar Asiento</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={selectedSeat}
                                onChange={e => {
                                    setSelectedSeat(e.target.value);
                                    if (e.target.value) setQuantity(1);
                                }}
                            >
                                <option value="">-- Sin Asiento / General --</option>
                                {availableSeats.map(seat => {
                                    const isTaken = occupiedSeats.has(seat);
                                    return (
                                        <option key={seat} value={seat} disabled={isTaken}>
                                            {seat}{isTaken ? ' (Ocupado)' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    )}

                    {/* Quantity Input (shown whenever General / no seat is selected) */}
                    {!selectedSeat && (
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Cantidad de Personas</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-slate-400 mb-1">Nombre del Portador / Familia</label>
                        <input
                            type="text"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            value={holderName}
                            onChange={e => setHolderName(e.target.value)}
                            placeholder="Ej. Familia Pérez o Juanito Banana"
                        />
                    </div>

                    <div className="flex items-center space-x-2 pb-3">
                        {!selectedSeat && (
                            <>
                                <input
                                    type="checkbox"
                                    id="consolidated"
                                    checked={consolidated}
                                    onChange={e => setConsolidated(e.target.checked)}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 bg-slate-900 border-slate-700"
                                />
                                <label htmlFor="consolidated" className="text-slate-300 text-sm cursor-pointer select-none">
                                    Generar 1 solo QR (Grupo)
                                </label>
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-4">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center shadow-lg shadow-indigo-500/20 transition-all font-medium disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <TicketIcon className="w-5 h-5 mr-2" />}
                        Generar Tickets
                    </button>

                    {tickets.length > 0 && (
                        <>
                            <button
                                onClick={() => downloadZip('desktop')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl flex items-center shadow-lg shadow-emerald-500/20 transition-all font-medium"
                            >
                                <Download className="w-5 h-5 mr-2" /> Imprimir (Tira)
                            </button>
                            <button
                                onClick={() => downloadZip('mobile')}
                                className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 rounded-xl flex items-center shadow-lg shadow-sky-500/20 transition-all font-medium"
                            >
                                <Smartphone className="w-5 h-5 mr-2" /> Formato Celular
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Preview Section - Live Rendering for Capture */}
            <div className="flex flex-col space-y-12">
                {tickets.map((ticket, idx) => (
                    <div key={idx} className="w-full flex justify-center">
                        {/* Desktop Ticket Render */}
                        <div
                            className="bg-white text-slate-900 w-full max-w-5xl aspect-[9/2.5] flex overflow-hidden shadow-2xl relative border border-slate-200"
                            style={{ minHeight: '220px' }}
                        >
                            {/* Left Stub: Event Info */}
                            <div className="w-3/4 bg-slate-50 flex flex-row relative">
                                <div className="w-1/4 h-full bg-slate-900 relative overflow-hidden flex items-center justify-center">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-slate-900"></div>
                                    <span className="relative text-white/30 font-black text-6xl -rotate-90 tracking-tighter uppercase whitespace-nowrap">T-λ</span>
                                    <div className="absolute -left-6 top-1/2 w-12 h-12 bg-white rounded-full"></div>
                                </div>

                                <div className="flex-1 p-8 flex flex-col justify-between relative border-r-2 border-dashed border-slate-300">
                                    <div className="absolute -top-3 right-0 transform translate-x-1/2 w-6 h-6 bg-white rounded-full border border-slate-300 z-10"></div>
                                    <div>
                                        <h1 className="text-3xl font-black uppercase text-slate-900 leading-none mb-2">{event.name}</h1>
                                        <p className="text-xl text-indigo-600 font-bold">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none mb-1">Portador</p>
                                            <p className="font-bold text-2xl">{ticket.holderName}</p>
                                            {ticket.seatId && <p className="text-indigo-600 font-bold text-lg mt-1">Asiento: {ticket.seatId}</p>}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none mb-1">Hora</p>
                                            <p className="font-bold text-2xl">{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-3 right-0 transform translate-x-1/2 w-6 h-6 bg-white rounded-full border border-slate-300 z-10"></div>
                                </div>
                            </div>

                            {/* Right Stub: QR */}
                            <div className="w-1/4 bg-white p-6 flex flex-col items-center justify-center relative border-l-2 border-dashed border-slate-300">
                                <img src={ticket.qrImage || ticket.qrCodeData} alt="QR" className="w-32 h-32 object-contain mix-blend-multiply" />
                                <div className="mt-4 text-center">
                                    <p className="font-mono font-bold text-xs tracking-widest text-slate-500">{ticket.folio.split('-').pop()}</p>
                                    <span className="text-emerald-600 font-black text-[10px] tracking-widest uppercase">Válido</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Existing Tickets History Section */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden mt-12 animate-in slide-in-from-bottom duration-700">
                <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between bg-slate-900/60 gap-4">
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-slate-400" />
                        <h3 className="text-lg font-bold text-white tracking-tight">Historial de Boletos Descargados</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => handleDownloadAllZip('desktop')}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest border border-slate-700"
                        >
                            <Archive size={14} /> Descargar Todo (ZIP)
                        </button>
                        <span className="text-[10px] px-3 py-1 bg-slate-800 text-slate-500 rounded-full font-bold uppercase tracking-widest">
                            {existingTickets.length} Transacciones
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-950/30 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black border-b border-slate-800/50">
                                <th className="px-6 py-4">Folio</th>
                                <th className="px-6 py-4">Titular</th>
                                <th className="px-6 py-4">Personas</th>
                                <th className="px-6 py-4">Asiento</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-right">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {existingTickets.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-medium italic">
                                        No hay boletos generados para este evento aún.
                                    </td>
                                </tr>
                            ) : (
                                existingTickets.slice().reverse().map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-xs text-indigo-400 font-bold">{t.folio.split('-').pop()}</td>
                                        <td className="px-6 py-4 text-sm text-slate-300 font-medium">
                                            {editingTicketId === t.id ? (
                                                <input 
                                                    type="text" 
                                                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs w-full focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    value={editForm.holderName}
                                                    onChange={e => setEditForm({...editForm, holderName: e.target.value})}
                                                />
                                            ) : t.holderName}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {editingTicketId === t.id ? (
                                                <input 
                                                    type="number" 
                                                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs w-16 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    value={editForm.pax}
                                                    onChange={e => setEditForm({...editForm, pax: parseInt(e.target.value)})}
                                                />
                                            ) : (
                                                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-indigo-400 font-bold">
                                                    {t.pax || 1} pax
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{t.seatId || 'General'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-md ${t.status === 'used' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {editingTicketId === t.id ? (
                                                    <button 
                                                        onClick={() => handleUpdateTicket(t.id)}
                                                        className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                        title="Guardar"
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => startEdit(t)}
                                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleRedownload(t)}
                                                    className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                                    title="Descargar"
                                                >
                                                    <Download size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteTicket(t.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Offscreen TicketCard Renders for html-to-image ZIP/Auto-Save */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: '-3000px',
                    zIndex: -100,
                    opacity: 0,
                    pointerEvents: 'none',
                }}
            >
                {tickets.map((ticket) => (
                    <div key={`capture-${ticket.folio}`}>
                        <TicketCard
                            ref={el => { desktopRefs.current[ticket.folio] = el; }}
                            ticket={ticket}
                            event={event}
                            mode="desktop"
                        />
                        <TicketCard
                            ref={el => { mobileRefs.current[ticket.folio] = el; }}
                            ticket={ticket}
                            event={event}
                            mode="mobile"
                        />
                    </div>
                ))}
            </div>

            <TicketPreviewModal 
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                tickets={justGeneratedTickets}
                event={event}
            />
        </div>
    );
}
