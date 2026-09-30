@extends('layouts.app')

@section('title', 'Task Dashboard - TaskTrack')

@section('content')
@php
    $tasks = collect($tasks)->map(function($t) {
        if (is_array($t)) {
            $t = (object) $t;
            if (isset($t->due_date) && !($t->due_date instanceof \Carbon\Carbon)) {
                $t->due_date = \Carbon\Carbon::parse($t->due_date);
            }
        }
        return $t;
    });
    $criticalTasks = $tasks->filter(fn($t) => $t->status !== 'completed' && (($t->is_overdue ?? false) || (($t->time_remaining_seconds ?? 0) > 0 && ($t->time_remaining_seconds ?? 0) <= 3600)));
@endphp

<div class="space-y-6 pb-12">
    <!-- Top Action Bar -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <h1 class="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Task Dashboard</h1>
            <p class="mt-1 text-xs sm:text-sm text-slate-500">Monitor deadlines, prioritize tasks, and keep projects on schedule.</p>
        </div>

        <div>
            <button
                type="button"
                onclick="openTaskModal()"
                class="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition"
            >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Create New Task
            </button>
        </div>
    </div>

    <!-- Urgent Deadline Alert Banner -->
    @if($criticalTasks->isNotEmpty())
        <div class="rounded-3xl border border-rose-200 bg-rose-50/70 p-4 sm:p-5">
            <div class="flex items-start gap-3.5">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/20">
                    <svg class="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-bold text-rose-900">
                        Attention Needed: {{ $criticalTasks->count() }} task{{ $criticalTasks->count() > 1 ? 's' : '' }} with critical deadlines!
                    </h3>
                    <div class="mt-2 flex flex-wrap gap-2">
                        @foreach($criticalTasks->take(3) as $cTask)
                            <span class="inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
                                <span class="truncate max-w-[180px]">{{ $cTask->title }}</span>
                                <span class="font-bold text-rose-600">({{ $cTask->time_remaining_formatted ?? 'Soon' }})</span>
                            </span>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>
    @endif

    <!-- KPI Metrics -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div class="rounded-3xl bg-white p-4 sm:p-5 border border-slate-200 shadow-sm">
            <span class="text-xs font-semibold text-slate-500">Total Tasks</span>
            <p class="mt-2 text-2xl sm:text-3xl font-black text-slate-900">{{ $stats['total'] }}</p>
            <span class="mt-1 block text-[11px] text-slate-400">All registered tasks</span>
        </div>
        <div class="rounded-3xl bg-white p-4 sm:p-5 border border-slate-200 shadow-sm">
            <span class="text-xs font-semibold text-slate-500">Pending</span>
            <p class="mt-2 text-2xl sm:text-3xl font-black text-slate-700">{{ $stats['pending'] }}</p>
            <span class="mt-1 block text-[11px] text-slate-400">Awaiting start</span>
        </div>
        <div class="rounded-3xl bg-white p-4 sm:p-5 border border-slate-200 shadow-sm">
            <span class="text-xs font-semibold text-indigo-600">In Progress</span>
            <p class="mt-2 text-2xl sm:text-3xl font-black text-indigo-600">{{ $stats['in_progress'] }}</p>
            <span class="mt-1 block text-[11px] text-indigo-400">Active now</span>
        </div>
        <div class="rounded-3xl bg-white p-4 sm:p-5 border border-slate-200 shadow-sm">
            <span class="text-xs font-semibold text-emerald-600">Completed</span>
            <p class="mt-2 text-2xl sm:text-3xl font-black text-emerald-600">{{ $stats['completed'] }}</p>
            <span class="mt-1 block text-[11px] text-emerald-500">{{ $stats['completion_rate'] }}% finished</span>
        </div>
        <div class="rounded-3xl bg-white p-4 sm:p-5 border border-rose-200 shadow-sm bg-rose-50/20">
            <span class="text-xs font-semibold text-rose-600">Overdue</span>
            <p class="mt-2 text-2xl sm:text-3xl font-black text-rose-600">{{ $stats['overdue'] }}</p>
            <span class="mt-1 block text-[11px] text-rose-500">Passed deadline</span>
        </div>
    </div>

    <!-- Progress Bar -->
    <div class="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
            <span>Overall Progress</span>
            <span>{{ $stats['completed'] }} of {{ $stats['total'] }} tasks completed ({{ $stats['completion_rate'] }}%)</span>
        </div>
        <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500" style="width: {{ $stats['completion_rate'] }}%"></div>
        </div>
    </div>

    <!-- Search & Filter Controls -->
    <div class="rounded-3xl bg-white p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <form action="{{ route('dashboard') }}" method="GET" class="space-y-4">
            <div class="flex flex-col sm:flex-row items-center gap-3">
                <div class="relative flex-1 w-full">
                    <input
                        type="text"
                        name="search"
                        value="{{ request('search') }}"
                        placeholder="Search tasks by title, keyword, or details..."
                        class="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-24 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                    >
                    <svg class="absolute left-3.5 top-3 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <button type="submit" class="absolute right-1.5 top-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">
                        Search
                    </button>
                </div>

                <div class="flex items-center rounded-2xl bg-slate-100 p-1 shrink-0 self-end sm:self-auto">
                    <button type="button" onclick="setViewMode('grid')" id="view-grid-btn" class="rounded-xl px-3 py-1.5 text-xs font-semibold bg-white text-slate-900 shadow-sm">Cards</button>
                    <button type="button" onclick="setViewMode('list')" id="view-list-btn" class="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">List</button>
                </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <!-- Status Pills -->
                <div class="flex flex-wrap items-center gap-1.5">
                    @foreach(['all' => 'All Tasks', 'pending' => 'Pending', 'in_progress' => 'In Progress', 'completed' => 'Completed', 'overdue' => 'Overdue'] as $sKey => $sLabel)
                        <a
                            href="{{ route('dashboard', array_merge(request()->query(), ['status' => $sKey])) }}"
                            class="rounded-xl px-3 py-1.5 text-xs font-semibold {{ (request('status', 'all') === $sKey) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200' }}"
                        >
                            {{ $sLabel }}
                        </a>
                    @endforeach
                </div>

                <!-- Priority, Due Date & Sort Filters -->
                <div class="flex flex-wrap items-center gap-2">
                    <select name="priority" onchange="this.form.submit()" class="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                        <option value="all" {{ request('priority') === 'all' ? 'selected' : '' }}>All Priorities</option>
                        <option value="urgent" {{ request('priority') === 'urgent' ? 'selected' : '' }}>Urgent</option>
                        <option value="high" {{ request('priority') === 'high' ? 'selected' : '' }}>High</option>
                        <option value="medium" {{ request('priority') === 'medium' ? 'selected' : '' }}>Medium</option>
                        <option value="low" {{ request('priority') === 'low' ? 'selected' : '' }}>Low</option>
                    </select>

                    <select name="due" onchange="this.form.submit()" class="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                        <option value="all" {{ request('due') === 'all' ? 'selected' : '' }}>All Deadlines</option>
                        <option value="today" {{ request('due') === 'today' ? 'selected' : '' }}>Due Today</option>
                        <option value="this_week" {{ request('due') === 'this_week' ? 'selected' : '' }}>Due This Week</option>
                        <option value="upcoming" {{ request('due') === 'upcoming' ? 'selected' : '' }}>Upcoming</option>
                        <option value="overdue" {{ request('due') === 'overdue' ? 'selected' : '' }}>Overdue Only</option>
                    </select>

                    <select name="sort_by" onchange="this.form.submit()" class="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                        <option value="due_date_asc" {{ request('sort_by') === 'due_date_asc' ? 'selected' : '' }}>Deadline: Soonest first</option>
                        <option value="due_date_desc" {{ request('sort_by') === 'due_date_desc' ? 'selected' : '' }}>Deadline: Latest first</option>
                        <option value="priority_desc" {{ request('sort_by') === 'priority_desc' ? 'selected' : '' }}>Priority: Highest first</option>
                        <option value="title_asc" {{ request('sort_by') === 'title_asc' ? 'selected' : '' }}>Title: A-Z</option>
                        <option value="created_at_desc" {{ request('sort_by') === 'created_at_desc' ? 'selected' : '' }}>Date: Newest</option>
                    </select>

                    @if(request('search') || request('status') || request('priority') || request('due'))
                        <a href="{{ route('dashboard') }}" class="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">Reset</a>
                    @endif
                </div>
            </div>
        </form>
    </div>

    <!-- Task Items (Grid View) -->
    <div id="tasks-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        @forelse($tasks as $task)
            @php
                $isOverdue = $task->is_overdue ?? false;
            @endphp
            <div class="group relative flex flex-col rounded-3xl p-5 sm:p-6 border bg-white shadow-sm hover:shadow-md transition {{ $task->status === 'completed' ? 'border-slate-200 opacity-75' : ($isOverdue ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20' : 'border-slate-200') }}">
                <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-2">
                        <!-- Checkmark Quick Toggle -->
                        <form action="{{ route('tasks.status', $task->id) }}" method="POST">
                            @csrf
                            @method('PATCH')
                            <input type="hidden" name="status" value="{{ $task->status === 'completed' ? 'pending' : 'completed' }}">
                            <button type="submit" class="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition {{ $task->status === 'completed' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 hover:border-indigo-500' }}">
                                @if($task->status === 'completed')
                                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                @endif
                            </button>
                        </form>

                        <!-- Priority Badge -->
                        @php
                            $pStyles = [
                                'urgent' => 'bg-rose-50 text-rose-700 border-rose-200',
                                'high' => 'bg-amber-50 text-amber-700 border-amber-200',
                                'medium' => 'bg-blue-50 text-blue-700 border-blue-200',
                                'low' => 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            ];
                        @endphp
                        <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border {{ $pStyles[$task->priority] ?? 'bg-slate-100 text-slate-700 border-slate-200' }}">
                            {{ ucfirst($task->priority) }}
                        </span>
                    </div>

                    <!-- Status Changer -->
                    <form action="{{ route('tasks.status', $task->id) }}" method="POST" class="inline">
                        @csrf
                        @method('PATCH')
                        <select name="status" onchange="this.form.submit()" class="rounded-xl px-2.5 py-1 text-xs font-semibold border-0 cursor-pointer bg-slate-100 text-slate-700">
                            <option value="pending" {{ $task->status === 'pending' ? 'selected' : '' }}>⏳ Pending</option>
                            <option value="in_progress" {{ $task->status === 'in_progress' ? 'selected' : '' }}>⚡ In Progress</option>
                            <option value="completed" {{ $task->status === 'completed' ? 'selected' : '' }}>✅ Completed</option>
                            @if($isOverdue)
                                <option value="overdue" {{ $task->status === 'overdue' ? 'selected' : '' }}>🚨 Overdue</option>
                            @endif
                        </select>
                    </form>
                </div>

                <div class="mt-3.5 flex-1">
                    <h3 class="text-base font-bold text-slate-900 {{ $task->status === 'completed' ? 'line-through text-slate-400' : '' }}">
                        {{ $task->title }}
                    </h3>
                    @if(!empty($task->description))
                        <p class="mt-1.5 text-xs leading-relaxed text-slate-600 line-clamp-2">
                            {{ $task->description }}
                        </p>
                    @endif
                </div>

                <div class="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-1.5 text-xs">
                        <svg class="w-4 h-4 {{ $task->status === 'completed' ? 'text-slate-400' : ($isOverdue ? 'text-rose-500 animate-pulse' : 'text-slate-400') }}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="font-semibold {{ $task->status === 'completed' ? 'text-slate-400' : ($isOverdue ? 'text-rose-600' : 'text-slate-600') }}">
                            {{ $task->time_remaining_formatted ?? 'Scheduled' }}
                        </span>
                    </div>

                    <div class="flex items-center gap-1">
                        <button
                            type="button"
                            onclick='openEditTaskModal(@json($task))'
                            class="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition"
                            title="Edit Task"
                        >
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onclick="confirmDeleteTask({{ $task->id }}, '{{ addslashes($task->title) }}')"
                            class="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                            title="Delete Task"
                        >
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        @empty
            <div class="col-span-full rounded-3xl border border-dashed border-slate-200 p-12 text-center bg-white/50">
                <h3 class="text-base font-bold text-slate-900">No tasks found</h3>
                <p class="mt-1 text-xs text-slate-500">Create a task or change filters to see tasks here.</p>
                <button type="button" onclick="openTaskModal()" class="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white">Create Task</button>
            </div>
        @endforelse
    </div>

    <!-- Task Items (List View - initially hidden) -->
    <div id="tasks-list" class="hidden rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <table class="w-full text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                    <th class="px-5 py-3.5">Task Title</th>
                    <th class="px-4 py-3.5">Priority</th>
                    <th class="px-4 py-3.5">Status</th>
                    <th class="px-4 py-3.5">Deadline</th>
                    <th class="px-4 py-3.5 text-right">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
                @foreach($tasks as $task)
                    @php
                        $isOverdue = $task->is_overdue ?? false;
                    @endphp
                    <tr class="hover:bg-slate-50/60 {{ $isOverdue && $task->status !== 'completed' ? 'bg-rose-50/20' : '' }}">
                        <td class="px-5 py-4">
                            <div class="font-semibold text-slate-900">{{ $task->title }}</div>
                            @if(!empty($task->description))
                                <div class="text-xs text-slate-500 line-clamp-1 mt-0.5">{{ $task->description }}</div>
                            @endif
                        </td>
                        <td class="px-4 py-4">
                            <span class="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold {{ $task->priority === 'urgent' ? 'bg-rose-100 text-rose-700' : ($task->priority === 'high' ? 'bg-amber-100 text-amber-700' : ($task->priority === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700')) }}">
                                {{ strtoupper($task->priority) }}
                            </span>
                        </td>
                        <td class="px-4 py-4">
                            <form action="{{ route('tasks.status', $task->id) }}" method="POST">
                                @csrf
                                @method('PATCH')
                                <select name="status" onchange="this.form.submit()" class="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs">
                                    <option value="pending" {{ $task->status === 'pending' ? 'selected' : '' }}>Pending</option>
                                    <option value="in_progress" {{ $task->status === 'in_progress' ? 'selected' : '' }}>In Progress</option>
                                    <option value="completed" {{ $task->status === 'completed' ? 'selected' : '' }}>Completed</option>
                                    @if($isOverdue)
                                        <option value="overdue" {{ $task->status === 'overdue' ? 'selected' : '' }}>Overdue</option>
                                    @endif
                                </select>
                            </form>
                        </td>
                        <td class="px-4 py-4">
                            <div class="text-xs font-semibold {{ $isOverdue ? 'text-rose-600' : 'text-slate-700' }}">
                                {{ $task->time_remaining_formatted ?? 'Scheduled' }}
                            </div>
                            <div class="text-[11px] text-slate-400">
                                @if(isset($task->due_date) && $task->due_date instanceof \Carbon\Carbon)
                                    {{ $task->due_date->format('M j, Y g:i A') }}
                                @elseif(isset($task->due_date))
                                    {{ date('M j, Y g:i A', strtotime($task->due_date)) }}
                                @endif
                            </div>
                        </td>
                        <td class="px-4 py-4 text-right">
                            <button type="button" onclick='openEditTaskModal(@json($task))' class="text-slate-400 hover:text-indigo-600 p-1">Edit</button>
                            <button type="button" onclick="confirmDeleteTask({{ $task->id }}, '{{ addslashes($task->title) }}')" class="text-slate-400 hover:text-rose-600 p-1 ml-2">Delete</button>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
