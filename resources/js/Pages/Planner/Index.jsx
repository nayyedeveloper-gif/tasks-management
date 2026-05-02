import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import HomeShell from '@/Components/HomeShell';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Trash2,
    X,
    Calendar as CalendarIcon,
    Search,
    GripVertical,
    Clock,
    AlignLeft,
} from 'lucide-react';

/* ----------------------- Time helpers ----------------------- */

const HOUR_HEIGHT = 48; // px per hour in the grid
const SNAP_MIN = 15;    // snap minutes for drag/resize
const DAY_START_HOUR = 0;
const DAY_END_HOUR = 24;

const PRIORITY_COLOR = {
    urgent: '#ef4444',
    high: '#f59e0b',
    medium: '#eab308',
    normal: '#3b82f6',
    low: '#9ca3af',
};

function startOfDay(d) {
    const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
}
function addDays(d, n) {
    const x = new Date(d); x.setDate(x.getDate() + n); return x;
}
function isSameDay(a, b) {
    return startOfDay(a).getTime() === startOfDay(b).getTime();
}
function fmtTime(d) {
    return new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function fmtDateLong(d) {
    return new Date(d).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
function fmtDateShort(d) {
    return new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
function fmtMonthRange(start, end) {
    const s = new Date(start), e = new Date(end);
    const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
    if (sameMonth) {
        return `${s.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`;
    }
    return `${s.toLocaleDateString(undefined, { month: 'short' })} – ${e.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`;
}
function toIsoLocal(d) {
    // Returns "YYYY-MM-DDTHH:MM" for datetime-local input (browser local time)
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function snapMinutes(min) {
    return Math.round(min / SNAP_MIN) * SNAP_MIN;
}
function minutesFromMidnight(d) {
    const x = new Date(d);
    return x.getHours() * 60 + x.getMinutes();
}
function dateAtMinutes(day, minutes) {
    const x = startOfDay(day);
    x.setMinutes(minutes);
    return x;
}

/* ----------------------- Components ----------------------- */

function TaskChip({ task, onDragStart }) {
    const due = task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;
    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('application/x-task', JSON.stringify({
                    id: task.id, title: task.title, priority: task.priority,
                }));
                onDragStart?.(task);
            }}
            className="group flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-neutral-800 bg-neutral-900 hover:border-purple-500/60 hover:bg-neutral-800 cursor-grab active:cursor-grabbing"
        >
            <GripVertical size={12} className="text-neutral-600 shrink-0" />
            <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.normal }}
            />
            <div className="flex-1 min-w-0">
                <div className="text-xs text-neutral-100 truncate">{task.title}</div>
                <div className="text-[10px] text-neutral-500 truncate">
                    {task.list?.space?.name ? `${task.list.space.name} · ` : ''}
                    {task.list?.name || 'No list'}
                    {due && ` · due ${due}`}
                </div>
            </div>
        </div>
    );
}

