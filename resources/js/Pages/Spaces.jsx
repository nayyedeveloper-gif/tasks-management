import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import HomeShell from '@/Components/HomeShell';
import { Layers, Plus, Trash2, Edit3, ArrowRight, X, Search } from 'lucide-react';

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

function SpaceModal({ initial, parent, onClose }) {
    const isEdit = !!initial?.id;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: initial?.name || '',
        description: initial?.description || '',
        color: initial?.color || '#7c3aed',
        parent_id: parent?.id || initial?.parent_id || null,
    });

    const submit = (e) => {
        e.preventDefault();
        const opts = {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        };
        if (isEdit) put(route('spaces.update', initial.id), opts);
        else post(route('spaces.store'), opts);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-neutral-900 rounded-lg border border-neutral-800 w-full max-w-md">
                <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                        <Layers size={15} className="text-purple-400" />
                        {isEdit ? 'Edit space' : parent ? `New sub-space in ${parent.name}` : 'New space'}
                    </h2>
                    <button type="button" onClick={onClose} className="text-neutral-400 hover:text-white"><X size={15} /></button>
                </div>
                <div className="p-4 space-y-3">
                    <div>
                        <label className="text-xs text-neutral-400">Name</label>
                        <input
                            value={data.name} onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Marketing, Engineering"
                            className="mt-1 w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-sm text-white outline-none focus:border-purple-500"
                            autoFocus required
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400">Description (optional)</label>
                        <textarea
                            value={data.description} onChange={(e) => setData('description', e.target.value)}
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
                <div className="px-4 py-3 border-t border-neutral-800 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-neutral-300 hover:text-white">Cancel</button>
                    <button type="submit" disabled={processing} className="px-4 py-1.5 text-sm bg-purple-600 hover:bg-purple-500 rounded-md text-white disabled:opacity-60">
                        {isEdit ? 'Save changes' : 'Create'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function SpaceCard({ space, onEdit, onAddChild, onDelete }) {
    const counts = (space.lists?.length || 0) + (space.folders?.length || 0);
    return (
        <div 
            className="group rounded-lg border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-900 transition flex flex-col overflow-hidden"
            style={{ borderLeft: `3px solid ${space.color || '#7c3aed'}` }}
        >
            <div className="p-4 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <Link href={route('spaces.show', space.id)} className="text-sm font-semibold text-white hover:text-purple-300 truncate block flex items-center gap-2">
                            <Layers size={14} style={{ color: space.color || '#7c3aed' }} />
                            {space.name}
                        </Link>
                        {space.description && (
                            <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{space.description}</p>
                        )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                        <button onClick={() => onEdit(space)} className="p-1 text-neutral-500 hover:text-white" title="Edit">
                            <Edit3 size={13} />
                        </button>
                        <button onClick={() => onDelete(space)} className="p-1 text-neutral-500 hover:text-red-400" title="Delete">
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>
                <div className="mt-3 flex items-center gap-3 text-[11px] text-neutral-500">
                    <span>{space.folders?.length || 0} folders</span>
                    <span>·</span>
                    <span>{space.lists?.length || 0} lists</span>
                    {space.children?.length > 0 && (<><span>·</span><span>{space.children.length} sub-spaces</span></>)}
                </div>

                {space.children?.length > 0 && (
                    <div className="mt-3 space-y-1">
                        {space.children.slice(0, 3).map((c) => (
                            <Link
                                key={c.id} href={route('spaces.show', c.id)}
                                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white"
                            >
                                <Layers size={11} className="opacity-60" />
                                <span className="truncate">{c.name}</span>
                            </Link>
                        ))}
                        {space.children.length > 3 && (
                            <span className="text-[10px] text-neutral-500">+{space.children.length - 3} more</span>
                        )}
                    </div>
                )}
            </div>

            <div className="px-4 py-2.5 border-t border-neutral-800 flex items-center justify-between">
                <button
                    onClick={() => onAddChild(space)}
                    className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
                >
                    <Plus size={12} /> Sub-space
                </button>
                <Link
                    href={route('spaces.show', space.id)}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                    Open <ArrowRight size={12} />
                </Link>
            </div>
        </div>
    );
}

export default function Spaces({ spaces }) {
    const [editor, setEditor] = useState(null); // { mode: 'create'|'edit'|'child', space?, parent? }
    const [search, setSearch] = useState('');

    const filtered = !search.trim() ? spaces : spaces.filter((s) =>
        s.name?.toLowerCase().includes(search.trim().toLowerCase())
        || s.description?.toLowerCase().includes(search.trim().toLowerCase())
    );

    const onDelete = (space) => {
        if (!confirm(`Delete "${space.name}"? Folders, lists, and tasks will be removed.`)) return;
        router.delete(route('spaces.destroy', space.id), { preserveScroll: true });
    };

    return (
        <>
            <Head title="Spaces" />
            <HomeShell
                title="Spaces"
                subtitle="Top-level containers for folders, lists, and tasks"
                actions={
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-neutral-800/70 border border-neutral-800">
                            <Search size={12} className="text-neutral-500" />
                            <input
                                value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search spaces…"
                                className="bare-input w-44"
                            />
                        </div>
                        <button
                            onClick={() => setEditor({ mode: 'create' })}
                            className="px-3 py-1.5 text-xs rounded-md bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5"
                        >
                            <Plus size={13} /> New space
                        </button>
                    </div>
                }
            >
                <div className="p-6">
                    {filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <Layers className="mx-auto text-neutral-700" size={48} />
                            <h3 className="mt-3 text-sm font-medium text-neutral-300">
                                {search ? 'No matching spaces' : 'No spaces yet'}
                            </h3>
                            <p className="text-xs text-neutral-500 mt-1">
                                {search ? 'Try a different search term.' : 'Create your first space to start organizing work.'}
                            </p>
                            {!search && (
                                <button
                                    onClick={() => setEditor({ mode: 'create' })}
                                    className="mt-4 px-4 py-2 text-xs rounded-md bg-purple-600 hover:bg-purple-500 text-white inline-flex items-center gap-1.5"
                                >
                                    <Plus size={13} /> Create space
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map((s) => (
                                <SpaceCard
                                    key={s.id}
                                    space={s}
                                    onEdit={(sp) => setEditor({ mode: 'edit', space: sp })}
                                    onAddChild={(parent) => setEditor({ mode: 'child', parent })}
                                    onDelete={onDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </HomeShell>

            {editor && (
                <SpaceModal
                    initial={editor.mode === 'edit' ? editor.space : null}
                    parent={editor.mode === 'child' ? editor.parent : null}
                    onClose={() => setEditor(null)}
                />
            )}
        </>
    );
}
