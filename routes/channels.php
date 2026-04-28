<?php

use App\Models\Channel;
use App\Models\ChannelMember;
use Illuminate\Support\Facades\Broadcast;

/*
 * Private channel authorisation.
 *
 * These callbacks determine whether the authenticated user is allowed to
 * listen on the given private channel.
 */

// Presence channel for a chat channel — any member of the Channel (or public) may join.
Broadcast::channel('chat.channel.{channelId}', function ($user, int $channelId) {
    $channel = Channel::find($channelId);
    if (! $channel) {
        return false;
    }

    // Public channels: any authenticated user.
    if (! $channel->is_private) {
        return ['id' => $user->id, 'name' => $user->name];
    }

    // Private channels: must be in channel_members if that table exists.
    if (class_exists(ChannelMember::class)) {
        $isMember = ChannelMember::where('channel_id', $channelId)
            ->where('user_id', $user->id)
            ->exists();
        if ($isMember) {
            return ['id' => $user->id, 'name' => $user->name];
        }
    }

    // Fallback: the creator can always join their own private channel.
    return $channel->created_by === $user->id
        ? ['id' => $user->id, 'name' => $user->name]
        : false;
});

// DM presence channel — ordered pair (smaller id . "-" . larger id).
Broadcast::channel('chat.dm.{pair}', function ($user, string $pair) {
    [$a, $b] = array_map('intval', explode('-', $pair) + [1 => 0]);
    if ($a <= 0 || $b <= 0) {
        return false;
    }

    return ($user->id === $a || $user->id === $b)
        ? ['id' => $user->id, 'name' => $user->name]
        : false;
});

// Per-user private channel for notifications (mentions, invites, etc.)
Broadcast::channel('user.{id}', function ($user, int $id) {
    return $user->id === $id;
});
