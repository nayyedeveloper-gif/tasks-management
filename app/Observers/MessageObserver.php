<?php

namespace App\Observers;

use App\Mail\MessageNotificationMail;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class MessageObserver
{
    public function created(Message $message)
    {
        $channel = $message->channel;
        if (!$channel) return;

        // For direct messages, notify the receiver
        if ($message->is_direct_message && $message->receiver_id) {
            $receiver = User::find($message->receiver_id);
            if ($receiver && $receiver->email && $receiver->id !== $message->sender_id) {
                Mail::to($receiver->email)->send(new MessageNotificationMail($message, $receiver, $channel, false));
            }
            return;
        }

        // For channel messages, check mentions
        $mentions = $message->mentions()->pluck('user_id')->toArray();
        
        foreach ($mentions as $userId) {
            // Skip the message sender
            if ($userId === $message->sender_id) continue;

            $user = User::find($userId);
            if (!$user || !$user->email) continue;

            Mail::to($user->email)->send(new MessageNotificationMail($message, $user, $channel, true));
        }
    }
}
