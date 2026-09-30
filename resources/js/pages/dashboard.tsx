import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { Task, DashboardStats, Filters, TaskAlert, TaskPriority, TaskStatus } from '@/types';
import { TaskCard } from '@/components/task-card';
import { TaskModal } from '@/components/task-modal';
import { DeleteConfirmModal } from '@/components/delete-confirm-modal';

interface DashboardProps {
    tasks: Task[];
    filters: Filters;
    stats: DashboardStats;
    alerts: TaskAlert[];
    unreadAlertsCount: number;
}

export default function Dashboard({
    tasks,
    filters,
    stats,
    alerts,
    unreadAlertsCount,
}: DashboardProps) {
    // Modal states
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

    // View toggle: 'grid' vs 'list'
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Local filter state for immediate UI feedback
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [priorityFilter, setPriorityFilter] = useState(filters.priority || 'all');
    const [dueFilter, setDueFilter] = useState(filters.due || 'all');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'due_date_asc');

    // Execute filter search
    const applyFilters = (overrides: Partial<Filters> = {}) => {
        const queryParams = {
            search: overrides.search !== undefined ? overrides.search : searchQuery,
            status: overrides.status !== undefined ? overrides.status : statusFilter,
            priority: overrides.priority !== undefined ? overrides.priority : priorityFilter,
            due: overrides.due !== undefined ? overrides.due : dueFilter,
            sort_by: overrides.sort_by !== undefined ? overrides.sort_by : sortBy,
        };

        router.get('/dashboard', queryParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search: searchQuery });
    };

    const handleStatusTab = (status: string) => {
        setStatusFilter(status);
        applyFilters({ status });
    };

    const handlePriorityChange = (priority: string) => {
        setPriorityFilter(priority);
        applyFilters({ priority });
    };

    const handleDueChange = (due: string) => {
        setDueFilter(due);
        applyFilters({ due });
    };

    const handleSortChange = (sort: string) => {
        setSortBy(sort);
        applyFilters({ sort_by: sort });
    };

    const resetFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setPriorityFilter('all');
        setDueFilter('all');
        setSortBy('due_date_asc');
        router.get('/dashboard', {}, { preserveState: true });
    };

    const openCreateModal = () => {
        setEditingTask(null);
        setTaskModalOpen(true);
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        setTaskModalOpen(true);
    };

    const openDeleteModal = (task: Task) => {
        setTaskToDelete(task);
        setDeleteModalOpen(true);
    };

    // Quick status toggle directly in list view
    const handleListStatusChange = (task: Task, newStatus: TaskStatus) => {
        router.patch(`/tasks/${task.id}/status`, { status: newStatus }, {
            preserveScroll: true,
            onSuccess: () => window.dispatchEvent(new Event('tasktrack:refresh-alarms')),
        });
    };

    return (
        <AppLayout alerts={alerts} unreadAlertsCount={unreadAlertsCount}>
            <Head title="Dashboard - TaskTrack" />

            <div className="space-y-6 pb-12">
                {/* Header Title & "+ Add Task" Action */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                            Task Dashboard
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            Monitor deadlines, prioritize tasks, and keep projects on schedule.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            Create New Task
                        </button>
                    </div>
                </div>

                {/* KPI Metrics Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    {/* Total Tasks */}
                    <div className="relative rounded-3xl bg-white p-4 sm:p-5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Tasks</span>
                        <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stats.total}</p>
                        <span className="mt-1 block text-[11px] text-slate-400">All registered tasks</span>
                        <button type="button" onClick={() => handleStatusTab('all')} aria-label="Show all tasks" className="absolute inset-0 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
                    </div>

                    {/* Pending */}
                    <div className="relative rounded-3xl bg-white p-4 sm:p-5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending</span>
                        <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-700 dark:text-slate-300">{stats.pending}</p>
                        <span className="mt-1 block text-[11px] text-slate-400">Awaiting start</span>
                        <button type="button" onClick={() => handleStatusTab('pending')} aria-label="Show pending tasks" className="absolute inset-0 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
                    </div>

                    {/* In Progress */}
                    <div className="relative rounded-3xl bg-white p-4 sm:p-5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm">
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">In Progress</span>
                        <p className="mt-2 text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">{stats.in_progress}</p>
                        <span className="mt-1 block text-[11px] text-indigo-400/80">Active now</span>
                        <button type="button" onClick={() => handleStatusTab('in_progress')} aria-label="Show in-progress tasks" className="absolute inset-0 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
                    </div>

                    {/* Completed */}
                    <div className="relative rounded-3xl bg-white p-4 sm:p-5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm">
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Completed</span>
                        <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
                        <span className="mt-1 block text-[11px] text-emerald-500/80">{stats.completion_rate}% finished</span>
                        <button type="button" onClick={() => handleStatusTab('completed')} aria-label="Show completed tasks" className="absolute inset-0 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
                    </div>

                    {/* Overdue */}
                    <div className="relative rounded-3xl bg-white p-4 sm:p-5 border border-rose-200 dark:bg-slate-900 dark:border-rose-900/50 shadow-sm bg-rose-50/20">
                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Overdue</span>
                        <p className="mt-2 text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">{stats.overdue}</p>
                        <span className="mt-1 block text-[11px] text-rose-500/80">Passed deadline</span>
                        <button type="button" onClick={() => handleStatusTab('overdue')} aria-label="Show overdue tasks" className="absolute inset-0 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
                    </div>

                </div>

                {/* Progress Bar & Completion Rate */}
                <div className="rounded-3xl bg-white p-5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        <span>Overall Progress</span>
                        <span>{stats.completed} of {stats.total} tasks completed ({stats.completion_rate}%)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full dark:bg-slate-800 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${stats.completion_rate}%` }}
                        />
                    </div>
                </div>

                {/* Filter, Search & View Controls */}
                <div className="rounded-3xl bg-white p-4 sm:p-6 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-4">
                    {/* Top Row: Search Input & View Switcher */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tasks by title, keyword, or details..."
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-24 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                            <svg className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <button
                                type="submit"
                                className="absolute right-1.5 top-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 transition"
                            >
                                Search
                            </button>
                        </form>

                        {/* View Switcher: Grid vs List */}
                        <div className="flex items-center rounded-2xl bg-slate-100 p-1 dark:bg-slate-800 shrink-0 self-end sm:self-auto">
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                                    viewMode === 'grid'
                                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                                title="Grid View"
                            >
                                <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                Cards
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                                    viewMode === 'list'
                                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                                title="Table / List View"
                            >
                                <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                                List
                            </button>
                        </div>
                    </div>

                    {/* Bottom Row: Status Filter Tabs & Selectors */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {/* Status Pills */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {[
                                { id: 'all', label: 'All Tasks' },
                                { id: 'pending', label: 'Pending' },
                                { id: 'in_progress', label: 'In Progress' },
                                { id: 'completed', label: 'Completed' },
                                { id: 'overdue', label: 'Overdue' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => handleStatusTab(tab.id)}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                                        statusFilter === tab.id
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Priority, Due Date & Sort Filters */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Priority Filter */}
                            <select
                                value={priorityFilter}
                                onChange={(e) => handlePriorityChange(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                                <option value="all">All Priorities</option>
                                <option value="urgent">Urgent</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>

                            {/* Due Date Filter */}
                            <select
                                value={dueFilter}
                                onChange={(e) => handleDueChange(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                                <option value="all">All Deadlines</option>
                                <option value="today">Due Today</option>
                                <option value="this_week">Due This Week</option>
                                <option value="upcoming">Upcoming</option>
                                <option value="overdue">Overdue Only</option>
                            </select>

                            {/* Sort Order */}
                            <select
                                value={sortBy}
                                onChange={(e) => handleSortChange(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                                <option value="due_date_asc">Deadline: Soonest first</option>
                                <option value="due_date_desc">Deadline: Latest first</option>
                                <option value="priority_desc">Priority: Highest first</option>
                                <option value="title_asc">Title: A-Z</option>
                                <option value="created_at_desc">Date Created: Newest</option>
                            </select>

                            {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || dueFilter !== 'all' || sortBy !== 'due_date_asc') && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                    title="Clear all filters"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tasks Content: Card Grid View or List View */}
                {tasks.length === 0 ? (
                    /* Empty State */
                    <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                            No tasks found
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                                ? 'No tasks match your current filters. Try resetting your search filters.'
                                : "You don't have any tasks scheduled yet. Create your first task to get started!"}
                        </p>
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Task Now
                            </button>
                        </div>
                    </div>
                ) : viewMode === 'grid' ? (
                    /* Grid / Card View */
                    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 sm:gap-6">
                        {tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onEdit={openEditModal}
                                onDelete={openDeleteModal}
                            />
                        ))}
                    </div>
                ) : (
                    /* Table / List View */
                    <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                                    <tr>
                                        <th className="px-5 py-3.5">Task Title</th>
                                        <th className="px-4 py-3.5">Priority</th>
                                        <th className="px-4 py-3.5">Status</th>
                                        <th className="px-4 py-3.5">Deadline</th>
                                        <th className="px-4 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {tasks.map((task) => (
                                        <tr
                                            key={task.id}
                                            className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition ${
                                                task.is_overdue && task.status !== 'completed' ? 'bg-rose-50/20' : ''
                                            }`}
                                        >
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-slate-900 dark:text-white">
                                                    {task.title}
                                                </div>
                                                {task.description && (
                                                    <div className="text-xs text-slate-500 line-clamp-1 dark:text-slate-400 mt-0.5">
                                                        {task.description}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-4 py-4">
                                                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                    task.priority === 'urgent'
                                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                                                        : task.priority === 'high'
                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                                            : task.priority === 'medium'
                                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                                                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                                }`}>
                                                    {task.priority.toUpperCase()}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4">
                                                <select
                                                    value={task.status}
                                                    onChange={(e) => handleListStatusChange(task, e.target.value as TaskStatus)}
                                                    className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="in_progress">In Progress</option>
                                                    <option value="completed">Completed</option>
                                                    {task.is_overdue && <option value="overdue">Overdue</option>}
                                                </select>
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className={`text-xs font-semibold ${
                                                    task.status === 'completed'
                                                        ? 'text-slate-400'
                                                        : task.is_overdue
                                                            ? 'text-rose-600 dark:text-rose-400'
                                                            : 'text-slate-700 dark:text-slate-300'
                                                }`}>
                                                    {task.time_remaining_formatted}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(task)}
                                                        className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openDeleteModal(task)}
                                                        className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                                                        title="Delete"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            <TaskModal
                isOpen={taskModalOpen}
                onClose={() => setTaskModalOpen(false)}
                task={editingTask}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                task={taskToDelete}
            />
        </AppLayout>
    );
}

