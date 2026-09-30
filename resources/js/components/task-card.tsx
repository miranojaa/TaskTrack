import React from 'react';
import { router } from '@inertiajs/react';
import { Task, TaskPriority, TaskStatus } from '@/types';

interface TaskCardProps {
    task: Task;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
    task,
    onEdit,
    onDelete,
}) => {
    // Priority Badge colors
    const priorityStyles: Record<TaskPriority, { bg: string; text: string; border: string; label: string }> = {
        urgent: {
            bg: 'bg-rose-50 dark:bg-rose-950/60',
            text: 'text-rose-700 dark:text-rose-400',
            border: 'border-rose-200 dark:border-rose-800',
            label: 'Urgent',
        },
        high: {
            bg: 'bg-amber-50 dark:bg-amber-950/60',
            text: 'text-amber-700 dark:text-amber-400',
            border: 'border-amber-200 dark:border-amber-800',
            label: 'High',
        },
        medium: {
            bg: 'bg-blue-50 dark:bg-blue-950/60',
            text: 'text-blue-700 dark:text-blue-400',
            border: 'border-blue-200 dark:border-blue-800',
            label: 'Medium',
        },
        low: {
            bg: 'bg-emerald-50 dark:bg-emerald-950/60',
            text: 'text-emerald-700 dark:text-emerald-400',
            border: 'border-emerald-200 dark:border-emerald-800',
            label: 'Low',
        },
    };

    // Status Badge colors
    const statusStyles: Record<TaskStatus, { bg: string; text: string; label: string; icon: string }> = {
        pending: {
            bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            text: 'text-slate-700 dark:text-slate-300',
            label: 'Pending',
            icon: '⏳',
        },
        in_progress: {
            bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
            text: 'text-indigo-700 dark:text-indigo-300',
            label: 'In Progress',
            icon: '⚡',
        },
        completed: {
            bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
            text: 'text-emerald-800 dark:text-emerald-300',
            label: 'Completed',
            icon: '✅',
        },
        overdue: {
            bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
            text: 'text-rose-800 dark:text-rose-300',
            label: 'Overdue',
            icon: '🚨',
        },
    };

    const handleQuickStatusChange = (newStatus: TaskStatus) => {
        router.patch(`/tasks/${task.id}/status`, { status: newStatus }, {
            preserveScroll: true,
            onSuccess: () => window.dispatchEvent(new Event('tasktrack:refresh-alarms')),
        });
    };

    const toggleCompleted = () => {
        const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
        handleQuickStatusChange(nextStatus);
    };

    return (
        <div className={`group relative flex flex-col min-w-0 rounded-3xl p-5 sm:p-6 transition-all duration-200 border bg-white shadow-sm hover:shadow-md dark:bg-slate-900 ${
            task.status === 'completed'
                ? 'border-slate-200/70 opacity-75 dark:border-slate-800'
                : task.is_overdue
                    ? 'border-rose-300 dark:border-rose-900/80 ring-1 ring-rose-200 dark:ring-rose-900/40 bg-rose-50/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900'
        }`}>
            {/* Top Bar: Checkbox, Badges & Quick Status */}
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    {/* Completion Checkbox */}
                    <button
                        type="button"
                        onClick={toggleCompleted}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                            task.status === 'completed'
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 hover:border-indigo-500 dark:border-slate-700'
                        }`}
                        title={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                        {task.status === 'completed' && (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </button>

                    {/* Priority Badge */}
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${priorityStyles[task.priority].bg} ${priorityStyles[task.priority].text} ${priorityStyles[task.priority].border}`}>
                        {priorityStyles[task.priority].label}
                    </span>
                </div>

                {/* Status Selector Dropdown */}
                <select
                    value={task.status}
                    onChange={(e) => handleQuickStatusChange(e.target.value as TaskStatus)}
                    className={`max-w-full shrink-0 rounded-xl px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 border-0 cursor-pointer ${statusStyles[task.status].bg}`}
                >
                    <option value="pending">⏳ Pending</option>
                    <option value="in_progress">⚡ In Progress</option>
                    <option value="completed">✅ Completed</option>
                    {(task.is_overdue || task.status === 'overdue') && <option value="overdue">🚨 Overdue</option>}
                </select>
            </div>

            {/* Task Title & Description */}
            <div className="mt-3.5 flex-1">
                <h3 className={`break-words [overflow-wrap:anywhere] text-base font-bold transition-colors ${
                    task.status === 'completed'
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-900 dark:text-white'
                }`}>
                    {task.title}
                </h3>

                {task.description && (
                    <p className="mt-1.5 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">
                        {task.description}
                    </p>
                )}
                {task.file_name && task.file_url && (
                    <a href={task.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-w-0 max-w-full break-all text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                        Attachment: {task.file_name}
                    </a>
                )}
            </div>

            {/* Deadline & Time Remaining */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                {/* Due Date & Countdown */}
                <div className="flex items-center gap-1.5 text-xs">
                    <svg className={`w-4 h-4 shrink-0 ${
                        task.status === 'completed'
                            ? 'text-slate-400'
                            : task.is_overdue
                                ? 'text-rose-500 animate-pulse'
                                : 'text-slate-400 dark:text-slate-500'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>

                    <span className={`font-semibold ${
                        task.status === 'completed'
                            ? 'text-slate-400 dark:text-slate-500'
                            : task.is_overdue
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-600 dark:text-slate-400'
                    }`}>
                        {task.time_remaining_formatted}
                    </span>
                </div>

                {/* Card Action Buttons: Edit, Delete */}
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onEdit(task)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:text-indigo-400 dark:hover:bg-slate-800 transition"
                        title="Edit Task"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>

                    <button
                        type="button"
                        onClick={() => onDelete(task)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:text-rose-400 dark:hover:bg-slate-800 transition"
                        title="Delete Task"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

