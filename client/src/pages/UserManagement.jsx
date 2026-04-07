import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Trash2, UserPlus, Shield } from 'lucide-react';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'client' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth');
            setUsers(res.data);
        } catch (error) {
            console.error("Error fetching users", error);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await api.post('/auth/register', newUser);
            setSuccess('Usuario creado correctamente');
            setNewUser({ username: '', password: '', role: 'client' });
            fetchUsers();
        } catch (error) {
            setError(error.response?.data?.error || 'Error creando usuario');
        }
    };

    const handleUpdateRole = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/auth/users/${editingUser.id}`, { role: editingUser.role });
            setEditingUser(null);
            fetchUsers();
            setSuccess('Rol actualizado correctamente');
        } catch (error) {
            setError('Error actualizando rol');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            await api.delete(`/auth/${id}`);
            fetchUsers();
        } catch (error) {
            alert('Error eliminando usuario');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="border-b border-slate-700 pb-6">
                <h2 className="text-3xl font-bold text-gray-100 flex items-center">
                    <Shield className="w-8 h-8 mr-3 text-indigo-500" />
                    Gestión de Usuarios
                </h2>
                <p className="text-slate-400 mt-2">Administra los accesos y roles de la plataforma.</p>
            </header>

            {/* Create User Form */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center"><UserPlus className="w-5 h-5 mr-2 text-indigo-400" /> Crear Nuevo Usuario</h3>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Usuario</label>
                        <input
                            type="text"
                            required
                            className="block w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={newUser.username}
                            onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Contraseña</label>
                        <input
                            type="text"
                            required
                            className="block w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={newUser.password}
                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Rol</label>
                        <select
                            className="block w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={newUser.role}
                            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                        >
                            <option value="client">Cliente (Organizador)</option>
                            <option value="staff">Staff (Empleado)</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 flex items-center justify-center font-bold shadow-lg shadow-indigo-500/20 transition-all">
                        <UserPlus className="w-5 h-5 mr-2" /> Crear
                    </button>
                </form>
                {error && <p className="mt-4 text-sm text-red-400 bg-red-900/20 p-2 rounded-lg border border-red-900/50">{error}</p>}
                {success && <p className="mt-4 text-sm text-emerald-400 bg-emerald-900/20 p-2 rounded-lg border border-emerald-900/50">{success}</p>}
            </div>

            {/* Editing Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 p-8 rounded-2xl max-w-md w-full border border-slate-700">
                        <h3 className="text-xl font-bold text-white mb-4">Editar Rol: {editingUser.username}</h3>
                        <form onSubmit={handleUpdateRole} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Nuevo Rol</label>
                                <select
                                    className="block w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={editingUser.role}
                                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                >
                                    <option value="client">Cliente</option>
                                    <option value="staff">Staff</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 text-slate-300 hover:text-white">Cancelar</button>
                                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Users List */}
            <div className="bg-slate-800 shadow-xl rounded-2xl border border-slate-700 overflow-hidden">
                <ul className="divide-y divide-slate-700">
                    {users.map((user) => (
                        <li key={user.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors">
                            <div className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 font-bold text-lg ${user.role === 'admin' ? 'bg-purple-900/50 text-purple-400 border border-purple-500/30' : 'bg-slate-700 text-slate-300 border border-slate-600'}`}>
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-base font-medium text-white">{user.username}</p>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${user.role === 'admin' ? 'bg-purple-900/30 text-purple-400 border border-purple-500/30' : 'bg-indigo-900/30 text-indigo-400 border border-indigo-500/30'
                                        }`}>
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => setEditingUser(user)} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-900/20 rounded-lg transition-colors" title="Editar Rol">
                                    <Shield className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors" title="Eliminar Usuario">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