</div>

<!-- Task Create/Edit Modal -->
<div id="task-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div class="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 id="task-modal-title" class="text-xl font-bold text-slate-900">Create New Task</h2>
            <button type="button" onclick="closeTaskModal()" class="text-slate-400 hover:text-slate-600">&times;</button>
        </div>

        <form id="task-modal-form" action="{{ route('tasks.store') }}" method="POST" class="mt-5 space-y-4">
            @csrf
            <input type="hidden" id="task-modal-method" name="_method" value="POST">

            <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Task Title *</label>
                <input type="text" id="form-title" name="title" required placeholder="e.g. Finish client proposal slides" class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none">
            </div>

            <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Description</label>
                <textarea id="form-description" name="description" rows="3" placeholder="Add task notes or checklists..." class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Priority Level</label>
                    <select id="form-priority" name="priority" class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                        <option value="low">🟢 Low</option>
                        <option value="medium" selected>🔵 Medium</option>
                        <option value="high">🟠 High</option>
                        <option value="urgent">🔴 Urgent</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Status</label>
                    <select id="form-status" name="status" class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                        <option value="pending" selected>⏳ Pending</option>
                        <option value="in_progress">⚡ In Progress</option>
                        <option value="completed">✅ Completed</option>
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Deadline (Due Date & Time) *</label>
                <input type="datetime-local" id="form-due-date" name="due_date" required class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none">
                <p class="mt-1 text-[11px] text-slate-500">The deadline alarm will trigger at this exact scheduled time.</p>
            </div>

            <div class="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onclick="closeTaskModal()" class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
                <button type="submit" id="task-modal-submit" class="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Save Task</button>
            </div>
        </form>
    </div>
