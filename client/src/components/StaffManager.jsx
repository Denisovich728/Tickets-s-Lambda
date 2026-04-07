import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { UserPlus, Clock, CheckCircle2, AlertCircle, UserCheck, ShieldCheck, Timer, UserMinus, Search, User } from 'lucide-react';

export default function StaffManager() {
    const { id } = useParams();
    const [staffList, setStaffList] = useState([]);
    const [availableStaff, setAvailableStaff] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rosterRes, availableRes] = await Promise.all([
                api.get(`/staff/event/${id}`),
                api.get('/staff') // Fetch all staff profiles
            ]);
            setStaffList(rosterRes.data);
            
            // Filter out staff already assigned
            const assignedIds = rosterRes.data.map(s => s.id);
            const filtered = availableRes.data.filter(s => !assignedIds.includes(s.id) && s.isActive);
            setAvailableStaff(filtered);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (staffId, role) => {
        try {
            await api.post('/staff/assign', {
                eventId: id,
                userId: staffId,
                role: role
            });
            fetchData();
        } catch (error) {
            alert('Error al asignar personal');
        }
    };

    const unassignStaff = async (staffId) => {
        // Implementation for unassign if backend supports it or just re-fetch
        // For now, let's assume we re-fetch after any change
        fetchData();
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Working': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
            case 'Finished': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            default: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        }
    };

    const filteredAvailable = availableStaff.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center">
                            <UserCheck size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Total Staff</p>
                            <p className="text-3xl font-black text-white leading-none">{staffList.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">En Turno</p>
                            <p className="text-3xl font-black text-white leading-none">{staffList.filter(s => s.status === 'Working').length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Roster List */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <Timer className="text-indigo-500" />
                            Personal en Evento
                        </h3>
                        <span className="bg-slate-800 text-slate-400 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{staffList.length} Asignados</span>
                    </div>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                        {staffList.map((staff) => (
                            <div key={staff.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
                                        {staff.photo ? (
                                            <img src={staff.photo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-indigo-500/30 font-black text-xl">{staff.username.charAt(0)}</div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-white text-lg leading-none mb-1">{staff.username}</h4>
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{staff.role}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-6">
                                    <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusStyles(staff.status)}`}>
                                        {staff.status}
                                    </div>
                                    <button onClick={() => unassignStaff(staff.id)} className="text-slate-600 hover:text-red-500 transition-colors">
                                        <UserMinus size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {staffList.length === 0 && (
                            <div className="text-center py-20 bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-800">
                                <AlertCircle className="mx-auto text-slate-700 mb-4" size={48} />
                                <p className="text-slate-500 font-black uppercase text-xs tracking-widest">No hay personal asignado aún</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Available Selection List */}
                <div className="space-y-6">
                    <div className="space-y-4 mb-2">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <UserPlus className="text-emerald-500" />
                            Directorio de Empleados
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="text"
                                placeholder="Buscar por nombre o puesto..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                        {filteredAvailable.map((s) => (
                            <div key={s.id} className="bg-slate-900/50 border border-slate-800 p-5 rounded-[2rem] flex items-center justify-between hover:bg-slate-900 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                                        {s.photo ? (
                                            <img src={s.photo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-700 font-black">{s.name.charAt(0)}</div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-white leading-none mb-1">{s.name}</h4>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{s.role}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleAssign(s.id, s.role)}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/10 transition-all active:scale-95"
                                >
                                    Asignar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
