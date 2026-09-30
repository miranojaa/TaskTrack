<?php

use App\Models\Task;
use App\Models\TaskAlert;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('dashboard requires authentication', function () {
    $response = $this->get('/dashboard');

    $response->assertRedirect('/login');
});

test('authenticated user can view dashboard', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertOk();
});

test('user can create a task', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/tasks', [
        'title' => 'Complete TaskTrack Documentation',
        'description' => 'Write comprehensive user guide and api specs',
        'priority' => 'high',
        'status' => 'pending',
        'due_date' => Carbon::now()->addDays(2)->toDateTimeString(),
    ]);

    $response->assertSessionHas('success');
    $this->assertDatabaseHas('tasks', [
        'user_id' => $user->id,
        'title' => 'Complete TaskTrack Documentation',
        'priority' => 'high',
        'status' => 'pending',
    ]);
});

test('user can update a task', function () {
    $user = User::factory()->create();
    $task = Task::create([
        'user_id' => $user->id,
        'title' => 'Old Title',
        'priority' => 'low',
        'status' => 'pending',
        'due_date' => Carbon::now()->addDay(),
    ]);

    $response = $this->actingAs($user)->put("/tasks/{$task->id}", [
        'title' => 'Updated Task Title',
        'description' => 'Updated description content',
        'priority' => 'urgent',
        'status' => 'in_progress',
        'due_date' => Carbon::now()->addDays(3)->toDateTimeString(),
    ]);

    $response->assertSessionHas('success');
    $this->assertDatabaseHas('tasks', [
        'id' => $task->id,
        'title' => 'Updated Task Title',
        'priority' => 'urgent',
        'status' => 'in_progress',
    ]);
});

test('user can toggle task status', function () {
    $user = User::factory()->create();
    $task = Task::create([
        'user_id' => $user->id,
        'title' => 'Status Toggle Task',
        'priority' => 'medium',
        'status' => 'pending',
        'due_date' => Carbon::now()->addDays(2),
    ]);

    $response = $this->actingAs($user)->patch("/tasks/{$task->id}/status", [
        'status' => 'completed',
    ]);

    $response->assertSessionHas('success');
    $task->refresh();
    expect($task->status)->toBe('completed');
    expect($task->completed_at)->not->toBeNull();
});

test('user can delete a task', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $filePath = UploadedFile::fake()->create('delete-task.pdf', 10, 'application/pdf')->store('task_attachments', 'public');
    $task = Task::create([
        'user_id' => $user->id,
        'title' => 'Task to be deleted',
        'priority' => 'low',
        'status' => 'pending',
        'due_date' => Carbon::now()->addDay(),
        'file_path' => $filePath,
        'file_name' => 'delete-task.pdf',
        'file_type' => 'application/pdf',
    ]);

    $response = $this->actingAs($user)->delete("/tasks/{$task->id}");

    $response->assertSessionHas('success');
    $this->assertDatabaseMissing('tasks', [
        'id' => $task->id,
    ]);
    Storage::disk('public')->assertMissing($filePath);
});

test('workspace navigation renders distinct task calendar files and notification pages', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/dashboard')->assertInertia(fn (Assert $page) => $page->component('dashboard')->has('tasks'));
    $this->actingAs($user)->get('/tasks')->assertInertia(fn (Assert $page) => $page->component('my-tasks')->has('tasks'));
    $this->actingAs($user)->get('/calendar')->assertInertia(fn (Assert $page) => $page->component('calendar')->has('tasks'));
    $this->actingAs($user)->get('/files')->assertInertia(fn (Assert $page) => $page->component('files')->has('tasks'));
    $this->actingAs($user)->get('/notifications')->assertInertia(fn (Assert $page) => $page->component('notifications')->has('alerts'));
    $this->actingAs($user)->get('/history')->assertInertia(fn (Assert $page) => $page->component('history')->has('history'));
    $this->actingAs($user)->get('/profile')->assertInertia(fn (Assert $page) => $page->component('profile/edit'));
    $this->actingAs($user)->get('/settings')->assertInertia(fn (Assert $page) => $page->component('profile/settings'));
});

test('my tasks filters by status and priority on the server', function () {
    $user = User::factory()->create();
    Task::create([
        'user_id' => $user->id,
        'title' => 'Filtered High Priority',
        'priority' => 'high',
        'status' => 'pending',
        'due_date' => Carbon::now()->addDay(),
    ]);
    Task::create([
        'user_id' => $user->id,
        'title' => 'Completed Low Priority',
        'priority' => 'low',
        'status' => 'completed',
        'due_date' => Carbon::now()->addDays(2),
    ]);

    $this->actingAs($user)->get('/tasks?status=pending&priority=high&sort_by=title_asc')
        ->assertInertia(fn (Assert $page) => $page
            ->component('my-tasks')
            ->has('tasks.data', 1)
            ->where('tasks.data.0.title', 'Filtered High Priority')
            ->where('filters.status', 'pending')
            ->where('filters.priority', 'high')
        );
});

