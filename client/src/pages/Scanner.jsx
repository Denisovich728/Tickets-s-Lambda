import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../api/axios';
import { CheckCircle, XCircle } from 'lucide-react';

export default function Scanner() {
    const [scanResult, setScanResult] = useState(null);
    const [message, setMessage] = useState('');
    const [ticketData, setTicketData] = useState(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);

        function onScanSuccess(decodedText) {
            // Handle scan once, maybe pause
            validateTicket(decodedText);
            scanner.clear(); // Stop scanning after success to show result
        }

        function onScanFailure(error) {
            // console.warn(`Code scan error = ${error}`);
        }

        return () => {
            scanner.clear().catch(error => console.error("Failed to clear html5-qrcode scanner. ", error));
        };
    }, []);

    const validateTicket = async (qrData) => {
        try {
            const res = await api.post('/tickets/validate', { qrData });
            setScanResult('success');
            setMessage(res.data.message);
            setTicketData(res.data.ticket);
        } catch (error) {
            setScanResult('error');
            setMessage(error.response?.data?.error || 'Error Validating Ticket');
            if (error.response?.data?.ticket) {
                setTicketData(error.response.data.ticket);
            }
        }
    };

    const resetScanner = () => {
        window.location.reload(); // Simple reload to restart scanner or logic to re-init
    };

    return (
        <div className="max-w-md mx-auto bg-white shadow rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Escáner de Boletos</h2>

            {!scanResult && <div id="reader" className="w-full"></div>}

            {scanResult && (
                <div className="mt-8">
                    {scanResult === 'success' ? (
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    ) : (
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    )}

                    <h3 className={`text-xl font-bold ${scanResult === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                    </h3>

                    {ticketData && (
                        <div className="mt-4 text-left bg-gray-50 p-4 rounded">
                            <p><strong>Folio:</strong> {ticketData.folio}</p>
                            <p><strong>Portador:</strong> {ticketData.holderName}</p>
                            <p><strong>Estado:</strong> {ticketData.status}</p>
                        </div>
                    )}

                    <button onClick={resetScanner} className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-full w-full">
                        Escanear Otro
                    </button>
                </div>
            )}
        </div>
    );
}
