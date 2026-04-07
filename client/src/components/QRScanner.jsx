import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, XCircle, AlertCircle } from 'lucide-react';

export default function QRScanner({ onScan, onClose }) {
    const videoRef = useRef(null);
    const [error, setError] = useState(null);
    const [isSupported, setIsSupported] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const scanningRef = useRef(false);

    useEffect(() => {
        // Check for BarcodeDetector support
        if (!('BarcodeDetector' in window)) {
            setIsSupported(false);
            setError("Tu navegador no soporta el escaneo nativo de QR. Por favor usa Chrome o Edge actualizados.");
            return;
        }

        startCamera();

        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute("playsinline", "true");
                setIsScanning(true);
                scanningRef.current = true;
                requestAnimationFrame(scanLoop);
            }
        } catch (err) {
            console.error("Camera Error:", err);
            setError("No se pudo acceder a la cámara. Revisa los permisos.");
        }
    };

    const stopCamera = () => {
        scanningRef.current = false;
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
    };

    const scanLoop = async () => {
        if (!scanningRef.current || !videoRef.current) return;

        // Ensure video is ready
        if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
                // @ts-ignore - BarcodeDetector is a late web standard
                const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
                const barcodes = await barcodeDetector.detect(videoRef.current);
                
                if (barcodes.length > 0) {
                    const decodedText = barcodes[0].rawValue;
                    onScan(decodedText);
                    // Give context feedback before stopping
                    scanningRef.current = false;
                    return;
                }
            } catch (err) {
                // Squelch errors during loop
            }
        }
        
        requestAnimationFrame(scanLoop);
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-sm mx-auto">
            <div className="relative w-full aspect-square bg-slate-900 rounded-[3rem] overflow-hidden border-4 border-indigo-500 shadow-[0_0_50px_rgba(79,70,229,0.3)]">
                {!error && isSupported ? (
                    <>
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            muted 
                            className="w-full h-full object-cover"
                        />
                        {/* Animated Scanner HUD */}
                        <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                             <div className="absolute inset-0 border-2 border-indigo-500/50"></div>
                        </div>
                        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-indigo-500 shadow-[0_0_15px_#4f46e5] animate-scan-line"></div>
                        
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-indigo-600/80 backdrop-blur-md px-4 py-2 rounded-full">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-black uppercase text-white tracking-widest">Escaneando...</span>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-10 text-center gap-4 bg-slate-900">
                        <XCircle className="text-red-500" size={48} />
                        <p className="text-sm font-black uppercase text-red-400 tracking-tight leading-tight">
                            {error || "Cámara Desactivada"}
                        </p>
                        <button 
                            onClick={startCamera}
                            className="mt-4 px-6 py-2 bg-white text-slate-900 rounded-full font-black text-[10px] uppercase tracking-widest"
                        >
                            <RefreshCw size={14} className="inline mr-2" /> Reintentar
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center gap-2 opacity-60">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Alinea el código QR dentro del recuadro</p>
            </div>
        </div>
    );
}

// Add these to your global CSS for the animation
// @keyframes scan-line {
//   0% { top: 0%; }
//   100% { top: 100%; }
// }
// .animate-scan-line { animation: scan-line 2s infinite linear; }
