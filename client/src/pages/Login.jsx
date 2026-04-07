import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const success = await login(username, password);
            if (success) {
                navigate('/dashboard', { replace: true });
            } else {
                setError('Credenciales inválidas. Por favor intente de nuevo.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans">
            {/* Elegant Gray Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-slate-800/20 rounded-full blur-[140px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-slate-700/10 rounded-full blur-[140px] animate-pulse delay-700"></div>

            <div className="max-w-md w-full mx-4 z-10">
                <div className="bg-slate-900/60 backdrop-blur-3xl p-10 rounded-[2rem] border border-slate-800 shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)]">
                    <div className="text-center mb-10">
                        <div className="inline-flex p-4 rounded-2xl bg-slate-800 border border-slate-700 shadow-xl mb-6 group">
                            <Lock className="w-8 h-8 text-slate-200 group-hover:text-white transition-colors" />
                        </div>
                        <h2 className="text-4xl font-bold text-white tracking-tighter mb-2 uppercase">
                            Ticket's <span className="text-slate-400 font-light">Lambda</span>
                        </h2>
                        <p className="text-slate-500 text-xs font-bold tracking-[0.3em] uppercase opacity-80">
                            Central de Operaciones
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div className="space-y-3">
                            <div className="relative group">
                                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 ml-1 group-focus-within:text-slate-300 transition-colors">Usuario</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                    <input
                                        id="username"
                                        type="text"
                                        required
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-all font-medium"
                                        placeholder="Ingrese su usuario"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="relative group">
                                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 ml-1 group-focus-within:text-slate-300 transition-colors">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full pl-11 pr-12 py-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-all font-medium"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-3 text-red-400 text-[13px] text-center font-medium">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 px-6 bg-slate-100 hover:bg-white text-slate-950 font-bold rounded-xl shadow-xl shadow-black/20 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Iniciar Sesión</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
                        <p className="text-slate-500 text-xs font-medium">
                            ¿Aún no tienes cuenta?{' '}
                            <Link to="/register" className="text-slate-300 hover:text-white underline underline-offset-4 decoration-slate-700 transition-colors">
                                Regístrate gratis
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="mt-8 text-center text-slate-700 text-xs tracking-widest font-bold uppercase">
                    Secured by Lambda Systems Inc.
                </p>
            </div>
        </div>
    );
}
