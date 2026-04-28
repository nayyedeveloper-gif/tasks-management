import { Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import Sidebar from '@/Components/Sidebar';
import {
    LayoutList,
    Kanban,
    Calendar as CalendarIcon,
    Plus,
    ChevronDown,
    ChevronRight,
    Trash2,
    Filter,
    Search,
    CheckCircle2,
    User,
    MoreHorizontal,
    List,
    LayoutGrid,
} from 'lucide-react';

const PRIORITIES = [
    { id: 'urgent', label: 'Urgent', color: '#ef4444' },
    { id: 'high', label: 'High', color: '#f97316' },
    { id: 'medium', label: 'Medium', color: '#eab308' },
    { id: 'low', label: 'Low', color: '#6b7280' },
];

const VIEWS = [
    { id: 'list', label: 'List', icon: List },
    { id: 'board', label: 'Board', icon: LayoutGrid },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
];

function priorityTone(p) {
    switch (p) {
        case 'urgent': return 'bg-red-500/20 text-red-300 border-red-500/30';
        case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
        case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
        case 'low': return 'bg-neutral-700 text-neutral-300 border-neutral-600';
        default: return 'bg-neutral-700 text-neutral-300';
    }
}

function priorityFlag(p) {
    const color = PRIORITIES.find(x => x.id === p)?.color || '#6b7280';
    return <span className="text-[10px] font-bold" style={{ color }}>●</span>;
}

function statusStyle(color) {
    return {
        backgroundColor: `${color}33`,
        color,
        border: `1px solid ${color}66`,
    };
}

export default function AllTasksIndex({ tasks, groupedByStatus, statuses, spaces }) {
    const { auth } = usePage().props;
    const userName = auth?.user?.name || 'Workspace';

    const [view, setView] = useState('list');
    const [expandedGroups, setExpandedGroups] = useState(() => {
        // All groups expanded by default
        const keys = Object.keys(groupedByStatus);
        return Object.fromEntries(keys.map(k => [k, true]));
    });
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [filterAssignee, setFilterAssignee] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showClosed, setShowClosed] = useState(false);
    const [groupBy, setGroupBy] = useState('status'); // status | list | assignee | priority

    const toggleGroup = (key) => {
        setExpandedGroups(s => ({ ...s, [key]: !s[key] }));
    };

    const expandAll = () => {
        const keys = Object.keys(filteredGrouped);
        setExpandedGroups(Object.fromEntries(keys.map(k => [k, true])));
    };

    const collapseAll = () => {
        const keys = Object.keys(filteredGrouped);
        setExpandedGroups(Object.fromEntries(keys.map(k => [k, false])));
    };

    // Filter tasks
    const filteredGrouped = useMemo(() => {
        let result = {};
        
        for (const [key, group] of Object.entries(groupedByStatus)) {
            let filtered = group.tasks.filter(t => {
                if (filterStatus !== 'all' && t.status !== filterStatus) return false;
                if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
                if (filterAssignee !== 'all') {
                    if (filterAssignee === 'me' && t.assigned_to?.id !== auth?.user?.id) return false;
                    if (filterAssignee === 'unassigned' && t.assigned_to) return false;
                }
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    if (!t.title.toLowerCase().includes(q) && 
                        !(t.description || '').toLowerCase().includes(q)) return false;
                }
                // Hide completed unless showClosed is on
                if (!showClosed && t.status === 'completed') return false;
                return true;
            });
            
            if (filtered.length > 0 || Object.keys(groupedByStatus).length === 1) {
                result[key] = { ...group, tasks: filtered };
            }
        }
        
        return result;
    }, [groupedByStatus, filterStatus, filterPriority, filterAssignee, searchQuery, showClosed, auth?.user?.id]);

    const findStatus = (key) => statuses.find(s => s.key === key) || { key, label: key, color: '#6b7280' };

    const totalTasks = useMemo(() => 
        Object.values(filteredGrouped).reduce((sum, g) => sum + g.tasks.length, 0),
        [filteredGrouped]
    );

    const updateTaskStatus = (taskId, status) => {
        router.put(route('tasks.update', taskId), { status }, { preserveScroll: true });
    };

    const deleteTask = (taskId) => {
        if (confirm('Delete this task?')) {
            router.delete(route('tasks.destroy', taskId), { preserveScroll: true });
        }
    };

    const statusOptions = [{ key: 'all', label: 'All statuses' }, ...statuses.map(s => ({ key: s.key, label: s.label }))];

    return (
        <div className="flex h-screen bg-neutral-950 text-neutral-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-800">
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                        <span>Workspace</span>
                        <ChevronRight size={12} />
                        <span className="text-neutral-300">All Tasks</span>
                    </div>
                    <h1 className="text-xl font-semibold">{userName}'s Workspace</h1>
                </div>

                {/* View Tabs */}
                <div className="px-6 py-2 border-b border-neutral-800 flex items-center gap-1">
                    {VIEWS.map(v => (
                        <button
                            key={v.id}
                            onClick={() => setView(v.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition ${
                                view === v.id 
                                    ? 'bg-neutral-800 text-white' 
                                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                            }`}
                        >
                            <v.icon size={14} />
                            {v.label}
                        </button>
                    ))}
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-neutral-400 hover:text-white hover:bg-neutral-800/50 ml-1">
                        <Plus size={14} />
                        View
                    </button>
                </div>

                {/* Filters & Actions Bar */}
                <div className="px-6 py-3 border-b border-neutral-800 flex items-center gap-3">
                    {/* Group by */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">Group:</span>
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value)}
                            className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
                        >
                            <option value="status">Status</option>
                            <option value="list">List</option>
                            <option value="priority">Priority</option>
                            <option value="assignee">Assignee</option>
                        </select>
                    </div>

                    <div className="h-4 w-px bg-neutral-700 mx-1" />

                    {/* Filters */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
                    >
                        {statusOptions.map(s => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                    </select>

                    <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
                    >
                        <option value="all">All priorities</option>
                        {PRIORITIES.map(p => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                    </select>

                    <select
                        value={filterAssignee}
                        onChange={(e) => setFilterAssignee(e.target.value)}
                        className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs"
                    >
                        <option value="all">Everyone</option>
                        <option value="me">Assigned to me</option>
                        <option value="unassigned">Unassigned</option>
                    </select>

                    <label className="flex items-center gap-1.5 text-xs text-neutral-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showClosed}
                            onChange={(e) => setShowClosed(e.target.checked)}
                            className="rounded bg-neutral-800 border-neutral-600"
                        />
                        Closed
                    </label>

                    <div className="flex-1" />

                    {/* Search */}
                    <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-neutral-900 border border-neutral-700 rounded pl-8 pr-3 py-1.5 text-xs w-48 focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-neutral-800 text-neutral-300 hover:bg-neutral-700">
                        <Filter size={12} />
                        Filter
                    </button>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-auto">
                    {/* Column Headers */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-neutral-800 bg-neutral-900/50 text-[11px] uppercase tracking-wider text-neutral-500 sticky top-0 z-10">
                        <div className="col-span-5">Name</div>
                        <div className="col-span-2">Assignee</div>
                        <div className="col-span-2">Due date</div>
                        <div className="col-span-1">Priority</div>
                        <div className="col-span-2">Status</div>
                    </div>

                    {/* Task Groups */}
                    {Object.entries(filteredGrouped).map(([key, group]) => {
                        const st = group.status;
                        const isOpen = expandedGroups[key] ?? true;
                        const count = group.tasks.length;
                        
                        return (
                            <div key={key} className="border-b border-neutral-800">
                                {/* Group Header */}
                                <button
                                    onClick={() => toggleGroup(key)}
                                    className="w-full flex items-center gap-2 px-4 py-2 bg-neutral-900/30 hover:bg-neutral-900/50 transition"
                                >
                                    {isOpen ? <ChevronDown size={14} className="text-neutral-500" /> : <ChevronRight size={14} className="text-neutral-500" />}
                                    <div 
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ background: st.color || '#6b7280' }}
                                    />
                                    <span className="text-xs font-medium text-neutral-200">{st.label || key}</span>
                                    <span className="text-xs text-neutral-500 ml-1">{count}</span>
                                </button>

                                {/* Group Tasks */}
                                {isOpen && (
                                    <div>
                                        {group.tasks.map(task => (
                                            <TaskRow 
                                                key={task.id} 
                                                task={task} 
                                                statuses={statuses}
                                                onClick={() => router.push(route('tasks.show', task.id))}
                                                onStatusChange={(status) => updateTaskStatus(task.id, status)}
                                                onDelete={() => deleteTask(task.id)}
                                            />
                                        ))}
                                        {count === 0 && (
                                            <div className="px-4 py-3 text-xs text-neutral-500 italic">
                                                No tasks in this group
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {totalTasks === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                            <CheckCircle2 size={48} className="mb-4 text-neutral-700" />
                            <p className="text-sm">No tasks found matching your filters</p>
                            <button 
                                onClick={() => {
                                    setFilterStatus('all');
                                    setFilterPriority('all');
                                    setFilterAssignee('all');
                                    setSearchQuery('');
                                }}
                                className="mt-2 text-xs text-purple-400 hover:text-purple-300"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}

function TaskRow({ task, statuses, onClick, onStatusChange, onDelete }) {
    const st = statuses.find(s => s.key === task.status) || { key: task.status, label: task.status, color: '#6b7280' };
    const hasSubtasks = (task.subtasks_count || 0) > 0;

    return (
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-neutral-800/60 hover:bg-neutral-800/40 group items-center">
            <div className="col-span-5 flex items-center gap-2">
                <span className="inline-block w-4" />
                <div 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: st.color || '#6b7280' }}
                />
                <Link
                    href={route('tasks.show', task.id)}
                    className="text-sm text-neutral-100 truncate text-left hover:underline"
                >
                    {task.title}
                </Link>
                {hasSubtasks && (
                    <span className="text-[10px] text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded">
                        {task.subtasks_count}
                    </span>
                )}
                {(task.comments_count || 0) > 0 && (
                    <span className="text-[10px] text-neutral-500">
                        💬 {task.comments_count}
                    </span>
                )}
            </div>
            <div className="col-span-2 flex items-center gap-1.5">
                {task.assigned_to ? (
                    <>
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
                            {task.assigned_to.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-neutral-400 truncate">{task.assigned_to.name}</span>
                    </>
                ) : (
                    <span className="text-xs text-neutral-500">—</span>
                )}
            </div>
            <div className="col-span-2 text-xs text-neutral-400">
                {task.due_date ? (
                    <span className={isOverdue(task.due_date) ? 'text-red-400' : ''}>
                        {formatDate(task.due_date)}
                    </span>
                ) : '—'}
            </div>
            <div className="col-span-1">
                {task.priority && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border ${priorityTone(task.priority)}`}>
                        {priorityFlag(task.priority)}
                        <span className="capitalize">{task.priority}</span>
                    </span>
                )}
            </div>
            <div className="col-span-2 flex items-center justify-between gap-2">
                <select
                    value={task.status}
                    onChange={(e) => onStatusChange(e.target.value)}
                    className="text-[11px] rounded px-2 py-0.5 border-none w-full max-w-[100px]"
                    style={statusStyle(st.color || '#6b7280')}
                    onClick={(e) => e.stopPropagation()}
                >
                    {statuses.map(s => (
                        <option key={s.key} value={s.key} className="bg-neutral-800 text-neutral-100">
                            {s.label}
                        </option>
                    ))}
                    {statuses.length === 0 && (
                        <>
                            <option value="to_do">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </>
                    )}
                </select>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

function isOverdue(dateStr) {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
