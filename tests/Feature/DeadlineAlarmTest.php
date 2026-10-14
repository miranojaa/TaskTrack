<?php

use App\Mail\TaskReminderMail;
use App\Models\Task;
use App\Models\TaskAlert;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;

test('past deadline tasks are automatically identified as overdue', function () {
    $user = User::factory()->create();

    // Create task with due date 1 hour in past
    $task = Task::create([
        'user_id' => $user->id,
        'title' => 'Past Deadline Task',
        'priority' => 'high',
        'status' => 'pending',
        'due_date' => Carbon::now()->subHour(),
    ]);

    $response = $this->actingAs($user)->getJson('/api/alerts');
    $response->assertOk();

    $task->refresh();
    expect($task->status)->toBe('overdue');
    expect($task->notified_overdue)->toBeTrue();

    $this->assertDatabaseHas('task_alerts', [
        'user_id' => $user->id,
        'task_id' => $task->id,
        'type' => 'overdue',
    ]);
    expect(TaskAlert::where('task_id', $task->id)->where('type', 'approaching')->count())->toBe(0);
});

test('configured warning duration triggers exactly before the deadline and queues one matching email', function () {
    Mail::fake();
    $timezone = config('app.timezone');
    $deadline = Carbon::parse('2026-10-14 16:00:00', $timezone);
    $warningAt = $deadline->copy()->subMinutes(45);
    Carbon::setTestNow($warningAt->copy()->subMinute());

    try {
        $user = User::factory()->create([
            'alert_threshold_minutes' => 45,
            'notify_email_reminders' => true,
        ]);
        $task = Task::create([
            'user_id' => $user->id,
            'title' => 'Exact warning task',
            'priority' => 'low',
            'status' => 'pending',
            'due_date' => $deadline,
        ]);

        $beforeWarning = $this->actingAs($user)->getJson('/api/alerts');
        $beforeWarning->assertOk()
            ->assertJsonPath('next_alarm_at', $warningAt->toIso8601String());
        expect(TaskAlert::where('task_id', $task->id)->where('type', 'approaching')->count())->toBe(0);

        Carbon::setTestNow($warningAt);
        $this->getJson('/api/alerts')->assertOk()
            ->assertJsonPath('unread_alerts.0.type', 'approaching');
        $this->assertDatabaseHas('task_alerts', [
            'task_id' => $task->id,
            'reminder_key' => "warning_45m_{$deadline->getTimestamp()}",
        ]);

        Carbon::setTestNow($warningAt->copy()->addSeconds(30));
        $this->getJson('/api/alerts')->assertOk();
        expect(TaskAlert::where('task_id', $task->id)->where('type', 'approaching')->count())->toBe(1);
        expect(TaskAlert::where('task_id', $task->id)->whereNotNull('email_queued_at')->count())->toBe(1);
        Mail::assertQueuedTimes(TaskReminderMail::class, 1);
        Mail::assertQueued(TaskReminderMail::class, fn (TaskReminderMail $mail) => $mail->task->id === $task->id
            && $mail->warningMinutes === 45
            && $mail->warningAt->equalTo($warningAt)
            && $mail->hasTo($user->email)
        );
    } finally {
        Carbon::setTestNow();
    }
});

test('configured warning duration supports short and long intervals regardless of priority', function () {
    $timezone = config('app.timezone');
    $deadline = Carbon::parse('2026-10-14 16:00:00', $timezone);

    try {
        foreach ([15, 30, 60, 120] as $warningMinutes) {
            $warningAt = $deadline->copy()->subMinutes($warningMinutes);
            Carbon::setTestNow($warningAt->copy()->subMinute());
            $user = User::factory()->create([
                'alert_threshold_minutes' => $warningMinutes,
                'notify_email_reminders' => false,
            ]);
            $task = Task::create([
                'user_id' => $user->id,
                'title' => "{$warningMinutes}-minute warning task",
                'priority' => 'low',
                'status' => 'pending',
                'due_date' => $deadline,
            ]);

            $this->actingAs($user)->getJson('/api/alerts')->assertOk()
                ->assertJsonPath('next_alarm_at', $warningAt->toIso8601String());
            expect(TaskAlert::where('task_id', $task->id)->where('type', 'approaching')->count())->toBe(0);

            Carbon::setTestNow($warningAt);
            $this->getJson('/api/alerts')->assertOk();
            expect(TaskAlert::where('task_id', $task->id)->where('type', 'approaching')->count())->toBe(1);
        }
    } finally {
        Carbon::setTestNow();
    }
});

