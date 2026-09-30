import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
    tasks_count: number;
}

export default function AdminUsers({ users }: { users: User[] }) {
    const [search, setSearch] = useState('');

    const filteredUsers = users.filter((u) => 
        u.name.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const toggleActive = (user: User) => {
        if (confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} ${user.name}?`)) {
            router.patch(`/admin/users/${user.id}/toggle-active`, {}, { preserveScroll: true });
        }
    };

    const resetPassword = (user: User) => {
        if (confirm(`Reset password for ${user.name} to "password"?`)) {
            router.post(`/admin/users/${user.id}/reset-password`, {}, { preserveScroll: true });
        }
    };

    const deleteUser = (user: User) => {
        if (confirm(`CRITICAL: Are you absolutely sure you want to permanently delete ${user.name}? This will delete all their tasks and history.`)) {
            router.delete(`/admin/users/${user.id}`, { preserveScroll: true });
        }
    };

    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editData, setEditData] = useState({ name: '', email: '', role: 'user' });

    const openEdit = (user: User) => {
        setEditingUser(user);
        setEditData({ name: user.name, email: user.email, role: user.role });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            router.put(`/admin/users/${editingUser.id}`, editData, {
                preserveScroll: true,
                onSuccess: () => setEditingUser(null)
            });
        }
    };

    return (
        <AppLayout>
            <Head title="Manage Users - TaskTrack Admin" />
            
            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl dark:bg-slate-900">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Edit User</h2>
                        <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Name</label>
                                <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="mt-1 block w-full rounded-xl border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Email</label>
                                <input type="email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} className="mt-1 block w-full rounded-xl border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Role</label>
                                <select value={editData.role} onChange={e => setEditData({...editData, role: e.target.value})} className="mt-1 block w-full rounded-xl border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                                    <option value="user">User</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setEditingUser(null)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition">Cancel</button>
                                <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-600">Administration</p>
                    <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">User Management</h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">View, edit, and manage all registered accounts.</p>
                </div>
                <div className="flex items-center">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="rounded-xl border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                </div>
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950/50">
                            <tr>
                                <th className="px-5 py-3">User</th>
                                <th className="px-5 py-3">Role</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3">Tasks</th>
                                <th className="px-5 py-3">Joined</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-slate-900 dark:text-white">{u.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wide ${
                                            u.role === 'admin' 
                                                ? 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400' 
                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                        }`}>
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wide ${
                                            u.is_active !== false
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                        }`}>
                                            {u.is_active !== false ? 'ACTIVE' : 'DEACTIVATED'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 font-medium text-slate-700 dark:text-slate-300">{u.tasks_count}</td>
                                    <td className="px-5 py-4 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(u)} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition">
                                                Edit
                                            </button>
                                            <button onClick={() => resetPassword(u)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition" title="Reset Password to 'password'">
                                                Reset Pwd
                                            </button>
                                            <button onClick={() => toggleActive(u)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition shadow-sm text-white ${
                                                u.is_active !== false ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'
                                            }`}>
                                                {u.is_active !== false ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button onClick={() => deleteUser(u)} className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-600 transition">
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">No users found.</div>
                    )}
                </div>
            </section>
        </AppLayout>
    );
}
