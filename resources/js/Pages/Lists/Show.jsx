import { Link, router, useForm } from '@inertiajs/react';
import { useMemo, useState, useEffect, useRef } from 'react';
import Sidebar from '@/Components/Sidebar';
import TaskDrawer from '@/Components/TaskDrawer';
import StatusManager from '@/Components/StatusManager';
import {
    RenameListModal,
    ColorIconModal,
    MoveListModal,
    ComingSoonModal,
} from '@/Components/Lists/ListActionModals';
import {
    LayoutList,
    Kanban,
    Calendar as CalendarIcon,
    Plus,
    ChevronDown,
    ChevronRight,
    Trash2,
    Settings,
    MoreVertical,
    Star,
    Edit3,
    Link as LinkIcon,
    Palette,
    Zap,
    LayoutTemplate,
    Archive,
    Copy,
    Move,
    Trash,
    Users,
    PlusCircle,
    Mail,
    FileText,
} from 'lucide-react';

const PRIORITIES = [
    { id: 'urgent', label: 'Urgent', tone: 'bg-red-500/20 text-red-300' },
    { id: 'high', label: 'High', tone: 'bg-orange-500/20 text-orange-300' },
    { id: 'medium', label: 'Medium', tone: 'bg-yellow-500/20 text-yellow-300' },
    { id: 'low', label: 'Low', tone: 'bg-neutral-600/40 text-neutral-300' },
];

const priorityTone = (p) =>
    PRIORITIES.find((x) => x.id === p)?.tone ?? 'bg-neutral-700 text-neutral-200';

function statusStyle(color) {
    return {
        backgroundColor: `${color}33`,
        color,
    };
}

