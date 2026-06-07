import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    return (
        <GuestLayout>
            <Head title="Crear cuenta" />

            <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Crea tu cuenta</h2>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Empieza a controlar tus ahorros hoy</p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Nombre
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                        autoComplete="name"
                        autoFocus
                        required
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
                        placeholder="Tu nombre"
                    />
                    <InputError message={errors.name} className="mt-1.5" />
                </div>

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
                        required
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
                        placeholder="tu@correo.com"
                    />
                    <InputError message={errors.email} className="mt-1.5" />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Contraseña
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={e => setData('password', e.target.value)}
                        autoComplete="new-password"
                        required
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
                        placeholder="••••••••"
                    />
                    <InputError message={errors.password} className="mt-1.5" />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Confirmar contraseña
                    </label>
                    <input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        onChange={e => setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                        required
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
                        placeholder="••••••••"
                    />
                    <InputError message={errors.password_confirmation} className="mt-1.5" />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 text-sm mt-2"
                >
                    {processing ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>

                <p className="text-center text-sm text-slate-400 dark:text-slate-500">
                    ¿Ya tienes cuenta?{' '}
                    <Link href={route('login')} className="text-emerald-600 hover:text-emerald-700 font-semibold">
                        Inicia sesión
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
