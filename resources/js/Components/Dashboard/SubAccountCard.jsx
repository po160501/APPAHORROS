export default function SubAccountCard({
    sub,
    index,
    active,
    isSelected,
    stackStyle,
    handle3DMove,
    handle3DLeave,
    onSelect,
    getSubAccountIcon,
    formatMoney,
    CARD_W,
}) {
    const percentRemaining =
        (parseFloat(sub.current_amount) / parseFloat(sub.initial_amount)) * 100;
    let progressColor = "bg-emerald-500";
    let bgHoverColor =
        "hover:border-emerald-200 dark:hover:border-emerald-800/50";
    if (percentRemaining <= 20) {
        progressColor = "bg-rose-500";
        bgHoverColor = "hover:border-rose-200 dark:hover:border-rose-800/50";
    } else if (percentRemaining <= 50) {
        progressColor = "bg-amber-500";
        bgHoverColor = "hover:border-amber-200 dark:hover:border-amber-800/50";
    }

    return (
        <div
            onClick={onSelect}
            onMouseMove={handle3DMove}
            onMouseLeave={handle3DLeave}
            className={`cursor-pointer p-6 rounded-3xl border flex flex-col justify-between ${
                isSelected
                    ? "bg-slate-100 dark:bg-slate-700 border-slate-400 dark:border-slate-500"
                    : `bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/50 ${bgHoverColor}`
            }`}
            style={{
                ...stackStyle(index, active),
                width: CARD_W,
                minWidth: CARD_W,
                minHeight: 190,
            }}
        >
            <div className="flex items-center gap-4">
                {getSubAccountIcon(sub.name)}
                <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                        {sub.name}
                    </h4>
                    <p
                        className={`text-xs uppercase tracking-widest font-semibold ${sub.type === "ahorro" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                    >
                        {sub.type === "ahorro" ? "Ahorro" : "Gasto"}
                    </p>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                    <span className="text-sm text-slate-400 dark:text-slate-500">
                        Disponible
                    </span>
                    <span
                        className={`text-xl font-extrabold ${percentRemaining <= 20 ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-200"}`}
                    >
                        {formatMoney(sub.current_amount)}
                    </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
                    <span>Asignado: {formatMoney(sub.initial_amount)}</span>
                    <span>{Math.max(0, Math.round(percentRemaining))}%</span>
                </div>
                {percentRemaining <= 20 && (
                    <p className="text-xs font-bold text-rose-500">
                        {percentRemaining <= 0
                            ? "Límite alcanzado"
                            : "Alerta: queda menos del 20%"}
                    </p>
                )}
                <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
                        style={{
                            width: `${Math.max(0, Math.min(100, percentRemaining))}%`,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
