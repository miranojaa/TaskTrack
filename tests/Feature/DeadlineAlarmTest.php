<?php

use App\Models\Task;
use App\Models\TaskAlert;
use App\Models\User;
use Carbon\Carbon;

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
});

test('future deadlines do not create advance warning alerts', function () {
    $user = User::factory()->create();

    foreach ([15, 30, 60, 120] as $minutes) {
        Task::create([
            'user_id' => $user->id,
            'title' => "Future Deadline {$minutes}",
            'priority' => 'urgent',
            'status' => 'pending',
            'due_date' => Carbon::now()->addMinutes($minutes),
        ]);
    }

    $response = $this->actingAs($user)->getJson('/api/alerts');
    $response->assertOk();
    $response->assertJsonPath('has_deadline_alarm', false);
    expect(TaskAlert::where('user_id', $user->id)->count())->toBe(0);
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

