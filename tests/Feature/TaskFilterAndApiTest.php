<?php

use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;

test('user can search tasks by keyword', function () {
    $user = User::factory()->create();

    Task::create([
        'user_id' => $user->id,
        'title' => 'Unique Secret Project',
        'priority' => 'high',
        'status' => 'pending',
        'due_date' => Carbon::now()->addDays(2),
    ]);

    Task::create([
        'user_id' => $user->id,
        'title' => 'Standard Maintenance Routine',
        'priority' => 'low',
        'status' => 'pending',
        'due_date' => Carbon::now()->addDays(3),
    ]);

    $response = $this->actingAs($user)->get('/dashboard?search=Unique+Secret');
    $response->assertOk();
    $response->assertSee('Unique Secret Project');
    $response->assertDontSee('Standard Maintenance Routine');
});

test('user can filter tasks by priority', function () {
    $user = User::factory()->create();

    Task::create([
        'user_id' => $user->id,
        'title' => 'Urgent Server Outage',
        'priority' => 'urgent',
        'status' => 'pending',
        'due_date' => Carbon::now()->addHour(),
    ]);

    Task::create([
        'user_id' => $user->id,
        'title' => 'Low Priority Clean Up',
        'priority' => 'low',
        'status' => 'pending',
        'due_date' => Carbon::now()->addDays(5),
    ]);

    $response = $this->actingAs($user)->get('/dashboard?priority=urgent');
    $response->assertOk();
    $response->assertSee('Urgent Server Outage');
    $response->assertDontSee('Low Priority Clean Up');
});

test('api alerts endpoint returns active alerts and critical status', function () {
    $user = User::factory()->create([
        'alarm_sound_enabled' => true,
    ]);

    // A future task must not be returned as a deadline alarm candidate.
    $task = Task::create([
        'user_id' => $user->id,
        'title' => 'API Alert Imminent Task',
        'priority' => 'urgent',
        'status' => 'pending',
        'due_date' => Carbon::now()->addMinutes(20),
    ]);

    $response = $this->actingAs($user)->getJson('/api/alerts');

    $response->assertOk();
    $response->assertJsonStructure([
        'alarm_sound_enabled',
        'unread_alerts',
        'unread_count',
        'has_deadline_alarm',
    ]);
    $response->assertJsonPath('has_deadline_alarm', false);
});

