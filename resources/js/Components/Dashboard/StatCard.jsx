export default function StatCard({ color, icon, label, value, sub }) {
    const colors = {
        rose: "bg-rose-50 dark:bg-rose-950/30",
        emerald: "bg-emerald-50 dark:bg-emerald-950/30",
        slate: "bg-slate-50 dark:bg-slate-900/50",
        violet: "bg-violet-50 dark:bg-violet-950/30",
    };
    const iconColors = {
        rose: "bg-rose-100 dark:bg-rose-900/40 text-rose-500",
        emerald: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-500",
        slate: "bg-slate-100 dark:bg-slate-800 text-slate-500",
        violet: "bg-violet-100 dark:bg-violet-900/40 text-violet-500",
    };
    const labelColors = {
        rose: "text-rose-500",
        emerald: "text-emerald-500",
        slate: "text-slate-400",
        violet: "text-violet-500",
    };
    const valueColors = {
        rose: "text-rose-700 dark:text-rose-300",
        emerald: "text-emerald-700 dark:text-emerald-300",
        slate: "text-slate-700 dark:text-slate-200",
        violet: "text-violet-700 dark:text-violet-300",
    };

    return (
        <div
            className={`rounded-2xl ${colors[color]} p-4 flex items-start gap-3`}
        >
            <div className={`p-2 ${iconColors[color]} rounded-xl shrink-0`}>
                {icon}
            </div>
            <div>
                <p
                    className={`text-[10px] uppercase font-bold ${labelColors[color]}`}
                >
                    {label}
                </p>
                <p
                    className={`text-xl font-extrabold ${valueColors[color]} truncate`}
                >
                    {value}
                </p>
                {sub && (
                    <p className={`text-[10px] ${labelColors[color]}`}>{sub}</p>
                )}
            </div>
        </div>
    );
}
