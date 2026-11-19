import { useState } from 'react';
import api from '../api/axios';
import QRScanner from '../components/QRScanner';
import { CheckCircle, XCircle, ScanLine, Keyboard } from 'lucide-react';

export default function Scanner() {
    const [scanResult, setScanResult] = useState(null);
    const [message, setMessage] = useState('');
    const [ticketData, setTicketData] = useState(null);
    const [manualFolio, setManualFolio] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    const validateTicket = async (qrData) => {
        if (!qrData || isValidating) return;
        setIsValidating(true);
        try {
            const res = await api.post('/tickets/validate', { qrData: qrData.trim() });
            setScanResult('success');
            setMessage(res.data.message);
            setTicketData(res.data.ticket);
        } catch (error) {
            setScanResult('error');
            setMessage(error.response?.data?.error || 'Error al validar el boleto');
            setTicketData(error.response?.data?.ticket || null);
        } finally {
            setIsValidating(false);
        }
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (!manualFolio.trim()) return;
        validateTicket(manualFolio);
    };

    const resetScanner = () => {
        setScanResult(null);
        setMessage('');
        setTicketData(null);
        setManualFolio('');
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <header className="border-b border-slate-800 pb-5">
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    <ScanLine className="w-6 h-6 text-indigo-400" />
                    Control de Acceso QR
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                    Escanea el código del boleto con la cámara, sube una imagen o ingresa el folio manualmente.
                </p>
            </header>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                {!scanResult ? (
                    <>
                        <QRScanner onScan={validateTicket} />

                        <div className="border-t border-slate-800 pt-5">
                            <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Keyboard className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Ingresar folio manual (ej. GEN-1732...-A1B2)"
                                        value={manualFolio}
                                        onChange={e => setManualFolio(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isValidating || !manualFolio.trim()}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                                >
                                    Validar Folio
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="py-4 text-center space-y-5">
                        {scanResult === 'success' ? (
                            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
                        ) : (
                            <XCircle className="w-16 h-16 text-red-400 mx-auto" />
                        )}

                        <div>
                            <h3 className={`text-xl font-bold ${scanResult === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {message}
                            </h3>
                        </div>

                        {ticketData && (
                            <div className="text-left bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2 text-sm text-slate-300">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Folio</span>
                                    <span className="font-mono font-semibold text-indigo-300">{ticketData.folio}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Portador</span>
                                    <span className="font-semibold text-white">{ticketData.holderName}</span>
                                </div>
                                {ticketData.seatId && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Asiento</span>
                                        <span className="font-semibold text-indigo-400">{ticketData.seatId}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Personas</span>
                                    <span className="font-semibold text-white">{ticketData.pax || 1}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Estado</span>
                                    <span className="uppercase text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200">{ticketData.status}</span>
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={resetScanner}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors"
                        >
                            Escanear Siguiente Boleto
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
