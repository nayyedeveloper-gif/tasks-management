import { router, useForm, usePage, Head } from '@inertiajs/react';
import { useState } from 'react';
import Sidebar from '@/Components/Sidebar';
import { Search, Shield, UserCheck, UserX, ChevronDown, Check, ChevronUp, Users, Key, Settings, Trash2 } from 'lucide-react';

export default function UsersIndex({ users, roles, permissions, auth }) {
    const { flash } = usePage().props;
    const [activeTab, setActiveTab] = useState('users');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [showRoleMenu, setShowRoleMenu] = useState(null);
    const [expandedModules, setExpandedModules] = useState({});

    // Role Permission Form
    const roleForm = useForm({
        role_id: '',
        permission_ids: []
    });

    const toggleModule = (module) => {
        setExpandedModules(prev => ({ ...prev, [module]: !prev[module] }));
    };

    const filteredUsers = users.filter((user) => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'all' || 
            (filterRole === 'admin' && user.role_id === 1) ||
            (filterRole === 'member' && user.role_id === 2);
        return matchesSearch && matchesRole;
    });

    const updateRole = (userId, roleId) => {
        router.put(
            route('users.update-role', userId),
            { role_id: roleId },
            { preserveScroll: true }
        );
        setShowRoleMenu(null);
    };

    const toggleActive = (userId) => {
        router.post(route('users.toggle-active', userId), {}, { preserveScroll: true });
    };

    const deleteUser = (user) => {
        if (!confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) return;
        router.delete(route('users.destroy', user.id), {
            preserveScroll: true,
        });
    };

    const submitRolePermissions = (e) => {
        e.preventDefault();
        roleForm.post(route('permissions.update-role'), {
            preserveScroll: true,
        });
    };

    const togglePermission = (permissionId) => {
        const current = roleForm.data.permission_ids || [];
        if (current.includes(permissionId)) {
            roleForm.setData('permission_ids', current.filter(id => id !== permissionId));
        } else {
            roleForm.setData('permission_ids', [...current, permissionId]);
        }
    };

    const groupedPermissions = permissions.reduce((acc, perm) => {
        if (!acc[perm.module]) acc[perm.module] = [];
        acc[perm.module].push(perm);
        return acc;
    }, {});

    return (
        <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
            <Sidebar />
            <Head title="Users & Permissions" />
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-8 py-6 border-b border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300">
                            <Settings size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">User Management</h1>
                            <p className="text-sm text-neutral-400">
                                Manage users, roles, and system-wide permissions.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {flash?.success && (
                            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-md text-sm">
                                {flash.success}
                            </div>
                        )}

                        {/* Tabs */}
                        <div className="flex gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800 w-fit">
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-2 ${
                                    activeTab === 'users'
                                        ? 'bg-neutral-800 text-white'
                                        : 'text-neutral-400 hover:text-neutral-200'
                                }`}
                            >
                                <Users size={14} />
                                Users
                            </button>
                            <button
                                onClick={() => setActiveTab('permissions')}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-2 ${
                                    activeTab === 'permissions'
                                        ? 'bg-neutral-800 text-white'
                                        : 'text-neutral-400 hover:text-neutral-200'
                                }`}
                            >
                                <Shield size={14} />
                                Roles & Permissions
                            </button>
                        </div>

                        {activeTab === 'users' && (
                            <div className="space-y-6">
                                {/* Search & Filters */}
                                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                            <input
                                                type="text"
                                                placeholder="Search by name or email..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full bg-neutral-950 border border-neutral-800 rounded-md pl-9 pr-4 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-purple-500 focus:outline-none"
                                            />
                                        </div>
                                        <select
                                            value={filterRole}
                                            onChange={(e) => setFilterRole(e.target.value)}
                                            className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none min-w-[140px]"
                                        >
                                            <option value="all">All Roles</option>
                                            <option value="admin">Admin</option>
                                            <option value="member">Member</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Users List */}
                                <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                                    <div className="px-4 py-3 border-b border-neutral-800">
                                        <h2 className="text-sm font-semibold">Active Members ({filteredUsers.length})</h2>
                                    </div>
                                    <div className="divide-y divide-neutral-800/60">
                                        {filteredUsers.length === 0 ? (
                                            <div className="px-4 py-12 text-center text-sm text-neutral-500">No users found matching your search.</div>
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <div key={user.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-neutral-800/30 transition-colors">
                                                    <div className="col-span-5 flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-purple-500/10">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-medium text-white truncate">{user.name}</div>
                                                            <div className="text-xs text-neutral-500 truncate">{user.email}</div>
                                                        </div>
                                                    </div>

                                                    <div className="col-span-3">
                                                        <div className="relative">
                                                            <button
                                                                onClick={() => setShowRoleMenu(showRoleMenu === user.id ? null : user.id)}
                                                                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-neutral-950 border border-neutral-800 text-neutral-300 hover:border-neutral-600 transition w-fit"
                                                            >
                                                                {user.role_id === 1 ? 'Admin' : 'Member'}
                                                                <ChevronDown size={12} className="text-neutral-500" />
                                                            </button>
                                                            {showRoleMenu === user.id && (
                                                                <div className="absolute z-10 mt-1 w-32 bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl overflow-hidden">
                                                                    {roles.map((r) => (
                                                                        <button
                                                                            key={r.id}
                                                                            onClick={() => updateRole(user.id, r.id)}
                                                                            className={`w-full px-3 py-2 text-xs text-left hover:bg-neutral-800 transition ${
                                                                                user.role_id === r.id ? 'text-purple-400 font-medium' : 'text-neutral-300'
                                                                            }`}
                                                                        >
                                                                            {r.name}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="col-span-2 text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${user.email_verified_at ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-yellow-500 shadow-sm shadow-yellow-500/50'}`} />
                                                            <span className={user.email_verified_at ? 'text-emerald-400' : 'text-yellow-400'}>
                                                                {user.email_verified_at ? 'Active' : 'Pending'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="col-span-2 flex items-center justify-end gap-1">
                                                        {user.id !== auth.user.id && (
                                                            <>
                                                                <button
                                                                    onClick={() => toggleActive(user.id)}
                                                                    className={`p-2 rounded-md transition ${
                                                                        user.email_verified_at
                                                                            ? 'text-neutral-400 hover:text-red-400 hover:bg-red-400/10'
                                                                            : 'text-neutral-400 hover:text-emerald-400 hover:bg-emerald-400/10'
                                                                    }`}
                                                                    title={user.email_verified_at ? 'Deactivate' : 'Activate'}
                                                                >
                                                                    {user.email_verified_at ? <UserX size={16} /> : <UserCheck size={16} />}
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteUser(user)}
                                                                    className="p-2 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition"
                                                                    title="Delete User"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'permissions' && (
                            <div className="space-y-6">
                                {/* Role Selection */}
                                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
                                    <h2 className="text-sm font-semibold mb-4 text-neutral-200">Select Role to Configure</h2>
                                    <div className="max-w-xs">
                                        <select
                                            value={roleForm.data.role_id}
                                            onChange={(e) => {
                                                const rid = e.target.value;
                                                roleForm.setData('role_id', rid);
                                                const role = roles.find(r => r.id == rid);
                                                if (role) {
                                                    roleForm.setData('permission_ids', role.permissions.map(p => p.id));
                                                }
                                            }}
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                                        >
                                            <option value="">Choose a role...</option>
                                            {roles.map((role) => (
                                                <option key={role.id} value={role.id}>{role.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Permissions List */}
                                {roleForm.data.role_id && (
                                    <form onSubmit={submitRolePermissions} className="space-y-4">
                                        <div className="grid gap-4">
                                            {Object.entries(groupedPermissions).map(([module, perms]) => (
                                                <div key={module} className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleModule(module)}
                                                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-800 transition-colors border-b border-transparent data-[expanded=true]:border-neutral-800"
                                                        data-expanded={expandedModules[module]}
                                                    >
                                                        <span className="text-sm font-semibold capitalize flex items-center gap-2">
                                                            <Key size={14} className="text-purple-400" />
                                                            {module}
                                                        </span>
                                                        {expandedModules[module] ? <ChevronUp size={16} className="text-neutral-500" /> : <ChevronDown size={16} className="text-neutral-500" />}
                                                    </button>
                                                    {expandedModules[module] && (
                                                        <div className="divide-y divide-neutral-800 bg-neutral-950/50">
                                                            {perms.map((perm) => (
                                                                <div
                                                                    key={perm.id}
                                                                    onClick={() => togglePermission(perm.id)}
                                                                    className="px-4 py-3 flex items-center justify-between hover:bg-neutral-800/40 cursor-pointer transition-colors"
                                                                >
                                                                    <div>
                                                                        <div className="text-sm font-medium text-neutral-200">{perm.name}</div>
                                                                        <div className="text-[11px] text-neutral-500">{perm.description}</div>
                                                                    </div>
                                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                                                        roleForm.data.permission_ids?.includes(perm.id)
                                                                            ? 'bg-purple-600 border-purple-600 shadow-sm shadow-purple-600/30'
                                                                            : 'border-neutral-700 bg-neutral-950'
                                                                    }`}>
                                                                        {roleForm.data.permission_ids?.includes(perm.id) && (
                                                                            <Check size={12} className="text-white" strokeWidth={3} />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            <button
                                                type="submit"
                                                disabled={roleForm.processing}
                                                className="px-6 py-2 rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-sm font-medium text-white shadow-lg shadow-purple-600/20 transition-all transform active:scale-95"
                                            >
                                                {roleForm.processing ? 'Saving Changes...' : 'Save Permissions'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
