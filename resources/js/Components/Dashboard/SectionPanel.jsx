export default function SectionPanel({ children, header, expanded, onToggle }) {
    return (
        <section className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-3xl shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">{header}</div>
                {onToggle && (
                    <button
                        type="button"
                        onClick={onToggle}
                        aria-expanded={expanded}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition shrink-0"
                    >
                        <svg
                            className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : "rotate-0"}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </button>
                )}
            </div>
            {expanded !== undefined ? expanded && children : children}
        </section>
    );
}
