import React from 'react';
import { Head } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { ActivityLog } from '@/types';

export default function History({ history }: { history: ActivityLog[] }) {
    return (
        <AppLayout>
            <Head title="History - TaskTrack" />
            <div className="mb-8">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-600">Your record</p>
                <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Activity history</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">A persistent record of tasks, alarms, and account activity.</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                        <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50">
                            <tr><th className="px-5 py-4">Date / Time</th><th className="px-5 py-4">Activity</th><th className="px-5 py-4">Task</th><th className="px-5 py-4">Details</th><th className="px-5 py-4">Status</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {history.map((entry) => <tr key={entry.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"><td className="whitespace-nowrap px-5 py-4 text-slate-500">{new Date(entry.created_at).toLocaleString()}</td><td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-100">{entry.activity}</td><td className="px-5 py-4 text-slate-600 dark:text-slate-300">{entry.task?.title || '-'}</td><td className="px-5 py-4 text-slate-500">{entry.details || '-'}</td><td className="px-5 py-4 text-slate-500">{entry.status || 'recorded'}</td></tr>)}
                        </tbody>
                    </table>
                </div>
                {history.length === 0 && <p className="p-10 text-center text-sm text-slate-500">No activity recorded yet.</p>}
            </div>
        </AppLayout>
    );
}
