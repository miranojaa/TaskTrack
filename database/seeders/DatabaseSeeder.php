<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\TaskAlert;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $now = Carbon::now();

        // 1. Create or update primary demo user
        $user = User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Demo User',
                'password' => Hash::make('password'),
                'alarm_sound_enabled' => true,
                'alert_threshold_minutes' => 60,
                'email_verified_at' => $now,
            ]
        );

        // Remove old tasks to ensure fresh clean state for testing
        $user->tasks()->delete();

        // 2. Task 1: Imminent deadline approaching (due in 25 minutes) - Triggers Alarm
        $task1 = $user->tasks()->create([
            'title' => 'Executive Project Pitch & Demo',
            'description' => 'Finalize slide deck and rehearse key talking points for the stakeholder product review.',
            'priority' => 'urgent',
            'status' => 'pending',
            'due_date' => $now->copy()->addMinutes(25),
            'notified_approaching' => true,
        ]);

        TaskAlert::create([
            'user_id' => $user->id,
            'task_id' => $task1->id,
            'type' => 'approaching',
            'message' => "Urgent: Task '{$task1->title}' is due in 25 minutes!",
            'is_read' => false,
        ]);

        // 3. Task 2: Overdue task (deadline was 3 hours ago)
        $task2 = $user->tasks()->create([
            'title' => 'Submit Monthly Expense Report',
            'description' => 'Compile all receipts and submit expense sheets to accounting for monthly reconciliation.',
            'priority' => 'high',
            'status' => 'overdue',
            'due_date' => $now->copy()->subHours(3),
            'notified_overdue' => true,
        ]);

        TaskAlert::create([
            'user_id' => $user->id,
            'task_id' => $task2->id,
            'type' => 'overdue',
            'message' => "Deadline passed! Task '{$task2->title}' is now overdue.",
            'is_read' => false,
        ]);

        // 4. Task 3: In Progress task due later today (in 5 hours)
        $user->tasks()->create([
            'title' => 'Implement API Authentication Middleware',
            'description' => 'Review token revocation logic, write unit tests, and verify rate limiting headers.',
            'priority' => 'high',
            'status' => 'in_progress',
            'due_date' => $now->copy()->addHours(5),
        ]);

        // 5. Task 4: Pending medium priority task due tomorrow
        $user->tasks()->create([
            'title' => 'Design TaskTrack Dark Mode Theme',
            'description' => 'Ensure all Tailwind color variables contrast well in dark mode with WCAG AA compliance.',
            'priority' => 'medium',
            'status' => 'pending',
            'due_date' => $now->copy()->addDay()->setHour(17)->setMinute(0),
        ]);

        // 6. Task 5: Completed task
        $user->tasks()->create([
            'title' => 'Initial Database Schema Design',
            'description' => 'Created initial migration schemas for users, tasks, and task_alerts.',
            'priority' => 'medium',
            'status' => 'completed',
            'due_date' => $now->copy()->subDay(),
            'completed_at' => $now->copy()->subDay()->addHours(2),
        ]);

        // 7. Task 6: Low priority backlog task due next week
        $user->tasks()->create([
            'title' => 'Update Team Documentation & Guides',
            'description' => 'Document onboarding instructions, Git branch conventions, and testing commands in the repository wiki.',
            'priority' => 'low',
            'status' => 'pending',
            'due_date' => $now->copy()->addDays(5),
        ]);
    }
}
