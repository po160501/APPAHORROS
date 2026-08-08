import * as Icons from "lucide-react";
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
                        className="text-slate-300 hover:text-emerald-500 text-xs font-bold"
                    >
                        <Icons.Pen className="w-5 h-5" />
                    </button>
                )}
                <button
                    onClick={() => onDelete(expense.id)}
                    className="text-slate-300 hover:text-rose-500 active:scale-90 transition-all"
                    title="Eliminar"
                >
                    <Icons.Trash2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
