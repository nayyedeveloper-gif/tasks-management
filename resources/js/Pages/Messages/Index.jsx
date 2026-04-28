import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Plus, Search, Phone, Video, Info } from 'lucide-react';
import Sidebar from '@/Components/Sidebar';
import NewDmModal from '@/Components/Modals/NewDmModal';
import Avatar from '@/Components/Chat/Avatar';
import Composer from '@/Components/Chat/Composer';
import MessageGroup from '@/Components/Chat/MessageGroup';
import DaySeparator from '@/Components/Chat/DaySeparator';
import { buildMessageGroups, relativeTime } from '@/Components/Chat/helpers';

export default function MessagesIndex({ conversations, partner: initialPartner, thread: initialThread, activeUserId }) {
    const { auth } = usePage().props;
    const myId = auth?.user?.id;

    const [partner, setPartner] = useState(initialPartner || null);
    const [messages, setMessages] = useState(initialThread || []);
    const [search, setSearch] = useState('');
    const [showNewDm, setShowNewDm] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const scrollerRef = useRef(null);

    // Sync when navigating between threads
    useEffect(() => {
        setPartner(initialPartner || null);
        setMessages(initialThread || []);
        setReplyTo(null);
    }, [activeUserId, initialPartner, initialThread]);

    // Real-time listeners for DM thread
    useEffect(() => {
        if (!partner?.id) return;
        const pair = [myId, partner.id].sort((a, b) => a - b).join('-');
        const channelName = `chat.dm.${pair}`;
        const echoChannel = window.Echo.join(channelName);

        echoChannel.listen('.message.sent', (e) => {
            setMessages((prev) => (prev.some((m) => m.id === e.message.id) ? prev : [...prev, e.message]));
        });
        echoChannel.listen('.message.deleted', (e) => {
            setMessages((prev) => prev.filter((m) => m.id !== e.id));
        });
        echoChannel.listen('.message.reaction', (e) => {
            setMessages((prev) => prev.map((m) => (m.id === e.id ? { ...m, reactions: e.reactions } : m)));
        });

        return () => { window.Echo.leave(channelName); };
    }, [partner?.id, myId]);

    // Auto-scroll on new messages or partner change
    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [messages.length, partner?.id]);

    const filteredConvos = useMemo(() => {
        if (!search.trim()) return conversations;
        const q = search.trim().toLowerCase();
        return conversations.filter(
            (c) => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
        );
    }, [conversations, search]);

    const onDeleteMessage = (m) => {
        if (!confirm('Delete this message?')) return;
        router.delete(route('messages.destroy', m.id), {
            preserveScroll: true,
            onSuccess: () => setMessages((prev) => prev.filter((x) => x.id !== m.id)),
        });
    };

    const onReact = (m, emoji) => {
        if (!emoji) return;
        const mine = (m.reactions || []).find((r) => r.user_id === myId && r.emoji === emoji);

        // Optimistic update
        setMessages((prev) =>
            prev.map((x) => {
                if (x.id !== m.id) return x;
                const existing = x.reactions || [];
                const next = mine
                    ? existing.filter((r) => !(r.user_id === myId && r.emoji === emoji))
                    : [...existing, { id: `tmp-${Date.now()}`, user_id: myId, emoji }];
                return { ...x, reactions: next };
            })
        );

        if (mine) {
            // Use POST with _method override because DELETE with request body is problematic in Inertia
            router.post(route('messages.unreact', m.id), { _method: 'delete', emoji }, {
                preserveScroll: true,
                preserveState: true,
            });
        } else {
            router.post(route('messages.react', m.id), { emoji }, {
                preserveScroll: true,
                preserveState: true,
            });
        }
    };

    const groupedItems = useMemo(() => buildMessageGroups(messages), [messages]);

    return (
        <>
            <Head title={partner ? `Chat · ${partner.name}` : 'Direct Messages'} />
            <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex overflow-hidden">
                    {/* Conversation list */}
                    <aside className="w-80 bg-neutral-950 border-r border-neutral-800 flex flex-col">
                        <header className="h-14 px-4 flex items-center justify-between border-b border-neutral-800 shrink-0">
                            <h2 className="text-[15px] font-semibold text-white">Direct Messages</h2>
                            <button
                                onClick={() => setShowNewDm(true)}
                                className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                                title="New message"
                            >
                                <Plus size={15} />
                            </button>
                        </header>

                        <div className="p-3 border-b border-neutral-800">
                            <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-neutral-900 border border-neutral-800 focus-within:border-neutral-700">
                                <Search size={13} className="text-neutral-500 shrink-0" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search conversations"
                                    className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-2 py-2">
                            {filteredConvos.length === 0 ? (
                                <div className="px-4 py-12 text-center text-xs text-neutral-500">
                                    {search ? 'No matches' : 'No conversations yet'}
                                </div>
                            ) : (
                                filteredConvos.map((c) => {
                                    const active = partner?.id === c.id;
                                    return (
                                        <Link
                                            key={c.id}
                                            href={route('messages.index', { user: c.id })}
                                            className={`flex items-center gap-3 px-2.5 py-2 rounded-lg transition ${
                                                active ? 'bg-neutral-800' : 'hover:bg-neutral-900'
                                            }`}
                                        >
                                            <Avatar name={c.name} size="md" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`text-sm truncate ${c.unread > 0 ? 'text-white font-semibold' : 'text-neutral-200'}`}>
                                                        {c.name}
                                                    </span>
                                                    <span className="text-[10px] text-neutral-500 shrink-0 tabular-nums">
                                                        {relativeTime(c.last_at)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2 mt-0.5">
                                                    <span className={`text-xs truncate ${c.unread > 0 ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                                        {c.last_from_me ? 'You: ' : ''}{c.last_message || '—'}
                                                    </span>
                                                    {c.unread > 0 && (
                                                        <span className="shrink-0 min-w-[18px] h-[18px] px-1.5 inline-flex items-center justify-center text-[10px] font-semibold text-white bg-purple-600 rounded-full">
                                                            {c.unread}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </aside>

                    {/* Conversation view */}
                    <section className="flex-1 flex flex-col bg-neutral-950 min-w-0">
                        {!partner ? (
                            <EmptyState onNew={() => setShowNewDm(true)} />
                        ) : (
                            <>
                                {/* Header */}
                                <header className="h-14 px-5 flex items-center gap-3 border-b border-neutral-800 shrink-0">
                                    <Avatar name={partner.name} size="md" status="online" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[15px] font-semibold text-white leading-tight truncate">
                                            {partner.name}
                                        </div>
                                        <div className="text-[11px] text-neutral-500 leading-tight truncate">
                                            {partner.email}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <HeaderIconButton title="Call"><Phone size={15} /></HeaderIconButton>
                                        <HeaderIconButton title="Video"><Video size={15} /></HeaderIconButton>
                                        <HeaderIconButton title="Details"><Info size={15} /></HeaderIconButton>
                                    </div>
                                </header>

                                {/* Messages */}
                                <div
                                    ref={scrollerRef}
                                    className="flex-1 overflow-y-auto"
                                >
                                    {groupedItems.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center px-8">
                                            <Avatar name={partner.name} size="xl" />
                                            <h3 className="mt-4 text-lg font-semibold text-white">{partner.name}</h3>
                                            <p className="mt-1 text-sm text-neutral-400">
                                                This is the beginning of your conversation with {partner.name}.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="py-4">
                                            {groupedItems.map((g) =>
                                                g.type === 'day' ? (
                                                    <DaySeparator key={g.key} label={g.label} />
                                                ) : (
                                                    <MessageGroup
                                                        key={g.key}
                                                        group={g}
                                                        myId={myId}
                                                        onReply={setReplyTo}
                                                        onDelete={onDeleteMessage}
                                                        onReact={onReact}
                                                    />
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Composer */}
                                <Composer
                                    receiverId={partner.id}
                                    replyTo={replyTo}
                                    onCancelReply={() => setReplyTo(null)}
                                    placeholder={`Message ${partner.name}`}
                                />
                            </>
                        )}
                    </section>
                </div>
            </div>
            {showNewDm && <NewDmModal onClose={() => setShowNewDm(false)} />}
        </>
    );
}

function HeaderIconButton({ children, title }) {
    return (
        <button
            type="button"
            title={title}
            className="w-8 h-8 flex items-center justify-center rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
        >
            {children}
        </button>
    );
}

function EmptyState({ onNew }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <MessageSquare size={28} className="text-neutral-500" />
            </div>
            <h3 className="mt-5 text-base font-semibold text-white">Your messages</h3>
            <p className="mt-1 text-sm text-neutral-500 max-w-sm">
                Send a private message to a teammate, or pick an existing conversation from the list.
            </p>
            <button
                onClick={onNew}
                className="mt-5 h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-medium text-white transition"
            >
                <Plus size={14} /> New message
            </button>
        </div>
    );
}
