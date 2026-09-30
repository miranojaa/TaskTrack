import React from 'react';
import { router } from '@inertiajs/react';
import { Task } from '@/types';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task | null;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    isOpen,
    onClose,
    task,
}) => {
    if (!isOpen || !task) return null;

    const handleDelete = () => {
        router.delete(`/tasks/${task.id}`, {
            onSuccess: () => {
                window.dispatchEvent(new Event('tasktrack:refresh-alarms'));
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10 dark:bg-slate-900 dark:ring-white/10">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            Delete Task
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            This action is permanent and cannot be undone.
                        </p>
                    </div>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {task.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {task.time_remaining_formatted}
                    </p>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-rose-700 transition"
                    >
                        Yes, Delete Task
                    </button>
                </div>
            </div>
        </div>
    );
};

