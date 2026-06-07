import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex">
            {/* Left panel - branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 to-teal-700 flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
                        <circle cx="300" cy="100" r="200" fill="white" />
                        <circle cx="50" cy="350" r="150" fill="white" />
                    </svg>
                </div>
                <div className="relative">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-white font-bold text-xl">Money Saver</span>
                    </Link>
                </div>
                <div className="relative space-y-4">
                    <h1 className="text-4xl font-extrabold text-white leading-tight">
                        Controla tus<br />ahorros con<br />facilidad
                    </h1>
                    <p className="text-emerald-100 text-sm leading-relaxed max-w-xs">
                        Organiza tu dinero en cuentas y subcuentas, registra tus gastos y lleva el control de cada mes.
                    </p>
                </div>
                <div className="relative flex gap-6">
                    {[['📊', 'Control total'], ['💰', 'Ahorra más'], ['📅', 'Por mes']].map(([icon, label]) => (
                        <div key={label} className="text-center">
                            <div className="text-2xl mb-1">{icon}</div>
                            <div className="text-emerald-100 text-xs font-semibold">{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right panel - form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-900">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-100">Money Saver</span>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
