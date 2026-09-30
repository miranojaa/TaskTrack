import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Task, TaskPriority, TaskStatus } from '@/types';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
    isOpen,
    onClose,
    task,
}) => {
    // Format date string to YYYY-MM-DDTHH:mm for datetime-local input
    const formatForInput = (dateStr?: string | null) => {
        const manilaParts = (date: Date) => {
            const parts = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Manila',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hourCycle: 'h23',
            }).formatToParts(date);
            return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
        };

        if (!dateStr) {
            const now = manilaParts(new Date());
            const tomorrow = new Date(Date.UTC(Number(now.year), Number(now.month) - 1, Number(now.day) + 1, 17));
            const pad = (value: number) => String(value).padStart(2, '0');
            return `${tomorrow.getUTCFullYear()}-${pad(tomorrow.getUTCMonth() + 1)}-${pad(tomorrow.getUTCDate())}T${pad(tomorrow.getUTCHours())}:${pad(tomorrow.getUTCMinutes())}`;
        }
        const parts = manilaParts(new Date(dateStr));
        return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
    };

    const { data, setData, post, transform, processing, errors, reset, clearErrors } = useForm({
        title: '',
        description: '',
        priority: 'medium' as TaskPriority,
        status: 'pending' as TaskStatus,
        due_date: '',
        attachment: null as File | null,
        remove_attachment: false,
    });

    useEffect(() => {
        if (task) {
            setData({
                title: task.title,
                description: task.description || '',
                priority: task.priority,
                status: task.status,
                due_date: formatForInput(task.due_date),
                attachment: null,
                remove_attachment: false,
            });
        } else {
            setData({
                title: '',
                description: '',
                priority: 'medium',
                status: 'pending',
                due_date: formatForInput(null),
                attachment: null,
                remove_attachment: false,
            });
        }
        clearErrors();
    }, [task, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const options = {
            forceFormData: true,
            onSuccess: () => {
                window.dispatchEvent(new Event('tasktrack:refresh-alarms'));
                reset();
                onClose();
            },
        };

        transform((formData) => ({
            ...formData,
            due_date: formData.due_date,
            ...(task ? { _method: 'put' } : {}),
        }));
        post(task ? `/tasks/${task.id}` : '/tasks', options);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl ring-1 ring-slate-900/10 dark:bg-slate-900 dark:ring-white/10 my-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {task ? 'Edit Task' : 'Create New Task'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    {/* Title */}
                    <div>
                        <label htmlFor="task-title" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Task Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                            id="task-title"
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="e.g. Finish client proposal slides"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            required
                        />
                        {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="task-desc" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Description
                        </label>
                        <textarea
                            id="task-desc"
                            rows={3}
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Add details, checklists, or reference links..."
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-none"
                        />
                        {errors.description && <p className="mt-1 text-xs text-rose-500">{errors.description}</p>}
                    </div>

                    {/* Priority & Status in Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Priority Selector */}
                        <div>
                            <label htmlFor="task-priority" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Priority Level
                            </label>
                            <select
                                id="task-priority"
                                value={data.priority}
                                onChange={(e) => setData('priority', e.target.value as TaskPriority)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            >
                                <option value="low">🟢 Low</option>
                                <option value="medium">🔵 Medium</option>
                                <option value="high">🟠 High</option>
                                <option value="urgent">🔴 Urgent</option>
                            </select>
                            {errors.priority && <p className="mt-1 text-xs text-rose-500">{errors.priority}</p>}
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="task-status" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Status
                            </label>
                            <select
                                id="task-status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value as TaskStatus)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            >
                                <option value="pending">⏳ Pending</option>
                                <option value="in_progress">⚡ In Progress</option>
                                <option value="completed">✅ Completed</option>
                                {task && <option value="overdue">🚨 Overdue</option>}
                            </select>
                            {errors.status && <p className="mt-1 text-xs text-rose-500">{errors.status}</p>}
                        </div>
                    </div>

                    {/* Due Date & Time Picker */}
                    <div>
                        <label htmlFor="task-due-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Deadline (Due Date & Time) <span className="text-rose-500">*</span>
                        </label>
                        <input
                            id="task-due-date"
                            type="datetime-local"
                            value={data.due_date}
                            onChange={(e) => setData('due_date', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            required
                        />
                        <p className="mt-1 text-[11px] font-bold text-fuchsia-600 dark:text-fuchsia-400">
                            The TaskTrack deadline alarm will trigger at this exact scheduled time.
                        </p>
                        {errors.due_date && <p className="mt-1 text-xs text-rose-500">{errors.due_date}</p>}
                    </div>

                    <div>
                        <label htmlFor="task-attachment" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Attachment
                        </label>
                        {task?.file_name && !data.remove_attachment && (
                            <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
                                <a href={task.file_url || undefined} target="_blank" rel="noreferrer" className="truncate text-indigo-600 hover:underline dark:text-indigo-400">{task.file_name}</a>
                                <label className="flex shrink-0 items-center gap-1.5 normal-case">
                                    <input type="checkbox" checked={data.remove_attachment} onChange={(event) => setData('remove_attachment', event.target.checked)} />
                                    Remove
                                </label>
                            </div>
                        )}
                        <input
                            id="task-attachment"
                            type="file"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.txt,.zip"
                            onChange={(event) => {
                                setData('attachment', event.target.files?.[0] ?? null);
                                setData('remove_attachment', false);
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        />
                        {errors.attachment && <p className="mt-1 text-xs text-rose-500">{errors.attachment}</p>}
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50 transition"
                        >
                            {processing ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