test('saving a new warning duration recalculates the scheduled alarm time', function () {
    $timezone = config('app.timezone');
    $deadline = Carbon::parse('2026-10-14 16:00:00', $timezone);
    Carbon::setTestNow(Carbon::parse('2026-10-14 15:14:00', $timezone));

    try {
        $user = User::factory()->create([
            'alert_threshold_minutes' => 45,
            'notify_email_reminders' => false,
        ]);
        $task = Task::create([
            'user_id' => $user->id,
            'title' => 'Updated warning setting task',
            'priority' => 'medium',
            'status' => 'pending',
            'due_date' => $deadline,
        ]);

        $this->actingAs($user)->getJson('/api/alerts')->assertOk()
            ->assertJsonPath('next_alarm_at', $deadline->copy()->subMinutes(45)->toIso8601String());
        $this->patch('/profile/preferences', ['alert_threshold_minutes' => 30])
            ->assertSessionHas('success');

        $newWarningAt = $deadline->copy()->subMinutes(30);
        $this->getJson('/api/alerts')->assertOk()
            ->assertJsonPath('next_alarm_at', $newWarningAt->toIso8601String());

        Carbon::setTestNow($deadline->copy()->subMinutes(45));
        $this->getJson('/api/alerts')->assertOk();
        expect(TaskAlert::where('task_id', $task->id)->where('type', 'approaching')->count())->toBe(0);

        Carbon::setTestNow($newWarningAt);
        $this->getJson('/api/alerts')->assertOk();
        $this->assertDatabaseHas('task_alerts', [
            'task_id' => $task->id,
            'reminder_key' => "warning_30m_{$deadline->getTimestamp()}",
        ]);
    } finally {
        Carbon::setTestNow();
    }
});

test('configured warning time supports deadlines on the next day', function () {
    $timezone = config('app.timezone');
    $now = Carbon::parse('2026-10-14 15:14:00', $timezone);
    $deadline = Carbon::parse('2026-10-15 16:00:00', $timezone);
    $warningAt = $deadline->copy()->subMinutes(45);
    Carbon::setTestNow($now);

    try {
        $user = User::factory()->create([
            'alert_threshold_minutes' => 45,
            'notify_email_reminders' => false,
        ]);
        Task::create([
            'user_id' => $user->id,
            'title' => 'Tomorrow task',
            'priority' => 'medium',
            'status' => 'pending',
            'due_date' => $deadline,
        ]);

        $this->actingAs($user)->getJson('/api/alerts')->assertOk()
            ->assertJsonPath('next_alarm_at', $warningAt->toIso8601String());
        expect(TaskAlert::where('user_id', $user->id)->where('type', 'approaching')->count())->toBe(0);
    } finally {
        Carbon::setTestNow();
    }
});

test('a missed warning is created once when the server checks before its future deadline', function () {
    $timezone = config('app.timezone');
    $deadline = Carbon::parse('2026-10-14 16:00:00', $timezone);
    $warningAt = $deadline->copy()->subMinutes(45);
    Carbon::setTestNow($warningAt->copy()->addMinutes(3));

    try {
        $user = User::factory()->create([
            'alert_threshold_minutes' => 45,
            'notify_email_reminders' => false,
        ]);
        $task = Task::create([
            'user_id' => $user->id,
            'title' => 'Missed warning task',
            'priority' => 'high',
            'status' => 'pending',
            'due_date' => $deadline,
        ]);

        $this->actingAs($user)->getJson('/api/alerts')->assertOk();
        $this->getJson('/api/alerts')->assertOk();
        expect(TaskAlert::where('task_id', $task->id)->where('type', 'approaching')->count())->toBe(1);
    } finally {
        Carbon::setTestNow();
    }
});

test('editing a deadline recalculates its warning and completed tasks are ignored', function () {
    $timezone = config('app.timezone');
    $now = Carbon::parse('2026-10-14 15:15:00', $timezone);
    $deadline = Carbon::parse('2026-10-14 16:00:00', $timezone);
    Carbon::setTestNow($now);

    try {
        $user = User::factory()->create([
            'alert_threshold_minutes' => 45,
            'notify_email_reminders' => false,
        ]);
        $task = Task::create([
            'user_id' => $user->id,
            'title' => 'Rescheduled task',
            'priority' => 'high',
            'status' => 'pending',
            'due_date' => $deadline,
        ]);

        $this->actingAs($user)->getJson('/api/alerts')->assertOk();
        expect(TaskAlert::where('task_id', $task->id)->where('type', 'approaching')->count())->toBe(1);

        $newDeadline = Carbon::parse('2026-10-14 17:00:00', $timezone);
        $task->update(['due_date' => $newDeadline]);
        $newWarningAt = $newDeadline->copy()->subMinutes(45);
        $this->getJson('/api/alerts')->assertOk()
            ->assertJsonPath('next_alarm_at', $newWarningAt->toIso8601String());
        expect(TaskAlert::where('task_id', $task->id)->where('type', 'approaching')->count())->toBe(1);

        Carbon::setTestNow($newWarningAt);
        $this->getJson('/api/alerts')->assertOk();
        expect(TaskAlert::where('task_id', $task->id)->where('type', 'approaching')->count())->toBe(2);

        $completedTask = Task::create([
            'user_id' => $user->id,
            'title' => 'Completed task',
            'priority' => 'urgent',
            'status' => 'completed',
            'due_date' => Carbon::now()->addMinutes(30),
        ]);
        $this->getJson('/api/alerts')->assertOk();
        expect(TaskAlert::where('task_id', $completedTask->id)->where('type', 'approaching')->count())->toBe(0);
    } finally {
        Carbon::setTestNow();
    }
});

