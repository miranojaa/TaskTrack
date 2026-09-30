import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { ActivityLog, Task, User } from '@/types';

type AdminStats = {
    users: number;
    active_users: number;
    tasks: number;
    pending: number;
    in_progress: number;
    completed: number;
    overdue: number;
};

interface AdminDashboardProps {
    stats: AdminStats;
    history: ActivityLog[];
    recentUsers: User[];
    recentTasks: (Task & { user?: User })[];
}

export default function AdminDashboard({ stats, history, recentUsers, recentTasks }: AdminDashboardProps) {
    const kpiCards = [
        { label: 'Total Users', value: stats.users, color: 'text-indigo-600 dark:text-indigo-400' },
        { label: 'Active Users', value: stats.active_users, color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Total Tasks', value: stats.tasks, color: 'text-blue-600 dark:text-blue-400' },
        { label: 'Overdue Tasks', value: stats.overdue, color: 'text-rose-600 dark:text-rose-400' },
        { label: 'Pending Tasks', value: stats.pending, color: 'text-amber-600 dark:text-amber-400' },
        { label: 'In Progress', value: stats.in_progress, color: 'text-fuchsia-600 dark:text-fuchsia-400' },
        { label: 'Completed', value: stats.completed, color: 'text-emerald-600 dark:text-emerald-400' },
    ];

    return (
        <AppLayout>
            <Head title="Admin Dashboard - TaskTrack" />
            
            <div className="mb-8">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-600">Administration</p>
                <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">System overview</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Monitor TaskTrack activity and account health.</p>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                {kpiCards.map((card) => (
                    <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 line-clamp-1">{card.label}</p>
                        <p className={`mt-3 text-3xl font-black ${card.color}`}>{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Recently Registered Users */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                        <h2 className="font-black text-slate-900 dark:text-white">Recently Registered Users</h2>
                        <Link href="/admin/users" className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400">View All</Link>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recentUsers.map((user) => (
                            <div key={user.id} className="flex items-center justify-between px-5 py-3">
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                                    <p className="text-xs text-slate-500">{user.email}</p>
                                </div>
                                <span className="text-xs text-slate-400">{new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Recently Created Tasks */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                        <h2 className="font-black text-slate-900 dark:text-white">Recently Created Tasks</h2>
                        <Link href="/admin/tasks" className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400">View All</Link>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recentTasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between px-5 py-3">
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-900 dark:text-white truncate">{task.title}</p>
                                    <p className="text-xs text-slate-500">by {task.user?.name || 'Unknown'}</p>
                                </div>
                                <span className={`shrink-0 ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                    task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                                }`}>{task.status.replace('_', ' ')}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                    <h2 className="font-black text-slate-900 dark:text-white">Recent Activity Log</h2>
                    <Link href="/admin/history" className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400">View All</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950/50">
                            <tr>
                                <th className="px-5 py-3">Date / Time</th>
                                <th className="px-5 py-3">User</th>
                                <th className="px-5 py-3">Activity</th>
                                <th className="px-5 py-3">Task</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {history.map((entry) => (
                                <tr key={entry.id}>
                                    <td className="px-5 py-3 text-slate-500">{new Date(entry.created_at).toLocaleString()}</td>
                                    <td className="px-5 py-3 font-semibold dark:text-slate-200">{entry.user?.name || 'Deleted user'}</td>
                                    <td className="px-5 py-3 dark:text-slate-200">{entry.activity}</td>
                                    <td className="px-5 py-3 text-slate-500 truncate max-w-[200px]">{entry.task?.title || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </AppLayout>
    );
}
