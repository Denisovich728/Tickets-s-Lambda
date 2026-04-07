import React, { useState, useEffect, useRef } from 'react';
import { X, Download, CheckCircle2, Archive as ZipIcon, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Local QR renderer using data URL
const TicketQR = ({ folio, size = 128 }) => {
    const [qrData, setQrData] = useState('');

    useEffect(() => {
        if (folio) {
            QRCode.toDataURL(folio, {
                margin: 0,
                width: size * 2,
                color: { dark: '#000000', light: '#ffffff' }
            })
            .then(url => setQrData(url))
            .catch(err => console.error('QR Error', err));
        }
    }, [folio, size]);

    if (!qrData) return <div style={{ width: size, height: size, background: '#e2e8f0', borderRadius: 8 }} />;
    return <img src={qrData} alt="QR" style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />;
};

// Ticket visual — rendered inline in the preview.
// Uses 100% inline hex styles so html-to-image captures it perfectly.
const TicketCard = React.forwardRef(({ ticket, event, mode }, ref) => {
    const isMobile = mode === 'mobile';

    const C = {
        bg:       '#0f172a',
        bg900:    '#1e293b',
        bg800:    '#1e1b4b',
        indigo:   '#6366f1',
        ind600:   '#4f46e5',
        sl400:    '#94a3b8',
        sl500:    '#64748b',
        sl600:    '#475569',
        white:    '#ffffff',
        accent:   '#a5b4fc',
    };

    if (isMobile) {
        return (
            <div ref={ref} style={{
                width: 450, height: 800,
                backgroundColor: C.bg,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                overflow: 'hidden', position: 'relative',
                fontFamily: 'Arial, Helvetica, sans-serif',
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, backgroundColor: C.indigo }} />

                <div style={{ width: '100%', marginTop: 44, marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 36px', backgroundColor: C.bg900, borderRadius: 40, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: 44, fontWeight: 900, color: C.indigo, letterSpacing: -2 }}>T-λ</span>
                        <div style={{ width: 2, height: 36, backgroundColor: C.sl600 }} />
                        <div>
                            <p style={{ fontSize: 9, fontWeight: 900, color: C.sl500, textTransform: 'uppercase', letterSpacing: 4, margin: '0 0 3px 0' }}>Lambda</p>
                            <p style={{ fontSize: 18, fontWeight: 900, color: C.white, margin: 0 }}>TICKET</p>
                        </div>
                    </div>
                </div>

                <div style={{ width: '100%', textAlign: 'center', padding: '0 36px', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 38, fontWeight: 900, textTransform: 'uppercase', color: C.white, lineHeight: 1, letterSpacing: -1, margin: '0 0 14px 0' }}>
                        {event?.name}
                    </h2>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.05)', padding: '7px 22px', borderRadius: 999 }}>
                        <span style={{ fontSize: 12, color: C.accent, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 3 }}>
                            {new Date(event?.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', margin: 'auto 0' }}>
                    <div style={{ backgroundColor: C.white, padding: 28, borderRadius: 44, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                        <TicketQR folio={ticket.folio} size={200} />
                    </div>
                </div>

                <div style={{ width: '82%', margin: '32px auto 0', backgroundColor: 'rgba(30,41,59,0.85)', padding: 28, borderRadius: 44, border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
                    <p style={{ fontSize: 9, fontWeight: 900, color: C.sl500, textTransform: 'uppercase', letterSpacing: 5, margin: '0 0 6px 0' }}>Invitado</p>
                    <h3 style={{ fontSize: 30, fontWeight: 900, color: C.white, wordBreak: 'break-word', lineHeight: 1.1, margin: '0 0 12px 0' }}>
                        {ticket.holderName}
                    </h3>
                    {ticket.seatId && (
                        <div style={{ paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: 9, fontWeight: 900, color: C.sl500, textTransform: 'uppercase', letterSpacing: 4, margin: 0 }}>Ubicación</p>
                            <p style={{ fontSize: 26, fontWeight: 900, color: C.accent, margin: 0 }}>{ticket.seatId}</p>
                        </div>
                    )}
                </div>

                <div style={{ width: '100%', textAlign: 'center', marginTop: 'auto', marginBottom: 28, opacity: 0.38 }}>
                    <p style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 900, color: C.sl500, textTransform: 'uppercase', letterSpacing: 6, margin: 0 }}>
                        {ticket.folio.split('-').pop()}
                    </p>
                </div>
            </div>
        );
    }

    // DESKTOP
    return (
        <div ref={ref} style={{
            width: 800, height: 220,
            display: 'flex', flexDirection: 'row',
            fontFamily: 'Arial, Helvetica, sans-serif',
            overflow: 'hidden',
        }}>
            <div style={{ width: 190, backgroundColor: C.bg900, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${C.bg900}, ${C.bg800})` }}>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 900, fontSize: 68, fontStyle: 'italic', letterSpacing: -3 }}>T-λ</span>
            </div>

            <div style={{ flex: 1, padding: '28px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: `linear-gradient(135deg, ${C.bg900} 0%, ${C.bg800} 100%)` }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span style={{ backgroundColor: C.ind600, color: C.white, fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 4, padding: '4px 12px', borderRadius: 999 }}>Official Event</span>
                        <span style={{ fontSize: 9, color: C.sl500, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3 }}>{new Date(event?.date).toLocaleDateString()}</span>
                    </div>
                    <h1 style={{ fontSize: 38, fontWeight: 900, textTransform: 'uppercase', color: C.white, lineHeight: 1, letterSpacing: -2, margin: 0 }}>{event?.name}</h1>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, marginTop: 10 }}>
                    <div>
                        <p style={{ fontSize: 8, color: C.sl500, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 5, margin: '0 0 3px 0' }}>Portador</p>
                        <p style={{ fontWeight: 900, fontSize: 30, color: C.white, letterSpacing: -1, margin: 0 }}>{ticket.holderName}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 28, textAlign: 'right' }}>
                        <div>
                            <p style={{ fontSize: 8, color: C.sl500, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 4, margin: '0 0 3px 0' }}>Apertura</p>
                            <p style={{ fontWeight: 900, fontSize: 26, color: C.white, margin: 0 }}>{new Date(event?.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        {ticket.seatId && (
                            <div>
                                <p style={{ fontSize: 8, color: C.sl500, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 4, margin: '0 0 3px 0' }}>Zona</p>
                                <p style={{ fontWeight: 900, fontSize: 26, color: C.accent, fontStyle: 'italic', margin: 0 }}>{ticket.seatId}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ width: 175, backgroundColor: C.white, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '2px dashed rgba(15,23,42,0.12)', padding: 20 }}>
                <TicketQR folio={ticket.folio} size={115} />
                <p style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 8, letterSpacing: 4, color: C.sl400, marginTop: 12, textTransform: 'uppercase', textAlign: 'center' }}>
                    {ticket.folio.split('-').pop()}
                </p>
            </div>
        </div>
    );
});

export default function TicketPreviewModal({ isOpen, onClose, tickets, event }) {
    const [viewMode, setViewMode] = useState('desktop');
    const [isDownloading, setIsDownloading] = useState(false);
    // Map of ticket folio -> ref
    const cardRefs = useRef({});

    if (!isOpen || !tickets || tickets.length === 0) return null;

    const captureCard = async (folio, filename) => {
        const node = cardRefs.current[folio];
        if (!node) throw new Error('Card not found: ' + folio);

        const dataUrl = await toJpeg(node, {
            quality: 0.96,
            pixelRatio: 2,
            backgroundColor: '#0f172a',
            skipFonts: true,  // avoids web font CORS issues
        });
        return { dataUrl };
    };

    const handleDownload = async (ticket) => {
        if (isDownloading) return;
        setIsDownloading(true);
        try {
            // Wait a tick for QR image to render
            await new Promise(r => setTimeout(r, 600));
            const { dataUrl } = await captureCard(ticket.folio, `Boleto-${ticket.folio}-${viewMode}`);
            saveAs(dataUrl, `Boleto-${ticket.folio}-${viewMode}.jpg`);
        } catch (err) {
            console.error('Download Error', err);
            alert('Error al descargar: ' + err.message);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadAll = async () => {
        if (isDownloading) return;
        setIsDownloading(true);
        const zip = new JSZip();
        try {
            await new Promise(r => setTimeout(r, 600));
            for (const ticket of tickets) {
                const { dataUrl } = await captureCard(ticket.folio, ticket.folio);
                // dataUrl is "data:image/jpeg;base64,..."
                const base64 = dataUrl.split(',')[1];
                zip.file(`Boleto-${ticket.folio}-${viewMode}.jpg`, base64, { base64: true });
            }
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `Lote-${event?.name || 'Tickets'}.zip`);
        } catch (err) {
            console.error('Zip Error', err);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl" onClick={onClose} />

            <div className="relative w-full max-w-6xl bg-slate-950 border border-white/5 rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col max-h-[94vh] overflow-hidden animate-in zoom-in-95 duration-500">

                {/* Header */}
                <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md p-10 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-[2rem] flex items-center justify-center border border-indigo-500/20">
                            <Zap size={30} className="animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">PREVIEW PREMIUM</h2>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Lambda λ Generation Engine</p>
                        </div>
                    </div>

                    <div className="flex bg-black p-2 rounded-[2.5rem] border border-white/5 shadow-inner">
                        <button onClick={() => setViewMode('desktop')} className={`px-12 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'desktop' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30' : 'text-slate-500 hover:text-white'}`}>Tira Desktop</button>
                        <button onClick={() => setViewMode('mobile')} className={`px-12 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'mobile' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30' : 'text-slate-500 hover:text-white'}`}>Móvil 9:16</button>
                    </div>

                    <div className="flex items-center gap-6">
                        <button onClick={handleDownloadAll} disabled={isDownloading} className="flex items-center gap-4 px-10 py-5 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-50 rounded-[2rem] transition-all font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl active:scale-95">
                            {isDownloading ? <Loader2 className="animate-spin" size={20} /> : <ZipIcon size={20} />} Descargar Lote (.zip)
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-300 hover:text-white transition-colors"><X size={40} /></button>
                    </div>
                </header>

                {/* Ticket list */}
                <div className="flex-1 p-10 space-y-20 overflow-y-auto bg-[radial-gradient(circle_at_top_right,_#1e1b4b_0%,_#0a0a0f_50%)] scrollbar-hide">
                    {tickets.map((ticket, idx) => (
                        <div key={ticket.folio} className="space-y-10 animate-in slide-in-from-bottom-8 duration-500">
                            {/* Row header */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-2xl flex items-center justify-center text-xl font-black">{idx + 1}</div>
                                    <div>
                                        <p className="text-2xl font-black text-white uppercase tracking-tight leading-none">{ticket.holderName}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-2 italic">Lambda ID: {ticket.folio.split('-').pop()}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDownload(ticket)}
                                    disabled={isDownloading}
                                    className="flex items-center gap-4 px-10 py-5 bg-white/5 hover:bg-white/10 text-white rounded-[2rem] transition-all font-black text-[10px] uppercase tracking-[0.3em] border border-white/10 group active:scale-95 disabled:opacity-50"
                                >
                                    {isDownloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} className="text-indigo-400 group-hover:translate-y-1 transition-transform" />} JPG HD
                                </button>
                            </div>

                            {/* Ticket card preview — this is what gets captured */}
                            <div className="flex items-center justify-center py-4">
                                <div
                                    style={{
                                        transform: viewMode === 'mobile' ? 'scale(0.68)' : 'scale(1)',
                                        transformOrigin: 'top center',
                                        marginBottom: viewMode === 'mobile' ? -260 : 0,
                                        borderRadius: viewMode === 'mobile' ? 48 : 24,
                                        overflow: 'hidden',
                                        boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
                                    }}
                                >
                                    <TicketCard
                                        ref={el => cardRefs.current[ticket.folio] = el}
                                        ticket={ticket}
                                        event={event}
                                        mode={viewMode}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <footer className="p-10 bg-slate-950/80 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <ShieldCheck className="text-emerald-500" size={32} />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em]">Procesamiento Seguro • Lambda Certified Preview</p>
                    </div>
                    <button onClick={onClose} className="px-24 py-5 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-[2.5rem] uppercase tracking-[0.4em] text-xs shadow-3xl transition-all active:scale-95">Finalizar Pre-Impresión</button>
                </footer>
            </div>
        </div>
    );
}
