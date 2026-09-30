import React from 'react';
import { Head } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { ActivityLog } from '@/types';

export default function AdminHistory({ history }: { history: ActivityLog[] }) {
    return (
        <AppLayout>
            <Head title="System History - TaskTrack Admin" />
            <div className="mb-8">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-600">Administration</p>
                <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Global History</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Monitor all system actions and alarm activity.</p>
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950/50">
                            <tr>
                                <th className="px-5 py-3">Date / Time</th>
                                <th className="px-5 py-3">User</th>
                                <th className="px-5 py-3">Activity</th>
                                <th className="px-5 py-3">Task</th>
                                <th className="px-5 py-3">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {history.map((entry) => (
                                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                    <td className="px-5 py-3 text-slate-500">
                                        {new Date(entry.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-5 py-3">
                                        {entry.user ? (
                                            <span className="font-semibold text-slate-900 dark:text-slate-200">{entry.user.name}</span>
                                        ) : (
                                            <span className="text-slate-400 italic">System / Deleted</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                            entry.activity.includes('Alarm') || entry.activity.includes('Alert')
                                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                : entry.activity.includes('Login')
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                        }`}>
                                            {entry.activity}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                                        {entry.task?.title || '-'}
                                    </td>
                                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400 truncate max-w-[300px]">
                                        {entry.details || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </AppLayout>
    );
}

