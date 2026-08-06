import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { WalletIcon, Bars3Icon, XMarkIcon, ChevronDownIcon, HomeIcon, UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Top Navbar */}
            <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">

                        {/* Left: Logo + Brand */}
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
                                    <WalletIcon className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-extrabold text-slate-800 dark:text-slate-100 tracking-tight text-base hidden sm:inline">
                                    Mi<span className="text-emerald-500">Ahorro</span>
                                </span>
                            </Link>

                            <div className="hidden sm:flex sm:ms-6 sm:items-center space-x-1">
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                >
                                    <HomeIcon className="w-4 h-4 mr-1.5 inline-block" />
                                    Inicio
                                </NavLink>
                            </div>
                        </div>

                        {/* Right: User Dropdown */}
                        <div className="hidden sm:flex sm:items-center gap-4">
                            <div className="relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-xl">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center text-xs font-bold">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                {user.name}
                                                <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link href={route('profile.edit')}>
                                            <UserCircleIcon className="w-4 h-4 inline-block mr-1.5" />
                                            Mi Perfil
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('logout')} method="post" as="button">
                                            <ArrowRightOnRectangleIcon className="w-4 h-4 inline-block mr-1.5" />
                                            Cerrar Sesión
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        {/* Mobile hamburger */}
                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown((p) => !p)}
                                className="inline-flex items-center justify-center rounded-xl p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
                            >
                                {showingNavigationDropdown
                                    ? <XMarkIcon className="h-6 w-6" />
                                    : <Bars3Icon className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Dropdown Menu */}
                <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden border-t border-slate-100 dark:border-slate-800'}>
                    <div className="space-y-1 pb-3 pt-2 px-4">
                        <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>
                            Inicio
                        </ResponsiveNavLink>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pb-2 pt-4 px-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold text-sm">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user.name}</div>
                                <div className="text-xs text-slate-500">{user.email}</div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>
                                <UserCircleIcon className="w-4 h-4 inline-block mr-1.5" />
                                Mi Perfil
                            </ResponsiveNavLink>
                            <ResponsiveNavLink method="post" href={route('logout')} as="button">
                                <ArrowRightOnRectangleIcon className="w-4 h-4 inline-block mr-1.5" />
                                Cerrar Sesión
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Page header */}
            {header && (
                <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main className="pb-12">{children}</main>
        </div>
    );
}
