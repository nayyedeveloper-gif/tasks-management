import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    ArrowLeft,
    Hash,
    Lock,
    Edit3,
    Trash2,
    X,
    Users,
    Pin,
    Bell,
    BellOff,
} from 'lucide-react';
import HomeShell from '@/Components/HomeShell';
import Avatar from '@/Components/Chat/Avatar';
import Composer from '@/Components/Chat/Composer';
import MessageGroup from '@/Components/Chat/MessageGroup';
import DaySeparator from '@/Components/Chat/DaySeparator';
import { buildMessageGroups } from '@/Components/Chat/helpers';

/* ----------------------- Edit channel modal ----------------------- */

function EditChannelModal({ channel, onClose }) {
    const { data, setData, put, processing, errors } = useForm({
        name: channel.name,
        description: channel.description || '',
        is_private: !!channel.is_private,
    });
    const submit = (e) => {
        e.preventDefault();
        put(route('channels.update', channel.id), { preserveScroll: true, onSuccess: onClose });
    };
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <form
                onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden"
            >
                <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Edit3 size={14} className="text-purple-400" /> Edit channel
                    </h2>
                    <button type="button" onClick={onClose} className="p-1 text-neutral-400 hover:text-white">
                        <X size={14} />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-neutral-400">Name</label>
                        <div className="mt-1.5 flex items-center gap-2 h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-800 focus-within:border-purple-500 transition">
                            {data.is_private ? (
                                <Lock size={14} className="text-neutral-500" />
                            ) : (
                                <Hash size={14} className="text-neutral-500" />
                            )}
                            <input
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                className="flex-1 bg-transparent text-sm text-white outline-none"
                                required
                            />
                        </div>
                        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="text-xs font-medium text-neutral-400">Description</label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className="mt-1.5 w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-white outline-none focus:border-purple-500 transition resize-none"
                        />
                    </div>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={data.is_private}
                            onChange={(e) => setData('is_private', e.target.checked)}
                            className="rounded bg-neutral-800 border-neutral-700"
                        />
                        <span className="text-sm text-neutral-300 inline-flex items-center gap-1.5">
                            <Lock size={12} /> Private channel
                        </span>
                    </label>
                </div>
                <div className="px-5 py-3 border-t border-neutral-800 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 px-3 text-sm text-neutral-300 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="h-9 px-4 text-sm font-medium text-white rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60 transition"
                    >
                        Save
                    </button>
                </div>
            </form>
        </div>
    );
}

/* ----------------------- Main page ----------------------- */

export default function ChannelShow({ channel }) {
    const { auth } = usePage().props;
    const myId = auth?.user?.id;
    const [editing, setEditing] = useState(false);
    const [muted, setMuted] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [messages, setMessages] = useState(channel.messages || []);
    const scrollRef = useRef(null);

    // Real-time listeners
    useEffect(() => {
        const channelName = `chat.channel.${channel.id}`;
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
    }, [channel.id]);

    // Auto-scroll on new messages
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [messages.length]);

    const onDeleteMessage = (m) => {
        if (!confirm('Delete this message?')) return;
        router.delete(route('messages.destroy', m.id), {
            preserveScroll: true,
            onSuccess: () => setMessages((prev) => prev.filter((x) => x.id !== m.id)),
        });
    };

    const onDeleteChannel = () => {
        if (!confirm(`Delete channel #${channel.name}? This is permanent.`)) return;
        router.delete(route('channels.destroy', channel.id), {
            onSuccess: () => router.visit(route('channels.index')),
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
            <Head title={`#${channel.name}`} />
            <HomeShell
                title={
                    <span className="flex items-center gap-2">
                        <Link
                            href={route('channels.index')}
                            className="inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-300 text-sm font-normal"
                        >
                            <ArrowLeft size={13} /> Channels
                        </Link>
                        <span className="text-neutral-700">/</span>
                        <span className="inline-flex items-center gap-1.5">
                            {channel.is_private ? (
                                <Lock size={14} className="text-amber-400" />
                            ) : (
                                <Hash size={14} className="text-purple-400" />
                            )}
                            <span className="font-semibold">{channel.name}</span>
                        </span>
                    </span>
                }
                subtitle={channel.description}
                actions={
                    <div className="flex items-center gap-1">
                        {channel.is_private && (
                            <span className="mr-2 inline-flex items-center text-[10px] font-semibold uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 h-5 rounded">
                                Private
                            </span>
                        )}
                        <HeaderIconButton title="Members">
                            <Users size={14} />
                        </HeaderIconButton>
                        <HeaderIconButton title="Pinned">
                            <Pin size={14} />
                        </HeaderIconButton>
                        <HeaderIconButton title={muted ? 'Unmute' : 'Mute'} onClick={() => setMuted((v) => !v)}>
                            {muted ? <BellOff size={14} /> : <Bell size={14} />}
                        </HeaderIconButton>
                        <HeaderIconButton title="Edit channel" onClick={() => setEditing(true)}>
                            <Edit3 size={14} />
                        </HeaderIconButton>
                        <HeaderIconButton title="Delete channel" onClick={onDeleteChannel} danger>
                            <Trash2 size={14} />
                        </HeaderIconButton>
                    </div>
                }
            >
                <div className="flex flex-col h-[calc(100vh-5.25rem)]">
                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto">
                        {groupedItems.length === 0 ? (
                            <ChannelEmptyState channel={channel} />
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
                        channelId={channel.id}
                        replyTo={replyTo}
                        onCancelReply={() => setReplyTo(null)}
                        onSent={(msg) => setMessages((prev) => [...prev, msg])}
                        placeholder={`Message #${channel.name}`}
                    />
                </div>
            </HomeShell>

            {editing && <EditChannelModal channel={channel} onClose={() => setEditing(false)} />}
        </>
    );
}

function HeaderIconButton({ children, title, onClick, danger = false }) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            className={`w-8 h-8 inline-flex items-center justify-center rounded-md transition ${
                danger
                    ? 'text-neutral-400 hover:text-red-400 hover:bg-neutral-900'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
        >
            {children}
        </button>
    );
}

function ChannelEmptyState({ channel }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                {channel.is_private ? (
                    <Lock size={28} className="text-amber-400" />
                ) : (
                    <Hash size={28} className="text-purple-400" />
                )}
            </div>
            <h3 className="mt-5 text-lg font-semibold text-white">
                Welcome to #{channel.name}
            </h3>
            <p className="mt-1 text-sm text-neutral-400 max-w-md">
                {channel.description ||
                    'This is the very beginning of the channel. Share updates, ask questions, and collaborate with your team.'}
            </p>
        </div>
    );
}
