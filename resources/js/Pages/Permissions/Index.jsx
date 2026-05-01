import { router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Sidebar from '@/Components/Sidebar';
import { Shield, Users, Key, Check, ChevronDown, ChevronUp } from 'lucide-react';

export default function PermissionsIndex({ permissions, roles, users }) {
    const { flash } = usePage().props;
    const [expandedModules, setExpandedModules] = useState({});
    const [activeTab, setActiveTab] = useState('roles');

    const toggleModule = (module) => {
        setExpandedModules(prev => ({
            ...prev,
            [module]: !prev[module]
        }));
    };

    const roleForm = useForm({ role_id: '', permission_ids: [] });
    const userForm = useForm({ user_id: '', role_id: '' });

    const submitRolePermissions = (e) => {
        e.preventDefault();
        roleForm.post(route('permissions.update-role'), {
            preserveScroll: true,
        });
    };

    const submitUserRole = (e) => {
        e.preventDefault();
        userForm.post(route('permissions.update-user'), {
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

    const selectAllPermissions = (role) => {
        if (roleForm.data.permission_ids?.length === permissions.length) {
            roleForm.setData('permission_ids', []);
        } else {
            roleForm.setData('permission_ids', permissions.map(p => p.id));
        }
    };

    const groupedPermissions = permissions.reduce((acc, perm) => {
        if (!acc[perm.module]) {
            acc[perm.module] = [];
        }
        acc[perm.module].push(perm);
        return acc;
    }, {});

    return (
        <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-8 py-6 border-b border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Permissions</h1>
                            <p className="text-sm text-neutral-400">
                                Manage roles and permissions for your team.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-6xl mx-auto space-y-6">
                        {flash?.success && (
                            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-md text-sm">
                                {flash.success}
                            </div>
                        )}

                        {/* Tabs */}
                        <div className="flex gap-2 border-b border-neutral-800">
                            <button
                                onClick={() => setActiveTab('roles')}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'roles'
                                        ? 'border-purple-500 text-purple-300'
                                        : 'border-transparent text-neutral-400 hover:text-neutral-200'
                                }`}
                            >
                                Roles & Permissions
                            </button>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'users'
                                        ? 'border-purple-500 text-purple-300'
                                        : 'border-transparent text-neutral-400 hover:text-neutral-200'
                                }`}
                            >
                                User Roles
                            </button>
                        </div>

                        {activeTab === 'roles' && (
                            <div className="space-y-6">
                                {/* Role Selection */}
                                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
                                    <h2 className="text-sm font-semibold mb-4">Select Role</h2>
                                    <div className="flex gap-4 items-end">
                                        <div className="flex-1">
                                            <label className="block text-xs text-neutral-400 mb-1">Role</label>
                                            <select
                                                value={roleForm.data.role_id}
                                                onChange={(e) => {
                                                    roleForm.setData('role_id', e.target.value);
                                                    const role = roles.find(r => r.id == e.target.value);
                                                    if (role) {
                                                        roleForm.setData('permission_ids', role.permissions.map(p => p.id));
                                                    }
                                                }}
                                                className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-sm"
                                            >
                                                <option value="">Select a role</option>
                                                {roles.map((role) => (
                                                    <option key={role.id} value={role.id}>{role.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            onClick={selectAllPermissions}
                                            className="px-4 py-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm"
                                        >
                                            Toggle All
                                        </button>
                                    </div>
                                </div>

                                {/* Permissions by Module */}
                                {roleForm.data.role_id && (
                                    <form onSubmit={submitRolePermissions}>
                                        <div className="space-y-4">
                                            {Object.entries(groupedPermissions).map(([module, perms]) => (
                                                <div key={module} className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleModule(module)}
                                                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-800 transition-colors"
                                                    >
                                                        <span className="text-sm font-semibold capitalize">{module}</span>
                                                        {expandedModules[module] ? (
                                                            <ChevronUp size={16} />
                                                        ) : (
                                                            <ChevronDown size={16} />
                                                        )}
                                                    </button>
                                                    {expandedModules[module] && (
                                                        <div className="divide-y divide-neutral-800">
                                                            {perms.map((perm) => (
                                                                <div
                                                                    key={perm.id}
                                                                    onClick={() => togglePermission(perm.id)}
                                                                    className="px-4 py-3 flex items-center justify-between hover:bg-neutral-800 cursor-pointer"
                                                                >
                                                                    <div>
                                                                        <div className="text-sm font-medium">{perm.name}</div>
                                                                        <div className="text-xs text-neutral-500">{perm.description}</div>
                                                                    </div>
                                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                                                                        roleForm.data.permission_ids?.includes(perm.id)
                                                                            ? 'bg-purple-500 border-purple-500'
                                                                            : 'border-neutral-600'
                                                                    }`}>
                                                                        {roleForm.data.permission_ids?.includes(perm.id) && (
                                                                            <Check size={12} className="text-white" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-end mt-4">
                                            <button
                                                type="submit"
                                                disabled={roleForm.processing}
                                                className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-sm font-medium"
                                            >
                                                Save Permissions
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                                <div className="px-4 py-3 border-b border-neutral-800">
                                    <h2 className="text-sm font-semibold">User Roles</h2>
                                </div>
                                <div className="divide-y divide-neutral-800">
                                    {users.map((user) => (
                                        <div key={user.id} className="px-4 py-3 flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-medium">{user.name}</div>
                                                <div className="text-xs text-neutral-500">{user.email}</div>
                                            </div>
                                            <select
                                                value={user.role_id || ''}
                                                onChange={(e) => {
                                                    userForm.setData('user_id', user.id);
                                                    userForm.setData('role_id', e.target.value);
                                                    userForm.post(route('permissions.update-user'), {
                                                        preserveScroll: true,
                                                    });
                                                }}
                                                className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-1.5 text-sm min-w-[150px]"
                                            >
                                                <option value="">No Role</option>
                                                {roles.map((role) => (
                                                    <option key={role.id} value={role.id}>{role.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
