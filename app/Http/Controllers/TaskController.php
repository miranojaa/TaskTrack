<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskAlert;
use App\Models\ActivityLog;
use App\Models\User;
use App\Services\DeadlineMonitoringService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function __construct(
        protected DeadlineMonitoringService $monitoringService
    ) {}

    /**
     * Display a listing of tasks and dashboard overview.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->isAdmin()) {
            return redirect()->route('admin.dashboard');
        }

        // Base query for this user's tasks
        $query = Task::where('user_id', $user->id);

        // Compute dashboard totals in SQL rather than hydrating every task.
        $now = Carbon::now();
        $counts = (clone $query)->selectRaw("COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue")->first();
        $totalCount = (int) $counts->total;
        $pendingCount = (int) $counts->pending;
        $inProgressCount = (int) $counts->in_progress;
        $completedCount = (int) $counts->completed;
        $overdueCount = (int) $counts->overdue;

        $completionRate = $totalCount > 0 ? round(($completedCount / $totalCount) * 100) : 0;

        // 4. Apply search filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // 5. Apply status filter
        if ($status = $request->input('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        // 6. Apply priority filter
        if ($priority = $request->input('priority')) {
            if ($priority !== 'all') {
                $query->where('priority', $priority);
            }
        }

        // 7. Apply due date filter
        if ($due = $request->input('due')) {
            if ($due === 'overdue') {
                $query->where('status', '!=', 'completed')->where('due_date', '<', $now);
            } elseif ($due === 'today') {
                $query->whereDate('due_date', $now->toDateString());
            } elseif ($due === 'this_week') {
                $query->whereBetween('due_date', [$now->startOfWeek(), $now->copy()->endOfWeek()]);
            } elseif ($due === 'upcoming') {
                $query->where('status', '!=', 'completed')->where('due_date', '>=', $now);
            }
        }

        // 8. Apply sorting
        $sortBy = $request->input('sort_by', 'due_date_asc');
        switch ($sortBy) {
            case 'due_date_desc':
                $query->orderBy('due_date', 'desc');
                break;
            case 'priority_desc':
                // Custom ordering: urgent > high > medium > low
                $query->orderByRaw("CASE 
                    WHEN priority = 'urgent' THEN 1 
                    WHEN priority = 'high' THEN 2 
                    WHEN priority = 'medium' THEN 3 
                    WHEN priority = 'low' THEN 4 
                    ELSE 5 END");
                break;
            case 'title_asc':
                $query->orderBy('title', 'asc');
                break;
            case 'created_at_desc':
                $query->orderBy('created_at', 'desc');
                break;
            case 'due_date_asc':
            default:
                $query->orderBy('due_date', 'asc');
                break;
        }

        $tasks = $query->limit(100)->get();

        // 9. Fetch recent alerts for user
        $recentAlerts = TaskAlert::where('user_id', $user->id)
            ->with('task')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return Inertia::render('dashboard', [
            'tasks' => $tasks,
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $request->input('status', 'all'),
                'priority' => $request->input('priority', 'all'),
                'due' => $request->input('due', 'all'),
                'sort_by' => $sortBy,
            ],
            'stats' => [
                'total' => $totalCount,
                'pending' => $pendingCount,
                'in_progress' => $inProgressCount,
                'completed' => $completedCount,
                'overdue' => $overdueCount,
                'completion_rate' => $completionRate,
            ],
            'alerts' => $recentAlerts,
            'unreadAlertsCount' => $recentAlerts->where('is_read', false)->count(),
        ]);
    }

    /**
     * Store a newly created task.
     */
    public function store(Request $request): RedirectResponse
    {
        if ($request->user()->isAdmin()) {
            abort(403, 'Administrators cannot create tasks.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'priority' => ['required', 'in:low,medium,high,urgent'],
            'status' => ['required', 'in:pending,in_progress,completed'],
            'due_date' => ['required', 'date'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,jpg,jpeg,png,txt,zip', 'max:10240'],
            'alarm_sound' => ['nullable', 'string', 'in:classic,digital,loud,bell,wake_up,strong,emergency,urgent'],
        ]);

        $dueDate = Carbon::parse($validated['due_date']);
        $status = $validated['status'];
        $completedAt = null;

        if ($status === 'completed') {
            $completedAt = Carbon::now();
        } elseif ($dueDate->isPast()) {
            $status = 'overdue';
        }

        $taskData = [
            'title' => $validated['title'],
            'description' => $validated['description'],
            'priority' => $validated['priority'],
            'status' => $status,
            'due_date' => $dueDate,
            'completed_at' => $completedAt,
            'notified_overdue' => $status === 'overdue',
            'alarm_snoozed_until' => null,
            'alarm_sound' => $validated['alarm_sound'] ?? null,
        ];

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $path = $file->store('task_attachments', 'public');
            $taskData['file_path'] = $path;
            $taskData['file_name'] = $file->getClientOriginalName();
            $taskData['file_type'] = $file->getClientMimeType();
            $taskData['file_uploaded_at'] = Carbon::now();
        }

        $task = $request->user()->tasks()->create($taskData);
        ActivityLog::record($request->user(), 'Task created', $task, 'Task added to your workspace.', $task->status);
        $this->createTaskAlert($request->user(), $task, 'created', 'notify_task_created', "Task '{$task->title}' was created.");

        // If task was already past deadline when created, generate overdue notification
        if ($status === 'overdue') {
            $this->createTaskAlert($request->user(), $task, 'overdue', 'notify_overdue', "Task '{$task->title}' has passed its deadline and is overdue.");
        }

        return back()->with('success', 'Task created successfully.');
    }

    /**
     * Update an existing task.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $task = $request->user()->tasks()->findOrFail($id);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'priority' => ['required', 'in:low,medium,high,urgent'],
            'status' => ['required', 'in:pending,in_progress,completed,overdue'],
            'due_date' => ['required', 'date'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,jpg,jpeg,png,txt,zip', 'max:10240'],
            'remove_attachment' => ['nullable', 'boolean'],
            'alarm_sound' => ['nullable', 'string', 'in:classic,digital,loud,bell,wake_up,strong,emergency,urgent'],
        ]);

        $wasCompleted = $task->status === 'completed';
        $dueDate = Carbon::parse($validated['due_date']);
        $status = $validated['status'];
        $completedAt = $task->completed_at;

        if ($status === 'completed') {
            if (!$completedAt) {
                $completedAt = Carbon::now();
            }
        } else {
            $completedAt = null;
            if ($dueDate->isPast()) {
                $status = 'overdue';
            }
        }

        $taskData = [
            'title' => $validated['title'],
            'description' => $validated['description'],
            'priority' => $validated['priority'],
            'status' => $status,
            'due_date' => $dueDate,
            'completed_at' => $completedAt,
            'notified_overdue' => $dueDate->isFuture() ? false : $task->notified_overdue,
            'alarm_snoozed_until' => $status === 'completed' || $dueDate->isFuture() ? null : $task->alarm_snoozed_until,
            'alarm_sound' => $validated['alarm_sound'] ?? null,
        ];

        if ($request->boolean('remove_attachment')) {
            if ($task->file_path) {
                Storage::disk('public')->delete($task->file_path);
            }
            $taskData['file_path'] = null;
            $taskData['file_name'] = null;
            $taskData['file_type'] = null;
            $taskData['file_uploaded_at'] = null;
        } elseif ($request->hasFile('attachment')) {
            if ($task->file_path) {
                Storage::disk('public')->delete($task->file_path);
            }
            $file = $request->file('attachment');
            $path = $file->store('task_attachments', 'public');
            $taskData['file_path'] = $path;
            $taskData['file_name'] = $file->getClientOriginalName();
            $taskData['file_type'] = $file->getClientMimeType();
            $taskData['file_uploaded_at'] = Carbon::now();
        }

        $task->update($taskData);
        ActivityLog::record($request->user(), 'Task edited', $task, 'Task details updated.', $task->status);
        if ($task->status === 'completed') {
            $this->markTaskAlarmsRead($request->user(), $task);
        }
        $this->createTaskAlert($request->user(), $task, 'updated', 'notify_task_updated', "Task '{$task->title}' was updated.");
        if (!$wasCompleted && $task->status === 'completed') {
            $this->createTaskAlert($request->user(), $task, 'completed', 'notify_task_completed', "Task '{$task->title}' was completed.");
        }

        return back()->with('success', 'Task updated successfully.');
    }

    /**
     * Quick status toggle for a task.
     */
    public function updateStatus(Request $request, int $id): RedirectResponse
    {
        $task = $request->user()->tasks()->findOrFail($id);

        $validated = $request->validate([
            'status' => ['required', 'in:pending,in_progress,completed,overdue'],
        ]);

        $newStatus = $validated['status'];
        $completedAt = $task->completed_at;

        if ($newStatus === 'completed') {
            $completedAt = Carbon::now();
        } else {
            $completedAt = null;
            // Check if deadline is already past
            if ($task->due_date->isPast()) {
                $newStatus = 'overdue';
            }
        }

        $wasCompleted = $task->status === 'completed';
        $task->update([
            'status' => $newStatus,
            'completed_at' => $completedAt,
            'notified_overdue' => $newStatus === 'completed' ? true : $task->notified_overdue,
            'alarm_snoozed_until' => $newStatus === 'completed' ? null : $task->alarm_snoozed_until,
        ]);
        ActivityLog::record($request->user(), $newStatus === 'completed' ? 'Task completed' : 'Task reopened', $task, null, $newStatus);
        if ($newStatus === 'completed') {
            $this->markTaskAlarmsRead($request->user(), $task);
        }
        if (!$wasCompleted && $newStatus === 'completed') {
            $this->createTaskAlert($request->user(), $task, 'completed', 'notify_task_completed', "Task '{$task->title}' was completed.");
        }

        return back()->with('success', "Task status changed to {$newStatus}.");
    }

    /**
     * Delete a task.
     */
    public function destroy(Request $request, int $id): RedirectResponse
    {
        $task = $request->user()->tasks()->findOrFail($id);
        ActivityLog::record($request->user(), 'Task deleted', $task, 'Task removed from your workspace.', 'deleted');
        if ($task->file_path) {
            Storage::disk('public')->delete($task->file_path);
        }
        $task->delete();

        return back()->with('success', 'Task deleted successfully.');
    }

    public function deleteAttachment(Request $request, int $id): RedirectResponse
    {
        $task = $request->user()->tasks()->findOrFail($id);
        if ($task->file_path) {
            Storage::disk('public')->delete($task->file_path);
        }
        $task->update([
            'file_path' => null,
            'file_name' => null,
            'file_type' => null,
            'file_uploaded_at' => null,
        ]);
        ActivityLog::record($request->user(), 'Task attachment deleted', $task, 'Attachment removed.', $task->status);

        return back()->with('success', 'Attachment deleted.');
    }

    public function snoozeAlarm(Request $request, int $id): RedirectResponse
    {
        $task = $request->user()->tasks()->findOrFail($id);
        abort_if($task->status === 'completed', 409, 'Completed tasks cannot be snoozed.');

        $validated = $request->validate([
            'alert_id' => ['nullable', 'integer'],
        ]);

        if (!empty($validated['alert_id'])) {
            TaskAlert::where('user_id', $request->user()->id)
                ->where('task_id', $task->id)
                ->whereKey($validated['alert_id'])
                ->update(['is_read' => true, 'read_at' => Carbon::now()]);
        }

        $task->update([
            'status' => 'overdue',
            'notified_overdue' => true,
            'alarm_snoozed_until' => Carbon::now()->addMinutes(10),
        ]);
        ActivityLog::record($request->user(), 'Alarm snoozed', $task, 'Alarm will repeat in 10 minutes.', 'snoozed');

        return back()->with('success', 'Alarm snoozed for 10 minutes.');
    }

    public function tasks(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:all,pending,in_progress,completed,overdue'],
            'priority' => ['nullable', 'in:all,low,medium,high,urgent'],
            'due' => ['nullable', 'in:all,today,this_week,upcoming,overdue'],
            'sort_by' => ['nullable', 'in:due_date_asc,due_date_desc,priority_desc,title_asc,created_at_desc'],
        ]);
        $query = $request->user()->tasks();
        if ($search = $filters['search'] ?? null) {
            $query->where(function ($builder) use ($search) {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }
        if (($status = $filters['status'] ?? 'all') !== 'all') {
            $query->where('status', $status);
        }
        if (($priority = $filters['priority'] ?? 'all') !== 'all') {
            $query->where('priority', $priority);
        }

        $now = Carbon::now();
        match ($filters['due'] ?? 'all') {
            'today' => $query->whereDate('due_date', $now->toDateString()),
            'this_week' => $query->whereBetween('due_date', [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()]),
            'upcoming' => $query->where('status', '!=', 'completed')->where('due_date', '>=', $now),
            'overdue' => $query->where('status', '!=', 'completed')->where('due_date', '<', $now),
            default => null,
        };

        $sortBy = $filters['sort_by'] ?? 'due_date_asc';
        match ($sortBy) {
            'due_date_desc' => $query->orderByDesc('due_date'),
            'priority_desc' => $query->orderByRaw("CASE WHEN priority = 'urgent' THEN 1 WHEN priority = 'high' THEN 2 WHEN priority = 'medium' THEN 3 ELSE 4 END"),
            'title_asc' => $query->orderBy('title'),
            'created_at_desc' => $query->orderByDesc('created_at'),
            default => $query->orderBy('due_date'),
        };
        $tasks = $query->paginate(25)->withQueryString();

        return Inertia::render('my-tasks', [
            'tasks' => $tasks,
            'filters' => [
                'search' => $filters['search'] ?? '',
                'status' => $filters['status'] ?? 'all',
                'priority' => $filters['priority'] ?? 'all',
                'due' => $filters['due'] ?? 'all',
                'sort_by' => $sortBy,
            ],
        ]);
    }

    public function calendar(Request $request): Response
    {
        $validated = $request->validate([
            'month' => ['nullable', 'date_format:Y-m'],
        ]);
        $month = Carbon::createFromFormat('Y-m', $validated['month'] ?? Carbon::now()->format('Y-m'))->startOfMonth();
        $start = $month->copy()->startOfWeek()->subDay();
        $end = $start->copy()->addDays(41)->endOfDay();
        $tasks = $request->user()->tasks()
            ->whereBetween('due_date', [$start, $end])
            ->orderBy('due_date')
            ->get();

        return Inertia::render('calendar', [
            'tasks' => $tasks,
            'month' => $month->format('Y-m'),
        ]);
    }

    public function files(Request $request): Response
    {
        $tasks = $request->user()->tasks()
            ->whereNotNull('file_path')
            ->orderByDesc('file_uploaded_at')
            ->paginate(25)
            ->withQueryString();
        $tasks->setCollection(
            $tasks->getCollection()
                ->filter(fn (Task $task) => Storage::disk('public')->exists($task->file_path))
                ->each(fn (Task $task) => $task->setAttribute('file_size', Storage::disk('public')->size($task->file_path)))
                ->values()
        );

        return Inertia::render('files', [
            'tasks' => $tasks,
        ]);
    }

    public function notifications(Request $request): Response
    {
        $alerts = TaskAlert::where('user_id', $request->user()->id)
            ->with('task:id,title,due_date,file_path,file_name')
            ->orderBy('created_at', 'desc')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('notifications', [
            'alerts' => $alerts,
        ]);
    }

    /**
     * API endpoint for real-time alarm checking and polling.
     */
    public function checkAlerts(Request $request): JsonResponse
    {
        $data = $this->monitoringService->getActiveAlarmsForUser($request->user());

        return response()->json($data);
    }

    public function recentAlerts(Request $request): JsonResponse
    {
        $alerts = TaskAlert::where('user_id', $request->user()->id)
            ->with('task:id,title,due_date')
            ->latest()
            ->limit(8)
            ->get();

        return response()->json(['alerts' => $alerts]);
    }

    /**
     * Mark alerts as read.
     */
    public function markAlertRead(Request $request, ?int $id = null): JsonResponse|RedirectResponse
    {
        $user = $request->user();

        if ($id) {
            $alert = TaskAlert::where('user_id', $user->id)->findOrFail($id);
            $alert->update([
                'is_read' => true,
                'read_at' => Carbon::now(),
            ]);
        } else {
            TaskAlert::where('user_id', $user->id)
                ->where('is_read', false)
                ->update([
                    'is_read' => true,
                    'read_at' => Carbon::now(),
                ]);
        }

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('success', 'Alerts marked as read.');
    }

    public function deleteAlert(Request $request, int $id): RedirectResponse
    {
        TaskAlert::where('user_id', $request->user()->id)->findOrFail($id)->delete();

        return back()->with('success', 'Notification deleted.');
    }

    private function createTaskAlert(User $user, Task $task, string $type, string $preference, string $message): void
    {
        if ($user->{$preference} === false) {
            return;
        }

        TaskAlert::create([
            'user_id' => $user->id,
            'task_id' => $task->id,
            'type' => $type,
            'message' => $message,
            'is_read' => false,
        ]);
    }

    private function markTaskAlarmsRead(User $user, Task $task): void
    {
        TaskAlert::where('user_id', $user->id)
            ->where('task_id', $task->id)
            ->where('is_read', false)
            ->whereIn('type', ['overdue', 'deadline_reached', 'alarm'])
            ->update(['is_read' => true, 'read_at' => Carbon::now()]);
    }
}