test('recent notification endpoint returns only the current users latest eight alerts', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $task = Task::create([
        'user_id' => $user->id,
        'title' => 'Recent Alert Task',
        'priority' => 'low',
        'status' => 'pending',
        'due_date' => Carbon::now()->addDay(),
    ]);

    foreach (range(1, 10) as $number) {
        TaskAlert::create([
            'user_id' => $user->id,
            'task_id' => $task->id,
            'type' => 'created',
            'message' => "Alert {$number}",
            'is_read' => false,
        ]);
    }
    TaskAlert::create([
        'user_id' => $otherUser->id,
        'task_id' => Task::create([
            'user_id' => $otherUser->id,
            'title' => 'Other User Task',
            'priority' => 'low',
            'status' => 'pending',
            'due_date' => Carbon::now()->addDay(),
        ])->id,
        'type' => 'created',
        'message' => 'Private alert',
        'is_read' => false,
    ]);

    $response = $this->actingAs($user)->getJson('/api/alerts/recent');
    $response->assertOk()->assertJsonCount(8, 'alerts');
    $response->assertDontSee('Private alert');
});

test('task attachments appear in Files with their related task', function () {
    Storage::fake('public');
    $user = User::factory()->create();

    $this->actingAs($user)->post('/tasks', [
        'title' => 'Study for Exam',
        'description' => 'Review the attached notes.',
        'priority' => 'high',
        'status' => 'pending',
        'due_date' => Carbon::now()->addDays(1)->toDateTimeString(),
        'attachment' => UploadedFile::fake()->create('exam-review.pdf', 24, 'application/pdf'),
    ])->assertSessionHas('success');

    $task = Task::where('user_id', $user->id)->firstOrFail();
    Storage::disk('public')->assertExists($task->file_path);
    expect($task->file_uploaded_at)->not->toBeNull();

    $this->actingAs($user)->get('/files')->assertInertia(fn (Assert $page) => $page
        ->component('files')
        ->has('tasks.data', 1)
        ->where('tasks.data.0.file_name', 'exam-review.pdf')
        ->where('tasks.data.0.title', 'Study for Exam')
    );
});

test('user can remove an attachment and delete a notification', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $path = UploadedFile::fake()->create('remove-me.pdf', 10, 'application/pdf')->store('task_attachments', 'public');
    $task = Task::create([
        'user_id' => $user->id,
        'title' => 'File Removal Task',
        'priority' => 'low',
        'status' => 'pending',
        'due_date' => Carbon::now()->addDay(),
        'file_path' => $path,
        'file_name' => 'remove-me.pdf',
        'file_type' => 'application/pdf',
        'file_uploaded_at' => Carbon::now(),
    ]);
    $alert = TaskAlert::create([
        'user_id' => $user->id,
        'task_id' => $task->id,
        'type' => 'created',
        'message' => 'Created',
        'is_read' => false,
    ]);

    $this->actingAs($user)->delete("/tasks/{$task->id}/attachment")->assertSessionHas('success');
    Storage::disk('public')->assertMissing($path);
    expect($task->fresh()->file_path)->toBeNull();

    $this->actingAs($user)->delete("/api/alerts/{$alert->id}")->assertSessionHas('success');
    $this->assertDatabaseMissing('task_alerts', ['id' => $alert->id]);
});

test('task creation update and completion create distinct notifications', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post('/tasks', [
        'title' => 'Notification Test Task',
        'description' => null,
        'priority' => 'medium',
        'status' => 'pending',
        'due_date' => Carbon::now()->addDays(1)->toDateTimeString(),
    ]);

    $task = Task::where('user_id', $user->id)->firstOrFail();
    $this->assertDatabaseHas('task_alerts', ['task_id' => $task->id, 'type' => 'created']);

    $this->actingAs($user)->put("/tasks/{$task->id}", [
        'title' => 'Updated Notification Task',
        'description' => null,
        'priority' => 'medium',
        'status' => 'pending',
        'due_date' => Carbon::now()->addDays(2)->toDateTimeString(),
    ]);
    $this->assertDatabaseHas('task_alerts', ['task_id' => $task->id, 'type' => 'updated']);

    $this->actingAs($user)->patch("/tasks/{$task->id}/status", ['status' => 'completed']);
    $this->assertDatabaseHas('task_alerts', ['task_id' => $task->id, 'type' => 'completed']);

    expect(TaskAlert::where('task_id', $task->id)->count())->toBe(3);
});

test('completing an overdue task clears its pending alarm', function () {
    $user = User::factory()->create();
    $task = Task::create([
        'user_id' => $user->id,
        'title' => 'Complete Alarm Task',
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

    $this->actingAs($user)->patch("/tasks/{$task->id}/status", ['status' => 'completed'])->assertSessionHas('success');

    expect($task->fresh()->status)->toBe('completed');
    expect($alert->fresh()->is_read)->toBeTrue();
});

