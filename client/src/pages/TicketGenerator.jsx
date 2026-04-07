import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, Users, Ticket as TicketIcon, Loader2, Trash2, Edit2, Smartphone, CheckCircle2, Archive } from 'lucide-react';
import QRCode from 'qrcode';
import TicketPreviewModal from '../components/TicketPreviewModal';

const API_BASE_URL = 'http://localhost:3001';

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

    // New: Seat Selection
    const [availableSeats, setAvailableSeats] = useState([]);
    const [selectedSeat, setSelectedSeat] = useState('');

    // Modal State
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [justGeneratedTickets, setJustGeneratedTickets] = useState([]);

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
                    const canvasData = JSON.parse(res.data.layout);
                    // Extract seats (objects with seatLabel)
                    const seats = [];
                    // Handle recursive helper if groups
                    const extractSeats = (objs) => {
                        objs.forEach(obj => {
                            if (obj.seatLabel) seats.push(obj.seatLabel);
                            if (obj.objects) extractSeats(obj.objects); // In case of Groups within Groups
                            // Note: Fabric structure for Group: obj.objects
                        });
                    };
                    if (canvasData.objects) extractSeats(canvasData.objects);
                    setAvailableSeats(seats.sort());
                } catch (e) {
                    console.error("Error parsing layout", e);
                }
            }
            fetchExistingTickets();
        });
    }, [id]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const res = await api.post('/tickets/generate', {
                eventId: id,
                quantity: selectedSeat ? 1 : (consolidated ? 1 : quantity),
                holderName: holderName || 'Portador',
                seatId: selectedSeat || null,
                pax: selectedSeat ? 1 : (consolidated ? quantity : 1)
            });

            // Generate QR data URLs locally
            const ticketsWithQRs = await Promise.all(res.data.map(async (t) => {
                const qr = await QRCode.toDataURL(t.folio);
                return { ...t, qrCodeData: qr, pax: selectedSeat ? 1 : (consolidated ? quantity : 1) };
            }));

            setJustGeneratedTickets(ticketsWithQRs);
            setIsPreviewOpen(true);
            setTickets(ticketsWithQRs); 

            // Auto-save to server in background
            setTimeout(() => saveImagesToServer(ticketsWithQRs), 1500);

            if (selectedSeat) setSelectedSeat('');
            fetchExistingTickets();

        } catch (error) {
            console.error("Error generating tickets", error);
            alert("Error al generar tickets. Verifique la conexión.");
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

    const handleRedownload = async (ticket) => {
        const qr = await QRCode.toDataURL(ticket.folio);
        const tWithQR = { ...ticket, qrCodeData: qr };
        setJustGeneratedTickets([tWithQR]);
        setIsPreviewOpen(true);
    };

    const saveImagesToServer = async (ticketList) => {
        for (const ticket of ticketList) {
            try {
                // Ensure they are rendered in the DOM before capturing
                await new Promise(r => setTimeout(r, 200));

                const desktopImg = await captureElement(`ticket-${ticket.folio}`, 800, 220);
                const mobileImg = await captureElement(`mobile-ticket-${ticket.folio}`, 450, 800);
                
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

    const captureElement = async (id, w, h) => {
        const element = document.getElementById(id);
        if (!element) return null;
        const canvas = await html2canvas(element, { scale: 2, width: w, height: h, useCORS: true, backgroundColor: '#ffffff' });
        return canvas.toDataURL('image/jpeg', 0.9);
    };

    const handleDownloadAllZip = async (mode = 'desktop') => {
        if (existingTickets.length === 0) return;
        setIsGenerating(true); 
        try {
            console.log("Preparando historial para descarga por lote...");
            // Trigger preview with all existing tickets to allow the modal to handle the ZIP capture
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
            console.log(`Iniciando compresión de lote JPG (${mode})...`);
            const zip = new JSZip();
            for (const ticket of tickets) {
                const elementId = mode === 'desktop' ? `ticket-${ticket.folio}` : `mobile-ticket-${ticket.folio}`;
                const element = document.getElementById(elementId);
                
                if (element) {
                    const canvas = await html2canvas(element, { 
                        scale: 2, 
                        useCORS: true, 
                        backgroundColor: '#ffffff'
                    });
                    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
                    zip.file(`Boleto-${ticket.folio}-${mode}.jpg`, blob);
                }
            }
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `Lote-${event.name}-${mode}.zip`);
            console.log("ZIP generado y descargado.");
        } catch (error) {
            console.log("Error ZIP:", error);
            alert("Error al generar el ZIP. Reintente.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!event) return <div className="p-8 text-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin mx-auto" /> Cargo evento...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="border-b border-slate-700 pb-6">
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

                    {/* Quantity or Seat Selection */}
                    {availableSeats.length > 0 ? (
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Asignar Asiento</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={selectedSeat}
                                onChange={e => {
                                    setSelectedSeat(e.target.value);
                                    if (e.target.value) setQuantity(1); // Force qty 1 if seat selected
                                }}
                            >
                                <option value="">-- Sin Asiento / General --</option>
                                {availableSeats.map(seat => (
                                    <option key={seat} value={seat}>{seat}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
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
                            id={`ticket-${ticket.folio}`}
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

            {/* Hidden Render Lists for ZIP/Auto-Save (Rescue Version) */}
            <div 
                style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: '-3000px', 
                    zIndex: -100, 
                    opacity: 0, 
                    pointerEvents: 'none',
                    background: '#0f172a'
                }}
            >
                {tickets.map((ticket, idx) => (
                    <div
                        key={`mobile-capture-${idx}`}
                        id={`mobile-ticket-${ticket.folio}`}
                        className="bg-[#0f172a] text-white relative flex flex-col items-center p-14 overflow-hidden"
                        style={{ width: '450px', height: '800px' }} 
                    >
                        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700"></div>
                        
                        <div className="w-full mb-16 mt-6 flex items-center justify-center">
                            <div className="flex items-center gap-6 py-3 px-8 bg-slate-900 rounded-[2rem] border border-slate-800/50 shadow-inner">
                                <span className="text-7xl font-black text-indigo-500 tracking-tighter">T-λ</span>
                                <div className="w-[3px] h-14 bg-slate-800"></div>
                                <div className="text-left font-black">
                                    <p className="text-xs uppercase text-slate-500 tracking-[0.3em] leading-none mb-1">Lambda</p>
                                    <p className="text-2xl text-white leading-none">TICKET</p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full text-center px-6 mb-4">
                            <h2 className="text-4xl font-black uppercase text-white leading-tight tracking-tighter opacity-90">
                                {event.name}
                            </h2>
                            <p className="text-2xl text-indigo-400 font-black mt-2">
                                {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <div className="h-1.5 w-16 bg-indigo-600 mx-auto mt-6 rounded-full"></div>
                        </div>

                        <div className="my-auto">
                            <div className="bg-white p-8 rounded-[3rem] shadow-2xl">
                                <TicketQR folio={ticket.folio} size={220} />
                            </div>
                        </div>

                        {/* REPAIRED NAME BOX FOR ZIPs */}
                        <div className="w-[85%] mx-auto mt-12 bg-slate-900/60 p-10 rounded-[3rem] border border-white/5 text-left overflow-visible">
                            <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Invitado Especial</p>
                            <p className="text-4xl font-black text-white break-words leading-tight">
                                {ticket.holderName}
                            </p>
                            {ticket.seatId && (
                                <div className="pt-4 border-t border-white/10 mt-4">
                                    <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Ubicación</p>
                                    <p className="text-3xl font-black text-white">{ticket.seatId}</p>
                                </div>
                            )}
                        </div>

                        <div className="w-full mt-16 mb-6 text-center">
                            <p className="font-mono text-sm font-black text-slate-600 uppercase tracking-[0.8em]">
                                {ticket.folio.split('-').pop()}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Hidden Render List para Tiras (Desktop/ZIP) - GHOST RENDERER PRO */}
            <div 
                style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    zIndex: -1000, 
                    opacity: 0.01, 
                    pointerEvents: 'none',
                }}
            >
                {tickets.map((ticket, idx) => (
                    <div 
                        key={`desktop-capture-${idx}`}
                        id={`ticket-${ticket.folio}`} 
                        className="bg-[#0f172a] text-white flex overflow-hidden relative shrink-0"
                        style={{ width: '800px', height: '220px' }}
                    >
                        <div className="w-1/4 bg-slate-900 border-r border-white/5 flex items-center justify-center relative overflow-hidden">
                            <span className="text-white/10 font-black text-8xl -rotate-90 tracking-tighter opacity-20 absolute top-0 left-0 transform -translate-x-12">LAMBDA</span>
                            <span className="text-white font-black text-8xl tracking-tighter italic relative z-10">T-λ</span>
                        </div>
                        
                        <div className="flex-1 p-10 flex flex-col justify-between relative bg-gradient-to-br from-slate-900 to-indigo-950 text-left">
                            <div>
                                <div className="flex items-center gap-4 mb-4">
                                    <span className="bg-indigo-600 text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full">Official Event</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(event.date).toLocaleDateString()}</span>
                                </div>
                                <h1 className="text-5xl font-black uppercase text-white leading-none tracking-tighter">{event.name}</h1>
                            </div>
                            
                            <div className="flex justify-between items-end border-t border-white/10 pt-8">
                                <div>
                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] mb-2">Portador</p>
                                    <p className="font-black text-4xl leading-none text-white tracking-tight">{ticket.holderName}</p>
                                </div>
                                <div className="flex gap-10 text-right">
                                    <div>
                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] mb-1">Apertura</p>
                                        <p className="font-black text-3xl leading-none text-white">{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    {ticket.seatId && (
                                        <div>
                                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] mb-1">Zona</p>
                                            <p className="font-black text-3xl leading-none text-indigo-400 italic">{ticket.seatId}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="w-[220px] bg-white p-10 flex flex-col items-center justify-center relative shadow-inner">
                            <div className="absolute inset-y-0 left-[-1px] w-[2px] border-l-2 border-dashed border-slate-900/10"></div>
                            <TicketQR folio={ticket.folio} size={130} />
                            <p className="font-mono font-black text-[10px] tracking-[0.5em] text-slate-400 mt-6 uppercase">{ticket.folio.split('-').pop()}</p>
                        </div>
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

// Sub-componente de QR compartido para asegurar visibilidad total y evitar iconos rotos
const TicketQR = ({ folio, size = 120 }) => {
    const [qrData, setQrData] = useState('');

    useEffect(() => {
        if (folio) {
            QRCode.toDataURL(folio, { 
                margin: 0, 
                width: size * 2, 
                color: { dark: '#000000', light: '#ffffff' }
            })
            .then(url => setQrData(url))
            .catch(err => console.error("QR Local Error", err));
        }
    }, [folio, size]);

    if (!qrData) return <div className="animate-pulse bg-slate-100 rounded-xl" style={{ width: size, height: size }}></div>;
    return <img src={qrData} alt="QR" className="object-contain" style={{ width: size, height: size }} />;
};
