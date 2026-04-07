import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Home, PlusCircle, ScanLine, Ticket as TicketIcon, Users } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <span className="font-bold text-xl text-indigo-600">EventMaster</span>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link to="/" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                <Home className="w-4 h-4 mr-2" /> Dashboard
                            </Link>
                            {user.role === 'admin' && (
                                <Link to="/users" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    <Users className="w-4 h-4 mr-2" /> Usuarios
                                </Link>
                            )}
                            <Link to="/events/new" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                <PlusCircle className="w-4 h-4 mr-2" /> Nuevo Evento
                            </Link>
                            <Link to="/scanner" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                <ScanLine className="w-4 h-4 mr-2" /> Scanner
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <span className="text-gray-700 mr-4">Hola, {user.username}</span>
                        <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
