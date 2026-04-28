<?php

namespace App\Http\Controllers;

use App\Models\Channel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChannelController extends Controller
{
    public function index()
    {
        $channels = Channel::with('creator', 'space')
            ->where(function ($query) {
                $query->where('is_private', false)
                    ->orWhere('created_by', auth()->id());
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Channels/Index', [
            'channels' => $channels,
        ]);
    }

    public function create()
    {
        return Inertia::render('Channels/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'space_id' => 'nullable|exists:spaces,id',
            'is_private' => 'boolean',
        ]);

        Channel::create([
            ...$validated,
            'created_by' => auth()->id(),
        ]);

        return redirect()->route('channels.index')->with('success', 'Channel created successfully.');
    }

    public function show(Channel $channel)
    {
        $channel->load([
            'messages' => fn ($q) => $q->orderBy('created_at'),
            'messages.sender:id,name',
            'messages.attachments',
            'messages.reactions:id,message_id,user_id,emoji',
            'messages.mentions:id,message_id,user_id',
            'messages.replyTo:id,sender_id,content,type,sticker_key',
            'messages.replyTo.sender:id,name',
            'creator:id,name',
            'space:id,name',
        ]);

        return Inertia::render('Channels/Show', [
            'channel' => $channel,
        ]);
    }

    public function edit(Channel $channel)
    {
        return Inertia::render('Channels/Edit', [
            'channel' => $channel,
        ]);
    }

    public function update(Request $request, Channel $channel)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_private' => 'boolean',
        ]);

        $channel->update($validated);

        return redirect()->route('channels.show', $channel)->with('success', 'Channel updated successfully.');
    }

    public function destroy(Channel $channel)
    {
        $channel->delete();

        return redirect()->route('channels.index')->with('success', 'Channel deleted successfully.');
    }
}
