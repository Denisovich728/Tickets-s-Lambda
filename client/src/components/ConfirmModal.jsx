import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Eliminar", 
  cancelText = "Cancelar",
  variant = "danger" 
}) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20",
        warning: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20",
        info: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
                onClick={onCancel}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 ease-out">
                {/* Decoration */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-500/5 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="p-8 pb-10">
                    <div className="flex justify-between items-start mb-6">
                        <div className={`p-4 rounded-2xl ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            <AlertTriangle size={32} />
                        </div>
                        <button 
                            onClick={onCancel}
                            className="p-2 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <h2 className="text-3xl font-bold text-white tracking-tight mb-2 uppercase">{title}</h2>
                    <p className="text-slate-400 text-lg leading-relaxed">{message}</p>
                </div>

                <div className="p-8 pt-0 flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all uppercase tracking-widest text-sm"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-[1.5] px-8 py-4 rounded-2xl font-black transition-all uppercase tracking-widest text-sm shadow-xl active:scale-[0.98] ${variantStyles[variant]}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
