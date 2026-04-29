import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Search, Shield, UserCheck, UserX, MoreHorizontal, ChevronDown, Filter } from 'lucide-react';

export default function UsersIndex({ users, auth }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [showRoleMenu, setShowRoleMenu] = useState(null);

    const filteredUsers = users.filter((user) => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const updateRole = (userId, newRole) => {
        router.put(
            route('users.update-role', userId),
            { role: newRole },
            { preserveScroll: true, preserveState: true }
        );
        setShowRoleMenu(null);
    };

    const toggleActive = (userId) => {
        router.post(
            route('users.toggle-active', userId),
            {},
            { preserveScroll: true, preserveState: true }
        );
    };

    const canManageUsers = auth?.user?.role === 'owner' || auth?.user?.role === 'admin';

    if (!canManageUsers) {
        return (
            <AuthenticatedLayout>
                <Head title="Access Denied" />
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <Shield size={48} className="mx-auto text-neutral-500 mb-4" />
                        <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
                        <p className="text-neutral-400">You don't have permission to manage users.</p>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-white">
                    User Management
                </h2>
            }
        >
            <Head title="Users" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Filters */}
                    <div className="mb-6 flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                        >
                            <option value="all">All Roles</option>
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                        </select>
                    </div>

                    {/* Users Table */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-neutral-900 border-b border-neutral-800 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                            <div className="col-span-4">User</div>
                            <div className="col-span-3">Role</div>
                            <div className="col-span-3">Status</div>
                            <div className="col-span-2">Actions</div>
                        </div>

                        {filteredUsers.length === 0 ? (
                            <div className="px-4 py-12 text-center text-neutral-500">
                                No users found
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <div key={user.id} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-neutral-800/60 hover:bg-neutral-800/40 items-center">
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">{user.name}</div>
                                            <div className="text-xs text-neutral-500">{user.email}</div>
                                        </div>
                                    </div>

                                    <div className="col-span-3">
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowRoleMenu(showRoleMenu === user.id ? null : user.id)}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition"
                                            >
                                                {user.role || 'member'}
                                                <ChevronDown size={12} />
                                            </button>

                                            {showRoleMenu === user.id && (
                                                <div className="absolute z-10 mt-1 w-32 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl overflow-hidden">
                                                    {['owner', 'admin', 'member'].map((role) => (
                                                        <button
                                                            key={role}
                                                            onClick={() => updateRole(user.id, role)}
                                                            className={`w-full px-3 py-2 text-xs text-left hover:bg-neutral-700 transition ${
                                                                user.role === role ? 'text-purple-400 font-medium' : 'text-neutral-300'
                                                            }`}
                                                        >
                                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-span-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${user.email_verified_at ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                                            <span className="text-xs text-neutral-400">
                                                {user.email_verified_at ? 'Verified' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="col-span-2 flex items-center gap-2">
                                        {user.id !== auth.user.id && (
                                            <button
                                                onClick={() => toggleActive(user.id)}
                                                className={`p-1.5 rounded transition ${
                                                    user.email_verified_at
                                                        ? 'text-neutral-400 hover:text-red-400'
                                                        : 'text-neutral-400 hover:text-emerald-400'
                                                }`}
                                                title={user.email_verified_at ? 'Deactivate' : 'Activate'}
                                            >
                                                {user.email_verified_at ? <UserX size={14} /> : <UserCheck size={14} />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-4 text-xs text-neutral-500">
                        {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} shown
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
