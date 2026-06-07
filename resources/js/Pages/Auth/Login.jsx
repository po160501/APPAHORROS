import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <GuestLayout>
            <Head title="Iniciar sesión" />

            <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Bienvenido de nuevo</h2>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Inicia sesión para continuar</p>
            </div>

            {status && (
                <div className="mb-4 text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 rounded-xl">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Correo electrónico
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        autoComplete="username"
                        autoFocus
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
                        placeholder="tu@correo.com"
                    />
                    <InputError message={errors.email} className="mt-1.5" />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Contraseña
                        </label>
                        {canResetPassword && (
                            <Link href={route('password.request')} className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        )}
                    </div>
                    <input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={e => setData('password', e.target.value)}
                        autoComplete="current-password"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
                        placeholder="••••••••"
                    />
                    <InputError message={errors.password} className="mt-1.5" />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        id="remember"
                        type="checkbox"
                        checked={data.remember}
                        onChange={e => setData('remember', e.target.checked)}
                        className="w-4 h-4 rounded accent-emerald-500"
                    />
                    <label htmlFor="remember" className="text-sm text-slate-500 dark:text-slate-400">Recordarme</label>
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 text-sm"
                >
                    {processing ? 'Ingresando...' : 'Iniciar sesión'}
                </button>

                <p className="text-center text-sm text-slate-400 dark:text-slate-500">
                    ¿No tienes cuenta?{' '}
                    <Link href={route('register')} className="text-emerald-600 hover:text-emerald-700 font-semibold">
                        Regístrate
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
