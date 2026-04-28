<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Invitation;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;

class InvitationController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'role' => 'required|in:admin,member',
            'space_id' => 'nullable|exists:spaces,id',
        ]);

        $token = Str::random(32);

        $invitation = Invitation::create([
            'email' => $validated['email'],
            'role' => $validated['role'],
            'space_id' => $validated['space_id'] ?? null,
            'invited_by' => auth()->id(),
            'token' => $token,
            'expires_at' => now()->addDays(7),
        ]);

        // TODO: Send email with invitation link
        // Mail::to($validated['email'])->send(new InvitationMail($invitation));

        return redirect()->back()->with('success', 'Invitation sent successfully.');
    }

    public function accept($token)
    {
        $invitation = Invitation::where('token', $token)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->firstOrFail();

        $invitation->update(['accepted_at' => now()]);

        // TODO: Add user to space with the specified role

        return redirect()->route('dashboard')->with('success', 'Invitation accepted successfully.');
    }
}
