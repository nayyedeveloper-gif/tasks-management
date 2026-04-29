import { Head, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import { User as UserIcon, Lock, Trash2, ChevronRight } from 'lucide-react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const initial = user?.name?.charAt(0).toUpperCase() || '?';

    return (
        <div className="flex h-screen bg-neutral-950 text-neutral-100">
            <Sidebar />
            <Head title="Profile Settings" />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-8 py-5 border-b border-neutral-800 pr-20">
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                        <span>Workspace</span>
                        <ChevronRight size={12} />
                        <span className="text-neutral-300">Profile Settings</span>
                    </div>
                    <h1 className="text-2xl font-semibold">Profile Settings</h1>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto px-8 py-8 space-y-6">
                        {/* Profile Card Header */}
                        <div className="bg-gradient-to-br from-purple-600/20 via-pink-600/10 to-transparent border border-neutral-800 rounded-xl p-6 flex items-center gap-5">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-2 ring-neutral-800">
                                {initial}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-lg font-semibold text-white truncate">{user?.name}</div>
                                <div className="text-sm text-neutral-400 truncate">{user?.email}</div>
                            </div>
                        </div>

                        {/* Profile Information */}
                        <Section icon={UserIcon} title="Profile Information" description="Update your account's profile information and email address.">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="max-w-xl"
                            />
                        </Section>

                        {/* Update Password */}
                        <Section icon={Lock} title="Update Password" description="Ensure your account is using a long, random password to stay secure.">
                            <UpdatePasswordForm className="max-w-xl" />
                        </Section>

                        {/* Delete Account */}
                        <Section icon={Trash2} title="Delete Account" description="Permanently delete your account. This action cannot be undone." danger>
                            <DeleteUserForm className="max-w-xl" />
                        </Section>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Section({ icon: Icon, title, description, children, danger = false }) {
    return (
        <div className={`bg-neutral-900 border rounded-xl overflow-hidden ${danger ? 'border-red-900/40' : 'border-neutral-800'}`}>
            <div className={`px-6 py-4 border-b ${danger ? 'border-red-900/40 bg-red-950/10' : 'border-neutral-800'}`}>
                <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${danger ? 'bg-red-500/15 text-red-400' : 'bg-purple-500/15 text-purple-300'}`}>
                        <Icon size={15} />
                    </div>
                    <div>
                        <h2 className={`text-sm font-semibold ${danger ? 'text-red-300' : 'text-white'}`}>{title}</h2>
                        <p className="text-xs text-neutral-400 mt-0.5">{description}</p>
                    </div>
                </div>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}