</div>

<!-- Delete Confirmation Modal -->
<div id="delete-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h3 class="text-lg font-bold text-slate-900">Delete Task</h3>
        <p class="mt-1 text-xs text-slate-500">Are you sure you want to delete this task? This action cannot be undone.</p>
        <p id="delete-task-title" class="mt-3 text-sm font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-xl"></p>

        <form id="delete-form" action="" method="POST" class="mt-6 flex justify-end gap-3">
            @csrf
            @method('DELETE')
            <button type="button" onclick="document.getElementById('delete-modal').classList.add('hidden')" class="rounded-xl border border-slate-200 px-4 py-2 text-sm">Cancel</button>
            <button type="submit" class="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">Yes, Delete</button>
        </form>
    </div>
</div>

<script>
    function setViewMode(mode) {
        const grid = document.getElementById('tasks-grid');
        const list = document.getElementById('tasks-list');
        const gridBtn = document.getElementById('view-grid-btn');
        const listBtn = document.getElementById('view-list-btn');
        if (mode === 'grid') {
            grid.classList.remove('hidden');
            list.classList.add('hidden');
            gridBtn.className = "rounded-xl px-3 py-1.5 text-xs font-semibold bg-white text-slate-900 shadow-sm";
            listBtn.className = "rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900";
        } else {
            grid.classList.add('hidden');
            list.classList.remove('hidden');
            listBtn.className = "rounded-xl px-3 py-1.5 text-xs font-semibold bg-white text-slate-900 shadow-sm";
            gridBtn.className = "rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900";
        }
    }

    function openTaskModal() {
        const modal = document.getElementById('task-modal');
        const title = document.getElementById('task-modal-title');
        const form = document.getElementById('task-modal-form');
        const method = document.getElementById('task-modal-method');

        title.textContent = 'Create New Task';
        form.action = '{{ route("tasks.store") }}';
        method.value = 'POST';

        document.getElementById('form-title').value = '';
        document.getElementById('form-description').value = '';
        document.getElementById('form-priority').value = 'medium';
        document.getElementById('form-status').value = 'pending';

        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(17, 0, 0, 0);
        document.getElementById('form-due-date').value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

        modal.classList.remove('hidden');
    }

    function openEditTaskModal(task) {
        const modal = document.getElementById('task-modal');
        const title = document.getElementById('task-modal-title');
        const form = document.getElementById('task-modal-form');
        const method = document.getElementById('task-modal-method');

        title.textContent = 'Edit Task';
        form.action = `/tasks/${task.id}`;
        method.value = 'PUT';

        document.getElementById('form-title').value = task.title || '';
        document.getElementById('form-description').value = task.description || '';
        document.getElementById('form-priority').value = task.priority || 'medium';
        document.getElementById('form-status').value = task.status || 'pending';

        if (task.due_date) {
            const d = new Date(task.due_date);
            document.getElementById('form-due-date').value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        }

        modal.classList.remove('hidden');
    }

    function closeTaskModal() {
        document.getElementById('task-modal').classList.add('hidden');
    }

    function confirmDeleteTask(id, title) {
        const modal = document.getElementById('delete-modal');
        const form = document.getElementById('delete-form');
        const titleEl = document.getElementById('delete-task-title');

        form.action = `/tasks/${id}`;
        titleEl.textContent = title;
        modal.classList.remove('hidden');
    }
</script>
@endsection

