import { useEffect, useRef, useState } from 'react';
import { RefreshCw, XCircle, Upload, Camera } from 'lucide-react';
import { decodeQRFromImageData } from '../utils/qrDecoder';

export default function QRScanner({ onScan }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const scanningRef = useRef(false);
    const streamRef = useRef(null);
    const onScanRef = useRef(onScan);
    onScanRef.current = onScan;

    const [error, setError] = useState(null);
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [selectedDeviceId]);

    const stopCamera = () => {
        scanningRef.current = false;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const startCamera = async () => {
        stopCamera();
        try {
            setError(null);
            if (!navigator.mediaDevices?.getUserMedia) {
                setError('Tu navegador no permite acceso a la cámara en este contexto.');
                return;
            }

            const constraints = selectedDeviceId
                ? { video: { deviceId: { exact: selectedDeviceId } } }
                : { video: { facingMode: 'environment' } };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (navigator.mediaDevices.enumerateDevices) {
                const allDevices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = allDevices.filter(d => d.kind === 'videoinput');
                setDevices(videoInputs);
            }

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsinline', 'true');
                await videoRef.current.play();
                scanningRef.current = true;
                requestAnimationFrame(scanLoop);
            }
        } catch (err) {
            console.error('Camera Error:', err);
            setError('No se pudo acceder a la cámara. Verifica los permisos o usa ingreso manual.');
        }
    };

    const scanLoop = () => {
        if (!scanningRef.current || !videoRef.current) return;
        const video = videoRef.current;

        if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
            let canvas = canvasRef.current;
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvasRef.current = canvas;
            }

            // Downscale large streams to ~640px max for fast real-time decoding
            const maxDim = 640;
            const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight));
            const w = Math.floor(video.videoWidth * scale);
            const h = Math.floor(video.videoHeight * scale);

            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(video, 0, 0, w, h);
            const imageData = ctx.getImageData(0, 0, w, h);

            const decoded = decodeQRFromImageData(imageData.data, w, h);
            if (decoded) {
                scanningRef.current = false;
                stopCamera();
                onScanRef.current(decoded);
                return;
            }
        }

        requestAnimationFrame(scanLoop);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDim = 900;
            const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
            canvas.width = Math.floor(img.width * scale);
            canvas.height = Math.floor(img.height * scale);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);

            const decoded = decodeQRFromImageData(imageData.data, canvas.width, canvas.height);
            if (decoded) {
                stopCamera();
                onScanRef.current(decoded);
            } else {
                setError('No se detectó ningún código QR válido en la imagen.');
            }
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            setError('No se pudo cargar la imagen seleccionada.');
        };
        img.src = url;
        e.target.value = '';
    };

    return (
        <div className="flex flex-col items-center space-y-4 w-full">
            <div className="relative w-full max-w-sm aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-700/80 shadow-xl">
                {!error ? (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-8 border-2 border-indigo-400/60 rounded-xl pointer-events-none" />
                        <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-indigo-500 shadow-[0_0_12px_#6366f1] animate-scan-line pointer-events-none" />
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/85 border border-slate-700/80 backdrop-blur-md px-3.5 py-1.5 rounded-full">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="text-[11px] font-semibold text-slate-200 tracking-wide">Motor QR Propio Activo</span>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center gap-3 bg-slate-950">
                        <XCircle className="text-red-400" size={40} />
                        <p className="text-sm font-medium text-red-300 leading-relaxed">{error}</p>
                        <button
                            type="button"
                            onClick={startCamera}
                            className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
                        >
                            <RefreshCw size={14} /> Reintentar cámara
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 w-full max-w-sm">
                {devices.length > 1 && (
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
                        <Camera size={14} className="text-slate-400" />
                        <select
                            className="bg-transparent text-slate-200 focus:outline-none"
                            value={selectedDeviceId}
                            onChange={e => setSelectedDeviceId(e.target.value)}
                        >
                            <option value="" className="bg-slate-900">Cámara predeterminada</option>
                            {devices.map((d, idx) => (
                                <option key={d.deviceId} value={d.deviceId} className="bg-slate-900">
                                    {d.label || `Cámara ${idx + 1}`}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors"
                >
                    <Upload size={14} /> Leer QR desde imagen
                </button>
            </div>
        </div>
    );
}