export default function ListShow({ list, movableSpaces = [] }) {
    const statuses = list.statuses || [];
    const firstStatusKey = statuses[0]?.key || 'to_do';

    const [view, setView] = useState('list');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [showCreate, setShowCreate] = useState(false);
    const [expandedSubtasks, setExpandedSubtasks] = useState({});
    const [activeTaskId, setActiveTaskId] = useState(null);
    const [showStatusManager, setShowStatusManager] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });
    const [showListMenu, setShowListMenu] = useState(false);
    const [showMoreSubmenu, setShowMoreSubmenu] = useState(false);
    const [isFavorite, setIsFavorite] = useState(list.is_favorite || false);
    const [showRename, setShowRename] = useState(false);
    const [showColorIcon, setShowColorIcon] = useState(false);
    const [showMove, setShowMove] = useState(false);
    const [comingSoon, setComingSoon] = useState(null); // { title, description }
    const [copyHint, setCopyHint] = useState(false);

    // List actions
    const closeMenu = () => { setShowListMenu(false); setShowMoreSubmenu(false); };

    const toggleFavorite = () => {
        setIsFavorite((v) => !v); // optimistic
        router.post(route('lists.favorite', list.id), {}, {
            preserveScroll: true,
            preserveState: true,
        });
        closeMenu();
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopyHint(true);
            setTimeout(() => setCopyHint(false), 1500);
        } catch {
            /* ignore */
        }
        closeMenu();
    };

    const duplicateList = () => {
        if (!confirm(`Duplicate list "${list.name}"?`)) return;
        router.post(route('lists.duplicate', list.id), {}, { preserveScroll: false });
        closeMenu();
    };

    const archiveList = () => {
        const archived = !!list.archived_at;
        if (!confirm(archived ? `Restore list "${list.name}"?` : `Archive list "${list.name}"?`)) return;
        router.post(route('lists.archive', list.id), {}, { preserveScroll: true });
        closeMenu();
    };

    const deleteList = () => {
        if (!confirm(`Delete list "${list.name}"? This cannot be undone.`)) return;
        router.delete(route('lists.destroy', list.id));
        closeMenu();
    };

    const showComingSoon = (title, description) => {
        closeMenu();
        setComingSoon({ title, description });
    };

    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        description: '',
        status: firstStatusKey,
        priority: 'medium',
        start_date: '',
        due_date: '',
        space_id: list.space_id,
        task_list_id: list.id,
        parent_task_id: null,
    });

    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowListMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const tasks = useMemo(() => {
        return (list.tasks || []).filter((t) => {
            if (filterStatus !== 'all' && t.status !== filterStatus) return false;
            if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
            return true;
        });
    }, [list.tasks, filterStatus, filterPriority]);

    const submit = (e) => {
        e.preventDefault();
        post(route('tasks.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setData('task_list_id', list.id);
                setData('space_id', list.space_id);
                setData('status', firstStatusKey);
                setShowCreate(false);
            },
        });
    };

    const updateStatus = (taskId, status) => {
        router.put(route('tasks.update', taskId), { status }, { preserveScroll: true });
    };

    const updateDueDate = (taskId, due_date) => {
        router.put(route('tasks.update', taskId), { due_date }, { preserveScroll: true });
    };

    const deleteTask = (taskId) => {
        if (confirm('Delete this task?')) {
            router.delete(route('tasks.destroy', taskId), { preserveScroll: true });
        }
    };

    const toggleSubtasks = (taskId) =>
        setExpandedSubtasks((s) => ({ ...s, [taskId]: !s[taskId] }));

    const findStatus = (key) => statuses.find((s) => s.key === key);

    /* ---------- LIST VIEW ---------- */
    const renderListView = () => (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-neutral-900 border-b border-neutral-800 text-[11px] uppercase tracking-wider text-neutral-500">
                <div className="col-span-5">Name</div>
                <div className="col-span-2">Assignee</div>
                <div className="col-span-2">Due date</div>
                <div className="col-span-1">Priority</div>
                <div className="col-span-2">Status</div>
            </div>
            {tasks.length === 0 && (
                <div className="px-4 py-8 text-center text-neutral-500 text-sm">
                    No tasks. Click "+ Task" to add one.
                </div>
            )}
            {tasks.map((task) => {
                const st = findStatus(task.status);
                return (
                    <div key={task.id}>
                        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-neutral-800/60 hover:bg-neutral-800/40 group">
                            <div className="col-span-5 flex items-center gap-2">
                                <button
                                    onClick={() => toggleSubtasks(task.id)}
                                    className="text-neutral-500 hover:text-white"
                                    title="Toggle subtasks"
                                >
                                    {(task.subtasks || []).length > 0 ? (
                                        expandedSubtasks[task.id] ? (
                                            <ChevronDown size={14} />
                                        ) : (
                                            <ChevronRight size={14} />
                                        )
                                    ) : (
                                        <span className="inline-block w-3.5" />
                                    )}
                                </button>
                                <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ background: st?.color || '#6b7280' }}
                                />
                                <button
                                    onClick={() => setActiveTaskId(task.id)}
                                    className="text-sm text-neutral-100 truncate text-left hover:underline"
                                >
                                    {task.title}
                                </button>
                                {(task.subtasks || []).length > 0 && (
                                    <span className="text-xs text-neutral-500">
                                        {task.subtasks.length}
                                    </span>
                                )}
                            </div>
                            <div className="col-span-2 text-xs text-neutral-400">
                                {task.assigned_to?.name || '—'}
                            </div>
                            <div className="col-span-2 text-xs text-neutral-400">
                                {task.due_date || '—'}
                            </div>
                            <div className="col-span-1">
                                <span
                                    className={`px-2 py-0.5 rounded text-[11px] ${priorityTone(task.priority)}`}
                                >
                                    {task.priority || 'medium'}
                                </span>
                            </div>
                            <div className="col-span-2 flex items-center justify-between gap-2">
                                <select
                                    value={task.status}
                                    onChange={(e) => updateStatus(task.id, e.target.value)}
                                    className="text-[11px] rounded px-2 py-0.5 border-none"
                                    style={statusStyle(st?.color || '#6b7280')}
                                >
                                    {statuses.map((s) => (
                                        <option key={s.id} value={s.key} className="bg-neutral-800 text-neutral-100">
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => deleteTask(task.id)}
                                    className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        {expandedSubtasks[task.id] &&
                            (task.subtasks || []).map((sub) => {
                                const subSt = findStatus(sub.status);
                                return (
                                    <div
                                        key={sub.id}
                                        className="grid grid-cols-12 gap-2 px-4 py-2 pl-12 border-b border-neutral-800/60 hover:bg-neutral-800/30 text-sm"
                                    >
                                        <div className="col-span-5 flex items-center gap-2 text-neutral-300">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{ background: subSt?.color || '#6b7280' }}
                                            />
                                            <button
                                                onClick={() => setActiveTaskId(sub.id)}
                                                className="hover:underline"
                                            >
                                                {sub.title}
                                            </button>
                                        </div>
                                        <div className="col-span-2 text-xs text-neutral-500">
                                            {sub.assigned_to?.name || '—'}
                                        </div>
                                        <div className="col-span-2 text-xs text-neutral-500">
                                            {sub.due_date || '—'}
                                        </div>
                                        <div className="col-span-1">
                                            <span
                                                className={`px-2 py-0.5 rounded text-[11px] ${priorityTone(sub.priority)}`}
                                            >
                                                {sub.priority || 'medium'}
                                            </span>
                                        </div>
                                        <div className="col-span-2">
                                            <select
                                                value={sub.status}
                                                onChange={(e) => updateStatus(sub.id, e.target.value)}
                                                className="text-[11px] rounded px-2 py-0.5 border-none"
                                                style={statusStyle(subSt?.color || '#6b7280')}
                                            >
                                                {statuses.map((s) => (
                                                    <option key={s.id} value={s.key} className="bg-neutral-800">
                                                        {s.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                );
            })}
            <button
                onClick={() => setShowCreate(true)}
                className="w-full text-left px-4 py-2 text-sm text-neutral-500 hover:text-white hover:bg-neutral-800/40 flex items-center gap-2"
            >
                <Plus size={14} /> Add Task
            </button>
        </div>
    );

    /* ---------- BOARD VIEW ---------- */
    const renderBoardView = () => (
        <div className="flex gap-4 overflow-x-auto pb-4">
            {statuses.map((column) => {
                const columnTasks = tasks.filter((t) => t.status === column.key);
                return (
                    <div
                        key={column.id}
                        className="w-72 flex-shrink-0 bg-neutral-900 rounded-lg border border-neutral-800"
                    >
                        <div className="px-3 py-2 flex items-center justify-between border-b border-neutral-800">
                            <div className="flex items-center gap-2">
                                <span
                                    className="px-2 py-0.5 rounded text-[11px]"
                                    style={statusStyle(column.color)}
                                >
                                    {column.label}
                                </span>
                                <span className="text-xs text-neutral-500">{columnTasks.length}</span>
                            </div>
                            <Plus
                                size={14}
                                className="text-neutral-500 hover:text-white cursor-pointer"
                                onClick={() => {
                                    setData('status', column.key);
                                    setShowCreate(true);
                                }}
                            />
                        </div>
                        <div className="p-2 space-y-2 min-h-[100px]">
                            {columnTasks.map((task) => (
                                <div
                                    key={task.id}
                                    onClick={() => setActiveTaskId(task.id)}
                                    className="bg-neutral-800/60 hover:bg-neutral-800 rounded-md p-3 border border-neutral-800 cursor-pointer"
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <span className="text-sm font-medium text-neutral-100">
                                            {task.title}
                                        </span>
                                        <span
                                            className={`px-2 py-0.5 rounded text-[10px] ${priorityTone(task.priority)}`}
                                        >
                                            {task.priority || 'medium'}
                                        </span>
                                    </div>
                                    {task.description && (
                                        <p className="text-xs text-neutral-400 line-clamp-2 mb-2">
                                            {task.description}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                                        <span>{task.due_date || ''}</span>
                                        <span>{task.assigned_to?.name || ''}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    /* ---------- CALENDAR VIEW ---------- */
    const renderCalendarView = () => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startWeekday = (firstDay.getDay() + 6) % 7; // make Monday first

        const cells = [];
        for (let i = 0; i < startWeekday; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
        while (cells.length % 7 !== 0) cells.push(null);

        const tasksByDay = tasks.reduce((acc, t) => {
            if (!t.due_date) return acc;
            const k = t.due_date;
            (acc[k] ||= []).push(t);
            return acc;
        }, {});

        const todayStr = new Date().toISOString().slice(0, 10);
        const monthLabel = calendarMonth.toLocaleString('default', {
            month: 'long',
            year: 'numeric',
        });

        const move = (delta) =>
            setCalendarMonth(new Date(year, month + delta, 1));

        return (
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-800">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => move(-1)}
                            className="px-2 py-1 rounded hover:bg-neutral-800 text-neutral-400"
                        >
                            ‹
                        </button>
                        <span className="text-sm font-semibold w-32 text-center">{monthLabel}</span>
                        <button
                            onClick={() => move(1)}
                            className="px-2 py-1 rounded hover:bg-neutral-800 text-neutral-400"
                        >
                            ›
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            const d = new Date();
                            setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                        }}
                        className="text-xs text-neutral-400 hover:text-white"
                    >
                        Today
                    </button>
                </div>
                <div className="grid grid-cols-7 text-[11px] text-neutral-500 uppercase border-b border-neutral-800">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                        <div key={d} className="px-2 py-1.5 text-center">
                            {d}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {cells.map((day, idx) => {
                        if (!day) return <div key={idx} className="h-28 bg-neutral-950/40 border border-neutral-800/50" />;
                        const k = day.toISOString().slice(0, 10);
                        const dayTasks = tasksByDay[k] || [];
                        const isToday = k === todayStr;
                        return (
                            <div
                                key={idx}
                                className="h-28 border border-neutral-800/50 p-1.5 overflow-hidden"
                            >
                                <div
                                    className={`text-[11px] mb-1 ${
                                        isToday
                                            ? 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white font-semibold'
                                            : 'text-neutral-500'
                                    }`}
                                >
                                    {day.getDate()}
                                </div>
                                <div className="space-y-1">
                                    {dayTasks.slice(0, 3).map((t) => {
                                        const st = findStatus(t.status);
                                        return (
                                            <button
                                                key={t.id}
                                                onClick={() => setActiveTaskId(t.id)}
                                                className="w-full text-left px-1.5 py-0.5 rounded text-[11px] truncate hover:opacity-80"
                                                style={statusStyle(st?.color || '#6b7280')}
                                            >
                                                {t.title}
                                            </button>
                                        );
                                    })}
                                    {dayTasks.length > 3 && (
                                        <div className="text-[10px] text-neutral-500">
                                            +{dayTasks.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Breadcrumb */}
                <div className="px-6 py-3 border-b border-neutral-800 flex items-center gap-2 text-sm">
                    <Link
                        href={route('spaces.show', list.space_id)}
                        className="text-neutral-400 hover:text-white"
                    >
                        {list.space?.name || 'Space'}
                    </Link>
                    {list.folder && (
                        <>
                            <span className="text-neutral-600">/</span>
                            <span className="text-neutral-400">{list.folder.name}</span>
                        </>
                    )}
                    <span className="text-neutral-600">/</span>
                    <span className="text-white font-semibold">{list.name}</span>

                    {/* List Menu Button */}
                    <div ref={menuRef} className="relative ml-2">
                        <button
                            onClick={() => setShowListMenu(!showListMenu)}
                            className="p-1 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition"
                            title="List options"
                        >
                            <MoreVertical size={16} />
                        </button>

                        {/* List Context Menu */}
                        {showListMenu && (
                            <div className="absolute top-full left-0 mt-1 w-64 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-50 py-1">
                                {/* Section 1: Quick Actions */}
                                <button
                                    onClick={toggleFavorite}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <Star size={14} className={isFavorite ? 'text-yellow-500 fill-yellow-500' : ''} />
                                    <span>{isFavorite ? 'Unfavorite' : 'Favorite'}</span>
                                </button>
                                <button
                                    onClick={() => { closeMenu(); setShowRename(true); }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <Edit3 size={14} />
                                    <span>Rename</span>
                                </button>
                                <button
                                    onClick={copyLink}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <LinkIcon size={14} />
                                    <span>{copyHint ? 'Link copied!' : 'Copy link'}</span>
                                </button>

                                <div className="border-t border-neutral-800 my-1" />

                                {/* Section 2: Create & Customize */}
                                <div className="px-4 py-1.5 text-xs text-neutral-500 uppercase tracking-wider">Create new</div>
                                <button
                                    onClick={() => { setShowListMenu(false); setShowCreate(true); }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <PlusCircle size={14} />
                                    <span>Task</span>
                                    <ChevronRight size={14} className="ml-auto text-neutral-500" />
                                </button>

                                <div className="border-t border-neutral-800 my-1" />

                                <button
                                    onClick={() => { closeMenu(); setShowColorIcon(true); }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <Palette size={14} />
                                    <span>Color & icon</span>
                                </button>
                                <button
                                    onClick={() => showComingSoon('Automations', 'Run actions automatically when tasks change status, dates, or assignees.')}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <Zap size={14} />
                                    <span>Automations</span>
                                </button>
                                <button
                                    onClick={() => showComingSoon('Custom fields', 'Add additional task fields like dropdowns, numbers, ratings, and more.')}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <LayoutTemplate size={14} />
                                    <span>Custom fields</span>
                                </button>
                                <button
                                    onClick={() => { setShowListMenu(false); setShowStatusManager(true); }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <LayoutList size={14} />
                                    <span>Task statuses</span>
                                </button>

                                <div className="border-t border-neutral-800 my-1" />

                                {/* Section 3: More - Expandable Submenu */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowMoreSubmenu(!showMoreSubmenu)}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                    >
                                        <MoreVertical size={14} />
                                        <span>More</span>
                                        <ChevronRight size={14} className={`ml-auto text-neutral-500 transition-transform ${showMoreSubmenu ? 'rotate-90' : ''}`} />
                                    </button>

                                    {/* More Submenu */}
                                    {showMoreSubmenu && (
                                        <div className="mx-2 mt-1 mb-2 bg-neutral-950/50 rounded-md overflow-hidden">
                                            {/* List Info Section */}
                                            <div className="px-3 py-1.5 text-xs text-neutral-500 uppercase tracking-wider">List Info</div>
                                            <button
                                                onClick={() => showComingSoon('Default task type', 'Choose what type new tasks created in this list will be (Task, Milestone, etc.).')}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition pl-6"
                                            >
                                                <FileText size={14} />
                                                <span>Default task type</span>
                                            </button>
                                            <button
                                                onClick={() => showComingSoon('Email to List', 'Forward emails to a unique address to create tasks automatically.')}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition pl-6"
                                            >
                                                <Mail size={14} />
                                                <span>Email to List</span>
                                            </button>

                                            <div className="border-t border-neutral-800/50 my-1" />

                                            {/* Imports */}
                                            <button
                                                onClick={() => showComingSoon('Imports', 'Import tasks from CSV, Trello, Asana, and more.')}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition pl-6"
                                            >
                                                <Plus size={14} />
                                                <span>Imports</span>
                                            </button>

                                            {/* Templates */}
                                            <button
                                                onClick={() => showComingSoon('Templates', 'Save and re-use list templates to spin up projects faster.')}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition pl-6"
                                            >
                                                <LayoutTemplate size={14} />
                                                <span>Templates</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-neutral-800 my-1" />

                                {/* Section 4: Move & Duplicate */}
                                <button
                                    onClick={() => { closeMenu(); setShowMove(true); }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <Move size={14} />
                                    <span>Move</span>
                                </button>
                                <button
                                    onClick={duplicateList}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <Copy size={14} />
                                    <span>Duplicate</span>
                                </button>

                                <div className="border-t border-neutral-800 my-1" />

                                {/* Section 5: Archive & Delete */}
                                <button
                                    onClick={archiveList}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 transition"
                                >
                                    <Archive size={14} />
                                    <span>{list.archived_at ? 'Restore from archive' : 'Archive'}</span>
                                </button>
                                <button
                                    onClick={deleteList}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-neutral-800 transition"
                                >
                                    <Trash size={14} />
                                    <span>Delete</span>
                                </button>

                                <div className="border-t border-neutral-800 my-1" />

                                {/* Section 6: Sharing */}
                                <button
                                    onClick={() => showComingSoon('Sharing & Permissions', 'Invite teammates and configure who can view or edit this list.')}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-md mx-2 mt-1 mb-2"
                                >
                                    <Users size={14} />
                                    <span>Sharing & Permissions</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-3 border-b border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        {[
                            { id: 'list', label: 'List', icon: LayoutList },
                            { id: 'board', label: 'Board', icon: Kanban },
                            { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
                        ].map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setView(id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
                                    view === id
                                        ? 'bg-neutral-800 text-white'
                                        : 'text-neutral-400 hover:text-white'
                                }`}
                            >
                                <Icon size={14} /> {label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-neutral-900 border border-neutral-800 text-xs rounded-md px-2 py-1.5"
                        >
                            <option value="all">All status</option>
                            {statuses.map((s) => (
                                <option key={s.id} value={s.key}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="bg-neutral-900 border border-neutral-800 text-xs rounded-md px-2 py-1.5"
                        >
                            <option value="all">All priority</option>
                            {PRIORITIES.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => setShowStatusManager(true)}
                            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm text-neutral-400 hover:text-white"
                            title="Manage statuses"
                        >
                            <Settings size={14} />
                        </button>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-purple-600 hover:bg-purple-500 text-white"
                        >
                            <Plus size={14} /> Task
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-6">
                    {view === 'list' && renderListView()}
                    {view === 'board' && renderBoardView()}
                    {view === 'calendar' && renderCalendarView()}
                </div>

                {/* Task drawer */}
                {activeTaskId && (
                    <TaskDrawer
                        taskId={activeTaskId}
                        statuses={statuses}
                        onClose={() => {
                            setActiveTaskId(null);
                            router.reload({ only: ['list'] });
                        }}
                        onChanged={() => router.reload({ only: ['list'] })}
                    />
                )}

                {/* Status manager drawer */}
                {showStatusManager && (
                    <StatusManager list={list} onClose={() => setShowStatusManager(false)} />
                )}

                {/* Create modal */}
                {showCreate && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-[480px] p-6 shadow-2xl">
                            <h3 className="text-lg font-semibold mb-4">New task</h3>
                            <form onSubmit={submit} className="space-y-3">
                                <div>
                                    <label className="block text-xs text-neutral-400 mb-1">Title</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        required
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                                    />
                                    {errors.title && <div className="text-xs text-red-400 mt-1">{errors.title}</div>}
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-400 mb-1">Description</label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">Status</label>
                                        <select
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm"
                                        >
                                            {statuses.map((s) => (
                                                <option key={s.id} value={s.key}>
                                                    {s.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">Priority</label>
                                        <select
                                            value={data.priority}
                                            onChange={(e) => setData('priority', e.target.value)}
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm"
                                        >
                                            {PRIORITIES.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">Start</label>
                                        <input
                                            type="date"
                                            value={data.start_date}
                                            onChange={(e) => setData('start_date', e.target.value)}
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">Due</label>
                                        <input
                                            type="date"
                                            value={data.due_date}
                                            onChange={(e) => setData('due_date', e.target.value)}
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreate(false)}
                                        className="px-3 py-2 text-sm text-neutral-300 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 text-sm rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
                                    >
                                        Create task
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* List action modals */}
            {showRename && (
                <RenameListModal list={list} onClose={() => setShowRename(false)} />
            )}
            {showColorIcon && (
                <ColorIconModal list={list} onClose={() => setShowColorIcon(false)} />
            )}
            {showMove && (
                <MoveListModal
                    list={list}
                    spaces={movableSpaces}
                    onClose={() => setShowMove(false)}
                />
            )}
            {comingSoon && (
                <ComingSoonModal
                    title={comingSoon.title}
                    description={comingSoon.description}
                    onClose={() => setComingSoon(null)}
                />
            )}
        </div>
    );
}
