<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Task;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function dashboard(): Response
    {
        return Inertia::render('admin/dashboard', [
            'stats' => [
                'users' => User::count(),
                'active_users' => User::where('is_active', true)->count(),
                'tasks' => Task::count(),
                'pending' => Task::where('status', 'pending')->count(),
                'in_progress' => Task::where('status', 'in_progress')->count(),
                'completed' => Task::where('status', 'completed')->count(),
                'overdue' => Task::where('status', 'overdue')->count(),
            ],
            'recentUsers' => User::latest()->limit(5)->get(),
            'recentTasks' => Task::with('user')->latest()->limit(5)->get(),
            'history' => ActivityLog::with(['user', 'task'])->latest()->limit(10)->get(),
        ]);
    }

    public function users(): Response
    {
        $users = User::withCount('tasks')->latest()->get();
        return Inertia::render('admin/users', ['users' => $users]);
    }

    public function tasks(): Response
    {
        $tasks = Task::with('user')->latest()->get();
        return Inertia::render('admin/tasks', ['tasks' => $tasks]);
    }

    public function history(): Response
    {
        $history = ActivityLog::with(['user', 'task'])->latest()->limit(200)->get();
        return Inertia::render('admin/history', ['history' => $history]);
    }

    public function updateUser(\Illuminate\Http\Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', \Illuminate\Validation\Rule::unique('users')->ignore($user->id)],
            'role' => ['required', 'in:user,admin'],
        ]);
        $user->update($validated);
        return back()->with('success', 'User updated successfully.');
    }

    public function toggleUserActive(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->withErrors(['error' => 'You cannot deactivate yourself.']);
        }
        $user->update(['is_active' => !$user->is_active]);
        return back()->with('success', 'User status updated.');
    }

    public function resetUserPassword(User $user)
    {
        $user->update(['password' => \Illuminate\Support\Facades\Hash::make('password')]);
        return back()->with('success', 'User password reset to "password".');
    }

    public function deleteUser(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->withErrors(['error' => 'You cannot delete yourself.']);
        }
        $user->delete();
        return back()->with('success', 'User deleted successfully.');
    }

    public function deleteTask(Task $task)
    {
        $task->delete();
        return back()->with('success', 'Task deleted successfully.');
    }
}