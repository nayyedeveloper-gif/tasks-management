<?php

namespace App\Http\Controllers;

use App\Mail\InvitationAcceptedMail;
use App\Mail\InvitationMail;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\Request;
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
            'status' => 'pending',
        ]);

        // Send email with invitation link
        $inviter = auth()->user();
        Mail::to($validated['email'])->send(new InvitationMail($invitation, $inviter));

        return redirect()->back()->with('success', 'Invitation sent successfully.');
    }

    public function accept($token)
    {
        $invitation = Invitation::where('token', $token)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->firstOrFail();

        $invitation->update([
            'accepted_at' => now(),
            'status' => 'accepted',
        ]);

        // Check if user exists or create them
        $user = User::where('email', $invitation->email)->first();

        if (!$user) {
            // User doesn't exist, redirect to register with the token
            return redirect()->route('register', ['token' => $token])->with('info', 'Please create an account to accept the invitation.');
        }

        // Assign role to user
        $user->update(['role' => $invitation->role]);

        // Add user to space if space_id exists
        if ($invitation->space_id) {
            $invitation->space->users()->syncWithoutDetaching([$user->id]);
        }

        // Send confirmation email to inviter
        $inviter = User::find($invitation->invited_by);
        if ($inviter) {
            Mail::to($inviter->email)->send(new InvitationAcceptedMail($invitation, $user));
        }

        return redirect()->route('dashboard')->with('success', 'Invitation accepted successfully.');
    }
}