function BlockEditor({ block, onClose, onChanged }) {
    const isNew = !block.id;
    const [title, setTitle] = useState(block.title || '');
    const [description, setDescription] = useState(block.description || '');
    const [color, setColor] = useState(block.color || '#7c3aed');
    const [startsAt, setStartsAt] = useState(block.starts_at);
    const [endsAt, setEndsAt] = useState(block.ends_at);
    const [saving, setSaving] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setSaving(true);
        const payload = {
            task_id: block.task_id || null,
            title: title.trim(),
            description: description.trim() || null,
            color,
            starts_at: new Date(startsAt).toISOString(),
            ends_at: new Date(endsAt).toISOString(),
        };
        const url = isNew ? route('planner.blocks.store') : route('planner.blocks.update', block.id);
        const method = isNew ? 'post' : 'put';
        router[method](url, payload, {
            preserveScroll: true,
            onSuccess: () => { onChanged?.(); onClose(); },
            onFinish: () => setSaving(false),
        });
    };

    const remove = () => {
        if (!block.id) return onClose();
        if (!confirm(`Delete "${block.title}"?`)) return;
        router.delete(route('planner.blocks.destroy', block.id), {
            preserveScroll: true,
            onSuccess: () => { onChanged?.(); onClose(); },
        });
    };

    const inputCls = 'mt-1 w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-700 text-sm text-white outline-none focus:border-purple-500';

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-neutral-900 border border-neutral-800 rounded-lg w-full max-w-md">
                <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                        <CalendarIcon size={15} className="text-purple-400" />
                        {isNew ? 'New time block' : 'Edit time block'}
                    </h2>
                    <button type="button" onClick={onClose} className="text-neutral-400 hover:text-white"><X size={15} /></button>
                </div>
                <div className="p-4 space-y-3">
                    <div>
                        <label className="text-xs text-neutral-400">Title</label>
                        <input
                            value={title} onChange={(e) => setTitle(e.target.value)}
                            placeholder={block.task_id ? 'Working on…' : 'Deep work, meeting, focus…'}
                            className={inputCls} autoFocus required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-neutral-400 flex items-center gap-1"><Clock size={11} /> Starts</label>
                            <input
                                type="datetime-local"
                                value={toIsoLocal(new Date(startsAt)).slice(0, 16)}
                                onChange={(e) => setStartsAt(e.target.value)}
                                className={inputCls} required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-400 flex items-center gap-1"><Clock size={11} /> Ends</label>
                            <input
                                type="datetime-local"
                                value={toIsoLocal(new Date(endsAt)).slice(0, 16)}
                                onChange={(e) => setEndsAt(e.target.value)}
                                className={inputCls} required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400 flex items-center gap-1"><AlignLeft size={11} /> Notes</label>
                        <textarea
                            value={description} onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Optional notes…"
                            className={inputCls}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-neutral-400">Color</label>
                        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="rounded cursor-pointer h-7 w-10 bg-transparent border border-neutral-700" />
                        <div className="flex gap-1.5 ml-auto">
                            {['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map((c) => (
                                <button key={c} type="button" onClick={() => setColor(c)}
                                    className={`w-5 h-5 rounded-full border ${color === c ? 'border-white' : 'border-transparent'}`}
                                    style={{ background: c }} />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="px-4 py-3 border-t border-neutral-800 flex items-center justify-between">
                    {!isNew ? (
                        <button type="button" onClick={remove} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1.5">
                            <Trash2 size={12} /> Delete
                        </button>
                    ) : <span />}
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-neutral-300 hover:text-white">Cancel</button>
                        <button type="submit" disabled={saving} className="px-4 py-1.5 text-sm bg-purple-600 hover:bg-purple-500 rounded-md text-white disabled:opacity-60">
                            {saving ? 'Saving…' : isNew ? 'Create' : 'Save'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

/* ----------------------- Calendar grid ----------------------- */

function TimeGutter() {
    const hours = [];
    for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) hours.push(h);
    return (
        <div className="w-14 shrink-0 border-r border-neutral-800 bg-neutral-950">
            <div className="h-10 border-b border-neutral-800" />
            {hours.map((h) => (
                <div key={h} className="relative" style={{ height: HOUR_HEIGHT }}>
                    <span className="absolute -top-2 right-2 text-[10px] text-neutral-500">
                        {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                    </span>
                </div>
            ))}
        </div>
    );
}

function DayColumn({ day, isToday, blocks, onCreate, onSelectBlock, onDropTask, onMoveBlock, onResizeBlock }) {
    const colRef = useRef(null);

    const yToMinutes = (y) => {
        const totalMin = (y / HOUR_HEIGHT) * 60 + DAY_START_HOUR * 60;
        return Math.max(DAY_START_HOUR * 60, Math.min(DAY_END_HOUR * 60, snapMinutes(totalMin)));
    };

    const handleDoubleClick = (e) => {
        const rect = colRef.current.getBoundingClientRect();
        const min = yToMinutes(e.clientY - rect.top);
        const start = dateAtMinutes(day, min);
        const end = dateAtMinutes(day, Math.min(min + 60, DAY_END_HOUR * 60 - 1));
        onCreate({ starts_at: start.toISOString(), ends_at: end.toISOString() });
    };

    const handleDragOver = (e) => {
        if (e.dataTransfer.types.includes('application/x-task') || e.dataTransfer.types.includes('application/x-block')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = e.dataTransfer.types.includes('application/x-block') ? 'move' : 'copy';
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const rect = colRef.current.getBoundingClientRect();
        const min = yToMinutes(e.clientY - rect.top);

        const blockData = e.dataTransfer.getData('application/x-block');
        if (blockData) {
            try {
                const { id, durationMin } = JSON.parse(blockData);
                const start = dateAtMinutes(day, min);
                const end = new Date(start.getTime() + durationMin * 60_000);
                onMoveBlock(id, start, end);
            } catch (_) {}
            return;
        }

        const taskData = e.dataTransfer.getData('application/x-task');
        if (taskData) {
            try {
                const t = JSON.parse(taskData);
                const start = dateAtMinutes(day, min);
                const end = new Date(start.getTime() + 60 * 60_000);
                onDropTask(t, start, end);
            } catch (_) {}
        }
    };

    return (
        <div
            ref={colRef}
            className="relative flex-1 border-r border-neutral-800"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Header */}
            <div className={`h-10 border-b border-neutral-800 flex flex-col items-center justify-center ${isToday ? 'bg-purple-500/5' : ''}`}>
                <div className="text-[10px] uppercase tracking-wider text-neutral-500">
                    {day.toLocaleDateString(undefined, { weekday: 'short' })}
                </div>
                <div className={`text-sm font-semibold ${isToday ? 'text-purple-400' : 'text-neutral-200'}`}>
                    {day.getDate()}
                </div>
            </div>

            {/* Hour cells (visual lines + double-click anchor) */}
            <div onDoubleClick={handleDoubleClick} className="relative">
                {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }).map((_, i) => (
                    <div key={i} className="border-b border-neutral-800/60" style={{ height: HOUR_HEIGHT }} />
                ))}

                {/* Now indicator */}
                {isToday && <NowLine />}

                {/* Blocks */}
                {blocks.map((b) => (
                    <BlockCard
                        key={b.id}
                        block={b}
                        onClick={() => onSelectBlock(b)}
                        onResize={onResizeBlock}
                    />
                ))}
            </div>
        </div>
    );
}

function NowLine() {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(id);
    }, []);
    const min = minutesFromMidnight(now) - DAY_START_HOUR * 60;
    if (min < 0 || min > (DAY_END_HOUR - DAY_START_HOUR) * 60) return null;
    const top = (min / 60) * HOUR_HEIGHT;
    return (
        <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top }}>
            <div className="relative">
                <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-pink-500" />
                <div className="h-px bg-pink-500" />
            </div>
        </div>
    );
}

