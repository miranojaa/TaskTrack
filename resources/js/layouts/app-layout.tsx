import React, { useEffect, useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { Auth, TaskAlert } from '@/types';
import { NotificationBell } from '@/components/notification-bell';
import { AlarmManager } from '@/components/alarm-manager';
import { ToastViewport } from '@/components/toast-viewport';
import { soundManager } from '@/lib/sound';
import {
    Bell,
    CalendarDays,
    ClipboardCheck,
    FolderOpen,
    History as HistoryIcon,
    House,
    LogOut,
    Moon,
    Settings,
    Sun,
    UserRound,
    UsersRound,
    ListChecks,
    type LucideIcon,
} from 'lucide-react';

interface SidebarItem {
    label: string;
    href: string;
    icon: LucideIcon;
}

const adminNavigation: SidebarItem[] = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: House },
    { label: 'Users', href: '/admin/users', icon: UsersRound },
    { label: 'All Tasks', href: '/admin/tasks', icon: ListChecks },
    { label: 'History', href: '/admin/history', icon: HistoryIcon },
    { label: 'Admin Profile', href: '/profile', icon: UserRound },
];

const workspaceNavigation: SidebarItem[] = [
    { label: 'Home', href: '/dashboard', icon: House },
    { label: 'My Tasks', href: '/tasks', icon: ClipboardCheck },
    { label: 'Calendar', href: '/calendar', icon: CalendarDays },
    { label: 'Notifications', href: '/notifications', icon: Bell },
    { label: 'Files', href: '/files', icon: FolderOpen },
    { label: 'History', href: '/history', icon: HistoryIcon },
    { label: 'Profile', href: '/profile', icon: UserRound },
    { label: 'Settings', href: '/settings', icon: Settings },
];

interface AppLayoutProps {
    children: React.ReactNode;
    alerts?: TaskAlert[];
    unreadAlertsCount?: number;
}

