import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setIsLoading(true);
        try {
            await register(username, password);
            setIsSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al registrar el usuario.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans">
                <div className="max-w-md w-full mx-4 bg-slate-900/60 backdrop-blur-3xl p-12 rounded-[2rem] border border-slate-800 text-center shadow-2xl">
                    <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/50 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">¡Registro Exitoso!</h2>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        Tu cuenta ha sido creada correctamente. Serás redirigido al inicio de sesión en unos segundos...
                    </p>
                    <Link to="/login" className="text-slate-200 hover:text-white font-bold underline underline-offset-8 decoration-slate-700">
                        Ir al login ahora
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans">
            {/* Background Texture */}
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-slate-800/20 rounded-full blur-[150px] animate-pulse"></div>
            
            <div className="max-w-md w-full mx-4 z-10">
                <div className="bg-slate-900/60 backdrop-blur-3xl p-10 rounded-[2rem] border border-slate-800 shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)]">
                    <div className="text-center mb-10">
                        <div className="inline-flex p-4 rounded-2xl bg-slate-800 border border-slate-700 shadow-xl mb-6 group">
                            <UserPlus className="w-8 h-8 text-slate-200 group-hover:text-white transition-colors" />
                        </div>
                        <h2 className="text-4xl font-bold text-white tracking-tighter mb-2 uppercase">
                            Nueva <span className="text-slate-500 font-light">Cuenta</span>
                        </h2>
                        <p className="text-slate-500 text-xs font-bold tracking-[0.3em] uppercase opacity-80">
                            Únete al Sistema Lambda
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div className="space-y-3">
                            <div className="relative group">
                                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 ml-1 group-focus-within:text-slate-300">Usuario</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                    <input
                                        id="username"
                                        type="text"
                                        required
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-all font-medium"
                                        placeholder="Crea tu usuario"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="relative group">
                                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 ml-1 group-focus-within:text-slate-300">Contraseña</label>
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

                            <div className="relative group">
                                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 ml-1 group-focus-within:text-slate-300">Confirmar Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                    <input
                                        id="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-all font-medium"
                                        placeholder="Re-ingresa tu clave"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-3 text-red-400 text-[13px] text-center font-medium animate-shake">
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
                                    <span>Completar Registro</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
                        <p className="text-slate-500 text-xs font-medium">
                            ¿Ya tienes una cuenta?{' '}
                            <Link to="/login" className="text-slate-300 hover:text-white underline underline-offset-4 decoration-slate-700 transition-colors">
                                Inicia sesión aquí
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
