<?php

namespace App\Http\Middleware;

use App\Models\Channel;
use App\Models\Message;
use App\Models\Space;
use App\Models\Task;
use App\Models\TaskComment;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? array_merge($request->user()->toArray(), [
                    'role_id' => $request->user()->role_id,
                ]) : null,
            ],
            'sidebar' => fn () => $request->user() ? $this->sidebarData($request) : null,
            'badges' => fn () => $request->user() ? $this->badges($request) : null,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }

    private function badges(Request $request): array
    {
        $userId = $request->user()->id;
        $today = now()->toDateString();

        $todayCount = Task::where('assigned_to', $userId)
            ->where(function ($q) use ($today) {
                $q->whereDate('due_date', '<=', $today);
            })
            ->whereNull('date_done')
            ->count();

        // Unread replies (comments on tasks created by user)
        $repliesCount = TaskComment::whereHas('task', fn ($q) => $q->where('created_by', $userId))
            ->where('user_id', '!=', $userId)
            ->where('is_read', false)
            ->count();

        // Unread assigned comments (comments on tasks assigned to user)
        $assignedCommentsCount = TaskComment::whereHas('task', fn ($q) => $q->where('assigned_to', $userId))
            ->where('user_id', '!=', $userId)
            ->where('is_read', false)
            ->count();

        // Total Inbox count (unread comments + maybe unread assignments if we had that)
        $inboxCount = $repliesCount + $assignedCommentsCount;

        // Direct Message unread counts
        $unreadMessages = Message::where('receiver_id', $userId)
            ->where('is_read', false)
            ->where('is_direct_message', true)
            ->count();

        // Unread counts by sender for sidebar members list
        $unreadBySender = Message::where('receiver_id', $userId)
            ->where('is_read', false)
            ->where('is_direct_message', true)
            ->groupBy('sender_id')
            ->selectRaw('sender_id, count(*) as count')
            ->pluck('count', 'sender_id')
            ->toArray();

        // Simple Channel unread check (has messages in last 24h from others)
        $newChannelMessages = Message::whereNotNull('channel_id')
            ->where('sender_id', '!=', $userId)
            ->where('created_at', '>=', now()->subDay())
            ->groupBy('channel_id')
            ->pluck('channel_id')
            ->toArray();

        return [
            'today' => $todayCount,
            'inbox' => $inboxCount,
            'replies' => $repliesCount,
            'assignedComments' => $assignedCommentsCount,
            'chat' => $unreadMessages,
            'unreadBySender' => $unreadBySender,
            'newChannels' => $newChannelMessages,
        ];
    }

    private function sidebarData(Request $request): array
    {
        $userId = $request->user()->id;

        $spacesQuery = Space::whereNull('parent_id')
            ->where('is_personal', false);

        // If not admin, restrict to spaces the user is a member of or created
        if ($request->user()->role_id !== 1) {
            $spacesQuery->where(function ($q) use ($userId) {
                $q->where('created_by', $userId)
                  ->orWhereHas('users', function ($uq) use ($userId) {
                      $uq->where('user_id', $userId);
                  });
            });
        }

        $spaces = $spacesQuery->with([
                'children',
                'folders' => fn ($q) => $q->select('id', 'space_id', 'name', 'color', 'position'),
                'folders.lists' => fn ($q) => $q->select('id', 'space_id', 'folder_id', 'name', 'color', 'position'),
                'lists' => fn ($q) => $q->select('id', 'space_id', 'folder_id', 'name', 'color', 'position'),
            ])
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'parent_id']);

        $channels = Channel::where(function ($query) use ($userId) {
            $query->where('is_private', false)
                ->orWhere('created_by', $userId);
        })
            ->orderBy('name')
            ->get(['id', 'name', 'is_private']);

        $directMessages = Message::with(['sender:id,name', 'receiver:id,name'])
            ->where('is_direct_message', true)
            ->where(function ($query) use ($userId) {
                $query->where('sender_id', $userId)
                    ->orWhere('receiver_id', $userId);
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($message) use ($userId) {
                return $message->sender_id === $userId ? $message->receiver : $message->sender;
            })
            ->filter()
            ->unique('id')
            ->values();

        // Get all members for direct messages
        $allMembers = \App\Models\User::select('id', 'name', 'email')
            ->where('id', '!=', $userId)
            ->orderBy('name')
            ->get();

        return [
            'spaces' => $spaces,
            'channels' => $channels,
            'directMessages' => $directMessages,
            'allMembers' => $allMembers,
        ];
    }
}
