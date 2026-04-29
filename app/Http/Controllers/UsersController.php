<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UsersController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::select('id', 'name', 'email', 'role', 'email_verified_at')
            ->orderBy('name')
            ->get();

        return Inertia::render('Users/Index', [
            'users' => $users,
        ]);
    }

    public function updateRole(Request $request, User $user)
    {
        $request->validate([
            'role' => 'required|in:owner,admin,member',
        ]);

        $user->role = $request->role;
        $user->save();

        return back();
    }

    public function toggleActive(User $user)
    {
        // For now, we'll toggle email verification status
        // In a real app, you might want an 'active' field
        if ($user->email_verified_at) {
            $user->email_verified_at = null;
        } else {
            $user->email_verified_at = now();
        }
        $user->save();

        return back();
    }
}
