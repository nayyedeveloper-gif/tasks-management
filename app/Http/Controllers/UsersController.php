<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class UsersController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::with('roleModel')
            ->select('id', 'name', 'email', 'role', 'role_id', 'email_verified_at')
            ->orderBy('name')
            ->get();

        $roles = Role::with('permissions')->get();
        $permissions = Permission::orderBy('module')->orderBy('name')->get();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function updateRole(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        $user->role_id = $validated['role_id'];
        
        // Also sync the legacy enum role for compatibility
        $role = Role::find($validated['role_id']);
        if ($role->slug === 'admin') {
            $user->role = 'admin';
        } else {
            $user->role = 'member';
        }
        
        $user->save();

        return back()->with('success', 'User role updated successfully.');
    }

    public function updateRolePermissions(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'role_id' => 'required|exists:roles,id',
            'permission_ids' => 'array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $role = Role::find($validated['role_id']);
        $role->permissions()->sync($validated['permission_ids'] ?? []);

        return back()->with('success', 'Role permissions updated successfully.');
    }

    public function toggleActive(User $user): RedirectResponse
    {
        if ($user->email_verified_at) {
            $user->email_verified_at = null;
        } else {
            $user->email_verified_at = now();
        }
        $user->save();

        return back();
    }
}
