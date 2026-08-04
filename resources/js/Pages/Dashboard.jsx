import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";

export default function Dashboard({
    budgets,
    selectedMonth,
    budgetMonths,
    prevBudgets = [],
    income = 0,
}) {
    const { auth } = usePage().props;
    const coverImageUrl = auth?.user?.cover_image_url || null;
    const [selectedBudgetId, setSelectedBudgetId] = useState(null);
    const [selectedSubAccountId, setSelectedSubAccountId] = useState(null);
    const [isSubAccountModalOpen, setIsSubAccountModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [isBudgetEditOpen, setIsBudgetEditOpen] = useState(false);
    const [isSubAccountEditOpen, setIsSubAccountEditOpen] = useState(false);
    const [budgetEditData, setBudgetEditData] = useState({
        name: "",
        amount: "",
        target_month: "",
    });
    const [subAccountEditData, setSubAccountEditData] = useState({
        name: "",
        amount: "",
    });

    const selectedBudget =
        budgets?.find((b) => b.id === selectedBudgetId) || null;
    const activeSubAccount =
        selectedBudget?.sub_accounts?.find(
            (s) => s.id === selectedSubAccountId,
        ) || null;

    const allocatedSum = selectedBudget
        ? selectedBudget.sub_accounts.reduce(
              (sum, sub) => sum + parseFloat(sub.initial_amount),
              0,
          )
        : 0;
    const remainingToAllocate = selectedBudget
        ? parseFloat(selectedBudget.initial_amount) - allocatedSum
        : 0;

    const allExpenses = selectedBudget
        ? selectedBudget.sub_accounts
              .flatMap((sub) =>
                  sub.expenses.map((exp) => ({
                      ...exp,
                      sub_account_name: sub.name,
                      sub_account_id: sub.id,
                  })),
              )
              .sort((a, b) => new Date(b.date) - new Date(a.date))
        : [];

    const totalExpensesSum = allExpenses.reduce(
        (sum, exp) => sum + parseFloat(exp.amount),
        0,
    );

    const expenseBudgets = budgets.filter((budget) => budget.type === "gasto");
    const savingBudgets = budgets.filter((budget) => budget.type === "ahorro");
    const monthlyExpenses = expenseBudgets
        .flatMap((budget) => budget.sub_accounts.flatMap((sub) => sub.expenses))
        .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const monthlySavings = savingBudgets.reduce(
        (sum, budget) => sum + parseFloat(budget.available_amount),
        0,
    );
    const categoryTotals = expenseBudgets
        .flatMap((budget) => budget.sub_accounts)
        .map((sub) => ({
            name: sub.name,
            amount:
                parseFloat(sub.initial_amount) - parseFloat(sub.current_amount),
        }))
        .filter((category) => category.amount > 0)
        .sort((a, b) => b.amount - a.amount);
    const spendingPctOfIncome =
        income > 0 ? (monthlyExpenses / income) * 100 : 0;
    const savingPctOfIncome = income > 0 ? (monthlySavings / income) * 100 : 0;
    const previousCategories = prevBudgets
        .flatMap((budget) => budget.sub_accounts)
        .reduce((totals, sub) => {
            totals[sub.name] =
                (totals[sub.name] || 0) +
                sub.expenses.reduce(
                    (sum, expense) => sum + parseFloat(expense.amount),
                    0,
                );
            return totals;
        }, {});

    const formatMoney = (amount) =>
        new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
        }).format(amount);

    const formatDate = (dateStr) =>
        new Date(dateStr).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });

    const formatMonthSpanish = (monthStr) => {
        const [year, month] = monthStr.split("-");
        const name = new Date(year, parseInt(month) - 1, 1).toLocaleDateString(
            "es-MX",
            { month: "long", year: "numeric" },
        );
        return name.replace(/^\w/, (c) => c.toUpperCase());
    };

    const monthsUntilTarget = (targetMonth) => {
        if (!targetMonth) return null;
        const [year, month] = targetMonth.split("-").map(Number);
        const now = new Date();
        return Math.max(
            1,
            (year - now.getFullYear()) * 12 + month - (now.getMonth() + 1) + 1,
        );
    };

    const budgetForm = useForm({
        month: selectedMonth,
        name: "",
        amount: "",
        type: "ahorro",
        target_month: "",
    });

    const subAccountForm = useForm({
        budget_id: selectedBudget?.id || "",
        name: "",
        amount: "",
        type: "gasto",
    });

    const expenseForm = useForm({
        sub_account_id: "",
        amount: "",
        comment: "",
        date: "",
    });

    const savingForm = useForm({
        budget_id: selectedBudget?.id || "",
        amount: "",
        comment: "",
        date: new Date().toISOString().slice(0, 16),
    });
    const incomeForm = useForm({ month: selectedMonth, income: income || "" });
    const editForm = useForm({ amount: "", comment: "", date: "" });

    useEffect(() => {
        if (selectedBudget) savingForm.setData("budget_id", selectedBudget.id);
    }, [selectedBudgetId]);

    useEffect(() => {
        if (selectedBudget)
            subAccountForm.setData("budget_id", selectedBudget.id);
    }, [selectedBudget]);

    useEffect(() => {
        if (activeSubAccount) {
            expenseForm.setData({
                sub_account_id: activeSubAccount.id,
                amount: "",
                comment: "",
                date: new Date().toISOString().slice(0, 16),
            });
        }
    }, [activeSubAccount]);

    // Reset selected sub-account when budget changes
    useEffect(() => {
        setSelectedSubAccountId(null);
    }, [selectedBudgetId]);

    const handleMonthChange = (e) => {
        setSelectedBudgetId(null);
        router.get(
            route("dashboard"),
            { month: e.target.value },
            { preserveState: false },
        );
    };

    const handleBudgetSubmit = (e) => {
        e.preventDefault();
        budgetForm.post(route("budgets.store"), {
            onSuccess: () => {
                setIsBudgetModalOpen(false);
                budgetForm.reset("name", "amount", "target_month");
            },
        });
    };

    const handleSubAccountSubmit = (e) => {
        e.preventDefault();
        subAccountForm.post(route("sub-accounts.store"), {
            onSuccess: () => {
                setIsSubAccountModalOpen(false);
                subAccountForm.reset("name", "amount");
            },
        });
    };

    const handleSavingSubmit = (e) => {
        e.preventDefault();
        savingForm.post(route("savings.store"), {
            onSuccess: () => savingForm.reset("amount", "comment"),
        });
    };

    const handleIncomeSubmit = (e) => {
        e.preventDefault();
        incomeForm.post(route("income.update"), { preserveScroll: true });
    };

    const openEditRecord = (record) => {
        setEditingRecord(record);
        editForm.setData({
            amount: record.amount,
            comment: record.comment || "",
            date: new Date(record.date).toISOString().slice(0, 16),
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        editForm.put(route("expenses.update", editingRecord.id), {
            preserveScroll: true,
            onSuccess: () => setEditingRecord(null),
        });
    };

    const openBudgetEdit = () => {
        setBudgetEditData({
            name: selectedBudget.name,
            amount: selectedBudget.initial_amount,
            target_month: selectedBudget.target_month || "",
        });
        setIsBudgetEditOpen(true);
    };
    const handleBudgetEditSubmit = (e) => {
        e.preventDefault();
        router.put(route("budgets.update", selectedBudget.id), budgetEditData, {
            preserveScroll: true,
            onSuccess: () => setIsBudgetEditOpen(false),
        });
    };
    const openSubAccountEdit = () => {
        setSubAccountEditData({
            name: activeSubAccount.name,
            amount: activeSubAccount.initial_amount,
        });
        setIsSubAccountEditOpen(true);
    };
    const handleSubAccountEditSubmit = (e) => {
        e.preventDefault();
        router.put(
            route("sub-accounts.update", activeSubAccount.id),
            subAccountEditData,
            {
                preserveScroll: true,
                onSuccess: () => setIsSubAccountEditOpen(false),
            },
        );
    };

    const handleExpenseSubmit = (e) => {
        e.preventDefault();
        expenseForm.post(route("expenses.store"), {
            onSuccess: () => {
                setIsExpenseModalOpen(false);
                expenseForm.reset("amount", "comment");
            },
        });
    };

    const handleDeleteExpense = (expenseId) => {
        if (
            confirm(
                "¿Estás seguro de que deseas eliminar este gasto? Los fondos se restaurarán.",
            )
        ) {
            router.delete(route("expenses.destroy", expenseId), {
                preserveScroll: true,
            });
        }
    };

    useEffect(() => {
        incomeForm.setData({ month: selectedMonth, income: income || "" });
    }, [selectedMonth, income]);

    const budgetItems = [...budgets, "__create__"];
    const subItems =
        selectedBudget && selectedBudget.type !== "ahorro"
            ? [
                  ...selectedBudget.sub_accounts,
                  ...(remainingToAllocate > 0.01 ? ["__create_sub__"] : []),
              ]
            : [];

    const CARD_W = 320;
    const GAP = 16;
    const STACK_OFFSET = 10;

    const budgetTrackRef = useRef(null);
    const [budgetActive, setBudgetActive] = useState(0);
    const subTrackRef = useRef(null);
    const [subActive, setSubActive] = useState(0);

    useEffect(() => {
        const el = budgetTrackRef.current;
        if (!el) return;
        const onScroll = () =>
            setBudgetActive(
                Math.min(
                    Math.round(el.scrollLeft / (CARD_W + GAP)),
                    budgetItems.length - 1,
                ),
            );
        el.addEventListener("scroll", onScroll, { passive: true });
        return () => el.removeEventListener("scroll", onScroll);
    }, [budgetItems.length]);

    useEffect(() => {
        const el = subTrackRef.current;
        if (!el) return;
        const onScroll = () =>
            setSubActive(
                Math.min(
                    Math.round(el.scrollLeft / (CARD_W + GAP)),
                    subItems.length - 1,
                ),
            );
        el.addEventListener("scroll", onScroll, { passive: true });
        return () => el.removeEventListener("scroll", onScroll);
    }, [subItems.length]);

    const stackStyle = (index, active) => {
        const diff = index - active;
        const base = {
            transition:
                "transform 0.35s ease, opacity 0.35s ease, scale 0.35s ease",
            flexShrink: 0,
            scrollSnapAlign: "center",
        };
        if (diff === 0)
            return {
                ...base,
                transform: "scale(1.06)",
                zIndex: 10,
                opacity: 1,
            };
        if (diff < 0)
            return {
                ...base,
                transform: `translateX(${diff * STACK_OFFSET}px) scale(0.92)`,
                opacity: Math.max(0.4, 1 + diff * 0.25),
                zIndex: index,
            };
        return {
            ...base,
            transform: "scale(0.92)",
            opacity: 0.6,
            zIndex: index,
        };
    };

    const handle3DMove = (e) => {
        const card = e.currentTarget;
        const { left, top, width, height } = card.getBoundingClientRect();
        const x = (e.clientX - left) / width - 0.5;
        const y = (e.clientY - top) / height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${x * 20}deg) rotateX(${-y * 20}deg)`;
    };

    const handle3DLeave = (e) => {
        e.currentTarget.style.transform =
            "perspective(800px) rotateY(0deg) rotateX(0deg)";
    };

    const getSubAccountIcon = (name) => {
        const n = name.toLowerCase();
        if (
            n.includes("pasaje") ||
            n.includes("transporte") ||
            n.includes("viaje") ||
            n.includes("bus") ||
            n.includes("taxi") ||
            n.includes("gasolina") ||
            n.includes("carro") ||
            n.includes("auto")
        ) {
            return (
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl">
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                    </svg>
                </div>
            );
        }
        if (
            n.includes("cita") ||
            n.includes("novi") ||
            n.includes("pareja") ||
            n.includes("amor") ||
            n.includes("salida") ||
            n.includes("cine") ||
            n.includes("regalo") ||
            n.includes("diversion") ||
            n.includes("ocio")
        ) {
            return (
                <div className="p-3 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-2xl">
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                    </svg>
                </div>
            );
        }
        if (
            n.includes("comida") ||
            n.includes("restaurante") ||
            n.includes("almuerzo") ||
            n.includes("cena") ||
            n.includes("super") ||
            n.includes("mercado") ||
            n.includes("compras") ||
            n.includes("despensa")
        ) {
            return (
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
                        />
                    </svg>
                </div>
            );
        }
        if (
            n.includes("servicio") ||
            n.includes("luz") ||
            n.includes("agua") ||
            n.includes("internet") ||
            n.includes("renta") ||
            n.includes("alquiler") ||
            n.includes("pago") ||
            n.includes("factura")
        ) {
            return (
                <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-2xl">
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                    </svg>
                </div>
            );
        }
        return (
            <div className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-2xl">
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
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
                    <div className="flex items-center gap-2">
                        <label
                            htmlFor="month-select"
                            className="text-sm font-medium text-slate-500 dark:text-slate-400"
                        >
                            Mes:
                        </label>
                        <select
                            id="month-select"
                            value={selectedMonth}
                            onChange={handleMonthChange}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                        >
                            {budgetMonths.map((m) => (
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

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
                <section className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-3xl shadow-sm p-5 sm:p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                Resumen de {formatMonthSpanish(selectedMonth)}
                            </h3>
                            <p className="text-xs text-slate-400">
                                Tu balance, categorías y avance mensual.
                            </p>
                        </div>
                        <form
                            onSubmit={handleIncomeSubmit}
                            className="flex gap-2 items-end"
                        >
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Ingreso del mes
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={incomeForm.data.income}
                                    onChange={(e) =>
                                        incomeForm.setData(
                                            "income",
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 block w-36 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                                    placeholder="$ 0.00"
                                />
                            </label>
                            <button
                                type="submit"
                                disabled={incomeForm.processing}
                                className="px-3 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-bold"
                            >
                                Guardar
                            </button>
                        </form>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 p-4">
                            <p className="text-[10px] uppercase font-bold text-rose-500">
                                Gastado
                            </p>
                            <p className="text-xl font-extrabold text-rose-700 dark:text-rose-300">
                                {formatMoney(monthlyExpenses)}
                            </p>
                            <p className="text-[10px] text-rose-500">
                                {income > 0
                                    ? `${spendingPctOfIncome.toFixed(1)}% del ingreso`
                                    : "Añade tu ingreso"}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 p-4">
                            <p className="text-[10px] uppercase font-bold text-emerald-500">
                                Ahorrado
                            </p>
                            <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                                {formatMoney(monthlySavings)}
                            </p>
                            <p className="text-[10px] text-emerald-500">
                                {income > 0
                                    ? `${savingPctOfIncome.toFixed(1)}% del ingreso`
                                    : "Depósitos del mes"}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4">
                            <p className="text-[10px] uppercase font-bold text-slate-400">
                                Ingreso
                            </p>
                            <p className="text-xl font-extrabold text-slate-700 dark:text-slate-200">
                                {formatMoney(income)}
                            </p>
                            <p className="text-[10px] text-slate-400">
                                Disponible:{" "}
                                {formatMoney(
                                    income - monthlyExpenses - monthlySavings,
                                )}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-violet-50 dark:bg-violet-950/30 p-4">
                            <p className="text-[10px] uppercase font-bold text-violet-500">
                                Mayor categoría
                            </p>
                            <p className="text-lg font-extrabold text-violet-700 dark:text-violet-300 truncate">
                                {categoryTotals[0]?.name || "Sin gastos"}
                            </p>
                            <p className="text-[10px] text-violet-500">
                                {categoryTotals[0]
                                    ? `${((categoryTotals[0].amount / monthlyExpenses) * 100).toFixed(0)}% de gastos`
                                    : ""}
                            </p>
                        </div>
                    </div>
                    {categoryTotals.length > 0 && (
                        <div className="grid md:grid-cols-[140px_1fr] gap-5 items-center">
                            <div
                                className="mx-auto w-28 h-28 rounded-full flex items-center justify-center"
                                style={{
                                    background: `conic-gradient(#10b981 0 ${Math.min(100, (categoryTotals[0].amount / monthlyExpenses) * 100)}%, #e2e8f0 0 100%)`,
                                }}
                            >
                                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-center text-[10px] font-bold text-slate-500">
                                    Gastos
                                </div>
                            </div>
                            <div className="space-y-3">
                                {categoryTotals.slice(0, 5).map((category) => {
                                    const percent =
                                        (category.amount / monthlyExpenses) *
                                        100;
                                    const previous =
                                        previousCategories[category.name] || 0;
                                    const difference =
                                        category.amount - previous;
                                    return (
                                        <div key={category.name}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                    {category.name}
                                                </span>
                                                <span className="text-slate-500">
                                                    {formatMoney(
                                                        category.amount,
                                                    )}{" "}
                                                    · {percent.toFixed(0)}%{" "}
                                                    {previous > 0 && (
                                                        <em
                                                            className={
                                                                difference > 0
                                                                    ? "text-rose-500 not-italic"
                                                                    : "text-emerald-500 not-italic"
                                                            }
                                                        >
                                                            (
                                                            {difference > 0
                                                                ? "+"
                                                                : ""}
                                                            {formatMoney(
                                                                difference,
                                                            )}{" "}
                                                            vs. mes anterior)
                                                        </em>
                                                    )}
                                                </span>
                                            </div>
                                            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                                                <div
                                                    className="h-2 rounded-full bg-emerald-500"
                                                    style={{
                                                        width: `${percent}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </section>
                {/* TARJETA PRINCIPAL */}
                <div
                    ref={budgetTrackRef}
                    className="flex gap-4 overflow-x-auto pb-3 items-center"
                    style={{
                        scrollSnapType: "x mandatory",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        paddingLeft: "calc(50% - 160px)",
                        paddingRight: "calc(50% - 160px)",
                    }}
                >
                    {budgetItems.map((budget, index) => {
                        if (budget === "__create__")
                            return (
                                <div
                                    key="create"
                                    onClick={() => setIsBudgetModalOpen(true)}
                                    className="cursor-pointer border border-dashed border-emerald-200 dark:border-emerald-800/50 rounded-3xl p-5 flex flex-col justify-center items-center text-center bg-emerald-50/30 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                                    style={{
                                        ...stackStyle(index, budgetActive),
                                        width: CARD_W,
                                        minWidth: CARD_W,
                                        minHeight: 160,
                                    }}
                                >
                                    <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-full text-emerald-500 dark:text-emerald-400 mb-2">
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 4v16m8-8H4"
                                            />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                        Crear Cuenta
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        Nueva cuenta principal
                                    </span>
                                </div>
                            );
                        const isSelected = selectedBudgetId === budget.id;
                        const budgetExpenses = budget.sub_accounts.flatMap(
                            (s) => s.expenses,
                        );
                        const budgetTotal = budgetExpenses.reduce(
                            (sum, e) => sum + parseFloat(e.amount),
                            0,
                        );
                        const pct =
                            budget.initial_amount > 0
                                ? Math.min(
                                      100,
                                      (parseFloat(budget.available_amount) /
                                          parseFloat(budget.initial_amount)) *
                                          100,
                                  )
                                : 0;
                        return (
                            <div
                                key={budget.id}
                                onClick={() =>
                                    setSelectedBudgetId(
                                        isSelected ? null : budget.id,
                                    )
                                }
                                onMouseMove={handle3DMove}
                                onMouseLeave={handle3DLeave}
                                className={`cursor-pointer p-5 rounded-3xl border relative overflow-hidden ${
                                    isSelected
                                        ? "border-transparent shadow-xl"
                                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/50 shadow-sm hover:border-emerald-200 dark:hover:border-emerald-800/50"
                                }`}
                                style={{
                                    ...stackStyle(index, budgetActive),
                                    width: CARD_W,
                                    minWidth: CARD_W,
                                    ...(isSelected
                                        ? {
                                              backgroundImage: coverImageUrl
                                                  ? `url(${coverImageUrl})`
                                                  : undefined,
                                              backgroundSize: "cover",
                                              backgroundPosition: "center",
                                              backgroundColor: coverImageUrl
                                                  ? undefined
                                                  : "#1e293b",
                                          }
                                        : {}),
                                }}
                            >
                                {isSelected && (
                                    <div
                                        className="absolute inset-0 rounded-3xl"
                                        style={{
                                            background: coverImageUrl
                                                ? "rgba(0,0,0,0.2)"
                                                : "rgba(15,23,42,0.4)",
                                        }}
                                    />
                                )}
                                <div
                                    className={`relative z-10 text-xs font-bold uppercase tracking-wider mb-1 ${isSelected ? "text-white/80" : "text-slate-400 dark:text-slate-500"}`}
                                >
                                    {budget.name}
                                </div>
                                <div
                                    className={`relative z-10 text-2xl font-extrabold mb-1 ${isSelected ? "text-white" : "text-slate-800 dark:text-slate-100"}`}
                                >
                                    {formatMoney(budget.available_amount)}
                                </div>
                                <div
                                    className={`relative z-10 text-[10px] font-semibold mb-3 ${
                                        isSelected
                                            ? budget.type === "ahorro"
                                                ? "text-emerald-200"
                                                : "text-rose-200"
                                            : budget.type === "ahorro"
                                              ? "text-emerald-500"
                                              : "text-rose-400"
                                    }`}
                                >
                                    {budget.type === "ahorro"
                                        ? `Meta: ${formatMoney(budget.initial_amount)}${budget.target_month ? ` · ${formatMonthSpanish(budget.target_month)}` : ""}`
                                        : `Gastos: ${formatMoney(budgetTotal)}`}
                                </div>
                                <div
                                    className={`relative z-10 w-full rounded-full h-1.5 mb-2 ${isSelected ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700"}`}
                                >
                                    <div
                                        className={`h-1.5 rounded-full transition-all duration-300 ${isSelected ? "bg-white" : budget.type === "ahorro" ? "bg-emerald-400" : "bg-emerald-500"}`}
                                        style={{ width: `${pct}%` }}
                                    ></div>
                                </div>
                                <div
                                    className={`relative z-10 flex justify-between text-[10px] ${isSelected ? "text-white/70" : "text-slate-400 dark:text-slate-500"}`}
                                >
                                    <span>
                                        {budget.type === "ahorro"
                                            ? "Meta"
                                            : "Inicial"}
                                        : {formatMoney(budget.initial_amount)}
                                    </span>
                                    <span>
                                        {budget.type === "ahorro"
                                            ? `${Math.min(100, Math.round(pct))}%`
                                            : `${budget.sub_accounts.length} subcuentas`}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* DETALLE DE CUENTA SELECCIONADA */}
                {selectedBudget && (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Cuenta seleccionada
                                </p>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                    {selectedBudget.name}
                                </h3>
                            </div>
                            <button
                                onClick={openBudgetEdit}
                                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600"
                            >
                                Editar cuenta
                            </button>
                        </div>
                        {/* SUBCUENTAS */}
                        <div className="space-y-4">
                            {selectedBudget.type === "ahorro" ? (
                                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-3xl shadow-sm p-6 space-y-4">
                                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                                        Registrar Ahorro
                                    </h3>
                                    {selectedBudget.target_month &&
                                        (() => {
                                            const remaining = Math.max(
                                                0,
                                                parseFloat(
                                                    selectedBudget.initial_amount,
                                                ) -
                                                    parseFloat(
                                                        selectedBudget.available_amount,
                                                    ),
                                            );
                                            const months = monthsUntilTarget(
                                                selectedBudget.target_month,
                                            );
                                            return (
                                                <div className="grid grid-cols-3 gap-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center">
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-emerald-600">
                                                            Falta
                                                        </p>
                                                        <p className="text-sm font-extrabold text-emerald-800 dark:text-emerald-200">
                                                            {formatMoney(
                                                                remaining,
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-emerald-600">
                                                            Fecha meta
                                                        </p>
                                                        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                                                            {formatMonthSpanish(
                                                                selectedBudget.target_month,
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-emerald-600">
                                                            Por mes
                                                        </p>
                                                        <p className="text-sm font-extrabold text-emerald-800 dark:text-emerald-200">
                                                            {formatMoney(
                                                                remaining /
                                                                    months,
                                                            )}
                                                        </p>
                                                        <p className="text-[9px] text-emerald-600">
                                                            {months}{" "}
                                                            {months === 1
                                                                ? "mes"
                                                                : "meses"}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    <form
                                        onSubmit={handleSavingSubmit}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                                Cantidad a Ahorrar
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                                                    $
                                                </span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Ej. 500"
                                                    value={
                                                        savingForm.data.amount
                                                    }
                                                    onChange={(e) =>
                                                        savingForm.setData(
                                                            "amount",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full pl-7 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                    required
                                                />
                                            </div>
                                            {savingForm.errors.amount && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {savingForm.errors.amount}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                                Comentario (opcional)
                                            </label>
                                            <input
                                                type="text"
                                                value={savingForm.data.comment}
                                                onChange={(e) =>
                                                    savingForm.setData(
                                                        "comment",
                                                        e.target.value.toUpperCase(),
                                                    )
                                                }
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                maxLength={255}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={savingForm.processing}
                                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
                                        >
                                            {savingForm.processing
                                                ? "Guardando..."
                                                : "Guardar Ahorro"}
                                        </button>
                                    </form>
                                </div>
                            ) : selectedBudget.sub_accounts.length === 0 ? (
                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                                        No has creado ninguna subcuenta para{" "}
                                        {selectedBudget.name}.
                                    </p>
                                    <button
                                        onClick={() =>
                                            setIsSubAccountModalOpen(true)
                                        }
                                        className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold py-2 px-4 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm transition-all text-xs"
                                    >
                                        Crear primera subcuenta
                                    </button>
                                </div>
                            ) : (
                                <div
                                    ref={subTrackRef}
                                    className="flex gap-4 overflow-x-auto pb-3 items-center"
                                    style={{
                                        scrollSnapType: "x mandatory",
                                        scrollbarWidth: "none",
                                        msOverflowStyle: "none",
                                        paddingLeft: "calc(50% - 160px)",
                                        paddingRight: "calc(50% - 160px)",
                                    }}
                                >
                                    {subItems.map((sub, index) => {
                                        if (sub === "__create_sub__")
                                            return (
                                                <div
                                                    key="create-sub"
                                                    onClick={() =>
                                                        setIsSubAccountModalOpen(
                                                            true,
                                                        )
                                                    }
                                                    className="cursor-pointer border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-5 flex flex-col justify-center items-center text-center bg-slate-50/50 dark:bg-slate-800/10 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                                                    style={{
                                                        ...stackStyle(
                                                            index,
                                                            subActive,
                                                        ),
                                                        width: CARD_W,
                                                        minWidth: CARD_W,
                                                        minHeight: 160,
                                                    }}
                                                >
                                                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 mb-2">
                                                        <svg
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M12 4v16m8-8H4"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                        Crear Subcuenta
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        Disponible:{" "}
                                                        {formatMoney(
                                                            remainingToAllocate,
                                                        )}
                                                    </span>
                                                </div>
                                            );
                                        const percentRemaining =
                                            (parseFloat(sub.current_amount) /
                                                parseFloat(
                                                    sub.initial_amount,
                                                )) *
                                            100;
                                        let progressColor = "bg-emerald-500";
                                        let bgHoverColor =
                                            "hover:border-emerald-200 dark:hover:border-emerald-800/50";
                                        if (percentRemaining <= 20) {
                                            progressColor = "bg-rose-500";
                                            bgHoverColor =
                                                "hover:border-rose-200 dark:hover:border-rose-800/50";
                                        } else if (percentRemaining <= 50) {
                                            progressColor = "bg-amber-500";
                                            bgHoverColor =
                                                "hover:border-amber-200 dark:hover:border-amber-800/50";
                                        }
                                        const isSelected =
                                            selectedSubAccountId === sub.id;
                                        return (
                                            <div
                                                key={sub.id}
                                                onClick={() =>
                                                    setSelectedSubAccountId(
                                                        isSelected
                                                            ? null
                                                            : sub.id,
                                                    )
                                                }
                                                onMouseMove={handle3DMove}
                                                onMouseLeave={handle3DLeave}
                                                className={`cursor-pointer p-5 rounded-3xl border ${
                                                    isSelected
                                                        ? "bg-slate-100 dark:bg-slate-700 border-slate-400 dark:border-slate-500"
                                                        : `bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/50 ${bgHoverColor}`
                                                }`}
                                                style={{
                                                    ...stackStyle(
                                                        index,
                                                        subActive,
                                                    ),
                                                    width: CARD_W,
                                                    minWidth: CARD_W,
                                                }}
                                            >
                                                <div className="flex items-center gap-4 mb-4">
                                                    {getSubAccountIcon(
                                                        sub.name,
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                                            {sub.name}
                                                        </h4>
                                                        <p
                                                            className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${sub.type === "ahorro" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                                                        >
                                                            {sub.type ===
                                                            "ahorro"
                                                                ? "Ahorro"
                                                                : "Gasto"}
                                                        </p>
                                                        <p className="text-xs text-slate-400 dark:text-slate-500">
                                                            Asignado:{" "}
                                                            {formatMoney(
                                                                sub.initial_amount,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-baseline justify-between">
                                                        <span className="text-xs text-slate-400 dark:text-slate-500">
                                                            Disponible
                                                        </span>
                                                        <span
                                                            className={`text-base font-extrabold ${percentRemaining <= 20 ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-200"}`}
                                                        >
                                                            {formatMoney(
                                                                sub.current_amount,
                                                            )}
                                                        </span>
                                                    </div>
                                                    {percentRemaining <= 20 && (
                                                        <p className="text-[10px] font-bold text-rose-500 mt-2">
                                                            {percentRemaining <=
                                                            0
                                                                ? "Límite alcanzado"
                                                                : "Alerta: queda menos del 20%"}
                                                        </p>
                                                    )}
                                                    <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5">
                                                        <div
                                                            className={`h-1.5 rounded-full transition-all duration-300 ${progressColor}`}
                                                            style={{
                                                                width: `${Math.max(0, Math.min(100, percentRemaining))}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* DETALLE SUBCUENTA + HISTORIAL */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                            <div className="lg:col-span-2 space-y-6">
                                {selectedBudget.type === "ahorro" ? (
                                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-3xl shadow-sm p-6 space-y-4">
                                        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                            Historial de Ahorros
                                        </h4>
                                        {allExpenses.length === 0 ? (
                                            <p className="text-sm text-slate-400 dark:text-slate-500 italic py-4 text-center">
                                                No hay ahorros registrados aún.
                                            </p>
                                        ) : (
                                            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                                {allExpenses.map((expense) => (
                                                    <div
                                                        key={expense.id}
                                                        className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/20 border border-slate-100/50 dark:border-slate-800 rounded-2xl"
                                                    >
                                                        <div className="min-w-0 flex-1 pr-4">
                                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                                                {expense.comment ||
                                                                    "Depósito"}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                                                {formatDate(
                                                                    expense.date,
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                                                                +
                                                                {formatMoney(
                                                                    expense.amount,
                                                                )}
                                                            </span>
                                                            <button
                                                                onClick={() =>
                                                                    openEditRecord(
                                                                        expense,
                                                                    )
                                                                }
                                                                className="text-slate-400 hover:text-emerald-500 text-xs font-bold"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleDeleteExpense(
                                                                        expense.id,
                                                                    )
                                                                }
                                                                className="text-slate-400 hover:text-rose-500 text-xs font-bold"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : activeSubAccount ? (
                                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-3xl shadow-sm p-6 space-y-6">
                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                                            <div className="flex items-center gap-3">
                                                {getSubAccountIcon(
                                                    activeSubAccount.name,
                                                )}
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                                        Detalle:{" "}
                                                        {activeSubAccount.name}
                                                    </h3>
                                                    <p className="text-xs text-slate-400">
                                                        Asignado:{" "}
                                                        {formatMoney(
                                                            activeSubAccount.initial_amount,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={openSubAccountEdit}
                                                    className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-600 dark:text-slate-300 font-semibold px-3 py-2 rounded-xl text-xs transition-all"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setIsExpenseModalOpen(
                                                            true,
                                                        )
                                                    }
                                                    className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-emerald-500/15"
                                                >
                                                    Nuevo Gasto
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setSelectedSubAccountId(
                                                            null,
                                                        )
                                                    }
                                                    className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-600 dark:text-slate-300 font-semibold px-3 py-2 rounded-xl text-xs transition-all"
                                                >
                                                    Cerrar
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl">
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                    Saldo Disponible
                                                </span>
                                                <div
                                                    className={`text-xl font-extrabold ${parseFloat(activeSubAccount.current_amount) < 0 ? "text-rose-600" : "text-slate-700 dark:text-slate-200"}`}
                                                >
                                                    {formatMoney(
                                                        activeSubAccount.current_amount,
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                    Gastos Registrados
                                                </span>
                                                <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
                                                    {formatMoney(
                                                        parseFloat(
                                                            activeSubAccount.initial_amount,
                                                        ) -
                                                            parseFloat(
                                                                activeSubAccount.current_amount,
                                                            ),
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                                                Historial de Gastos
                                            </h4>
                                            {activeSubAccount.expenses
                                                .length === 0 ? (
                                                <p className="text-sm text-slate-400 dark:text-slate-500 italic py-4 text-center">
                                                    No hay gastos registrados
                                                    aún.
                                                </p>
                                            ) : (
                                                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                                    {activeSubAccount.expenses.map(
                                                        (expense) => (
                                                            <div
                                                                key={expense.id}
                                                                className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/20 border border-slate-100/50 dark:border-slate-800 rounded-2xl hover:bg-slate-100/40 dark:hover:bg-slate-800/20 transition-all"
                                                            >
                                                                <div className="min-w-0 flex-1 pr-4">
                                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                                                        {expense.comment ||
                                                                            "Gasto registrado"}
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                                                        {formatDate(
                                                                            expense.date,
                                                                        )}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                                                                        -
                                                                        {formatMoney(
                                                                            expense.amount,
                                                                        )}
                                                                    </span>
                                                                    <button
                                                                        onClick={() =>
                                                                            openEditRecord(
                                                                                expense,
                                                                            )
                                                                        }
                                                                        className="text-slate-400 hover:text-emerald-500 text-xs font-bold"
                                                                    >
                                                                        Editar
                                                                    </button>
                                                                    <button
                                                                        onClick={() =>
                                                                            handleDeleteExpense(
                                                                                expense.id,
                                                                            )
                                                                        }
                                                                        className="text-slate-300 hover:text-rose-500 active:scale-90 transition-all"
                                                                        title="Eliminar gasto"
                                                                    >
                                                                        <svg
                                                                            className="w-4.5 h-4.5"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth="2"
                                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                            />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-3xl shadow-sm p-6 flex flex-col justify-center items-center text-center min-h-[300px]">
                                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-700/50 text-slate-400 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                            <svg
                                                className="w-6 h-6"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                                                />
                                            </svg>
                                        </div>
                                        <h4 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1">
                                            Presiona una Subcuenta
                                        </h4>
                                        <p className="text-slate-400 dark:text-slate-500 text-xs max-w-xs leading-relaxed">
                                            Selecciona una subcuenta para ver su
                                            historial y registrar gastos.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                    Historial General
                                </h3>
                                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-3xl p-5 shadow-sm space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                        Gastos de {selectedBudget.name}
                                    </h4>
                                    {allExpenses.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic py-6 text-center">
                                            Ningún gasto registrado.
                                        </p>
                                    ) : (
                                        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                                            {allExpenses.map((expense) => (
                                                <div
                                                    key={`global-${expense.id}`}
                                                    onClick={() =>
                                                        setSelectedSubAccountId(
                                                            expense.sub_account_id,
                                                        )
                                                    }
                                                    className="cursor-pointer p-3 bg-slate-50 dark:bg-slate-900/10 border border-slate-100/50 dark:border-slate-800 rounded-2xl hover:border-slate-200 dark:hover:border-slate-700 transition-all flex items-center justify-between"
                                                >
                                                    <div className="min-w-0 flex-1 pr-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-200/50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md truncate max-w-[80px]">
                                                                {
                                                                    expense.sub_account_name
                                                                }
                                                            </span>
                                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                                                                {expense.comment ||
                                                                    "Gasto"}
                                                            </span>
                                                        </div>
                                                        <span className="text-[9px] text-slate-400 block mt-0.5">
                                                            {formatDate(
                                                                expense.date,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <span
                                                        className={`text-xs font-extrabold ${selectedBudget.type === "ahorro" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                                                    >
                                                        {selectedBudget.type ===
                                                        "ahorro"
                                                            ? "+"
                                                            : "-"}
                                                        {formatMoney(
                                                            expense.amount,
                                                        )}
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

            {/* MODALS */}

            {/* Modal Crear Cuenta */}
            {isBudgetModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setIsBudgetModalOpen(false)}
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                            Nueva Cuenta
                        </h3>
                        <p className="text-slate-400 dark:text-slate-500 text-xs mb-6">
                            Crea una nueva cuenta principal con nombre y monto
                            disponible.
                        </p>
                        <form
                            onSubmit={handleBudgetSubmit}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                    Nombre de la Cuenta
                                </label>
                                <input
                                    type="text"
                                    value={budgetForm.data.name.toUpperCase()}
                                    onChange={(e) =>
                                        budgetForm.setData(
                                            "name",
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                    maxLength={100}
                                />
                                {budgetForm.errors.name && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {budgetForm.errors.name}
                                    </p>
                                )}
                            </div>
                            {budgetForm.data.type === "ahorro" && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                        Fecha Meta
                                    </label>
                                    <input
                                        type="month"
                                        min={selectedMonth}
                                        value={budgetForm.data.target_month}
                                        onChange={(e) =>
                                            budgetForm.setData(
                                                "target_month",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        Mes y año en que quieres completar esta
                                        meta.
                                    </p>
                                    {budgetForm.errors.target_month && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {budgetForm.errors.target_month}
                                        </p>
                                    )}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                    Tipo de Cuenta
                                </label>
                                <select
                                    value={budgetForm.data.type}
                                    onChange={(e) =>
                                        budgetForm.setData(
                                            "type",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="ahorro">Ahorro</option>
                                    <option value="gasto">Gasto</option>
                                </select>
                                {budgetForm.errors.type && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {budgetForm.errors.type}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                    Monto Disponible
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                                        $
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Ej. 700"
                                        value={budgetForm.data.amount}
                                        onChange={(e) =>
                                            budgetForm.setData(
                                                "amount",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full pl-7 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                {budgetForm.errors.amount && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {budgetForm.errors.amount}
                                    </p>
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
                                    {budgetForm.processing
                                        ? "Creando..."
                                        : "Crear Cuenta"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Crear Subcuenta */}
            {isSubAccountModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setIsSubAccountModalOpen(false)}
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                            Nueva Subcuenta
                        </h3>
                        <p className="text-slate-400 dark:text-slate-500 text-xs mb-6">
                            Asigna parte de {selectedBudget?.name} a una
                            subcuenta específica.
                        </p>
                        <form
                            onSubmit={handleSubAccountSubmit}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                    Nombre de la Subcuenta
                                </label>
                                <input
                                    type="text"
                                    value={subAccountForm.data.name}
                                    onChange={(e) =>
                                        subAccountForm.setData(
                                            "name",
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                    maxLength={100}
                                />
                                {subAccountForm.errors.name && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {subAccountForm.errors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                    Monto Asignado
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                                        $
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder={`Máximo: ${remainingToAllocate}`}
                                        value={subAccountForm.data.amount}
                                        onChange={(e) =>
                                            subAccountForm.setData(
                                                "amount",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full pl-7 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                    Disponible para asignar:{" "}
                                    {formatMoney(remainingToAllocate)}
                                </span>
                                {subAccountForm.errors.amount && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {subAccountForm.errors.amount}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsSubAccountModalOpen(false)
                                    }
                                    className="w-1/2 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={subAccountForm.processing}
                                    className="w-1/2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
                                >
                                    {subAccountForm.processing
                                        ? "Creando..."
                                        : "Crear Subcuenta"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Agregar Gasto */}
            {isExpenseModalOpen && activeSubAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setIsExpenseModalOpen(false)}
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
                            Agregar Gasto: {activeSubAccount.name}
                        </h3>
                        <p className="text-slate-400 dark:text-slate-500 text-xs mb-6">
                            Registra una compra y el saldo se restará de la
                            subcuenta.
                        </p>
                        <form
                            onSubmit={handleExpenseSubmit}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                    Monto del Gasto
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                                        $
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={expenseForm.data.amount}
                                        onChange={(e) =>
                                            expenseForm.setData(
                                                "amount",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full pl-7 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                    Saldo disponible:{" "}
                                    {formatMoney(
                                        activeSubAccount.current_amount,
                                    )}
                                </span>
                                {expenseForm.data.amount &&
                                    parseFloat(expenseForm.data.amount) >
                                        parseFloat(
                                            activeSubAccount.current_amount,
                                        ) && (
                                        <p className="text-amber-500 text-[10px] font-semibold mt-1">
                                            Advertencia: El gasto excede el
                                            saldo (quedará negativo).
                                        </p>
                                    )}
                                {expenseForm.errors.amount && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {expenseForm.errors.amount}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                    Comentario / Descripción
                                </label>
                                <input
                                    type="text"
                                    value={expenseForm.data.comment}
                                    onChange={(e) =>
                                        expenseForm.setData(
                                            "comment",
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    maxLength={255}
                                />
                                {expenseForm.errors.comment && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {expenseForm.errors.comment}
                                    </p>
                                )}
                            </div>
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
                                    {expenseForm.processing
                                        ? "Guardando..."
                                        : "Guardar Gasto"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isBudgetEditOpen && selectedBudget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-5">
                            Editar cuenta
                        </h3>
                        <form
                            onSubmit={handleBudgetEditSubmit}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                                    Nombre
                                </label>
                                <input
                                    required
                                    maxLength={100}
                                    value={budgetEditData.name}
                                    onChange={(e) =>
                                        setBudgetEditData((data) => ({
                                            ...data,
                                            name: e.target.value.toUpperCase(),
                                        }))
                                    }
                                    className="w-full px-4 py-2.5 uppercase rounded-xl bg-slate-50 border border-slate-200 dark:border-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                                    {selectedBudget.type === "ahorro"
                                        ? "Monto meta"
                                        : "Monto inicial"}
                                </label>
                                <input
                                    required
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={budgetEditData.amount}
                                    onChange={(e) =>
                                        setBudgetEditData((data) => ({
                                            ...data,
                                            amount: e.target.value,
                                        }))
                                    }
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50  border border-slate-200 dark:border-slate-700"
                                />
                            </div>
                            {selectedBudget.type === "ahorro" && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                                        Fecha meta
                                    </label>
                                    <input
                                        required
                                        type="month"
                                        value={budgetEditData.target_month}
                                        onChange={(e) =>
                                            setBudgetEditData((data) => ({
                                                ...data,
                                                target_month: e.target.value,
                                            }))
                                        }
                                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50  border border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsBudgetEditOpen(false)}
                                    className="w-1/2 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="w-1/2 py-2.5 bg-emerald-500 text-white font-bold rounded-xl text-sm"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isSubAccountEditOpen && activeSubAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
                            Editar subcuenta
                        </h3>
                        <p className="text-xs text-slate-400 mb-5">
                            Los gastos ya registrados se conservarán al ajustar
                            el monto.
                        </p>
                        <form
                            onSubmit={handleSubAccountEditSubmit}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                                    Nombre
                                </label>
                                <input
                                    required
                                    maxLength={100}
                                    value={subAccountEditData.name}
                                    onChange={(e) =>
                                        setSubAccountEditData((data) => ({
                                            ...data,
                                            name: e.target.value.toUpperCase(),
                                        }))
                                    }
                                    className="w-full px-4 py-2.5 uppercase rounded-xl bg-slate-50 border border-slate-200 dark:border-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                                    Monto asignado
                                </label>
                                <input
                                    required
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={subAccountEditData.amount}
                                    onChange={(e) =>
                                        setSubAccountEditData((data) => ({
                                            ...data,
                                            amount: e.target.value,
                                        }))
                                    }
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 dark:border-slate-700"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsSubAccountEditOpen(false)
                                    }
                                    className="w-1/2 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="w-1/2 py-2.5 bg-emerald-500 text-white font-bold rounded-xl text-sm"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {editingRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
                            Editar{" "}
                            {editingRecord.is_saving ? "ahorro" : "gasto"}
                        </h3>
                        <p className="text-xs text-slate-400 mb-5">
                            El saldo se recalculará automáticamente.
                        </p>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Monto
                                </label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    required
                                    value={editForm.data.amount}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "amount",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                                />
                                {editForm.errors.amount && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {editForm.errors.amount}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Comentario
                                </label>
                                <input
                                    type="text"
                                    maxLength={255}
                                    value={editForm.data.comment}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "comment",
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    className="w-full px-4 py-2.5 uppercase bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Fecha
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={editForm.data.date}
                                    onChange={(e) =>
                                        editForm.setData("date", e.target.value)
                                    }
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingRecord(null)}
                                    className="w-1/2 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="w-1/2 py-2.5 bg-emerald-500 text-white font-bold rounded-xl text-sm"
                                >
                                    {editForm.processing
                                        ? "Guardando..."
                                        : "Guardar cambios"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