function BlockCard({ block, onClick, onResize }) {
    const start = new Date(block.starts_at);
    const end = new Date(block.ends_at);
    const startMin = minutesFromMidnight(start) - DAY_START_HOUR * 60;
    const durMin = Math.max(15, (end - start) / 60_000);
    const top = (startMin / 60) * HOUR_HEIGHT;
    const height = (durMin / 60) * HOUR_HEIGHT;

    const onDragStart = (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/x-block', JSON.stringify({
            id: block.id, durationMin: durMin,
        }));
    };

    const onResizeStart = (e) => {
        e.preventDefault(); e.stopPropagation();
        const startY = e.clientY;
        const startHeight = height;
        const move = (ev) => {
            const delta = ev.clientY - startY;
            const newHeight = Math.max(HOUR_HEIGHT * (SNAP_MIN / 60), startHeight + delta);
            const newDurMin = snapMinutes((newHeight / HOUR_HEIGHT) * 60);
            const newEnd = new Date(start.getTime() + newDurMin * 60_000);
            onResize(block.id, start, newEnd, /* commit */ false);
            // Live preview via direct DOM mutation for smoothness:
            ev.target.parentElement && (ev.target.parentElement.style.height = `${(newDurMin / 60) * HOUR_HEIGHT}px`);
        };
        const up = (ev) => {
            const delta = ev.clientY - startY;
            const newHeight = Math.max(HOUR_HEIGHT * (SNAP_MIN / 60), startHeight + delta);
            const newDurMin = snapMinutes((newHeight / HOUR_HEIGHT) * 60);
            const newEnd = new Date(start.getTime() + newDurMin * 60_000);
            onResize(block.id, start, newEnd, /* commit */ true);
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    const tone = block.color || '#7c3aed';
    return (
        <div
            draggable
            onDragStart={onDragStart}
            onClick={onClick}
            className="absolute left-1 right-1 rounded-md border-l-[3px] cursor-pointer overflow-hidden group hover:shadow-lg transition"
            style={{
                top, height,
                background: `${tone}26`,
                borderLeftColor: tone,
                borderTop: `1px solid ${tone}44`,
                borderRight: `1px solid ${tone}44`,
                borderBottom: `1px solid ${tone}44`,
            }}
        >
            <div className="px-2 py-1.5 text-[11px] leading-tight">
                <div className="font-semibold text-white truncate">{block.title}</div>
                {height > 36 && (
                    <div className="text-neutral-300/80 text-[10px] mt-0.5">
                        {fmtTime(start)} – {fmtTime(end)}
                    </div>
                )}
                {block.task && height > 56 && (
                    <div className="text-[10px] text-neutral-300/70 mt-0.5 truncate">↳ {block.task.title}</div>
                )}
            </div>
            {/* Resize handle */}
            <div
                onPointerDown={onResizeStart}
                className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize bg-transparent group-hover:bg-white/10"
            />
        </div>
    );
}

/* ----------------------- Page ----------------------- */

export default function PlannerIndex({ view, anchor, rangeStart, rangeEnd, blocks, scheduledTasks, unscheduled }) {
    const [editor, setEditor] = useState(null);
    const [search, setSearch] = useState('');

    const days = useMemo(() => {
        const start = new Date(rangeStart);
        const dayCount = view === 'day' ? 1 : 7;
        return Array.from({ length: dayCount }, (_, i) => addDays(start, i));
    }, [rangeStart, view]);

    const blocksByDay = useMemo(() => {
        const map = new Map(days.map((d) => [startOfDay(d).getTime(), []]));
        blocks.forEach((b) => {
            const k = startOfDay(b.starts_at).getTime();
            if (map.has(k)) map.get(k).push(b);
        });
        return map;
    }, [blocks, days]);

    const navigate = (offset) => {
        const next = addDays(new Date(anchor), offset * (view === 'day' ? 1 : 7));
        router.get(route('planner.index'), {
            view, date: next.toISOString().slice(0, 10),
        }, { preserveState: false, preserveScroll: true });
    };

    const goToday = () => {
        router.get(route('planner.index'), {
            view, date: new Date().toISOString().slice(0, 10),
        }, { preserveState: false, preserveScroll: true });
    };

    const setView = (v) => {
        router.get(route('planner.index'), { view: v, date: anchor }, { preserveState: false, preserveScroll: true });
    };

    const refresh = () => router.reload({ only: ['blocks', 'scheduledTasks', 'unscheduled'], preserveScroll: true });

    const onCreate = (init) => setEditor({ ...init, title: '', color: '#7c3aed' });
    const onSelectBlock = (b) => setEditor(b);

    const onDropTask = (task, starts, ends) => {
        router.post(route('planner.blocks.store'), {
            task_id: task.id,
            title: task.title,
            color: PRIORITY_COLOR[task.priority] || '#7c3aed',
            starts_at: starts.toISOString(),
            ends_at: ends.toISOString(),
        }, { preserveScroll: true, onSuccess: refresh });
    };

    const onMoveBlock = (id, starts, ends) => {
        const block = blocks.find((b) => b.id === id);
        if (!block) return;
        router.put(route('planner.blocks.update', id), {
            task_id: block.task_id || null,
            title: block.title,
            color: block.color,
            starts_at: starts.toISOString(),
            ends_at: ends.toISOString(),
        }, { preserveScroll: true, onSuccess: refresh });
    };

    const resizeDebounce = useRef(null);
    const onResizeBlock = (id, starts, ends, commit) => {
        if (!commit) return;
        clearTimeout(resizeDebounce.current);
        resizeDebounce.current = setTimeout(() => onMoveBlock(id, starts, ends), 50);
    };

    const filteredUnscheduled = useMemo(() => {
        if (!search.trim()) return unscheduled;
        const q = search.trim().toLowerCase();
        return unscheduled.filter((t) => t.title?.toLowerCase().includes(q));
    }, [unscheduled, search]);

    const headerLabel = view === 'day'
        ? fmtDateLong(anchor)
        : fmtMonthRange(rangeStart, addDays(new Date(rangeEnd), -1));

    return (
        <>
            <Head title="Planner" />
            <HomeShell
                title="Planner"
                subtitle="Drag tasks onto your calendar to time-block your day"
                actions={
                    <div className="flex items-center gap-1.5">
                        <button onClick={goToday} className="px-2.5 py-1 text-xs rounded-md border border-neutral-800 text-neutral-300 hover:bg-neutral-800">
                            Today
                        </button>
                        <button onClick={() => navigate(-1)} className="p-1 rounded-md text-neutral-400 hover:bg-neutral-800">
                            <ChevronLeft size={15} />
                        </button>
                        <button onClick={() => navigate(1)} className="p-1 rounded-md text-neutral-400 hover:bg-neutral-800">
                            <ChevronRight size={15} />
                        </button>
                        <span className="ml-1 text-sm font-medium text-neutral-200 min-w-[180px]">
                            {headerLabel}
                        </span>
                        <div className="ml-2 flex items-center rounded-md border border-neutral-800 overflow-hidden">
                            {['day', 'week'].map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className={`px-2.5 py-1 text-xs ${view === v ? 'bg-purple-600 text-white' : 'text-neutral-400 hover:bg-neutral-800'}`}
                                >
                                    {v[0].toUpperCase() + v.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                }
            >
                <div className="flex h-[calc(100vh-7.5rem)] overflow-hidden">
                    {/* Unscheduled side panel */}
                    <aside className="w-72 shrink-0 border-r border-neutral-800 bg-neutral-900/30 flex flex-col">
                        <div className="px-3 py-2.5 border-b border-neutral-800">
                            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Unscheduled tasks</div>
                            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-neutral-800 border border-neutral-700">
                                <Search size={12} className="text-neutral-500" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search tasks…"
                                    className="bare-input"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                            {filteredUnscheduled.length === 0 ? (
                                <div className="text-center py-10 text-xs text-neutral-500">
                                    {search ? 'No matches' : 'All caught up — nothing to schedule'}
                                </div>
                            ) : filteredUnscheduled.map((t) => (
                                <TaskChip key={t.id} task={t} />
                            ))}
                        </div>
                        {scheduledTasks.length > 0 && (
                            <div className="border-t border-neutral-800 p-2 space-y-1.5">
                                <div className="text-[10px] uppercase tracking-wider text-neutral-500 px-1">Due in this range</div>
                                {scheduledTasks.map((t) => (
                                    <TaskChip key={t.id} task={t} />
                                ))}
                            </div>
                        )}
                        <div className="px-3 py-2 border-t border-neutral-800 text-[10px] text-neutral-500 leading-relaxed">
                            <p>• Drag a task onto a day to schedule.</p>
                            <p>• Double-click a slot to create a block.</p>
                            <p>• Drag a block to move, drag its bottom edge to resize.</p>
                        </div>
                    </aside>

                    {/* Calendar */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 flex overflow-y-auto">
                            <TimeGutter />
                            {days.map((d) => (
                                <DayColumn
                                    key={d.toISOString()}
                                    day={d}
                                    isToday={isSameDay(d, new Date())}
                                    blocks={blocksByDay.get(startOfDay(d).getTime()) || []}
                                    onCreate={onCreate}
                                    onSelectBlock={onSelectBlock}
                                    onDropTask={onDropTask}
                                    onMoveBlock={onMoveBlock}
                                    onResizeBlock={onResizeBlock}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </HomeShell>

            {editor && (
                <BlockEditor
                    block={editor}
                    onClose={() => setEditor(null)}
                    onChanged={refresh}
                />
            )}
        </>
    );
}
