import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Dashboard({ budget, selectedMonth, budgetMonths }) {
    const [selectedSubAccountId, setSelectedSubAccountId] = useState(null);
    const [isSubAccountModalOpen, setIsSubAccountModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

    // Get active sub-account details
    const activeSubAccount = budget?.sub_accounts?.find(s => s.id === selectedSubAccountId);

    // Calculate totals
    const allocatedSum = budget ? budget.sub_accounts.reduce((sum, sub) => sum + parseFloat(sub.initial_amount), 0) : 0;
    const remainingToAllocate = budget ? parseFloat(budget.initial_amount) - allocatedSum : 0;
    
    // Get all expenses across all sub-accounts for the general history
    const allExpenses = budget ? budget.sub_accounts.flatMap(sub => 
        sub.expenses.map(exp => ({
            ...exp,
            sub_account_name: sub.name,
            sub_account_id: sub.id
        }))
    ).sort((a, b) => new Date(b.date) - new Date(a.date)) : [];

    const totalExpensesSum = allExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    // Format money in Spanish / MXN-USD style
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    // Format date nicely
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format month in Spanish (e.g. "Junio 2026")
    const formatMonthSpanish = (monthStr) => {
        const [year, month] = monthStr.split('-');
        const date = new Date(year, parseInt(month) - 1, 1);
        const name = date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
        return name.replace(/^\w/, (c) => c.toUpperCase());
    };

    // Budget Initialization Form
    const budgetForm = useForm({
        month: selectedMonth,
        name: '',
        amount: '',
    });

    // Sub-account Form
    const subAccountForm = useForm({
        budget_id: budget?.id || '',
        name: '',
        amount: '',
    });

    // Expense Form
    const expenseForm = useForm({
        sub_account_id: '',
        amount: '',
        comment: '',
        date: '',
    });

    // Sync budget_id and reset forms on budget changes
    useEffect(() => {
        if (budget) {
            subAccountForm.setData('budget_id', budget.id);
        }
    }, [budget]);

    // Initialize/Sync Expense Form sub_account_id when active sub-account changes
    useEffect(() => {
        if (activeSubAccount) {
            expenseForm.setData({
                sub_account_id: activeSubAccount.id,
                amount: '',
                comment: '',
                date: new Date().toISOString().slice(0, 16) // Current time local format
            });
        }
    }, [activeSubAccount]);

    // Handle Month Change
    const handleMonthChange = (e) => {
        const month = e.target.value;
        router.get(route('dashboard'), { month }, { preserveState: false });
    };

    // Submit Budget
    const handleBudgetSubmit = (e) => {
        e.preventDefault();
        budgetForm.post(route('budgets.store'), {
            onSuccess: () => {
                setIsBudgetModalOpen(false);
                budgetForm.reset('name', 'amount');
            }
        });
    };

    // Submit Sub-account
    const handleSubAccountSubmit = (e) => {
        e.preventDefault();
        subAccountForm.post(route('sub-accounts.store'), {
            onSuccess: () => {
                setIsSubAccountModalOpen(false);
                subAccountForm.reset('name', 'amount');
            }
        });
    };

    // Submit Expense
    const handleExpenseSubmit = (e) => {
        e.preventDefault();
        expenseForm.post(route('expenses.store'), {
            onSuccess: () => {
                setIsExpenseModalOpen(false);
                expenseForm.reset('amount', 'comment');
            }
        });
    };

    // Delete Expense
    const handleDeleteExpense = (expenseId) => {
        if (confirm('¿Estás seguro de que deseas eliminar este gasto? Los fondos se restaurarán tanto en la subcuenta como en el monto disponible.')) {
            router.delete(route('expenses.destroy', expenseId), {
                preserveScroll: true
            });
        }
    };

    // Helper to get tailored icons based on sub-account name
    const getSubAccountIcon = (name) => {
        const n = name.toLowerCase();
        if (n.includes('pasaje') || n.includes('transporte') || n.includes('viaje') || n.includes('bus') || n.includes('taxi') || n.includes('gasolina') || n.includes('carro') || n.includes('auto')) {
            return (
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </div>
            );
        }
        if (n.includes('cita') || n.includes('novi') || n.includes('pareja') || n.includes('amor') || n.includes('salida') || n.includes('cine') || n.includes('regalo') || n.includes('diversion') || n.includes('ocio')) {
            return (
                <div className="p-3 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-2xl">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </div>
            );
        }
        if (n.includes('comida') || n.includes('restaurante') || n.includes('almuerzo') || n.includes('cena') || n.includes('super') || n.includes('mercado') || n.includes('compras') || n.includes('despensa')) {
            return (
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                    </svg>
                </div>
            );
        }
        if (n.includes('servicio') || n.includes('luz') || n.includes('agua') || n.includes('internet') || n.includes('renta') || n.includes('alquiler') || n.includes('pago') || n.includes('factura')) {
            return (
                <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-2xl">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
            );
        }
        // Default Wallet Icon
        return (
            <div className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-2xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                        Ahorro Mensual
                    </h2>
                    
                    {/* Month Selector */}
                    <div className="flex items-center gap-2">
                        <label htmlFor="month-select" className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Mes:
                        </label>
                        <select
                            id="month-select"
                            value={selectedMonth}
                            onChange={handleMonthChange}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                        >
                            {budgetMonths.map(m => (
                                <option key={m} value={m}>
                                    {formatMonthSpanish(m)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            }
        >
            <Head title="Control de Ahorros" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                
                {/* Crear Cuenta button - siempre visible */}
                {!budget && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                        <div
                            onClick={() => setIsBudgetModalOpen(true)}
                            className="cursor-pointer border border-dashed border-emerald-200 dark:border-emerald-800/50 rounded-3xl p-5 flex flex-col justify-center items-center text-center bg-emerald-50/30 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all min-h-[142px]"
                        >
                            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-full text-emerald-500 dark:text-emerald-400 mb-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Crear Cuenta</span>
                            <span className="text-[10px] text-slate-400">Nueva cuenta principal</span>
                        </div>
                    </div>
                )}

                {/* Summary Banner Cards - siempre visible */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                    {/* Available Balance Card */}
                    {budget && (
                        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/10">
                            <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                                <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h4 className="text-emerald-100 font-semibold text-xs uppercase tracking-wider mb-1">
                                Monto Disponible
                            </h4>
                            <div className="text-3xl font-extrabold mb-4">
                                {formatMoney(budget.available_amount)}
                            </div>
                            <div className="flex items-center justify-between text-xs text-emerald-50/80">
                                <span>Inicial: {formatMoney(budget.initial_amount)}</span>
                                <span>Mes: {formatMonthSpanish(selectedMonth)}</span>
                            </div>
                        </div>
                    )}

                    {/* Total Expenses Card */}
                    {budget && (
                        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-3xl p-6 shadow-md">
                            <h4 className="text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wider mb-1">
                                Gastos Totales del Mes
                            </h4>
                            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mb-2">
                                {formatMoney(totalExpensesSum)}
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-3">
                                <div
                                    className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, (totalExpensesSum / budget.initial_amount) * 100)}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>{allExpenses.length} transacciones</span>
                                <span>{((totalExpensesSum / budget.initial_amount) * 100).toFixed(0)}% del disponible</span>
                            </div>
                        </div>
                    )}

                    {/* Crear Cuenta card - siempre visible */}
                    <div
                        onClick={() => setIsBudgetModalOpen(true)}
                        className="cursor-pointer border border-dashed border-emerald-200 dark:border-emerald-800/50 rounded-3xl p-6 flex flex-col justify-center items-center text-center bg-emerald-50/30 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
                    >
                        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-full text-emerald-500 dark:text-emerald-400 mb-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Crear Cuenta</span>
                        <span className="text-[10px] text-slate-400">Nueva cuenta principal</span>
                    </div>

                </div>

                {/* BUDGET EXISTS */}
                {budget && (
                    <div className="space-y-8">

                        {/* SUB-ACCOUNTS SECTION */}
                        <div className="space-y-4">

                            {budget.sub_accounts.length === 0 ? (
                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                                        No has creado ninguna subcuenta para dividir tus {formatMoney(budget.initial_amount)}.
                                    </p>
                                    <button
                                        onClick={() => setIsSubAccountModalOpen(true)}
                                        className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold py-2 px-4 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm transition-all text-xs"
                                    >
                                        Crear primera subcuenta (Ej. Pasaje, Citas)
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {budget.sub_accounts.map(sub => {
                                        const percentRemaining = (parseFloat(sub.current_amount) / parseFloat(sub.initial_amount)) * 100;
                                        
                                        // Color logic for remaining budget
                                        let progressColor = "bg-emerald-500";
                                        let bgHoverColor = "hover:border-emerald-200 dark:hover:border-emerald-800/50 hover:bg-emerald-50/10";
                                        if (percentRemaining <= 20) {
                                            progressColor = "bg-rose-500";
                                            bgHoverColor = "hover:border-rose-200 dark:hover:border-rose-800/50 hover:bg-rose-50/10";
                                        } else if (percentRemaining <= 50) {
                                            progressColor = "bg-amber-500";
                                            bgHoverColor = "hover:border-amber-200 dark:hover:border-amber-800/50 hover:bg-amber-50/10";
                                        }

                                        const isSelected = selectedSubAccountId === sub.id;

                                        return (
                                            <div
                                                key={sub.id}
                                                onClick={() => setSelectedSubAccountId(isSelected ? null : sub.id)}
                                                className={`cursor-pointer rounded-3xl p-5 border transition-all ${
                                                    isSelected 
                                                        ? 'bg-slate-100 dark:bg-slate-700 border-slate-400 dark:border-slate-500 shadow-inner' 
                                                        : `bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/50 shadow-sm ${bgHoverColor}`
                                                }`}
                                            >
                                                <div className="flex items-center gap-4 mb-4">
                                                    {getSubAccountIcon(sub.name)}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                                            {sub.name}
                                                        </h4>
                                                        <p className="text-xs text-slate-400 dark:text-slate-500">
                                                            Asignado: {formatMoney(sub.initial_amount)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-baseline justify-between">
                                                        <span className="text-xs text-slate-400 dark:text-slate-500">
                                                            Disponible
                                                        </span>
                                                        <span className={`text-base font-extrabold ${percentRemaining <= 20 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                                            {formatMoney(sub.current_amount)}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5">
                                                        <div 
                                                            className={`h-1.5 rounded-full transition-all duration-300 ${progressColor}`}
                                                            style={{ width: `${Math.max(0, Math.min(100, percentRemaining))}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Quick inline Add Sub Account card if budget remains */}
                                    {remainingToAllocate > 0.01 && (
                                        <div 
                                            onClick={() => setIsSubAccountModalOpen(true)}
                                            className="cursor-pointer border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-5 flex flex-col justify-center items-center text-center bg-slate-50/50 dark:bg-slate-800/10 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all min-h-[142px]"
                                        >
                                            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 mb-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Crear Subcuenta</span>
                                            <span className="text-[10px] text-slate-400">Disponible: {formatMoney(remainingToAllocate)}</span>
                                        </div>
                                    )}

                                </div>
                            )}
                        </div>

                        {/* ACTIVE SUB-ACCOUNT VIEW OR MONTHLY EXPENSE HISTORY */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                            
                            {/* Selected Sub-Account Details */}
                            <div className="lg:col-span-2 space-y-6">
                                {activeSubAccount ? (
                                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-3xl shadow-sm p-6 space-y-6">
                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                                            <div className="flex items-center gap-3">
                                                {getSubAccountIcon(activeSubAccount.name)}
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                                        Detalle: {activeSubAccount.name}
                                                    </h3>
                                                    <p className="text-xs text-slate-400">
                                                        Presupuesto asignado: {formatMoney(activeSubAccount.initial_amount)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setIsExpenseModalOpen(true)}
                                                    className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-emerald-500/15"
                                                >
                                                    Nuevo Gasto
                                                </button>
                                                <button
                                                    onClick={() => setSelectedSubAccountId(null)}
                                                    className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-600 dark:text-slate-300 font-semibold px-3 py-2 rounded-xl text-xs transition-all"
                                                >
                                                    Cerrar
                                                </button>
                                            </div>
                                        </div>

                                        {/* Sub-account Stats */}
                                        <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl">
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Saldo Disponible</span>
                                                <div className={`text-xl font-extrabold ${parseFloat(activeSubAccount.current_amount) < 0 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                                    {formatMoney(activeSubAccount.current_amount)}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gastos Registrados</span>
                                                <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
                                                    {formatMoney(parseFloat(activeSubAccount.initial_amount) - parseFloat(activeSubAccount.current_amount))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expense list for this sub-account */}
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                                                Historial de Gastos
                                            </h4>

                                            {activeSubAccount.expenses.length === 0 ? (
                                                <p className="text-sm text-slate-400 dark:text-slate-500 italic py-4 text-center">
                                                    No hay gastos registrados en esta subcuenta aún.
                                                </p>
                                            ) : (
                                                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                                    {activeSubAccount.expenses.map(expense => (
                                                        <div 
                                                            key={expense.id}
                                                            className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/20 border border-slate-100/50 dark:border-slate-800 rounded-2xl hover:bg-slate-100/40 dark:hover:bg-slate-800/20 transition-all"
                                                        >
                                                            <div className="min-w-0 flex-1 pr-4">
                                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                                                    {expense.comment || 'Gasto registrado'}
                                                                </p>
                                                                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                                                    {formatDate(expense.date)}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                                                                    -{formatMoney(expense.amount)}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleDeleteExpense(expense.id)}
                                                                    className="text-slate-300 hover:text-rose-500 active:scale-90 transition-all"
                                                                    title="Eliminar gasto"
                                                                >
                                                                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* No sub-account selected - show a helpful monthly dashboard overview / guide */
                                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-3xl shadow-sm p-6 flex flex-col justify-center items-center text-center min-h-[300px]">
                                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-700/50 text-slate-400 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                            </svg>
                                        </div>
                                        <h4 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1">
                                            Presiona una Subcuenta
                                        </h4>
                                        <p className="text-slate-400 dark:text-slate-500 text-xs max-w-xs leading-relaxed">
                                            Selecciona cualquiera de tus subcuentas en la parte superior para ver su historial de transacciones detallado y registrar nuevos gastos específicos.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* General Monthly History / Global Log */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                    Historial General
                                </h3>

                                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-3xl p-5 shadow-sm space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                        Todos los gastos de {formatMonthSpanish(selectedMonth)}
                                    </h4>

                                    {allExpenses.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic py-6 text-center">
                                            Ningún gasto registrado en este mes.
                                        </p>
                                    ) : (
                                        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                                            {allExpenses.map(expense => (
                                                <div 
                                                    key={`global-${expense.id}`}
                                                    onClick={() => setSelectedSubAccountId(expense.sub_account_id)}
                                                    className="cursor-pointer p-3 bg-slate-50 dark:bg-slate-900/10 border border-slate-100/50 dark:border-slate-800 rounded-2xl hover:border-slate-200 dark:hover:border-slate-700 transition-all flex items-center justify-between"
                                                >
                                                    <div className="min-w-0 flex-1 pr-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-200/50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md truncate max-w-[80px]">
                                                                {expense.sub_account_name}
                                                            </span>
                                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                                                                {expense.comment || 'Gasto'}
                                                            </span>
                                                        </div>
                                                        <span className="text-[9px] text-slate-400 block mt-0.5">
                                                            {formatDate(expense.date)}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">
                                                        -{formatMoney(expense.amount)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>

            {/* ====================================================================== */}
            {/* MODALS */}
            {/* ====================================================================== */}

            {/* Modal Crear Cuenta Principal */}
            {isBudgetModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setIsBudgetModalOpen(false)}
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                            Nueva Cuenta
                        </h3>
                        <p className="text-slate-400 dark:text-slate-500 text-xs mb-6">
                            Crea una nueva cuenta principal para este mes con un nombre y monto disponible.
                        </p>

                        <form onSubmit={handleBudgetSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                    Nombre del Ahorro
                                </label>
                                <input
                                    type="text"
                                    value={budgetForm.data.name}
                                    onChange={e => budgetForm.setData('name', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                    maxLength="100"
                                />
                                {budgetForm.errors.name && (
                                    <p className="text-red-500 text-xs mt-1">{budgetForm.errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                    Monto Disponible
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Ej. 700"
                                        value={budgetForm.data.amount}
                                        onChange={e => budgetForm.setData('amount', e.target.value)}
                                        className="w-full pl-7 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                {budgetForm.errors.amount && (
                                    <p className="text-red-500 text-xs mt-1">{budgetForm.errors.amount}</p>
                                )}
                                {budgetForm.errors.month && (
                                    <p className="text-red-500 text-xs mt-1">{budgetForm.errors.month}</p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsBudgetModalOpen(false)}
                                    className="w-1/2 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={budgetForm.processing}
                                    className="w-1/2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
                                >
                                    {budgetForm.processing ? 'Creando...' : 'Crear Cuenta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 1. Modal Add Sub-Account */}
            {isSubAccountModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setIsSubAccountModalOpen(false)}
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                            Nueva Subcuenta
                        </h3>
                        <p className="text-slate-400 dark:text-slate-500 text-xs mb-6">
                            Asigna parte de tu presupuesto disponible a una subcuenta específica.
                        </p>

                        <form onSubmit={handleSubAccountSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                    Nombre de la Subcuenta
                                </label>
                                <input
                                    type="text"
                                    value={subAccountForm.data.name}
                                    onChange={e => subAccountForm.setData('name', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                    maxLength="100"
                                />
                                {subAccountForm.errors.name && (
                                    <p className="text-red-500 text-xs mt-1">{subAccountForm.errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                    Monto Asignado
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder={`Máximo: ${remainingToAllocate}`}
                                        value={subAccountForm.data.amount}
                                        onChange={e => subAccountForm.setData('amount', e.target.value)}
                                        className="w-full pl-7 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                    Disponible para asignar: {formatMoney(remainingToAllocate)}
                                </span>
                                {subAccountForm.errors.amount && (
                                    <p className="text-red-500 text-xs mt-1">{subAccountForm.errors.amount}</p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsSubAccountModalOpen(false)}
                                    className="w-1/2 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={subAccountForm.processing}
                                    className="w-1/2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
                                >
                                    {subAccountForm.processing ? 'Creando...' : 'Crear Subcuenta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. Modal Add Expense */}
            {isExpenseModalOpen && activeSubAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setIsExpenseModalOpen(false)}
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
                            Agregar Gasto: {activeSubAccount.name}
                        </h3>
                        <p className="text-slate-400 dark:text-slate-500 text-xs mb-6">
                            Registra una compra y el saldo se restará de la subcuenta y del total mensual.
                        </p>

                        <form onSubmit={handleExpenseSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                    Monto del Gasto
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={expenseForm.data.amount}
                                        onChange={e => expenseForm.setData('amount', e.target.value)}
                                        className="w-full pl-7 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                    Saldo subcuenta disponible: {formatMoney(activeSubAccount.current_amount)}
                                </span>
                                {expenseForm.data.amount && parseFloat(expenseForm.data.amount) > parseFloat(activeSubAccount.current_amount) && (
                                    <p className="text-amber-500 text-[10px] font-semibold mt-1">
                                        Advertencia: El gasto excede el saldo de la subcuenta (quedará negativo).
                                    </p>
                                )}
                                {expenseForm.errors.amount && (
                                    <p className="text-red-500 text-xs mt-1">{expenseForm.errors.amount}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                    Comentario / Descripción
                                </label>
                                <input
                                    type="text"
                                    value={expenseForm.data.comment}
                                    onChange={e => expenseForm.setData('comment', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    maxLength="255"
                                />
                                {expenseForm.errors.comment && (
                                    <p className="text-red-500 text-xs mt-1">{expenseForm.errors.comment}</p>
                                )}
                            </div>

                            {/* <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                    Fecha y Hora
                                </label>
                                <input
                                    type="datetime-local"
                                    value={expenseForm.data.date}
                                    onChange={e => expenseForm.setData('date', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                                {expenseForm.errors.date && (
                                    <p className="text-red-500 text-xs mt-1">{expenseForm.errors.date}</p>
                                )}
                            </div> */}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsExpenseModalOpen(false)}
                                    className="w-1/2 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={expenseForm.processing}
                                    className="w-1/2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
                                >
                                    {expenseForm.processing ? 'Guardando...' : 'Guardar Gasto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
