<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use App\Models\ActivityLog;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
    * Display the user's profile information.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('profile/edit', [
            'user' => $request->user(),
        ]);
    }

    public function settings(Request $request): Response
    {
        return Inertia::render('profile/settings', [
            'user' => $request->user(),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function updateProfile(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        if ($request->hasFile('avatar')) {
            if ($user->avatar_path) {
                Storage::disk('public')->delete($user->avatar_path);
            }
            $validated['avatar_path'] = $request->file('avatar')->store('profile_avatars', 'public');
            unset($validated['avatar']);
        }

        $user->fill($validated);
        $user->save();
        ActivityLog::record($user, 'Profile updated', null, 'Profile details changed.', 'success');

        return back()->with('success', 'Profile updated successfully.');
    }

    /**
     * Update the user's password.
     */
    public function updatePassword(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('success', 'Password changed successfully.');
    }

    /**
    * Update application and notification preferences.
     */
    public function updatePreferences(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'alarm_sound_enabled' => ['sometimes', 'boolean'],
            'alarm_sound' => ['sometimes', 'nullable', 'string', 'in:classic,digital,loud,bell,wake_up,strong,emergency,urgent'],
            'alarm_volume' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100'],
            'alarm_duration' => ['sometimes', 'nullable', 'integer', 'min:5', 'max:60'],
            'notify_task_created' => ['sometimes', 'boolean'],
            'notify_task_updated' => ['sometimes', 'boolean'],
            'notify_task_completed' => ['sometimes', 'boolean'],
            'notify_overdue' => ['sometimes', 'boolean'],
            'theme' => ['nullable', 'in:light,dark'],
        ]);

        $request->user()->update($validated);
        ActivityLog::record($request->user(), 'Settings changed', null, 'Alarm or appearance preferences updated.', 'success');

        return back()->with('success', 'Preferences saved.');
    }
}

