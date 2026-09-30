import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { Filters, Paginated, Task } from '@/types';
import { TaskCard } from '@/components/task-card';
import { TaskModal } from '@/components/task-modal';
import { DeleteConfirmModal } from '@/components/delete-confirm-modal';
import { PaginationLinks } from '@/components/pagination-links';

interface MyTasksProps {
    tasks: Paginated<Task>;
    filters: Filters;
}

export default function MyTasks({ tasks, filters }: MyTasksProps) {
    const [search, setSearch] = useState(filters.search);
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

    const submitSearch = (event: React.FormEvent) => {
        event.preventDefault();
        router.get('/tasks', { ...filters, search, page: 1 }, { preserveState: true, preserveScroll: true });
    };

    const updateFilter = (field: keyof Filters, value: string) => {
        router.get('/tasks', { ...filters, search, [field]: value, page: 1 }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AppLayout>
            <Head title="My Tasks" />
            <div className="space-y-6 pb-12">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">My Tasks</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{tasks.total} task{tasks.total === 1 ? '' : 's'} in your workspace.</p>
                    </div>
                    <button type="button" onClick={() => { setEditingTask(null); setTaskModalOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700">
                        <span aria-hidden="true">+</span> Create New Task
                    </button>
                </div>

                <form onSubmit={submitSearch} className="flex gap-2">
                    <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your tasks" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
                    <button type="submit" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">Search</button>
                </form>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap gap-1.5">
                        {[
                            ['all', 'All Tasks'], ['pending', 'Pending'], ['in_progress', 'In Progress'],
                            ['completed', 'Completed'], ['overdue', 'Overdue'],
                        ].map(([value, label]) => (
                            <button key={value} type="button" onClick={() => updateFilter('status', value)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${filters.status === value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <select aria-label="Filter by priority" value={filters.priority} onChange={(event) => updateFilter('priority', event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <option value="all">All Priorities</option><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                        </select>
                        <select aria-label="Filter by deadline" value={filters.due} onChange={(event) => updateFilter('due', event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <option value="all">All Deadlines</option><option value="today">Due Today</option><option value="this_week">This Week</option><option value="upcoming">Upcoming</option><option value="overdue">Overdue</option>
                        </select>
                        <select aria-label="Sort tasks" value={filters.sort_by} onChange={(event) => updateFilter('sort_by', event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <option value="due_date_asc">Deadline: Soonest</option><option value="due_date_desc">Deadline: Latest</option><option value="priority_desc">Priority: Highest</option><option value="title_asc">Title: A-Z</option><option value="created_at_desc">Newest</option>
                        </select>
                    </div>
                </div>

                {tasks.data.length ? (
                    <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
                        {tasks.data.map((task) => (
                            <TaskCard key={task.id} task={task}
                                onEdit={(selected) => { setEditingTask(selected); setTaskModalOpen(true); }}
                                onDelete={setTaskToDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
                        <h2 className="text-base font-bold text-slate-800 dark:text-white">No tasks found</h2>
                        <p className="mt-1 text-sm text-slate-500">Create a task or adjust your search.</p>
                    </div>
                )}
                <PaginationLinks links={tasks.links} />
            </div>
            <TaskModal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} task={editingTask} />
            <DeleteConfirmModal isOpen={!!taskToDelete} onClose={() => setTaskToDelete(null)} task={taskToDelete} />
        </AppLayout>
    );
}