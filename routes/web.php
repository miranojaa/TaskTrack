<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public Landing Page
Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return Inertia::render('welcome');
})->name('home');

// Guest Authentication Routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);

    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AuthController::class, 'register']);

    Route::get('/admin/login', [AuthController::class, 'showAdminLogin'])->name('admin.login');
    Route::post('/admin/login', [AuthController::class, 'adminLogin']);
});

// Authenticated Application Routes
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // Dashboard & Tasks
    Route::get('/dashboard', [TaskController::class, 'index'])->name('dashboard');
    
    // New pages
    Route::get('/tasks', [TaskController::class, 'tasks'])->name('tasks.index');
    Route::get('/calendar', [TaskController::class, 'calendar'])->name('calendar');
    Route::get('/files', [TaskController::class, 'files'])->name('files');
    Route::get('/notifications', [TaskController::class, 'notifications'])->name('notifications');
    Route::get('/settings', [ProfileController::class, 'settings'])->name('settings.edit');

    Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::put('/tasks/{id}', [TaskController::class, 'update'])->name('tasks.update');
    Route::delete('/tasks/{id}', [TaskController::class, 'destroy'])->name('tasks.destroy');
    Route::patch('/tasks/{id}/status', [TaskController::class, 'updateStatus'])->name('tasks.status');
    Route::post('/tasks/{id}/snooze', [TaskController::class, 'snoozeAlarm'])->name('tasks.snooze');
    Route::delete('/tasks/{id}/attachment', [TaskController::class, 'deleteAttachment'])->name('tasks.attachment.destroy');

    // Profile & Settings
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'updateProfile'])->name('profile.update');
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');
    Route::patch('/profile/preferences', [ProfileController::class, 'updatePreferences'])->name('profile.preferences');

    // Alarm & Real-time Alerts API
    Route::get('/api/alerts', [TaskController::class, 'checkAlerts'])->name('alerts.check');
    Route::get('/api/alerts/recent', [TaskController::class, 'recentAlerts'])->name('alerts.recent');
    Route::post('/api/alerts/read/{id?}', [TaskController::class, 'markAlertRead'])->name('alerts.read');
    Route::delete('/api/alerts/{id}', [TaskController::class, 'deleteAlert'])->name('alerts.destroy');
    Route::get('/history', [HistoryController::class, 'index'])->name('history');
    Route::post('/api/history', [HistoryController::class, 'store'])->name('history.store');

    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard');
        Route::get('/users', [AdminController::class, 'users'])->name('users');
        Route::put('/users/{user}', [AdminController::class, 'updateUser'])->name('users.update');
        Route::patch('/users/{user}/toggle-active', [AdminController::class, 'toggleUserActive'])->name('users.toggle-active');
        Route::post('/users/{user}/reset-password', [AdminController::class, 'resetUserPassword'])->name('users.reset-password');
        Route::delete('/users/{user}', [AdminController::class, 'deleteUser'])->name('users.delete');
        
        Route::get('/tasks', [AdminController::class, 'tasks'])->name('tasks');
        Route::delete('/tasks/{task}', [AdminController::class, 'deleteTask'])->name('tasks.delete');
        Route::get('/history', [AdminController::class, 'history'])->name('history');
    });
});