test('enabled email reminders queue one message for a new warning', function () {
    Mail::fake();
    $user = User::factory()->create(['notify_email_reminders' => true]);
    $task = Task::create([
        'user_id' => $user->id,
        'title' => 'Email reminder task',
        'priority' => 'urgent',
        'status' => 'pending',
        'due_date' => Carbon::now()->addMinutes(30),
    ]);

    $this->actingAs($user)->getJson('/api/alerts')->assertOk();
    $this->getJson('/api/alerts')->assertOk();

    expect(TaskAlert::where('task_id', $task->id)->whereNotNull('email_queued_at')->count())->toBe(1);
    Mail::assertQueued(TaskReminderMail::class);
});

test('deadline at the exact current time creates its alarm', function () {
    Carbon::setTestNow(Carbon::now()->startOfSecond());

    try {
        $user = User::factory()->create();
        $task = Task::create([
            'user_id' => $user->id,
            'title' => 'Exact Deadline Task',
            'priority' => 'high',
            'status' => 'pending',
            'due_date' => Carbon::now(),
        ]);

        $response = $this->actingAs($user)->getJson('/api/alerts');
        $response->assertOk()->assertJsonPath('has_deadline_alarm', true);
        $response->assertJsonPath('unread_alerts.0.task_id', $task->id);
        $this->assertDatabaseHas('task_alerts', [
            'user_id' => $user->id,
            'task_id' => $task->id,
            'type' => 'overdue',
        ]);
    } finally {
        Carbon::setTestNow();
    }
});

test('snoozing an alarm schedules the next alert exactly ten minutes later', function () {
    Carbon::setTestNow(Carbon::now()->startOfSecond());

    try {
        $user = User::factory()->create();
        $task = Task::create([
            'user_id' => $user->id,
            'title' => 'Snooze Test Task',
            'priority' => 'high',
            'status' => 'overdue',
            'due_date' => Carbon::now()->subMinute(),
            'notified_overdue' => true,
        ]);
        $alert = TaskAlert::create([
            'user_id' => $user->id,
            'task_id' => $task->id,
            'type' => 'overdue',
            'message' => 'Deadline reached',
            'is_read' => false,
        ]);

        $this->actingAs($user)->post("/tasks/{$task->id}/snooze", ['alert_id' => $alert->id])->assertSessionHas('success');
        $task->refresh();
        expect($task->alarm_snoozed_until->equalTo(Carbon::now()->addMinutes(10)))->toBeTrue();

        $beforeSnooze = $this->actingAs($user)->getJson('/api/alerts');
        $beforeSnooze->assertOk()->assertJsonPath('has_deadline_alarm', false);
        $beforeSnooze->assertJsonPath('next_alarm_at', Carbon::now()->addMinutes(10)->toIso8601String());

        Carbon::setTestNow($task->alarm_snoozed_until);
        $afterSnooze = $this->actingAs($user)->getJson('/api/alerts');
        $afterSnooze->assertOk()->assertJsonPath('has_deadline_alarm', true);
        $afterSnooze->assertJsonPath('next_alarm_at', null);
        expect(TaskAlert::where('task_id', $task->id)->where('is_read', false)->count())->toBe(1);
        expect($task->fresh()->alarm_snoozed_until)->toBeNull();
    } finally {
        Carbon::setTestNow();
    }
});

test('check-deadlines console command executes successfully', function () {
    $user = User::factory()->create();

    Task::create([
        'user_id' => $user->id,
        'title' => 'Command Test Overdue Task',
        'priority' => 'medium',
        'status' => 'pending',
        'due_date' => Carbon::now()->subMinutes(15),
    ]);

    $this->artisan('tasks:check-deadlines')
        ->assertSuccessful();
});

test('user can mark alerts as read', function () {
    $user = User::factory()->create();
    $task = Task::create([
        'user_id' => $user->id,
        'title' => 'Alert Read Test Task',
        'priority' => 'low',
        'status' => 'pending',
        'due_date' => Carbon::now()->addDay(),
    ]);

    $alert = TaskAlert::create([
        'user_id' => $user->id,
        'task_id' => $task->id,
        'type' => 'overdue',
        'message' => 'Task deadline passed',
        'is_read' => false,
    ]);

    $response = $this->actingAs($user)->post("/api/alerts/read/{$alert->id}");
    $response->assertSessionHas('success');

    $alert->refresh();
    expect($alert->is_read)->toBeTrue();
    expect($alert->read_at)->not->toBeNull();
});
