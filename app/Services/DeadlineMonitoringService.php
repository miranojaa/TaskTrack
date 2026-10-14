<?php

namespace App\Services;

use App\Mail\TaskReminderMail;
use App\Models\Task;
use App\Models\TaskAlert;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

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

                if (! $claimed || ! ($task->user?->notify_overdue ?? true)) {
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

        $reminderAlerts = $this->createUpcomingReminders($user, $now);

        return [
            'overdue_count' => $overdueCount,
            'reminder_count' => count($reminderAlerts),
            'new_alerts' => array_merge($triggeredAlerts, $reminderAlerts),
        ];
    }

    /** @return array<int, TaskAlert> */
    private function createUpcomingReminders(?User $user, Carbon $now): array
    {
        $tasks = Task::query()
            ->where('status', '!=', 'completed')
            ->where('due_date', '>', $now)
            ->where('due_date', '<=', $now->copy()->addDays(7))
            ->when($user, fn ($query) => $query->where('user_id', $user->id))
            ->with('user:id,email,alert_threshold_minutes,notify_approaching,notify_email_reminders')
            ->get();

        $alerts = [];

        foreach ($tasks as $task) {
            $owner = $task->user;
            if (! $owner || ! $owner->notify_approaching) {
                continue;
            }

            $warningMinutes = (int) $owner->alert_threshold_minutes;
            if ($warningMinutes < 1) {
                continue;
            }

            $warningAt = $task->due_date->copy()->subMinutes($warningMinutes);
            if ($warningAt->isAfter($now)) {
                continue;
            }

            $reminderKey = "warning_{$warningMinutes}m_{$task->due_date->getTimestamp()}";
            $inserted = DB::table('task_alerts')->insertOrIgnore([
                'user_id' => $task->user_id,
                'task_id' => $task->id,
                'type' => 'approaching',
                'reminder_key' => $reminderKey,
                'message' => "Task '{$task->title}' ({$task->priority} priority) is due at {$task->due_date->format('M j, Y g:i A')}. Reminder: {$warningMinutes} minutes before the deadline.",
                'is_read' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $alert = TaskAlert::where('task_id', $task->id)
                ->where('reminder_key', $reminderKey)
                ->first();

            if (! $alert) {
                continue;
            }

            if ($inserted) {
                $alerts[] = $alert;
            }

            if ($owner->notify_email_reminders && ! $alert->email_queued_at) {
                $claimed = TaskAlert::whereKey($alert->id)
                    ->whereNull('email_queued_at')
                    ->update(['email_queued_at' => $now]);

                if ($claimed) {
                    try {
                        Mail::to($owner->email)->queue(new TaskReminderMail($task, $warningMinutes, $warningAt));
                    } catch (Throwable $exception) {
                        TaskAlert::whereKey($alert->id)->update(['email_queued_at' => null]);
                        Log::warning('Could not queue task deadline reminder email.', [
                            'task_id' => $task->id,
                            'user_id' => $owner->id,
                            'warning_at' => $warningAt->toIso8601String(),
                            'exception' => $exception->getMessage(),
                        ]);
                    }
                }
            }
        }

        return $alerts;
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
            ->with('task:id,title,due_date,file_path,file_name,priority')
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
        $warningTasks = Task::where('user_id', $user->id)
            ->where('status', '!=', 'completed')
            ->where('due_date', '>', $now)
            ->where('due_date', '<=', $now->copy()->addDays(14))
            ->whereHas('user', fn ($query) => $query->where('notify_approaching', true))
            ->with('user:id,alert_threshold_minutes')
            ->get();
        $nextWarning = $warningTasks
            ->map(fn (Task $task) => $task->due_date->copy()->subMinutes((int) $task->user->alert_threshold_minutes))
            ->filter(fn ($warningAt) => $warningAt->isAfter($now))
            ->min();
        $nextAlarmAt = collect([$nextDeadline, $nextSnooze, $nextWarning])->filter()->sort()->first();

        return [
            'alarm_sound_enabled' => (bool) $user->alarm_sound_enabled,
            'unread_alerts' => $unreadAlerts,
            'unread_count' => $unreadAlerts->count(),
            'has_deadline_alarm' => $unreadAlerts->contains(fn (TaskAlert $alert) => in_array($alert->type, ['overdue', 'deadline_reached'], true)),
            'next_alarm_at' => $nextAlarmAt ? Carbon::parse($nextAlarmAt)->toIso8601String() : null,
        ];
    }
}
