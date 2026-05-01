import { Link, usePage, router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import NewSpaceModal from '@/Components/Modals/NewSpaceModal';
import NewChannelModal from '@/Components/Modals/NewChannelModal';
import NewDmModal from '@/Components/Modals/NewDmModal';
import {
    Home,
    CalendarDays,
    Users,
    Plus,
    ChevronDown,
    ChevronRight,
    Inbox,
    MessageSquareReply,
    MessageSquare,
    CheckSquare,
    UserCheck,
    CalendarClock,
    ListChecks,
    Hash,
    UserPlus,
    Search,
    Layers,
    Folder as FolderIcon,
    List as ListIcon,
    Star,
    LogOut,
    Target,
    BarChart3,
    Briefcase,
    Shield,
    Settings,
} from 'lucide-react';

const railItems = [
    { id: 'home', label: 'Home', icon: Home, route: 'inbox.index' },
    { id: 'chat', label: 'Chat', icon: MessageSquare, route: 'channels.index' },
    { id: 'planner', label: 'Planner', icon: CalendarDays, route: 'planner.index' },
    { id: 'teams', label: 'Teams', icon: Users, route: 'teams.index' },
    { id: 'goals', label: 'Goals', icon: Target, route: 'goals.index' },
    { id: 'dashboards', label: 'Dash', icon: BarChart3, route: 'dashboards.index' },
    { id: 'crm', label: 'CRM', icon: Briefcase, route: 'crm.contacts.index' },
    { id: 'users', label: 'Users', icon: UserCheck, route: 'users.index', adminOnly: true },
];

const homeMenu = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, route: 'inbox.index', badgeKey: 'inbox' },
    { id: 'replies', label: 'Replies', icon: MessageSquareReply, route: 'replies.index' },
    { id: 'comments', label: 'Assigned Comments', icon: MessageSquare, route: 'assigned-comments.index' },
];

const myTasksItems = [
    { id: 'assigned', label: 'Assigned to me', icon: UserCheck, route: 'my-tasks.assigned' },
    { id: 'today', label: 'Today & Overdue', icon: CalendarClock, route: 'my-tasks.today', badgeKey: 'today' },
    { id: 'personal', label: 'Personal List', icon: ListChecks, route: 'my-tasks.personal' },
];

function SectionHeader({ title, action, onAction }) {
    return (
        <div className="flex items-center justify-between px-3 pt-4 pb-2 group">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                {title}
            </span>
            {action && (
                <button
                    onClick={onAction}
                    className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-white transition"
                    title={action}
                >
                    <Plus size={14} />
                </button>
            )}
        </div>
    );
}

