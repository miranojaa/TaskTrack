<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'TaskTrack - Task Management & Deadline Notification System')</title>
    <link rel="icon" href="/favicon.ico">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        indigo: {
                            50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
                            400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
                            800: '#3730a3', 900: '#312e81', 950: '#1e1b4b',
                        }
                    }
                }
            }
        }
    </script>
</head>
<body class="min-h-full bg-slate-50 text-slate-900 flex flex-col antialiased">
    @php
        $authUser = auth()->user();
        $unreadCount = $unreadAlertsCount ?? 0;
        $recentAlerts = collect($alerts ?? [])->map(fn($a) => is_array($a) ? (object)$a : $a);
        $alarmSoundEnabled = $authUser ? (bool) $authUser->alarm_sound_enabled : true;
    @endphp

    <!-- Sound & Notification Controller -->
    <script>
        // Web Audio API Sound Synthesizer
        class TaskAlertSoundManager {
            constructor() {
                this.audioCtx = null;
                this.soundEnabled = {{ $alarmSoundEnabled ? 'true' : 'false' }};
            }
            getCtx() {
                if (!this.audioCtx) {
                    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                    if (AudioContextClass) this.audioCtx = new AudioContextClass();
                }
                if (this.audioCtx && this.audioCtx.state === 'suspended') {
                    this.audioCtx.resume();
                }
                return this.audioCtx;
            }
            playChime() {
                if (!this.soundEnabled) return;
                try {
                    const ctx = this.getCtx();
                    if (!ctx) return;
                    const now = ctx.currentTime;
                    // First tone
                    const osc1 = ctx.createOscillator();
                    const gain1 = ctx.createGain();
                    osc1.type = 'sine';
                    osc1.frequency.setValueAtTime(587.33, now);
                    gain1.gain.setValueAtTime(0, now);
                    gain1.gain.linearRampToValueAtTime(0.2, now + 0.05);
                    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                    osc1.connect(gain1);
                    gain1.connect(ctx.destination);
                    osc1.start(now);
                    osc1.stop(now + 0.5);

                    // Second tone
                    const osc2 = ctx.createOscillator();
                    const gain2 = ctx.createGain();
                    osc2.type = 'sine';
                    osc2.frequency.setValueAtTime(880.0, now + 0.18);
                    gain2.gain.setValueAtTime(0, now + 0.18);
                    gain2.gain.linearRampToValueAtTime(0.25, now + 0.22);
                    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
                    osc2.connect(gain2);
                    gain2.connect(ctx.destination);
                    osc2.start(now + 0.18);
                    osc2.stop(now + 0.7);
                } catch(e) { console.warn(e); }
            }
            playOverdueAlarm() {
                if (!this.soundEnabled) return;
                try {
                    const ctx = this.getCtx();
                    if (!ctx) return;
                    const now = ctx.currentTime;
                    [659.25, 783.99, 987.77].forEach((freq, idx) => {
                        const start = now + idx * 0.15;
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(freq, start);
                        gain.gain.setValueAtTime(0, start);
                        gain.gain.linearRampToValueAtTime(0.3, start + 0.04);
                        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(start);
                        osc.stop(start + 0.35);
                    });
                } catch(e) { console.warn(e); }
            }
            testSound() {
                const prev = this.soundEnabled;
                this.soundEnabled = true;
                this.playChime();
                this.soundEnabled = prev;
            }
        }
        window.soundManager = new TaskAlertSoundManager();

        // Periodic Background Poller (every 30 seconds)
        const seenAlertIds = new Set([@foreach($recentAlerts as $a) {{ $a->id }}, @endforeach]);
        setInterval(async () => {
            try {
                const res = await fetch('{{ route("alerts.check") }}');
                if (!res.ok) return;
                const data = await res.json();
                const unread = data.unread_alerts || [];
                unread.forEach(alert => {
                    if (!seenAlertIds.has(alert.id)) {
                        seenAlertIds.add(alert.id);
                        if (alert.type === 'overdue' || alert.type === 'deadline_reached') {
                            window.soundManager.playOverdueAlarm();
                        }
                        if ('Notification' in window && Notification.permission === 'granted' && localStorage.getItem('tasktrack-desktop-notifications') === 'true') {
                            new Notification(`TaskTrack: ${alert.type.replace('_', ' ')}`, {
                                body: alert.message,
                                icon: '/favicon.ico'
                            });
                        }
                        showToast(alert.type === 'overdue' || alert.type === 'deadline_reached' ? 'Task Deadline' : `Task ${alert.type}`, alert.message, alert.type);
                    }
                });
            } catch(e) {}
        }, 30000);

        function showToast(title, message, type) {
            const container = document.getElementById('toast-container');
            if (!container) return;
            const toast = document.createElement('div');
            toast.className = `flex items-start gap-3 rounded-2xl p-4 shadow-xl border transition-all animate-bounce ${
                type === 'overdue' ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-amber-50 border-amber-300 text-amber-900'
            }`;
            toast.innerHTML = `
                <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-sm">${title}</h4>
                    <p class="mt-0.5 text-xs opacity-90">${message}</p>
                </div>
                <button onclick="this.parentElement.remove()" class="shrink-0 text-slate-400 hover:text-slate-600">&times;</button>
            `;
            container.appendChild(toast);
            setTimeout(() => toast.remove(), 8000);
        }
    </script>

    <!-- Navigation Header -->
    <header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <!-- Brand -->
            <div class="flex items-center gap-6">
                <a href="{{ route('dashboard') }}" class="flex items-center gap-2.5 font-black text-xl tracking-tight text-indigo-600">
                    <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    </div>
                    <span class="text-slate-900 font-extrabold text-lg">Task<span class="text-indigo-600">Track</span></span>
                </a>

                <nav class="hidden md:flex items-center gap-1">
                    <a href="{{ route('dashboard') }}" class="rounded-xl px-3.5 py-2 text-sm font-semibold {{ request()->routeIs('dashboard') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100' }}">
                        Dashboard
                    </a>
                    <a href="{{ route('settings.edit') }}" class="rounded-xl px-3.5 py-2 text-sm font-semibold {{ request()->routeIs('settings.edit') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100' }}">
                        Settings & Alarms
                    </a>
                </nav>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 sm:gap-3">
                <!-- Notification Bell Dropdown -->
                <div class="relative" id="bell-dropdown-container">
                    <button
                        type="button"
                        onclick="document.getElementById('bell-dropdown-menu').classList.toggle('hidden')"
                        class="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none"
                    >
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        @if($unreadCount > 0)
                            <span class="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                                {{ $unreadCount > 9 ? '9+' : $unreadCount }}
                            </span>
                        @endif
                    </button>

                    <!-- Bell Menu -->
                    <div id="bell-dropdown-menu" class="hidden absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden">
                        <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50">
                            <div class="flex items-center gap-2">
                                <h3 class="font-semibold text-sm text-slate-800">Deadline Alerts</h3>
                                @if($unreadCount > 0)
                                    <span class="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">{{ $unreadCount }} new</span>
                                @endif
                            </div>
                            <div class="flex items-center gap-2">
                                @if($unreadCount > 0)
                                    <form action="{{ route('alerts.read') }}" method="POST" class="inline">
                                        @csrf
                                        <button type="submit" class="text-xs text-slate-500 font-semibold hover:text-slate-800">Mark all read</button>
                                    </form>
                                @endif
                            </div>
                        </div>

                        <div class="max-h-80 overflow-y-auto divide-y divide-slate-100">
                            @forelse($recentAlerts as $alert)
                                <div class="flex items-start gap-3 p-3.5 {{ !$alert->is_read ? 'bg-indigo-50/40' : '' }}">
                                    <div class="mt-0.5 shrink-0">
                                        @if($alert->type === 'overdue')
                                            <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600">🚨</span>
                                        @else
                                            <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">⏳</span>
                                        @endif
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <p class="text-xs font-semibold text-slate-800 truncate">
                                            @if(is_object($alert->task ?? null))
                                                {{ $alert->task->title }}
                                            @elseif(is_array($alert->task ?? null))
                                                {{ $alert->task['title'] ?? 'Task Deadline Alert' }}
                                            @else
                                                Task Deadline Alert
                                            @endif
                                        </p>
                                        <p class="mt-0.5 text-xs text-slate-600">{{ $alert->message }}</p>
                                        <span class="mt-1 block text-[11px] text-slate-400">
                                            @if(isset($alert->created_at) && $alert->created_at instanceof \Carbon\Carbon)
                                                {{ $alert->created_at->diffForHumans() }}
                                            @elseif(isset($alert->created_at))
                                                {{ \Carbon\Carbon::parse($alert->created_at)->diffForHumans() }}
                                            @else
                                                Recently
                                            @endif
                                        </span>
                                    </div>
                                    @if(!$alert->is_read)
                                        <form action="{{ route('alerts.read', $alert->id) }}" method="POST">
                                            @csrf
                                            <button type="submit" class="text-slate-400 hover:text-indigo-600 text-xs p-1" title="Mark as read">&#10003;</button>
                                        </form>
                                    @endif
                                </div>
                            @empty
                                <div class="p-6 text-center text-sm text-slate-400">
                                    No deadline alerts right now. You're on track!
                                </div>
                            @endforelse
                        </div>
                    </div>
                </div>

                <!-- User Dropdown -->
                <div class="relative">
                    <button
                        type="button"
                        onclick="document.getElementById('user-menu-dropdown').classList.toggle('hidden')"
                        class="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 transition focus:outline-none"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-xs font-bold text-white shadow-sm">
                            {{ substr($authUser->name ?? 'User', 0, 1) }}
                        </div>
                        <span class="hidden sm:block text-xs font-semibold text-slate-800">{{ $authUser->name ?? 'User' }}</span>
                        <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    <div id="user-menu-dropdown" class="hidden absolute right-0 mt-2 w-48 rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-black/5 z-50">
                        <div class="px-3 py-2 border-b border-slate-100">
                            <p class="text-xs font-bold text-slate-900 truncate">{{ $authUser->name ?? '' }}</p>
                            <p class="text-[11px] text-slate-500 truncate">{{ $authUser->email ?? '' }}</p>
                        </div>
                        <a href="{{ route('profile.edit') }}" class="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition">
                            Profile
                        </a>
                        <form action="{{ route('logout') }}" method="POST">
                            @csrf
                            <button type="submit" class="w-full text-left flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition">
                                Log Out
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Flash Messages -->
    @if(session('success'))
        <div class="bg-emerald-500 text-white px-4 py-2.5 text-center text-xs sm:text-sm font-medium shadow-md">
            {{ session('success') }}
        </div>
    @endif
    @if(session('error'))
        <div class="bg-rose-500 text-white px-4 py-2.5 text-center text-xs sm:text-sm font-medium shadow-md">
            {{ session('error') }}
        </div>
    @endif

    <!-- Main Content -->
    <main class="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        @yield('content')
    </main>

    <!-- Floating Toast Stack -->
    <div id="toast-container" class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"></div>

    <footer class="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        TaskTrack &copy; {{ date('Y') }} &mdash; Task Management & Deadline Notification System.
    </footer>
</body>
</html>