interface PageProps {
    auth: Auth;
    name: string;
    unreadAlertsCount?: number;
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
    children,
    alerts = [],
    unreadAlertsCount = 0,
}) => {
    const { auth, flash, unreadAlertsCount: sharedUnreadCount } = usePage<PageProps>().props;
    const user = auth.user;
    const navigation = user?.role === 'admin' ? adminNavigation : workspaceNavigation;

    const [soundEnabled, setSoundEnabled] = useState<boolean>(
        user?.alarm_sound_enabled !== undefined ? !!user.alarm_sound_enabled : true
    );
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
    const [darkMode, setDarkMode] = useState(() => user?.theme === 'dark' || localStorage.getItem('tasktrack-theme') === 'dark');

    useEffect(() => {
        if (user) {
            soundManager.setSoundType(user.alarm_sound || 'classic');
            soundManager.setVolume(user.alarm_volume !== undefined ? user.alarm_volume : 70);
        }
    }, [user?.alarm_sound, user?.alarm_volume]);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        localStorage.setItem('tasktrack-theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    useEffect(() => {
        setSoundEnabled(user?.alarm_sound_enabled !== undefined ? !!user.alarm_sound_enabled : true);
    }, [user?.alarm_sound_enabled]);

    useEffect(() => {
        const updateConnection = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', updateConnection);
        window.addEventListener('offline', updateConnection);
        return () => {
            window.removeEventListener('online', updateConnection);
            window.removeEventListener('offline', updateConnection);
        };
    }, []);

    const handleLogout = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/logout');
    };

    return (
        <div className="absolute inset-0 flex bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased overflow-hidden">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 flex flex-col border-r border-slate-200 bg-white px-3 py-5 shadow-xl transition-transform dark:border-slate-800 dark:bg-slate-900 md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="mb-8 flex items-center gap-2 px-3">
                    <img src="/tasktrack-mark.svg" alt="" className="h-9 w-9" />
                    <span className="text-lg font-black text-slate-900 dark:text-white">Task<span className="text-[#0875F5]">Track</span></span>
                </div>
                <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    {user?.role === 'admin' ? 'Administration' : 'Workspace'}
                </p>
                <nav className="space-y-1 overflow-y-auto flex-1 pb-4">
                    {navigation.map(({ label, href, icon: Icon }) => {
                        const isActive = window.location.pathname === href;

                        return (
                            <Link
                                key={label}
                                href={href}
                                onClick={() => setMobileMenuOpen(false)}
                                aria-current={isActive ? 'page' : undefined}
                                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-slate-800 dark:hover:text-indigo-300 ${isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-slate-800 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300'}`}
                            >
                                <Icon aria-hidden="true" size={19} strokeWidth={1.8} className="shrink-0" />
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="shrink-0 space-y-1 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <button type="button" onClick={() => { const next = !darkMode; setDarkMode(next); router.patch('/profile/preferences', { theme: next ? 'dark' : 'light' }, { preserveState: true, preserveScroll: true }); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                        {darkMode ? <Sun aria-hidden="true" size={19} strokeWidth={1.8} className="shrink-0" /> : <Moon aria-hidden="true" size={19} strokeWidth={1.8} className="shrink-0" />}
                        <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30">
                        <LogOut aria-hidden="true" size={19} strokeWidth={1.8} className="shrink-0" />
                        <span>Log out</span>
                    </button>
                </div>
            </aside>

            {mobileMenuOpen && <button type="button" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 z-40 bg-slate-950/40 md:hidden" />}

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
                <ToastViewport flash={flash} />
                {/* Real-time Alarm Audio & Polling Manager */}
                {user?.role !== 'admin' && <AlarmManager soundEnabled={soundEnabled} />}

                {/* Main Navigation Bar */}
                <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 shrink-0">
                    <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
                        {/* Brand / Logo */}
                        <div className="flex items-center gap-6">
                            <Link href="/dashboard" className="flex items-center gap-2.5 font-black text-xl tracking-tight text-indigo-600 dark:text-indigo-400 md:hidden">
                                <img src="/tasktrack-mark.svg" alt="" className="h-9 w-9" />
                                <span className="text-slate-900 dark:text-white font-extrabold text-lg md:hidden">Task<span className="text-[#0875F5]">Track</span></span>
                                <span className="text-slate-900 dark:text-white font-extrabold text-lg hidden md:inline">Task<span className="text-[#0875F5]">Track</span></span>
                            </Link>

                            {/* Desktop Nav Links */}
                            <nav className="hidden md:flex items-center gap-1">
                                <Link
                                    href="/dashboard"
                                    className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/settings"
                                    className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition"
                                >
                                    Settings & Alarms
                                </Link>
                            </nav>
                        </div>

                        {/* Right Action Icons: Notification Bell, User Menu */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Notification Bell Dropdown */}
                            <NotificationBell
                                alerts={alerts}
                                unreadCount={sharedUnreadCount ?? unreadAlertsCount}
                            />

                            <span role="status" aria-live="polite" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
                            </span>

                            {/* User Profile Menu Dropdown */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none"
                                >
                                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-xs font-bold text-white shadow-sm">
                                        {user?.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <span className="hidden sm:block text-xs font-semibold text-slate-800 dark:text-slate-200">
                                        {user?.name}
                                    </span>
                                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10 z-50">
                                        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                                        </div>
                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Profile
                                        </Link>
                                        <form onSubmit={handleLogout}>
                                            <button
                                                type="submit"
                                                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50 transition"
                                            >
                                                <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                Log Out
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>

                            {/* Mobile hamburger */}
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation Drawer */}
                    {mobileMenuOpen && (
                        <div className="md:hidden border-t border-slate-200 px-4 py-3 dark:border-slate-800 space-y-1 bg-white dark:bg-slate-900">
                            <Link
                                href="/dashboard"
                                className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/settings"
                                className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Settings & Alarms
                            </Link>
                        </div>
                    )}
                </header>

                {/* Main Page Content */}
                <main className="flex-1 w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                </main>

                {/* Footer */}
                <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <p>TaskTrack &copy; {new Date().getFullYear()} &mdash; Task Management & Deadline Notification System.</p>
                </footer>
            </div>
        </div>
    );
};

