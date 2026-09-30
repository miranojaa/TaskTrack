<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    /**
     * Display the login view.
     */
    public function showLogin(): Response
    {
        return Inertia::render('auth/login');
    }

    public function showAdminLogin(): Response
    {
        return Inertia::render('auth/admin-login');
    }

    public function adminLogin(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            if ($request->user()->isAdmin()) {
                $request->session()->regenerate();
                ActivityLog::record($request->user(), 'Admin Login', null, 'Successful admin portal sign in.', 'success');
                return redirect()->intended(route('admin.dashboard'))->with('success', 'Welcome to the Admin Dashboard!');
            }
            Auth::logout();
            return back()->withErrors(['email' => 'You do not have administrative privileges.'])->onlyInput('email');
        }

        return back()->withErrors(['email' => 'The provided credentials do not match our records.'])->onlyInput('email');
    }

    /**
     * Handle an incoming authentication request.
     */
    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $remember = $request->boolean('remember');

        if (Auth::attempt($credentials, $remember)) {
            $request->session()->regenerate();
            ActivityLog::record($request->user(), 'Login', null, 'Successful sign in.', 'success');

            if ($request->user()->isAdmin()) {
                return redirect()->intended(route('admin.dashboard'))->with('success', 'Welcome to the Admin Dashboard!');
            }

            return redirect()->intended(route('dashboard'))->with('success', 'Welcome back!');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    /**
     * Display the registration view.
     */
    public function showRegister(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     */
    public function register(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'alarm_sound_enabled' => true,
        ]);

        Auth::login($user);
        ActivityLog::record($user, 'User registration', null, 'Account created.', 'success');

        return redirect(route('dashboard'))->with('success', 'Account created! Welcome to TaskTrack.');
    }

    /**
     * Destroy an authenticated session.
     */
    public function logout(Request $request): RedirectResponse
    {
        if ($request->user()) {
            ActivityLog::record($request->user(), 'Logout', null, 'Session ended.', 'success');
        }
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect(route('home'))->with('success', 'You have been logged out.');
    }
}

