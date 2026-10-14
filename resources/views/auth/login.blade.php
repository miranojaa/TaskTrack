<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Sign In - TaskTrack</title>
    <link rel="icon" href="/tasktrack-mark.svg" type="image/svg+xml">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-full bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-900 antialiased">
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <a href="/" class="inline-flex flex-col items-center gap-1 font-black tracking-tight">
            <img src="/tasktrack-mark.svg" alt="" class="h-16 w-16">
            <div class="hidden">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            </div>
            <span class="text-slate-900 font-black text-2xl">Task<span class="text-[#0875F5]">Track</span></span>
        </a>
        <h2 class="mt-6 text-2xl font-extrabold text-slate-900">Welcome back to TaskTrack</h2>
        <p class="mt-2 text-xs sm:text-sm text-slate-500">Sign in to track your tasks and stay ahead of deadlines</p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div class="rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-slate-100">
            <!-- Demo autofill -->
            <div class="mb-6 rounded-2xl bg-indigo-50 p-3 text-center border border-indigo-100">
                <p class="text-xs text-indigo-900">Want to test immediately with demo tasks & alarms?</p>
                <button
                    type="button"
                    onclick="document.getElementById('email').value='test@example.com';document.getElementById('password').value='password';"
                    class="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                    Autofill Demo Account
                </button>
            </div>

            <form action="{{ route('login') }}" method="POST" class="space-y-4">
                @csrf
                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Address</label>
                    <input type="email" id="email" name="email" value="{{ old('email') }}" required autofocus class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none">
                    @error('email') <p class="mt-1 text-xs text-rose-500">{{ $message }}</p> @enderror
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Password</label>
                    <input type="password" id="password" name="password" required class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none">
                    @error('password') <p class="mt-1 text-xs text-rose-500">{{ $message }}</p> @enderror
                </div>

                <div class="flex items-center justify-between">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="remember" checked class="rounded border-slate-300 text-indigo-600">
                        <span class="text-xs text-slate-600">Remember me</span>
                    </label>
                </div>

                <button type="submit" class="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700">
                    Sign In
                </button>
            </form>

            <div class="mt-6 text-center text-xs text-slate-500">
                Don't have an account? <a href="{{ route('register') }}" class="font-semibold text-indigo-600 hover:underline">Create one now</a>
            </div>
        </div>
    </div>
</body>
</html>

