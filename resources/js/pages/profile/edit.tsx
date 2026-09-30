import React, { useEffect, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { User } from '@/types';

interface ProfileEditProps {
    user: User;
}

export default function ProfileEdit({ user }: ProfileEditProps) {
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const profileForm = useForm({
        name: user.name,
        email: user.email,
        avatar: null as File | null,
    });
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        return () => {
            if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        };
    }, [avatarPreview]);

    const handleProfileSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        profileForm.transform((formData) => ({ ...formData, _method: 'patch' }));
        profileForm.post('/profile', {
            forceFormData: true,
            onSuccess: () => {
                profileForm.setData('avatar', null);
                setAvatarPreview(null);
            },
        });
    };

    const handlePasswordSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        passwordForm.put('/profile/password', {
            onSuccess: () => passwordForm.reset(),
        });
    };

    return (
        <AppLayout>
            <Head title="Profile" />
            <div className="mx-auto max-w-4xl space-y-8 pb-12">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">Profile</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your personal and account information.</p>
                </div>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                    <h2 className="border-b border-slate-100 pb-4 text-lg font-bold text-slate-900 dark:border-slate-800 dark:text-white">Profile Information</h2>
                    <form onSubmit={handleProfileSubmit} className="mt-6 max-w-xl space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                {(avatarPreview || user.avatar_url) ? (
                                    <img src={avatarPreview || user.avatar_url || ''} alt="Profile" className="h-full w-full object-cover" />
                                ) : user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <label htmlFor="profile-avatar" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Profile Picture</label>
                                <input
                                    id="profile-avatar"
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0] ?? null;
                                        profileForm.setData('avatar', file);
                                        setAvatarPreview(file ? URL.createObjectURL(file) : null);
                                    }}
                                    className="mt-2 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 dark:text-slate-300"
                                />
                                {profileForm.errors.avatar && <p className="mt-1 text-xs text-rose-500">{profileForm.errors.avatar}</p>}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="profile-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Full Name</label>
                            <input id="profile-name" type="text" value={profileForm.data.name} onChange={(event) => profileForm.setData('name', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white" required />
                            {profileForm.errors.name && <p className="mt-1 text-xs text-rose-500">{profileForm.errors.name}</p>}
                        </div>

                        <div>
                            <label htmlFor="profile-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Email Address</label>
                            <input id="profile-email" type="email" value={profileForm.data.email} onChange={(event) => profileForm.setData('email', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white" required />
                            {profileForm.errors.email && <p className="mt-1 text-xs text-rose-500">{profileForm.errors.email}</p>}
                        </div>

                        <button type="submit" disabled={profileForm.processing} className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                            {profileForm.processing ? 'Saving...' : 'Update Profile'}
                        </button>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Account created {new Date(user.created_at).toLocaleDateString()}.</p>
                    </form>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                    <h2 className="border-b border-slate-100 pb-4 text-lg font-bold text-slate-900 dark:border-slate-800 dark:text-white">Change Password</h2>
                    <form onSubmit={handlePasswordSubmit} className="mt-6 max-w-xl space-y-4">
                        {([
                            ['current_password', 'Current Password'],
                            ['password', 'New Password'],
                            ['password_confirmation', 'Confirm New Password'],
                        ] as const).map(([field, label]) => (
                            <div key={field}>
                                <label htmlFor={field} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">{label}</label>
                                <input id={field} type="password" value={passwordForm.data[field]} onChange={(event) => passwordForm.setData(field, event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white" required />
                                {passwordForm.errors[field] && <p className="mt-1 text-xs text-rose-500">{passwordForm.errors[field]}</p>}
                            </div>
                        ))}
                        <button type="submit" disabled={passwordForm.processing} className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                            {passwordForm.processing ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