function NavItem({ icon: Icon, label, href, active, badge, indent = 0, trailing }) {
    const content = (
        <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                active
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-300 hover:bg-neutral-800/70 hover:text-white'
            }`}
            style={{ paddingLeft: 12 + indent * 16 }}
        >
            {Icon && <Icon size={15} className="text-neutral-400 shrink-0" />}
            <span className="flex-1 truncate">{label}</span>
            {badge != null && (
                <span className="text-[10px] bg-neutral-700 text-neutral-200 rounded px-1.5 py-0.5">
                    {badge}
                </span>
            )}
            {trailing}
        </div>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }
    return <button className="w-full text-left">{content}</button>;
}

function ListNode({ list, level, currentUrl }) {
    const active = currentUrl.startsWith(`/lists/${list.id}`);
    return (
        <NavItem
            icon={ListIcon}
            label={list.name}
            href={route('lists.show', list.id)}
            active={active}
            indent={level}
        />
    );
}

function FolderNode({ folder, level, currentUrl, expanded, onToggle }) {
    const isOpen = expanded[`f-${folder.id}`] ?? true;
    return (
        <div>
            <button
                onClick={() => onToggle(`f-${folder.id}`)}
                className="w-full text-left flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-neutral-300 hover:bg-neutral-800/70 hover:text-white"
                style={{ paddingLeft: 12 + level * 16 }}
            >
                {isOpen ? (
                    <ChevronDown size={12} className="text-neutral-500 shrink-0" />
                ) : (
                    <ChevronRight size={12} className="text-neutral-500 shrink-0" />
                )}
                <FolderIcon size={14} className="text-neutral-400 shrink-0" />
                <span className="flex-1 truncate">{folder.name}</span>
            </button>
            {isOpen &&
                (folder.lists || []).map((list) => (
                    <ListNode
                        key={list.id}
                        list={list}
                        level={level + 1}
                        currentUrl={currentUrl}
                    />
                ))}
        </div>
    );
}

function SpaceNode({ space, level, currentUrl, expanded, onToggle }) {
    const isOpen = expanded[`s-${space.id}`] ?? true;
    const isActive = currentUrl.includes(`/spaces/${space.id}`);
    return (
        <div>
            <div className="flex items-center group">
                <button
                    onClick={() => onToggle(`s-${space.id}`)}
                    className="text-neutral-500 hover:text-white p-1"
                    style={{ marginLeft: level * 16 }}
                >
                    {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                <Link
                    href={route('spaces.show', space.id)}
                    className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                        isActive
                            ? 'bg-neutral-800 text-white'
                            : 'text-neutral-300 hover:bg-neutral-800/70 hover:text-white'
                    }`}
                >
                    <Layers size={14} className="text-neutral-400 shrink-0" />
                    <span className="flex-1 truncate">{space.name}</span>
                </Link>
            </div>
            {isOpen && (
                <>
                    {(space.folders || []).map((folder) => (
                        <FolderNode
                            key={folder.id}
                            folder={folder}
                            level={level + 1}
                            currentUrl={currentUrl}
                            expanded={expanded}
                            onToggle={onToggle}
                        />
                    ))}
                    {(space.lists || []).map((list) => (
                        <ListNode
                            key={list.id}
                            list={list}
                            level={level + 1}
                            currentUrl={currentUrl}
                        />
                    ))}
                    {(space.children || []).map((child) => (
                        <SpaceNode
                            key={child.id}
                            space={child}
                            level={level + 1}
                            currentUrl={currentUrl}
                            expanded={expanded}
                            onToggle={onToggle}
                        />
                    ))}
                </>
            )}
        </div>
    );
}

