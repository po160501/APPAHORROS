import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import BudgetCard from "@/Components/Dashboard/BudgetCard";
import DashboardModal from "@/Components/Dashboard/DashboardModal";
import ExpenseRow from "@/Components/Dashboard/ExpenseRow";
import SectionPanel from "@/Components/Dashboard/SectionPanel";
import StatCard from "@/Components/Dashboard/StatCard";
import SubAccountCard from "@/Components/Dashboard/SubAccountCard";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import * as Icons from "lucide-react";

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
    const [isHistorialOpen, setIsHistorialOpen] = useState(false);
    const [isHistorialOpen1, setIsHistorialOpen1] = useState(false);
    const [isSubAccountEditOpen, setIsSubAccountEditOpen] = useState(false);
    const [isMainAccountsExpanded, setIsMainAccountsExpanded] = useState(false);
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
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
    const totalAvailableAmount = budgets.reduce(
        (sum, budget) => sum + parseFloat(budget.available_amount),
        0,
    );
    const accountBalances = budgets.map((budget) => ({
        id: budget.id,
        name: budget.name,
        type: budget.type,
        available_amount: parseFloat(budget.available_amount),
    }));
    const transferForm = useForm({
        from_budget_id: budgets?.[0]?.id || "",
        to_budget_id: budgets?.[1]?.id || "",
        amount: "",
        comment: "",
        date: new Date().toISOString().slice(0, 16),
    });
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

    const handleTransferSubmit = (e) => {
        e.preventDefault();
        transferForm.post(route("account-transfers.store"), {
            onSuccess: () => transferForm.reset("amount", "comment", "date"),
            preserveScroll: true,
        });
    };

    useEffect(() => {
        if (budgets.length >= 2 && !transferForm.data.from_budget_id) {
            transferForm.setData("from_budget_id", budgets[0].id);
        }
        if (budgets.length >= 2 && !transferForm.data.to_budget_id) {
            transferForm.setData("to_budget_id", budgets[1].id);
        }
    }, [budgets]);

    const formatMoney = (amount) =>
        new Intl.NumberFormat("es-PE", {
            style: "currency",
            currency: "PEN",
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

    const openBudgetEdit = (budget = selectedBudget) => {
        if (!budget) return;

        setSelectedBudgetId(budget.id);
        setBudgetEditData({
            name: budget.name,
            amount: budget.initial_amount,
            target_month: budget.target_month || "",
        });
        setIsBudgetEditOpen(true);
    };
    const handleBudgetEditSubmit = (e) => {
        e.preventDefault();
        if (!selectedBudget) return;

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

    const handleDeleteBudget = (budgetId) => {
        if (
            confirm(
                "¿Estás seguro de que deseas eliminar esta cuenta principal? Se eliminarán también sus subcuentas y registros.",
            )
        ) {
            router.delete(route("budgets.destroy", budgetId), {
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

    const [cardW, setCardW] = useState(
        typeof window !== "undefined" && window.innerWidth < 640 ? 310 : 320,
    );
    useEffect(() => {
        const onResize = () => setCardW(window.innerWidth < 640 ? 310 : 320);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);
    const CARD_W = cardW;
    const GAP = 16;
    const STACK_OFFSET = 10;

    const budgetTrackRef = useRef(null);
    const [budgetActive, setBudgetActive] = useState(0);
    const subTrackRef = useRef(null);
    const [subActive, setSubActive] = useState(0);

    const scrollToCard = (trackRef, index) => {
        const el = trackRef.current;
        if (!el) return;
        el.scrollTo({
            left: index * (CARD_W + GAP),
            behavior: "smooth",
        });
    };

    useEffect(() => {
        const el = budgetTrackRef.current;
        if (!el) return;
        const onScroll = () => {
            const idx = Math.min(
                Math.round(el.scrollLeft / (CARD_W + GAP)),
                budgetItems.length - 1,
            );
            setBudgetActive(idx);
            const budget = budgetItems[idx];
            if (budget && budget !== "__create__") {
                setSelectedBudgetId(budget.id);
            } else {
                setSelectedBudgetId(null);
            }
        };
        el.addEventListener("scroll", onScroll, { passive: true });
        return () => el.removeEventListener("scroll", onScroll);
    }, [budgetItems.length]);

    useEffect(() => {
        const el = subTrackRef.current;
        if (!el) return;
        const onScroll = () => {
            const idx = Math.min(
                Math.round(el.scrollLeft / (CARD_W + GAP)),
                subItems.length - 1,
            );
            setSubActive(idx);
            const sub = subItems[idx];
            if (sub && sub !== "__create_sub__") {
                setSelectedSubAccountId(sub.id);
            } else {
                setSelectedSubAccountId(null);
            }
        };
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
                scrollSnapStop: "always",
            };
        if (diff < 0)
            return {
                ...base,
                transform: `translateX(${diff * STACK_OFFSET}px) scale(0.92)`,
                opacity: Math.max(0.4, 1 + diff * 0.25),
                zIndex: index,
                scrollSnapStop: "always",
            };
        return {
            ...base,
            transform: "scale(0.92)",
            opacity: 0.6,
            zIndex: index,
            scrollSnapStop: "always",
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
                    <Icons.Send className="w-6 h-6" />
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
                <Icons.CreditCard className="w-6 h-6" />
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
                {selectedBudget && (
                    <div className="space-y-8">
                        <SectionPanel
                            header={
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                                        {formatMoney(totalAvailableAmount)}
                                    </h3>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setIsHistorialOpen1(true);
                                                setIsMainAccountsExpanded(true);
                                            }}
                                            className="border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-600 dark:text-slate-300 font-semibold px-3 py-2 rounded-xl text-xs transition-all"
                                        >
                                            Transferir
                                        </button>
                                    </div>
                                </div>
                            }
                        ></SectionPanel>
                    </div>
                )}
                {/* TARJETA PRINCIPAL */}
                <div
                    ref={budgetTrackRef}
                    className="flex gap-4 overflow-x-auto py-6 items-center"
                    style={{
                        scrollSnapType: "x mandatory",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        paddingLeft: `calc(50% - ${CARD_W / 2}px)`,
                        paddingRight: `calc(50% - ${CARD_W / 2}px)`,
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
                                        minHeight: 190,
                                    }}
                                >
                                    <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-full text-emerald-500 dark:text-emerald-400 mb-2">
                                        <Icons.Plus className="w-5 h-5" />
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
                            <BudgetCard
                                key={budget.id}
                                budget={budget}
                                index={index}
                                active={budgetActive}
                                isSelected={isSelected}
                                coverImageUrl={coverImageUrl}
                                stackStyle={stackStyle}
                                handle3DMove={handle3DMove}
                                handle3DLeave={handle3DLeave}
                                onSelect={() => {
                                    setSelectedBudgetId(
                                        isSelected ? null : budget.id,
                                    );
                                    scrollToCard(budgetTrackRef, index);
                                }}
                                onEdit={(budget) => openBudgetEdit(budget)}
                                onDelete={() => handleDeleteBudget(budget.id)}
                                formatMoney={formatMoney}
                                formatMonthSpanish={formatMonthSpanish}
                                CARD_W={CARD_W}
                            />
                        );
                    })}
                </div>

                {/* DETALLE DE CUENTA SELECCIONADA */}
                {selectedBudget && (
                    <div className="space-y-8">
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
                                    className="flex gap-4 overflow-x-auto py-6 items-center"
                                    style={{
                                        scrollSnapType: "x mandatory",
                                        scrollbarWidth: "none",
                                        msOverflowStyle: "none",
                                        paddingLeft: `calc(50% - ${CARD_W / 2}px)`,
                                        paddingRight: `calc(50% - ${CARD_W / 2}px)`,
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
                                                        minHeight: 190,
                                                    }}
                                                >
                                                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 mb-2">
                                                        <Icons.Plus className="w-5 h-5" />
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
                                            <SubAccountCard
                                                key={sub.id}
                                                sub={sub}
                                                index={index}
                                                active={subActive}
                                                isSelected={isSelected}
                                                stackStyle={stackStyle}
                                                handle3DMove={handle3DMove}
                                                handle3DLeave={handle3DLeave}
                                                onSelect={() => {
                                                    setSelectedSubAccountId(
                                                        isSelected
                                                            ? null
                                                            : sub.id,
                                                    );
                                                    scrollToCard(
                                                        subTrackRef,
                                                        index,
                                                    );
                                                }}
                                                getSubAccountIcon={
                                                    getSubAccountIcon
                                                }
                                                formatMoney={formatMoney}
                                                CARD_W={CARD_W}
                                            />
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
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                                Historial de Ahorros
                                            </h4>
                                            <button
                                                onClick={() =>
                                                    setIsHistorialOpen(true)
                                                }
                                                className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 transition-colors"
                                            >
                                                Ver todo
                                            </button>
                                        </div>
                                        {allExpenses.length === 0 ? (
                                            <p className="text-sm text-slate-400 dark:text-slate-500 italic py-4 text-center">
                                                No hay ahorros registrados aún.
                                            </p>
                                        ) : (
                                            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                                {allExpenses.map((expense) => (
                                                    <ExpenseRow
                                                        key={expense.id}
                                                        expense={expense}
                                                        type="ahorro"
                                                        onEdit={openEditRecord}
                                                        onDelete={
                                                            handleDeleteExpense
                                                        }
                                                        formatMoney={
                                                            formatMoney
                                                        }
                                                        formatDate={formatDate}
                                                    />
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
                                                    Nuevo
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
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                                    Historial de Gastos
                                                </h4>
                                                <button
                                                    onClick={() =>
                                                        setIsHistorialOpen(true)
                                                    }
                                                    className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 transition-colors"
                                                >
                                                    Ver todo
                                                </button>
                                            </div>
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
                                                            <ExpenseRow
                                                                key={expense.id}
                                                                expense={
                                                                    expense
                                                                }
                                                                type="gasto"
                                                                onEdit={
                                                                    openEditRecord
                                                                }
                                                                onDelete={
                                                                    handleDeleteExpense
                                                                }
                                                                formatMoney={
                                                                    formatMoney
                                                                }
                                                                formatDate={
                                                                    formatDate
                                                                }
                                                            />
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
                        </div>
                    </div>
                )}
            </div>

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
                <SectionPanel
                    header={
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                Resumen de {formatMonthSpanish(selectedMonth)}
                            </h3>
                        </div>
                    }
                    expanded={isSummaryExpanded}
                    onToggle={() =>
                        setIsSummaryExpanded((expanded) => !expanded)
                    }
                >
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
                                    incomeForm.setData("income", e.target.value)
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
                    <div className="grid grid-cols-1 gap-3">
                        <StatCard
                            color="rose"
                            label="Gastado"
                            value={formatMoney(monthlyExpenses)}
                            sub={
                                income > 0
                                    ? `${spendingPctOfIncome.toFixed(1)}% del ingreso`
                                    : "Añade tu ingreso"
                            }
                            icon={<Icons.Wallet className="w-6 h-6" />}
                        />
                        <StatCard
                            color="emerald"
                            label="Ahorrado"
                            value={formatMoney(monthlySavings)}
                            sub={
                                income > 0
                                    ? `${savingPctOfIncome.toFixed(1)}% del ingreso`
                                    : "Depósitos del mes"
                            }
                            icon={<Icons.PiggyBankIcon className="w-6 h-6" />}
                        />
                        <StatCard
                            color="slate"
                            label="Ingreso"
                            value={formatMoney(income)}
                            sub={`Disponible: ${formatMoney(income - monthlyExpenses - monthlySavings)}`}
                            icon={<Icons.HandCoins className="w-6 h-6" />}
                        />
                        <StatCard
                            color="violet"
                            label="Mayor categoría"
                            value={categoryTotals[0]?.name || "Sin gastos"}
                            sub={
                                categoryTotals[0]
                                    ? `${((categoryTotals[0].amount / monthlyExpenses) * 100).toFixed(0)}% de gastos`
                                    : ""
                            }
                            icon={<Icons.Signal className="w-6 h-6" />}
                        />
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
                                                    · {percent.toFixed(0)}%
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
                </SectionPanel>

                {isHistorialOpen1 && selectedBudget && (
                    <DashboardModal
                        open={isHistorialOpen1}
                        onClose={() => {
                            setIsHistorialOpen1(false);
                            setIsMainAccountsExpanded(false);
                        }}
                    >
                        {isMainAccountsExpanded && (
                            <>
                                {budgets.length >= 2 ? (
                                    <form
                                        onSubmit={handleTransferSubmit}
                                        className="grid gap-4 sm:grid-cols-[1fr_1fr] items-end"
                                    >
                                        <div className="grid gap-4 sm:col-span-2 lg:grid-cols-[1fr_1fr_1fr]">
                                            <div>
                                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                                    Desde
                                                </label>
                                                <select
                                                    value={
                                                        transferForm.data
                                                            .from_budget_id
                                                    }
                                                    onChange={(e) =>
                                                        transferForm.setData(
                                                            "from_budget_id",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                                                >
                                                    {budgets.map((budget) => (
                                                        <option
                                                            key={budget.id}
                                                            value={budget.id}
                                                        >
                                                            {budget.name} -{" "}
                                                            {formatMoney(
                                                                budget.available_amount,
                                                            )}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                                    Hacia
                                                </label>
                                                <select
                                                    value={
                                                        transferForm.data
                                                            .to_budget_id
                                                    }
                                                    onChange={(e) =>
                                                        transferForm.setData(
                                                            "to_budget_id",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                                                >
                                                    {budgets.map((budget) => (
                                                        <option
                                                            key={budget.id}
                                                            value={budget.id}
                                                        >
                                                            {budget.name} -{" "}
                                                            {formatMoney(
                                                                budget.available_amount,
                                                            )}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                                    Monto
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    value={
                                                        transferForm.data.amount
                                                    }
                                                    onChange={(e) =>
                                                        transferForm.setData(
                                                            "amount",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                                                    placeholder="0.00"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_2fr]">
                                            <div>
                                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                                    Fecha
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={
                                                        transferForm.data.date
                                                    }
                                                    onChange={(e) =>
                                                        transferForm.setData(
                                                            "date",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                                    Nota
                                                </label>
                                                <input
                                                    type="text"
                                                    value={
                                                        transferForm.data
                                                            .comment
                                                    }
                                                    onChange={(e) =>
                                                        transferForm.setData(
                                                            "comment",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                                                    placeholder="Opcional"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={
                                                    transferForm.processing ||
                                                    transferForm.data
                                                        .from_budget_id ===
                                                        transferForm.data
                                                            .to_budget_id
                                                }
                                                className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-3"
                                            >
                                                Transferir
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="rounded-3xl bg-slate-50 dark:bg-slate-900/40 p-4 border border-slate-100 dark:border-slate-700 text-sm text-slate-500">
                                        Necesitas al menos dos cuentas
                                        principales para transferir dinero.
                                    </div>
                                )}
                            </>
                        )}
                    </DashboardModal>
                )}
            </div>
            {/* MODALS */}

            {/* Modal Historial General */}
            {isHistorialOpen1 && selectedBudget && !isMainAccountsExpanded && (
                <DashboardModal
                    open={isHistorialOpen1}
                    onClose={() => setIsHistorialOpen1(false)}
                    title={`Historial: ${selectedBudget.name}`}
                    subtitle={`${allExpenses.length} registro${allExpenses.length !== 1 ? "s" : ""} en total`}
                >
                    {allExpenses.length === 0 ? (
                        <p className="text-sm text-slate-400 italic py-6 text-center">
                            No hay registros aún.
                        </p>
                    ) : (
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                            {allExpenses.map((expense) => (
                                <div
                                    key={`modal-${expense.id}`}
                                    className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between"
                                >
                                    <div className="min-w-0 flex-1 pr-3">
                                        <div className="flex items-center gap-1.5">
                                            {selectedBudget.type !==
                                                "ahorro" && (
                                                <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded-md truncate max-w-[80px]">
                                                    {expense.sub_account_name}
                                                </span>
                                            )}
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                                                {expense.comment ||
                                                    (selectedBudget.type ===
                                                    "ahorro"
                                                        ? "Ahorro"
                                                        : "Gasto")}
                                            </span>
                                        </div>
                                        <span className="text-[9px] text-slate-400 block mt-0.5">
                                            {formatDate(expense.date)}
                                        </span>
                                    </div>
                                    <span
                                        className={`text-xs font-extrabold ${
                                            selectedBudget.type === "ahorro"
                                                ? "text-emerald-600 dark:text-emerald-400"
                                                : "text-rose-600 dark:text-rose-400"
                                        }`}
                                    >
                                        {selectedBudget.type === "ahorro"
                                            ? "+"
                                            : "-"}
                                        {formatMoney(expense.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </DashboardModal>
            )}

            {/* Modal Crear Cuenta */}
            {isBudgetModalOpen && (
                <DashboardModal
                    open={isBudgetModalOpen}
                    onClose={() => setIsBudgetModalOpen(false)}
                    title="Nueva Cuenta"
                    subtitle="Crea una nueva cuenta principal con nombre y monto disponible."
                >
                    <form onSubmit={handleBudgetSubmit} className="space-y-4">
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
                                    budgetForm.setData("type", e.target.value)
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
                </DashboardModal>
            )}

            {/* Modal Crear Subcuenta */}
            {isSubAccountModalOpen && (
                <DashboardModal
                    open={isSubAccountModalOpen}
                    onClose={() => setIsSubAccountModalOpen(false)}
                    title="Nueva Subcuenta"
                    subtitle={`Asigna parte de ${selectedBudget?.name} a una subcuenta específica.`}
                >
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
                                {subAccountForm.processing
                                    ? "Creando..."
                                    : "Crear Subcuenta"}
                            </button>
                        </div>
                    </form>
                </DashboardModal>
            )}

            {/* Modal Agregar Gasto */}
            {isExpenseModalOpen && activeSubAccount && (
                <DashboardModal
                    open={isExpenseModalOpen}
                    onClose={() => setIsExpenseModalOpen(false)}
                    title={`Agregar Gasto: ${activeSubAccount.name}`}
                    subtitle="Registra una compra y el saldo se restará de la subcuenta."
                >
                    <form onSubmit={handleExpenseSubmit} className="space-y-4">
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
                                {formatMoney(activeSubAccount.current_amount)}
                            </span>
                            {expenseForm.data.amount &&
                                parseFloat(expenseForm.data.amount) >
                                    parseFloat(
                                        activeSubAccount.current_amount,
                                    ) && (
                                    <p className="text-amber-500 text-[10px] font-semibold mt-1">
                                        Advertencia: El gasto excede el saldo
                                        (quedará negativo).
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
                </DashboardModal>
            )}
            {isBudgetEditOpen && selectedBudget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-5">
                            Editar
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
                            Editar
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
