import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, Plus, QrCode, Trash2, Edit2, CheckCircle, XCircle, Camera, Download, FileText, Smartphone, User } from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

export default function StaffProfiles() {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', role: 'Mesero', photo: '' });
    const [badgeData, setBadgeData] = useState(null); // Data for the Badge Modal
    const [qrPreview, setQrPreview] = useState(null);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const res = await api.get('/staff');
            setStaffList(res.data);
        } catch (error) {
            console.error("Error fetching staff", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, photo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/staff', formData);
            setShowForm(false);
            setFormData({ name: '', role: 'Mesero', photo: '' });
            fetchStaff();
        } catch (error) {
            const msg = error?.response?.data?.error || error?.message || 'Error desconocido';
            alert(`Error al guardar empleado: ${msg}`);
            console.error('Staff creation error:', error?.response?.data);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar personal?')) return;
        try {
            await api.delete(`/staff/${id}`);
            fetchStaff();
        } catch (error) {
            console.error(error);
        }
    };

    const stripOklch = (clonedDoc) => {
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach(el => {
            const style = el.getAttribute('style') || '';
            if (style.includes('oklch')) {
                el.setAttribute('style', style.replace(/oklch\([^)]+\)/g, '#1e293b'));
            }
            ['color','backgroundColor','borderColor'].forEach(prop => {
                if (el.style[prop] && el.style[prop].includes('oklch')) {
                    el.style[prop] = '#1e293b';
                }
            });
        });
    };

    const downloadBadge = async (id) => {
        const element = document.getElementById(id);
        if (!element) return;
        
        try {
            const canvas = await html2canvas(element, { 
                scale: 2, 
                backgroundColor: '#0f172a',
                useCORS: true,
                allowTaint: true,
                onclone: (_doc, _el) => stripOklch(_el.ownerDocument)
            });
            canvas.toBlob((blob) => {
                saveAs(blob, `Badge-${badgeData.name}.jpg`);
            }, 'image/jpeg', 0.95);
        } catch (error) {
            console.error(error);
        }
    };

    const showBadge = async (staff) => {
        try {
            const url = await QRCode.toDataURL(staff.qrCodeData);
            setBadgeData({ ...staff, qrUrl: url });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header className="border-b border-slate-700 pb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white flex items-center tracking-tighter">
                        <Users className="w-10 h-10 mr-4 text-indigo-500" />
                        Personal Lambda
                    </h2>
                    <p className="text-slate-400 mt-2 font-medium">Gestiona tu equipo y genera credenciales de acceso inteligente.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl flex items-center transition-all font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95"
                >
                    <Plus className="w-5 h-5 mr-3" />
                    Nuevo Perfil
                </button>
            </header>

            {/* Form */}
            {showForm && (
                <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl max-w-3xl mx-auto relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] -mr-32 -mt-32"></div>
                    
                    <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3 relative z-10">
                        <FileText className="text-indigo-400" />
                        Detalles del Empleado
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Nombre Completo</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ej. Juan Pérez"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Rol / Puesto</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="Mesero">Mesero</option>
                                        <option value="Seguridad">Seguridad</option>
                                        <option value="Bartender">Bartender</option>
                                        <option value="Staff General">Staff General</option>
                                        <option value="DJ">DJ / Entretenimiento</option>
                                        <option value="Supervisores">Supervisores</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-center">
                                <label className="block w-full text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2 text-center md:text-left">Foto de Identificación</label>
                                <div className="relative group/photo">
                                    <div className="w-48 h-48 bg-slate-950 border-2 border-dashed border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-indigo-500">
                                        {formData.photo ? (
                                            <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center p-4">
                                                <Camera className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Cargar Foto</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handlePhotoChange}
                                        />
                                    </div>
                                    {formData.photo && (
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({...formData, photo: ''})}
                                            className="absolute -top-2 -right-2 bg-red-600 text-white p-2 rounded-full shadow-lg"
                                        >
                                            <XCircle size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-slate-800/50">
                            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all">
                                Guardar Perfil
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {staffList.map(staff => (
                    <div key={staff.id} className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl hover:border-indigo-500/50 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-[50px] -mr-16 -mt-16"></div>
                        
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className="w-20 h-20 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
                                {staff.photo ? (
                                    <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-black text-indigo-500 opacity-30">{staff.name.charAt(0)}</span>
                                )}
                            </div>
                            <div className="flex space-x-3">
                                <button onClick={() => handleDelete(staff.id)} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white p-3 rounded-xl transition-all shadow-lg active:scale-90">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="relative z-10 mb-8">
                            <h3 className="text-2xl font-black text-white tracking-tight truncate">{staff.name}</h3>
                            <p className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.2em] mt-1">{staff.role}</p>
                        </div>

                        <div className="border-t border-slate-800 pt-6 flex justify-between items-center relative z-10">
                            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${staff.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                                {staff.isActive ? <CheckCircle className="w-3 h-3 mr-2" /> : <XCircle className="w-3 h-3 mr-2" />}
                                {staff.isActive ? "Activo" : "Inactivo"}
                            </span>
                            <button
                                onClick={() => showBadge(staff)}
                                className="bg-white hover:bg-slate-100 text-slate-900 px-6 py-2.5 rounded-xl flex items-center font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95"
                            >
                                <Smartphone className="w-4 h-4 mr-2" />
                                Badge QR
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Badge/ID Modal */}
            {badgeData && (
                <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setBadgeData(null)}>
                    <div className="max-w-sm w-full flex flex-col gap-6" onClick={e => e.stopPropagation()}>
                        <div id="staff-badge-container" className="bg-[#0f172a] p-10 rounded-[4rem] text-center shadow-[0_0_100px_rgba(79,70,229,0.2)] border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[180px] bg-indigo-600"></div>
                            <div className="absolute top-[170px] left-[-20px] right-[-20px] h-10 bg-[#0f172a] rounded-[100%] shadow-2xl"></div>
                            
                            <div className="relative z-10">
                                <div className="flex items-center justify-center gap-4 mb-10 text-white">
                                    <span className="text-4xl font-black tracking-tighter">T-λ</span>
                                    <div className="w-[2px] h-8 bg-white/20"></div>
                                    <div className="text-left font-black">
                                        <p className="text-[8px] uppercase tracking-[0.3em] leading-none mb-1 opacity-60">Lambda</p>
                                        <p className="text-lg leading-none">STAFF</p>
                                    </div>
                                </div>

                                <div className="w-48 h-48 mx-auto bg-slate-950 rounded-[3rem] border-4 border-[#0f172a] shadow-2xl overflow-hidden -mt-4 mb-6">
                                    {badgeData.photo ? (
                                        <img src={badgeData.photo} alt="Staff" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-900 border-4 border-slate-950">
                                            <User className="w-20 h-20 text-slate-700" />
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-3xl font-black text-white mb-2 leading-none">{badgeData.name}</h3>
                                <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.4em] mb-10">{badgeData.role}</p>

                                <div className="bg-white p-6 rounded-[3rem] shadow-2xl mb-8 flex flex-col items-center">
                                    <img src={badgeData.qrUrl} alt="QR" className="w-40 h-40" />
                                    <p className="text-[8px] font-black text-slate-400 mt-4 uppercase tracking-[0.5em]">ID: {badgeData.id}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => downloadBadge('staff-badge-container')}
                                className="flex-1 bg-white hover:bg-slate-100 text-slate-950 py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-2xl"
                            >
                                <Download size={18} />
                                Descargar
                            </button>
                            <button
                                onClick={() => setBadgeData(null)}
                                className="bg-white/5 hover:bg-white/10 text-white px-8 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] border border-white/10 transition-all active:scale-95"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
