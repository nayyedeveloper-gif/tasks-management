<?php

namespace App\Http\Controllers;

use App\Events\MessageDeleted;
use App\Events\MessageReactionUpdated;
use App\Events\MessageSent;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\MessageMention;
use App\Models\MessageReaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MessageController extends Controller
{
    private const RELATIONS = [
        'sender:id,name',
        'receiver:id,name',
        'attachments',
        'reactions:id,message_id,user_id,emoji',
        'mentions:id,message_id,user_id',
        'replyTo:id,sender_id,content,type,sticker_key',
        'replyTo.sender:id,name',
    ];

    public function index(Request $request): Response
    {
        $userId = Auth::id();
        $activeUserId = $request->integer('user') ?: null;

        $conversations = $this->conversations($userId);

        $thread = [];
        $partner = null;
        if ($activeUserId) {
            $partner = User::select('id', 'name', 'email')->find($activeUserId);
            if ($partner) {
                $thread = $this->dmThreadQuery($userId, $activeUserId)->get();
                $this->markRead($userId, $activeUserId);
            }
        }

        return Inertia::render('Messages/Index', [
            'conversations' => $conversations,
            'partner' => $partner,
            'thread' => $thread,
            'activeUserId' => $activeUserId,
        ]);
    }

    public function thread(Request $request, User $user): JsonResponse
    {
        $userId = Auth::id();
        $messages = $this->dmThreadQuery($userId, $user->id)->get();
        $this->markRead($userId, $user->id);

        return response()->json([
            'partner' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
            'messages' => $messages,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'channel_id' => 'nullable|exists:channels,id',
            'receiver_id' => 'nullable|exists:users,id',
            'content' => 'nullable|string|max:5000',
            'type' => 'nullable|in:text,sticker,file',
            'sticker_key' => 'nullable|string|max:64',
            'reply_to_id' => 'nullable|exists:messages,id',
            'is_direct_message' => 'boolean',
            'mentions' => 'nullable|array',
            'mentions.*' => 'integer|exists:users,id',
            'attachments' => 'nullable|array|max:10',
            'attachments.*' => 'file|max:25600', // 25 MB each
        ]);

        if (empty($data['channel_id']) && empty($data['receiver_id'])) {
            abort(422, 'Either channel_id or receiver_id is required.');
        }

        $type = $data['type'] ?? 'text';
        $hasContent = ! empty($data['content']) || ! empty($data['sticker_key']) || $request->hasFile('attachments');
        if (! $hasContent) {
            abort(422, 'Message must contain content, a sticker, or an attachment.');
        }

        $message = DB::transaction(function () use ($data, $type, $request) {
            $message = Message::create([
                'channel_id' => $data['channel_id'] ?? null,
                'receiver_id' => $data['receiver_id'] ?? null,
                'sender_id' => Auth::id(),
                'content' => $data['content'] ?? '',
                'type' => $type,
                'sticker_key' => $data['sticker_key'] ?? null,
                'reply_to_id' => $data['reply_to_id'] ?? null,
                'is_direct_message' => (bool) ($data['is_direct_message'] ?? false),
                'is_read' => false,
            ]);

            // Attachments
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store("messages/{$message->id}", 'public');
                    [$w, $h] = $this->imageDimensions($file);
                    MessageAttachment::create([
                        'message_id' => $message->id,
                        'disk' => 'public',
                        'path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType(),
                        'size_bytes' => $file->getSize(),
                        'width' => $w,
                        'height' => $h,
                    ]);
                }
            }

            // Mentions
            $mentionIds = collect($data['mentions'] ?? [])->unique()->reject(fn ($id) => $id === Auth::id())->values();
            foreach ($mentionIds as $uid) {
                MessageMention::create(['message_id' => $message->id, 'user_id' => $uid]);
            }

            return $message;
        });

        $message->load(self::RELATIONS);
        broadcast(new MessageSent($message))->toOthers();

        if ($request->expectsJson() || $request->wantsJson() || $request->is('api/*')) {
            return response()->json(['message' => $message]);
        }
        if (! empty($data['receiver_id']) && ($data['is_direct_message'] ?? false)) {
            return redirect()->route('messages.index', ['user' => $data['receiver_id']]);
        }
        return back();
    }

    public function markAsRead(Message $message): RedirectResponse
    {
        if ($message->receiver_id === Auth::id()) {
            $message->update(['is_read' => true]);
        }
        return back();
    }

    public function destroy(Message $message)
    {
        abort_unless($message->sender_id === Auth::id(), 403);

        // Remove attachments from disk
        foreach ($message->attachments as $a) {
            try { Storage::disk($a->disk)->delete($a->path); } catch (\Throwable $e) { /* ignore */ }
        }

        $payload = [
            'id' => $message->id,
            'channel_id' => $message->channel_id,
            'sender_id' => $message->sender_id,
            'receiver_id' => $message->receiver_id,
        ];
        $message->delete();

        broadcast(new MessageDeleted(
            $payload['id'], $payload['channel_id'], $payload['sender_id'], $payload['receiver_id']
        ))->toOthers();

        if (request()->wantsJson()) return response()->json(['ok' => true]);
        return back();
    }

    public function react(Request $request, Message $message): RedirectResponse
    {
        $data = $request->validate([
            'emoji' => 'required|string|max:16',
        ]);

        MessageReaction::firstOrCreate([
            'message_id' => $message->id,
            'user_id' => Auth::id(),
            'emoji' => $data['emoji'],
        ]);

        broadcast(new MessageReactionUpdated($message->fresh()))->toOthers();
        return back();
    }

    public function unreact(Request $request, Message $message): RedirectResponse
    {
        $data = $request->validate([
            'emoji' => 'required|string|max:16',
        ]);

        MessageReaction::where([
            'message_id' => $message->id,
            'user_id' => Auth::id(),
            'emoji' => $data['emoji'],
        ])->delete();

        broadcast(new MessageReactionUpdated($message->fresh()))->toOthers();
        return back();
    }

    public function searchUsers(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        $query = User::query()->select('id', 'name', 'email')->limit(8);
        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                $qq->where('name', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%");
            });
        } else {
            $query->orderBy('name');
        }
        return response()->json(['users' => $query->get()]);
    }

    /* ---------------------- helpers ---------------------- */

    private function dmThreadQuery(int $userId, int $partnerId)
    {
        return Message::query()
            ->where('is_direct_message', true)
            ->where(function ($q) use ($userId, $partnerId) {
                $q->where(function ($qq) use ($userId, $partnerId) {
                    $qq->where('sender_id', $userId)->where('receiver_id', $partnerId);
                })->orWhere(function ($qq) use ($userId, $partnerId) {
                    $qq->where('sender_id', $partnerId)->where('receiver_id', $userId);
                });
            })
            ->with(self::RELATIONS)
            ->orderBy('created_at');
    }

    private function markRead(int $userId, int $partnerId): void
    {
        Message::where('is_direct_message', true)
            ->where('sender_id', $partnerId)
            ->where('receiver_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);
    }

    private function imageDimensions($file): array
    {
        try {
            if (str_starts_with((string) $file->getMimeType(), 'image/')) {
                $info = @getimagesize($file->getRealPath());
                if (is_array($info)) return [$info[0] ?? null, $info[1] ?? null];
            }
        } catch (\Throwable $e) { /* ignore */ }
        return [null, null];
    }

    private function conversations(int $userId): array
    {
        $rows = Message::where('is_direct_message', true)
            ->where(function ($q) use ($userId) {
                $q->where('sender_id', $userId)->orWhere('receiver_id', $userId);
            })
            ->orderByDesc('created_at')
            ->get(['id', 'sender_id', 'receiver_id', 'content', 'type', 'is_read', 'created_at']);

        $byPartner = [];
        foreach ($rows as $m) {
            $partnerId = $m->sender_id === $userId ? $m->receiver_id : $m->sender_id;
            if (! $partnerId) continue;
            if (! isset($byPartner[$partnerId])) {
                $byPartner[$partnerId] = [
                    'partner_id' => $partnerId,
                    'last_message' => $m->type === 'sticker' ? '🎨 Sticker' : $m->content,
                    'last_at' => $m->created_at,
                    'last_from_me' => $m->sender_id === $userId,
                    'unread' => 0,
                ];
            }
            if ($m->receiver_id === $userId && ! $m->is_read) {
                $byPartner[$partnerId]['unread']++;
            }
        }

        if (empty($byPartner)) return [];

        $partners = User::whereIn('id', array_keys($byPartner))->get(['id', 'name', 'email'])->keyBy('id');
        $list = [];
        foreach ($byPartner as $pid => $info) {
            if (! isset($partners[$pid])) continue;
            $list[] = [
                'id' => $pid,
                'name' => $partners[$pid]->name,
                'email' => $partners[$pid]->email,
                'last_message' => $info['last_message'],
                'last_at' => $info['last_at'],
                'last_from_me' => $info['last_from_me'],
                'unread' => $info['unread'],
            ];
        }
        usort($list, fn ($a, $b) => strcmp((string) $b['last_at'], (string) $a['last_at']));
        return $list;
    }
}
