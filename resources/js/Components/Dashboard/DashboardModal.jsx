export default function DashboardModal({
    open,
    onClose,
    title,
    subtitle,
    children,
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                <button
                    onClick={onClose}
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
                    {title}
                </h3>
                {subtitle && (
                    <p className="text-slate-400 dark:text-slate-500 text-xs mb-6">
                        {subtitle}
                    </p>
                )}
                {children}
            </div>
        </div>
    );
}
