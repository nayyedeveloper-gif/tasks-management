import Sidebar from '@/Components/Sidebar';

export default function HomeShell({ title, subtitle, actions, tabs, children }) {
    return (
        <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 pt-4 border-b border-neutral-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-base font-semibold">{title}</h1>
                            {subtitle && (
                                <div className="text-xs text-neutral-500 mt-0.5">{subtitle}</div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">{actions}</div>
                    </div>
                    {tabs && <div className="mt-2 flex items-center gap-1">{tabs}</div>}
                </div>
                <div className="flex-1 overflow-auto">{children}</div>
            </div>
        </div>
    );
}

export function Tab({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-2 text-sm border-b-2 transition-colors ${
                active
                    ? 'border-purple-500 text-white'
                    : 'border-transparent text-neutral-400 hover:text-white'
            }`}
        >
            {children}
        </button>
    );
}
