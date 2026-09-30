<?php

namespace App\Services;

use App\Models\Task;
use App\Models\TaskAlert;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DeadlineMonitoringService
{
    /**
     * Check and synchronize deadlines for a specific user or all users.
     */
    public function checkDeadlines(?User $user = null): array
    {
        $now = Carbon::now();
        $tasksQuery = Task::query()
            ->where('status', '!=', 'completed')
            ->where('due_date', '<=', $now)
            ->where(function ($query) use ($now) {
                $query->where(function ($unsnoozed) {
                    $unsnoozed->whereNull('alarm_snoozed_until')
                        ->where('notified_overdue', false);
                })->orWhere(function ($snoozed) use ($now) {
                    $snoozed->whereNotNull('alarm_snoozed_until')
                        ->where('alarm_snoozed_until', '<=', $now);
                });
            });

        if ($user) {
            $tasksQuery->where('user_id', $user->id);
        }

        $tasks = $tasksQuery->with('user:id,notify_overdue')->get();

        $overdueCount = 0;
        $triggeredAlerts = [];

        foreach ($tasks as $task) {
            $alert = DB::transaction(function () use ($task, $now) {
                $claimed = Task::whereKey($task->id)
                    ->where('status', '!=', 'completed')
                    ->where('due_date', '<=', $now)
                    ->where(function ($query) use ($now) {
                        $query->where(function ($unsnoozed) {
                            $unsnoozed->whereNull('alarm_snoozed_until')
                                ->where('notified_overdue', false);
                        })->orWhere(function ($snoozed) use ($now) {
                            $snoozed->whereNotNull('alarm_snoozed_until')
                                ->where('alarm_snoozed_until', '<=', $now);
                        });
                    })
                    ->update([
                        'status' => 'overdue',
                        'notified_overdue' => true,
                        'alarm_snoozed_until' => null,
                    ]);

                if (!$claimed || !($task->user?->notify_overdue ?? true)) {
                    return null;
                }

                return TaskAlert::create([
                    'user_id' => $task->user_id,
                    'task_id' => $task->id,
                    'type' => 'overdue',
                    'message' => "Deadline passed! Task '{$task->title}' is now overdue.",
                    'is_read' => false,
                ]);
            });

            if ($alert) {
                $triggeredAlerts[] = $alert;
                $overdueCount++;
            }
        }

        return [
            'overdue_count' => $overdueCount,
            'new_alerts' => $triggeredAlerts,
        ];
    }

    /**
    * Get unread alerts and tasks whose exact deadline has arrived.
     */
    public function getActiveAlarmsForUser(User $user): array
    {
        $this->checkDeadlines($user);
        $now = Carbon::now();

        $unreadAlerts = TaskAlert::where('user_id', $user->id)
            ->where('is_read', false)
            ->with('task:id,title,due_date,file_path,file_name')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        $nextAlarmQuery = Task::where('user_id', $user->id)
            ->where('status', '!=', 'completed')
            ->whereHas('user', fn ($query) => $query->where('notify_overdue', true));
        $nextDeadline = (clone $nextAlarmQuery)
            ->where('notified_overdue', false)
            ->whereNull('alarm_snoozed_until')
            ->where('due_date', '>', $now)
            ->min('due_date');
        $nextSnooze = (clone $nextAlarmQuery)
            ->whereNotNull('alarm_snoozed_until')
            ->where('alarm_snoozed_until', '>', $now)
            ->min('alarm_snoozed_until');
        $nextAlarmAt = collect([$nextDeadline, $nextSnooze])->filter()->sort()->first();

        return [
            'alarm_sound_enabled' => (bool) $user->alarm_sound_enabled,
            'unread_alerts' => $unreadAlerts,
            'unread_count' => $unreadAlerts->count(),
            'has_deadline_alarm' => $unreadAlerts->contains(fn (TaskAlert $alert) => in_array($alert->type, ['overdue', 'deadline_reached'], true)),
            'next_alarm_at' => $nextAlarmAt ? Carbon::parse($nextAlarmAt)->toIso8601String() : null,
        ];
    }
}

