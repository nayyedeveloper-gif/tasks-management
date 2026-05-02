import { useForm } from '@inertiajs/react';
import { Layers, X } from 'lucide-react';

const SPACE_COLORS = [
    '#7c3aed', // Purple
    '#ec4899', // Pink
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#6366f1', // Indigo
    '#64748b', // Slate
];

export default function NewSpaceModal({ onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        color: '#7c3aed',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('spaces.store'), {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <form
                onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
                className="bg-neutral-900 rounded-lg border border-neutral-800 w-full max-w-md"
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                        <Layers size={16} className="text-purple-400" /> New Space
                    </h2>
                    <button type="button" onClick={onClose} className="text-neutral-400 hover:text-white">
                        <X size={16} />
                    </button>
                </div>
                <div className="p-4 space-y-3">
                    <div>
                        <label className="text-xs text-neutral-400">Name</label>
                        <input
                            type="text" value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Marketing, Engineering"
                            className="mt-1 w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-sm text-white outline-none focus:border-purple-500"
                            required autoFocus
                        />
                        {errors.name && <div className="text-red-400 text-xs mt-1">{errors.name}</div>}
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400">Description (optional)</label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className="mt-1 w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-sm text-white outline-none focus:border-purple-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400">Color</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {SPACE_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setData('color', c)}
                                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                                        data.color === c ? 'border-white scale-110' : 'border-transparent'
                                    }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-4 py-3 border-t border-neutral-800">
                    <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-neutral-300 hover:text-white">
                        Cancel
                    </button>
                    <button
                        type="submit" disabled={processing}
                        className="px-4 py-1.5 text-sm bg-purple-600 hover:bg-purple-500 rounded-md text-white disabled:opacity-50"
                    >
                        Create space
                    </button>
                </div>
            </form>
        </div>
    );
}
