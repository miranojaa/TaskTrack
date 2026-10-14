<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>TaskTrack - Task Management & Deadline Notification System</title>
    <link rel="icon" href="/tasktrack-mark.svg" type="image/svg+xml">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-full bg-gradient-to-b from-slate-50 via-white to-indigo-50/30 text-slate-900 antialiased flex flex-col">
    <!-- Header -->
    <header class="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col items-center justify-center leading-none">
            <img src="/tasktrack-mark.svg" alt="" class="h-11 w-11">
            <span class="mt-0.5 text-base font-black tracking-tight text-slate-900">
                Task<span class="text-[#0875F5]">Track</span>
            </span>
        </div>

        <div class="flex items-center gap-3">
            @auth
                <a href="{{ route('dashboard') }}" class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition">Go to Dashboard</a>
            @else
                <a href="{{ route('login') }}" class="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">Sign In</a>
                <a href="{{ route('register') }}" class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition">Get Started Free</a>
            @endauth
        </div>
    </header>

    <!-- Hero Section -->
    <main class="flex-1 mx-auto max-w-7xl px-4 pt-12 pb-24 sm:px-6 lg:px-8 lg:pt-20">
        <div class="text-center max-w-3xl mx-auto">
            <div class="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm mb-6">
                <span class="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping"></span>
                Smart Deadline Monitoring & Alarm System
            </div>

            <h1 class="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl">
                Never Miss a Task <br />
                <span class="bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 bg-clip-text text-transparent">
                    Deadline Again
                </span>
            </h1>

            <p class="mt-6 text-base sm:text-lg leading-relaxed text-slate-600">
                TaskTrack combines organized task management with real-time deadline monitoring, audible chimes, and browser alerts at each task's scheduled time.
            </p>

            <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="{{ route('register') }}" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-indigo-600/25 hover:bg-indigo-700 transition">
                    Start Organizing Tasks
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </a>
                <a href="{{ route('login') }}" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-800 shadow-sm hover:bg-slate-50 transition">
                    Explore Live Demo
                </a>
            </div>

            <p class="mt-3 text-xs text-slate-400">
                Demo credentials available with pre-configured task examples.
            </p>
        </div>

        <!-- Highlights Grid -->
        <div class="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div class="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200">
                <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 mb-5 font-bold text-xl">📋</div>
                <h3 class="text-lg font-bold text-slate-900">Task Organization & Priority</h3>
                <p class="mt-2 text-sm text-slate-500 leading-relaxed">Prioritize tasks (Urgent, High, Medium, Low) and keep complete status visibility from Pending to Completed.</p>
            </div>
            <div class="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200">
                <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mb-5 font-bold text-xl">🔔</div>
                <h3 class="text-lg font-bold text-slate-900">Real-time Audio Alarms</h3>
                <p class="mt-2 text-sm text-slate-500 leading-relaxed">Hear synthesized chimes and receive notifications when each task reaches its scheduled deadline.</p>
            </div>
            <div class="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200">
                <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 mb-5 font-bold text-xl">🚨</div>
                <h3 class="text-lg font-bold text-slate-900">Automatic Overdue Detection</h3>
                <p class="mt-2 text-sm text-slate-500 leading-relaxed">Tasks are marked overdue after their scheduled deadlines pass without completion.</p>
            </div>
        </div>
    </main>

    <footer class="border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        TaskTrack &copy; {{ date('Y') }} &mdash; Task Management and Deadline Notification System.
    </footer>
</body>
</html>

