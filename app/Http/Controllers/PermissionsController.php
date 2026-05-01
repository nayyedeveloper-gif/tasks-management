<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PermissionsController extends Controller
{
    public function index(): Response
    {
        $permissions = Permission::orderBy('module')->orderBy('name')->get();
        $roles = Role::with('permissions')->get();
        $users = User::with('roleModel')->select('id', 'name', 'email', 'role_id')->get();

        return Inertia::render('Permissions/Index', [
            'permissions' => $permissions,
            'roles' => $roles,
            'users' => $users,
        ]);
    }

    public function updateRolePermissions(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'role_id' => 'required|exists:roles,id',
            'permission_ids' => 'array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $role = Role::find($validated['role_id']);
        $role->permissions()->sync($validated['permission_ids'] ?? []);

        return back()->with('success', 'Permissions updated successfully.');
    }

    public function updateUserRole(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'role_id' => 'required|exists:roles,id',
        ]);

        $user = User::find($validated['user_id']);
        $user->role_id = $validated['role_id'];
        $user->save();

        return back()->with('success', 'User role updated successfully.');
    }
}
