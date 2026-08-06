export default function ExpenseRow({
    expense,
    type = "gasto",
    onEdit,
    onDelete,
    formatMoney,
    formatDate,
}) {
    return (
        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/20 border border-slate-100/50 dark:border-slate-800 rounded-2xl hover:bg-slate-100/40 dark:hover:bg-slate-800/20 transition-all">
            <div className="min-w-0 flex-1 pr-4">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {expense.comment ||
                        (type === "ahorro" ? "Depósito" : "Gasto registrado")}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {formatDate(expense.date)}
                </p>
            </div>
            <div className="flex items-center gap-3">
                <span
                    className={`text-sm font-extrabold ${type === "ahorro" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                >
                    {type === "ahorro" ? "+" : "-"}
                    {formatMoney(expense.amount)}
                </span>
                {onEdit && (
                    <button
                        onClick={() => onEdit(expense)}
                        className="text-slate-400 hover:text-emerald-500 text-xs font-bold"
                    >
                        Editar
                    </button>
                )}
                <button
                    onClick={() => onDelete(expense.id)}
                    className="text-slate-300 hover:text-rose-500 active:scale-90 transition-all"
                    title="Eliminar"
                >
                    <svg
                        className="w-4 h-4"
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
    );
}
