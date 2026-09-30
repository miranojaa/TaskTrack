<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Contracts\Validation\UncompromisedVerifier;

test('profile page requires authentication', function () {
    $response = $this->get('/profile');
    $response->assertRedirect('/login');
});

test('profile page can be rendered', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/profile');
    $response->assertOk();
});

test('user can update profile information', function () {
    $user = User::factory()->create([
        'name' => 'Original Name',
        'email' => 'original@example.com',
    ]);

    $response = $this->actingAs($user)->patch('/profile', [
        'name' => 'Updated Name',
        'email' => 'updated@example.com',
    ]);

    $response->assertSessionHas('success');
    $user->refresh();
    expect($user->name)->toBe('Updated Name');
    expect($user->email)->toBe('updated@example.com');
});

test('user can update password', function () {
    $user = User::factory()->create([
        'password' => Hash::make('old-password-123'),
    ]);

    $response = $this->actingAs($user)->put('/profile/password', [
        'current_password' => 'old-password-123',
        'password' => 'new-password-456',
        'password_confirmation' => 'new-password-456',
    ]);

    $response->assertSessionHas('success');
    $user->refresh();
    expect(Hash::check('new-password-456', $user->password))->toBeTrue();
});

test('user can update alarm and notification preferences without a deadline threshold', function () {
    $user = User::factory()->create([
        'alarm_sound_enabled' => true,
    ]);

    $response = $this->actingAs($user)->patch('/profile/preferences', [
        'alarm_sound_enabled' => false,
        'notify_task_created' => false,
    ]);

    $response->assertSessionHas('success');
    $user->refresh();
    expect($user->alarm_sound_enabled)->toBeFalse();
    expect($user->notify_task_created)->toBeFalse();
});

test('user can upload a persistent profile picture', function () {
    Storage::fake('public');
    $user = User::factory()->create();

    $response = $this->actingAs($user)->patch('/profile', [
        'name' => $user->name,
        'email' => $user->email,
        'avatar' => UploadedFile::fake()->create('profile.jpg', 12, 'image/jpeg'),
    ]);

    $response->assertSessionHas('success');
    $user->refresh();

    expect($user->avatar_path)->not->toBeNull();
    expect($user->avatar_url)->toContain($user->avatar_path);
    Storage::disk('public')->assertExists($user->avatar_path);
});

test('compromised-password checks have a bounded network timeout', function () {
    $verifier = app(UncompromisedVerifier::class);
    $timeout = (new ReflectionProperty($verifier, 'timeout'))->getValue($verifier);

    expect($timeout)->toBe(3);
});

