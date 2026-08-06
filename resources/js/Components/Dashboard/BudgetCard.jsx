export default function BudgetCard({
    budget,
    index,
    active,
    isSelected,
    coverImageUrl,
    stackStyle,
    handle3DMove,
    handle3DLeave,
    onSelect,
    onDelete,
    formatMoney,
    formatMonthSpanish,
    CARD_W,
}) {
    const budgetExpenses = budget.sub_accounts.flatMap((s) => s.expenses);
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
            onClick={onSelect}
            onMouseMove={handle3DMove}
            onMouseLeave={handle3DLeave}
            className={`cursor-pointer p-6 rounded-3xl border relative overflow-hidden flex flex-col justify-between ${
                isSelected
                    ? "border-transparent shadow-xl"
                    : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/50 shadow-sm hover:border-emerald-200 dark:hover:border-emerald-800/50"
            }`}
            style={{
                ...stackStyle(index, active),
                width: CARD_W,
                minWidth: CARD_W,
                minHeight: 190,
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
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                title="Eliminar cuenta"
                className="absolute top-2 right-4 z-20 text-slate-400 hover:text-rose-500 p-1 rounded-full bg-white/60 dark:bg-slate-800/60"
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
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>
            <span
                className={`absolute top-10 right-4 z-10 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider ${
                    budget.type === "ahorro"
                        ? isSelected
                            ? "bg-emerald-400/25 text-emerald-100 border border-emerald-200/40"
                            : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                        : isSelected
                          ? "bg-rose-400/25 text-rose-100 border border-rose-200/40"
                          : "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300"
                }`}
            >
                {budget.type === "ahorro" ? "AHORRO" : "GASTO"}
            </span>
            <div className="relative z-10">
                <div
                    className={`text-xs font-bold uppercase tracking-wider mb-2 ${isSelected ? "text-white/80" : "text-slate-400 dark:text-slate-500"}`}
                >
                    {budget.name}
                </div>
                <div
                    className={`text-3xl font-extrabold mb-1 ${isSelected ? "text-white" : "text-slate-800 dark:text-slate-100"}`}
                >
                    {formatMoney(budget.available_amount)}
                </div>
                <div
                    className={`text-xs font-semibold mt-1 ${
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
            </div>
            <div className="relative z-10">
                <div
                    className={`w-full rounded-full h-2 mb-3 ${isSelected ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700"}`}
                >
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ${isSelected ? "bg-white" : budget.type === "ahorro" ? "bg-emerald-400" : "bg-emerald-500"}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <div
                    className={`flex justify-between text-xs ${isSelected ? "text-white/70" : "text-slate-400 dark:text-slate-500"}`}
                >
                    <span>
                        {budget.type === "ahorro" ? "Meta" : "Inicial"}:{" "}
                        {formatMoney(budget.initial_amount)}
                    </span>
                    <span>
                        {budget.type === "ahorro"
                            ? `${Math.min(100, Math.round(pct))}%`
                            : `${budget.sub_accounts.length} subcuentas`}
                    </span>
                </div>
            </div>
        </div>
    );
}
