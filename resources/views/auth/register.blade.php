<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Sign Up - TaskTrack</title>
    <link rel="icon" href="/favicon.ico">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-full bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-900 antialiased">
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <a href="/" class="inline-flex items-center gap-2.5 font-black text-2xl tracking-tight text-indigo-600">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            </div>
            <span class="text-slate-900 font-black text-2xl">Task<span class="text-indigo-600">Track</span></span>
        </a>
        <h2 class="mt-6 text-2xl font-extrabold text-slate-900">Create your TaskTrack Account</h2>
        <p class="mt-2 text-xs sm:text-sm text-slate-500">Start organizing tasks and never miss another deadline</p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div class="rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-slate-100">
            <form action="{{ route('register') }}" method="POST" class="space-y-4">
                @csrf
                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name</label>
                    <input type="text" name="name" value="{{ old('name') }}" required autofocus class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none">
                    @error('name') <p class="mt-1 text-xs text-rose-500">{{ $message }}</p> @enderror
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Address</label>
                    <input type="email" name="email" value="{{ old('email') }}" required class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none">
                    @error('email') <p class="mt-1 text-xs text-rose-500">{{ $message }}</p> @enderror
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Password</label>
                    <input type="password" name="password" required class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none">
                    @error('password') <p class="mt-1 text-xs text-rose-500">{{ $message }}</p> @enderror
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Confirm Password</label>
                    <input type="password" name="password_confirmation" required class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none">
                </div>

                <button type="submit" class="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700">
                    Create Account
                </button>
            </form>

            <div class="mt-6 text-center text-xs text-slate-500">
                Already have an account? <a href="{{ route('login') }}" class="font-semibold text-indigo-600 hover:underline">Sign in here</a>
            </div>
        </div>
    </div>
</body>
</html>

