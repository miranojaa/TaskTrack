import React from 'react';
import { Head, router } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { Paginated, Task } from '@/types';
import { PaginationLinks } from '@/components/pagination-links';

interface FilesProps {
    tasks: Paginated<Task>;
}

const formatSize = (bytes?: number | null) => {
    if (bytes === null || bytes === undefined) return 'Unavailable';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function Files({ tasks }: FilesProps) {
    const deleteAttachment = (task: Task) => {
        if (window.confirm(`Remove ${task.file_name} from ${task.title}?`)) {
            router.delete(`/tasks/${task.id}/attachment`, { preserveScroll: true });
        }
    };

    return (
        <AppLayout>
            <Head title="Files" />
            <div className="space-y-5 pb-12">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">Files</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Attachments uploaded with your tasks.</p>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    {tasks.data.length ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {tasks.data.map((task) => (
                                <div key={task.id} className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" aria-hidden="true">FILE</div>
                                        <div className="min-w-0">
                                            <h2 className="truncate text-sm font-bold text-slate-900 dark:text-white">{task.file_name}</h2>
                                            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{task.file_type || 'Unknown type'} · {formatSize(task.file_size)}</p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Task: {task.title} · Uploaded {task.file_uploaded_at ? new Date(task.file_uploaded_at).toLocaleDateString() : 'date unavailable'}</p>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 gap-2 pl-13 sm:pl-0">
                                        {task.file_url && <>
                                            <a href={task.file_url} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">View</a>
                                            <a href={task.file_url} download={task.file_name || true} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700">Download</a>
                                        </>}
                                        <button type="button" onClick={() => deleteAttachment(task)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-6 py-14 text-center">
                            <h2 className="text-base font-bold text-slate-800 dark:text-white">No uploaded files</h2>
                            <p className="mt-1 text-sm text-slate-500">Files attached to your tasks will appear here.</p>
                        </div>
                    )}
                </div>
                <PaginationLinks links={tasks.links} />
            </div>
        </AppLayout>
    );
}