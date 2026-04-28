import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Flag, Circle, CheckCircle2, MessageSquare, Paperclip } from 'lucide-react';
import TaskDrawer from '@/Components/TaskDrawer';

const PRIORITY = {
    urgent: { color: '#ef4444', label: 'Urgent' },
    high: { color: '#f59e0b', label: 'High' },
    medium: { color: '#eab308', label: 'Medium' },
    normal: { color: '#3b82f6', label: 'Normal' },
    low: { color: '#9ca3af', label: 'Low' },
};

function formatDue(date, isDone) {
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / 86400000);
    const overdue = diff < 0 && !isDone;
    let label;
    if (diff === 0) label = 'Today';
    else if (diff === 1) label = 'Tomorrow';
    else if (diff === -1) label = 'Yesterday';
    else if (diff > 1 && diff < 7) label = d.toLocaleDateString('en', { weekday: 'short' });
    else if (diff < 0 && diff > -7) label = d.toLocaleDateString('en', { weekday: 'short' });
    else label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    return { label, overdue, today: diff === 0 };
}

export default function TaskTableRow({ task, columns, onChange, wrapText = false, showLocation = false, showSubtaskParent = false }) {
    const [open, setOpen] = useState(false);
    const isDone = !!task.date_done;
    const due = formatDue(task.due_date, isDone);
    const pr = PRIORITY[task.priority] || PRIORITY.normal;
    const subtaskCount = task.subtasks_count ?? task.subtasks?.length ?? 0;
    const commentCount = task.comments_count ?? 0;

    const toggleDone = (e) => {
        e.stopPropagation();
        router.put(
            route('tasks.update', task.id),
            { date_done: isDone ? null : new Date().toISOString().slice(0, 10) },
            { preserveScroll: true, onSuccess: () => onChange?.() }
        );
    };

    return (
        <>
            <div
                onClick={() => setOpen(true)}
                className="flex items-center gap-3 px-4 py-1.5 hover:bg-neutral-800/40 cursor-pointer text-sm border-b border-neutral-800/50 group"
            >
                <button onClick={toggleDone} className="text-neutral-500 hover:text-emerald-400 shrink-0 w-4">
                    {isDone ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Circle size={15} />}
                </button>

                {/* Name column - flexible */}
                <div className={`flex-1 min-w-0 flex ${wrapText ? 'items-start' : 'items-center'} gap-1.5 flex-wrap`}>
                    <span
                        className={`${wrapText ? 'whitespace-normal break-words' : 'truncate'} ${
                            isDone ? 'line-through text-neutral-500' : 'text-neutral-100'
                        }`}
                    >
                        {task.title}
                    </span>
                    {showSubtaskParent && task.parent_task_id && task.parent?.title && (
                        <span className="text-[10px] text-neutral-500 italic">
                            ↳ {task.parent.title}
                        </span>
                    )}
                    {showLocation && task.list?.name && (
                        <span className="text-[10px] text-neutral-500">
                            · {task.list.space?.name ? `${task.list.space.name} / ` : ''}{task.list.name}
                        </span>
                    )}
                    {subtaskCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-neutral-500 px-1 rounded">
                            <span className="opacity-60">≡</span>
                            {subtaskCount}
                        </span>
                    )}
                    {commentCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-neutral-500">
                            <MessageSquare size={10} />
                            {commentCount}
                        </span>
                    )}
                </div>

                {columns.assignee && (
                    <div className="w-12 text-right shrink-0">
                        {task.assigned_to?.name && (
                            <span
                                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-[10px] font-bold text-white"
                                title={task.assigned_to.name}
                            >
                                {task.assigned_to.name.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                )}

                {columns.priority && (
                    <div className="w-28 shrink-0 flex items-center gap-1.5 text-xs">
                        <Flag size={12} className="shrink-0" style={{ color: pr.color, fill: pr.color }} />
                        <span className="text-neutral-300">{pr.label}</span>
                    </div>
                )}

                {columns.due_date && (
                    <div className="w-24 shrink-0 text-xs">
                        {due ? (
                            <span className={due.overdue ? 'text-red-400' : due.today ? 'text-yellow-400' : 'text-neutral-300'}>
                                {due.label}
                            </span>
                        ) : (
                            <span className="text-neutral-600">—</span>
                        )}
                    </div>
                )}
            </div>

            {open && (
                <TaskDrawer
                    taskId={task.id}
                    statuses={task.list?.statuses || []}
                    onClose={() => {
                        setOpen(false);
                        onChange?.();
                    }}
                    onChanged={() => onChange?.()}
                />
            )}
        </>
    );
}
