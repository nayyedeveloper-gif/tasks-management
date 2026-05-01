<?php

namespace App\Mail;

use App\Models\Message;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MessageNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $message;
    public $user;
    public $channel;
    public $isMention;

    public function __construct(Message $message, User $user, $channel, bool $isMention = false)
    {
        $this->message = $message;
        $this->user = $user;
        $this->channel = $channel;
        $this->isMention = $isMention;
    }

    public function envelope(): Envelope
    {
        $subject = $this->isMention 
            ? "You were mentioned in {$this->channel->name}"
            : "New message in {$this->channel->name}";

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.message-notification',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
