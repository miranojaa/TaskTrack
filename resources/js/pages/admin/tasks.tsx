import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { Task } from '@/types';

interface AdminTask extends Task {
    user: { id: number; name: string; email: string; } | null;
}

export default function AdminTasks({ tasks }: { tasks: AdminTask[] }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredTasks = tasks.filter((t) => {
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
            (t.user?.name.toLowerCase().includes(search.toLowerCase()) ?? false);
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const deleteTask = (task: AdminTask) => {
        if (confirm(`CRITICAL: Are you absolutely sure you want to permanently delete the task "${task.title}"?`)) {
            router.delete(`/admin/tasks/${task.id}`, { preserveScroll: true });
        }
    };

    return (
        <AppLayout>
            <Head title="Global Tasks - TaskTrack Admin" />
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-600">Administration</p>
                    <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Global Tasks</h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Monitor all tasks across the system.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-xl border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="overdue">Overdue</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Search tasks or users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="rounded-xl border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                </div>
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950/50">
                            <tr>
                                <th className="px-5 py-3">Task</th>
                                <th className="px-5 py-3">Owner</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3">Priority</th>
                                <th className="px-5 py-3">Due Date</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredTasks.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-slate-900 dark:text-white truncate max-w-[250px]">{t.title}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        {t.user ? (
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                    {t.user.name.charAt(0)}
                                                </div>
                                                <span className="font-medium text-slate-700 dark:text-slate-300">{t.user.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic">Deleted User</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wide ${
                                            t.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            t.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                            t.status === 'overdue' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                        }`}>
                                            {t.status.toUpperCase().replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                                            t.priority === 'urgent' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900/50' :
                                            t.priority === 'high' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/50' :
                                            t.priority === 'medium' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/50' :
                                            'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/50'
                                        }`}>
                                            {t.priority.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-slate-500 text-sm">
                                        {new Date(t.due_date).toLocaleString()}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <button onClick={() => deleteTask(t)} className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-600 transition">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredTasks.length === 0 && (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">No tasks found.</div>
                    )}
                </div>
            </section>
        </AppLayout>
    );
}