export default function Sidebar() {
    const { url, props } = usePage();
    const auth = props.auth;
    const sidebarData = props.sidebar || { spaces: [], channels: [], directMessages: [], allMembers: [] };
    const { spaces = [], channels = [], directMessages = [], allMembers = [] } = sidebarData;
    const badges = props.badges || {};

    const [openSections, setOpenSections] = useState({
        myTasks: true,
        favorites: true,
        spaces: true,
        chat: true,
    });
    const [expandedTree, setExpandedTree] = useState({});
    const [showNewSpace, setShowNewSpace] = useState(false);
    const [showNewChannel, setShowNewChannel] = useState(false);
    const [showNewDm, setShowNewDm] = useState(false);

    const toggle = (key) =>
        setOpenSections((s) => ({ ...s, [key]: !s[key] }));

    const toggleTree = (key) =>
        setExpandedTree((s) => ({ ...s, [key]: s[key] === undefined ? false : !s[key] }));

    const userInitial = useMemo(
        () => (auth?.user?.name ? auth.user.name.charAt(0).toUpperCase() : '?'),
        [auth]
    );

    const isActive = (routeName) => {
        try {
            return url.startsWith(route(routeName, undefined, false));
        } catch {
            return false;
        }
    };

    return (
        <div className="flex h-screen bg-neutral-950 text-neutral-100 select-none">
            {/* Icon rail */}
            <div className="w-14 bg-neutral-950 border-r border-neutral-800 flex flex-col items-center py-3">
                <div className="flex flex-col gap-1 flex-1">
                    {railItems.filter(item => !item.adminOnly || auth?.user?.role === 'owner' || auth?.user?.role === 'admin' || auth?.user?.role_id === 1).map((item) => {
                        const active = item.route ? isActive(item.route) : false;
                        const Icon = item.icon;
                        const button = (
                            <div
                                className={`w-10 h-10 flex flex-col items-center justify-center rounded-md text-[10px] gap-0.5 transition-colors ${
                                    active
                                        ? 'bg-neutral-800 text-white'
                                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                                }`}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </div>
                        );
                        return item.route ? (
                            <Link key={item.id} href={route(item.route)} title={item.label}>
                                {button}
                            </Link>
                        ) : (
                            <button key={item.id} title={item.label}>
                                {button}
                            </button>
                        );
                    })}
                </div>
                <div className="flex flex-col items-center gap-2">
                    <Link
                        href={route('invite.index')}
                        className={`w-10 h-10 flex flex-col items-center justify-center rounded-md text-[10px] gap-0.5 ${
                            isActive('invite.index')
                                ? 'bg-neutral-800 text-white'
                                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                        }`}
                        title="Invite"
                    >
                        <UserPlus size={18} />
                        <span>Invite</span>
                    </Link>
                </div>
            </div>

            {/* Main sidebar panel */}
            <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col">
                {/* Workspace header */}
                <div className="px-3 py-3 border-b border-neutral-800 flex items-center gap-2">
                    <img src="/logo.png" alt="29 Management" className="h-8 w-auto" />
                    <div className="flex-1 truncate text-sm font-semibold">
                        {auth?.user?.name ? `${auth.user.name}'s Workspace` : 'Workspace'}
                    </div>
                </div>

                {/* Search */}
                <div className="px-3 py-2 border-b border-neutral-800">
                    <div className="flex items-center gap-2 bg-neutral-800/60 rounded-md px-2 py-1.5 text-xs text-neutral-400">
                        <Search size={13} />
                        <span>Search</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-2">
                    {/* Home section */}
                    <div className="px-1">
                        <div className="flex items-center justify-between px-3 pb-1">
                            <span className="text-sm font-semibold text-white">Home</span>
                            <Plus size={14} className="text-neutral-400 hover:text-white cursor-pointer" />
                        </div>
                        <div className="space-y-0.5">
                            {homeMenu.map((item) => (
                                <NavItem
                                    key={item.id}
                                    icon={item.icon}
                                    label={item.label}
                                    href={item.route ? route(item.route) : null}
                                    active={item.route ? isActive(item.route) : false}
                                    badge={item.badgeKey ? badges[item.badgeKey] || null : null}
                                />
                            ))}
                            <div className="flex items-center group">
                                <button
                                    onClick={() => toggle('myTasks')}
                                    className="text-neutral-500 hover:text-white p-1"
                                >
                                    {openSections.myTasks ? (
                                        <ChevronDown size={12} />
                                    ) : (
                                        <ChevronRight size={12} />
                                    )}
                                </button>
                                <Link
                                    href={route('my-tasks')}
                                    className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${
                                        isActive('my-tasks')
                                            ? 'bg-neutral-800 text-white'
                                            : 'text-neutral-300 hover:bg-neutral-800/70 hover:text-white'
                                    }`}
                                >
                                    <CheckSquare size={15} className="text-neutral-400" />
                                    <span className="flex-1">My Tasks</span>
                                </Link>
                            </div>
                            {openSections.myTasks &&
                                myTasksItems.map((item) => (
                                    <NavItem
                                        key={item.id}
                                        icon={item.icon}
                                        label={item.label}
                                        href={item.route ? route(item.route) : null}
                                        active={item.route ? isActive(item.route) : false}
                                        indent={1}
                                        badge={item.badgeKey ? badges[item.badgeKey] || null : null}
                                    />
                                ))}
                        </div>
                    </div>

                    {/* Favorites */}
                    <SectionHeader title="Favorites" action="Add favorite" />

                    {/* Spaces */}
                    <div className="px-1">
                        <div className="flex items-center justify-between px-3 pt-2 pb-1">
                            <button
                                onClick={() => toggle('spaces')}
                                className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-300 flex items-center gap-1"
                            >
                                Spaces
                            </button>
                            <button
                                onClick={() => setShowNewSpace(true)}
                                className="text-neutral-400 hover:text-white"
                                title="Add space"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                        {openSections.spaces && (
                            <div className="space-y-0.5">
                                <NavItem
                                    icon={Star}
                                    label={`All Tasks · ${auth?.user?.name ?? 'Workspace'}`}
                                    href={route('all-tasks')}
                                    active={isActive('all-tasks')}
                                />
                                {spaces.map((space) => (
                                    <SpaceNode
                                        key={space.id}
                                        space={space}
                                        level={0}
                                        currentUrl={url}
                                        expanded={expandedTree}
                                        onToggle={toggleTree}
                                    />
                                ))}
                                <button
                                    onClick={() => setShowNewSpace(true)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-neutral-400 hover:bg-neutral-800/70 hover:text-white"
                                >
                                    <Plus size={14} />
                                    <span>New Space</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Chat Section (Channels + DMs) */}
                    <div className="px-1">
                        <div className="flex items-center group">
                            <button
                                onClick={() => toggle('chat')}
                                className="text-neutral-500 hover:text-white p-1"
                            >
                                {openSections.chat ? (
                                    <ChevronDown size={12} />
                                ) : (
                                    <ChevronRight size={12} />
                                )}
                            </button>
                            <Link
                                href={route('channels.index')}
                                className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${
                                    isActive('channels.index')
                                        ? 'bg-neutral-800 text-white'
                                        : 'text-neutral-300 hover:bg-neutral-800/70 hover:text-white'
                                }`}
                            >
                                <MessageSquare size={15} className="text-neutral-400" />
                                <span className="flex-1">Chat</span>
                            </Link>
                        </div>
                        {openSections.chat && (
                            <div className="space-y-1 mt-1">
                                {/* Channels */}
                                <div className="flex items-center justify-between px-3 pt-2 pb-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                                        Channels
                                    </span>
                                    <button
                                        onClick={() => setShowNewChannel(true)}
                                        className="text-neutral-400 hover:text-white"
                                        title="Add channel"
                                    >
                                        <Plus size={12} />
                                    </button>
                                </div>
                                <div className="space-y-0.5">
                                    {channels.length === 0 && (
                                        <div className="px-3 py-1 text-xs text-neutral-500 italic">
                                            No channels yet
                                        </div>
                                    )}
                                    {channels.map((channel) => (
                                        <NavItem
                                            key={channel.id}
                                            icon={Hash}
                                            label={channel.name}
                                            href={route('channels.show', channel.id)}
                                            active={url.includes(`/channels/${channel.id}`)}
                                            indent={1}
                                        />
                                    ))}
                                    <button
                                        onClick={() => setShowNewChannel(true)}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-neutral-400 hover:bg-neutral-800/70 hover:text-white"
                                        style={{ paddingLeft: 28 }}
                                    >
                                        <Plus size={12} />
                                        <span>Add Channel</span>
                                    </button>
                                </div>

                                {/* Direct Messages */}
                                <div className="flex items-center justify-between px-3 pt-3 pb-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                                        Members
                                    </span>
                                </div>
                                <div className="space-y-0.5">
                                    {allMembers.length === 0 && (
                                        <div className="px-3 py-1 text-xs text-neutral-500 italic">
                                            No members yet
                                        </div>
                                    )}
                                    {allMembers.map((user) => (
                                        <Link
                                            key={user.id}
                                            href={route('messages.index', { user: user.id })}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm hover:bg-neutral-800/70 hover:text-white ${
                                                url.includes(`user=${user.id}`) ? 'bg-neutral-800 text-white' : 'text-neutral-300'
                                            }`}
                                            style={{ paddingLeft: 28 }}
                                        >
                                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="flex-1 truncate">{user.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
            <ProfileMenu user={auth?.user} initial={userInitial} />
            {showNewSpace && <NewSpaceModal onClose={() => setShowNewSpace(false)} />}
            {showNewChannel && <NewChannelModal onClose={() => setShowNewChannel(false)} />}
            {showNewDm && <NewDmModal onClose={() => setShowNewDm(false)} />}
        </div>
    );
}

function ProfileMenu({ user, initial }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [open]);

    return (
        <div ref={ref} className="fixed top-3 right-4 z-50">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-base shadow-lg ring-2 ring-neutral-900 hover:ring-neutral-700 transition"
                title={user?.name || 'Profile'}
            >
                {initial}
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-neutral-800">
                        <div className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</div>
                        <div className="text-xs text-neutral-400 truncate">{user?.email}</div>
                    </div>
                    <div className="py-1">
                        <Link
                            href={route('profile.edit')}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
                        >
                            <Settings size={14} className="text-neutral-400" />
                            <span>Profile Settings</span>
                        </Link>
                        {(user?.role === 'admin' || user?.role === 'owner' || user?.role_id === 1) && (
                            <Link
                                href={route('users.index')}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
                            >
                                <Shield size={14} className="text-neutral-400" />
                                <span>Users & Permissions</span>
                            </Link>
                        )}
                        <button
                            type="button"
                            onClick={() => { setOpen(false); router.post(route('logout')); }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
                        >
                            <LogOut size={14} />
                            <span>Log out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
