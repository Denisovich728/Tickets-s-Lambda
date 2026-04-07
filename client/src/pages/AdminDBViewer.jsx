import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Database, Table, Loader2 } from 'lucide-react';

export default function AdminDBViewer() {
    const [activeTab, setActiveTab] = useState('users');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // This component might not work fully yet because we don't have a generalized "dump" API.
    // For now, let's fetch using existing APIs where possible or create a new route.
    // Since we don't have a generic /admin/db endpoint, we will use existing endpoints:
    // /auth/users (doesn't exist yet, we only have register/login).
    // /events (exists)
    // /tickets (doesn't have a "get all" endpoint, usually per event).
    // So this feature requires Backend support.

    // However, I can implement the UI structure and fetch Events for now, 
    // and maybe add a backend route for users list if I have time, or just show Events.
    // The user asked for "projected database view".

    // Let's implement fetching Events as a start.

    useEffect(() => {
        fetchData(activeTab);
    }, [activeTab]);

    const fetchData = async (tab) => {
        setLoading(true);
        setData([]);
        try {
            let res;
            if (tab === 'events') {
                res = await api.get('/events');
                setData(res.data);
            }
            // Mocking other data for UI demo until backend supports it
            else if (tab === 'users') {
                // res = await api.get('/users'); // Endpoint needed
                setData([
                    { id: 1, username: 'Denisovich728', role: 'admin' },
                    // Mock
                ]);
            }
        } catch (error) {
            console.error("Error fetching db data", error);
        } finally {
            setLoading(false);
        }
    };

    const renderTable = () => {
        if (data.length === 0) return <div className="text-slate-400 p-4">No hay datos disponibles.</div>;

        const headers = Object.keys(data[0]);

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-800">
                        <tr>
                            {headers.map(h => (
                                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-slate-900 divide-y divide-slate-800">
                        {data.map((row, i) => (
                            <tr key={i}>
                                {headers.map(h => (
                                    <td key={h} className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                        {typeof row[h] === 'object' ? JSON.stringify(row[h]) : row[h]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header className="border-b border-slate-700 pb-6">
                <h2 className="text-3xl font-bold text-gray-100 flex items-center">
                    <Database className="w-8 h-8 mr-3 text-emerald-500" />
                    Visor de Base de Datos
                </h2>
                <p className="text-slate-400 mt-2">Inspección de registros del sistema</p>
            </header>

            <div className="flex space-x-2 border-b border-slate-700">
                {['events', 'users'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-medium text-sm transition-colors rounded-t-lg ${activeTab === tab
                                ? 'bg-slate-800 text-emerald-400 border-t border-x border-slate-700'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    </div>
                ) : renderTable()}
            </div>
        </div>
    );
}
