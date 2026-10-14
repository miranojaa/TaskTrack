import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ToastViewport } from '@/components/toast-viewport';

export default function Welcome() {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/30 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
            <ToastViewport flash={flash} />
            <Head title="TaskTrack - Task Management & Deadline Notification System" />

            {/* Top Navigation */}
            <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-center leading-none">
                    <img src="/tasktrack-mark.svg" alt="" className="h-11 w-11" />
                    <span className="mt-0.5 text-base font-black tracking-tight text-slate-900 dark:text-white">
                        Task<span className="text-[#0875F5]">Track</span>
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/login"
                        className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition"
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/register"
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition"
                    >
                        Get Started Free
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <main className="mx-auto max-w-7xl px-4 pt-12 pb-24 sm:px-6 lg:px-8 lg:pt-20">
                <div className="text-center max-w-3xl mx-auto">
                    {/* Urgency Badge */}
                    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-4 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300 shadow-sm mb-6">
                        <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping"></span>
                        Smart Deadline Monitoring & Alarm System
                    </div>

                    <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl dark:text-white">
                        Never Miss a Task <br />
                        <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 bg-clip-text text-transparent">
                            Deadline Again
                        </span>
                    </h1>

                    <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                        TaskTrack combines structured task management with real-time deadline monitoring, audible chimes, and browser alerts at each task's scheduled time.
                    </p>

                    {/* CTA Buttons */}
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-indigo-600/25 hover:bg-indigo-700 transition active:scale-95"
                        >
                            Start Organizing Tasks
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                        <Link
                            href="/login"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition"
                        >
                            Explore Live Demo
                        </Link>
                    </div>

                    <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                        Demo credentials available with pre-configured task examples.
                    </p>
                </div>

                {/* System Highlights Feature Grid */}
                <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {/* Feature 1 */}
                    <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-all hover:shadow-md hover:border-indigo-200">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 mb-5">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            Task Organization & Priority
                        </h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Organize tasks by priority (<span className="text-rose-500 font-semibold">Urgent</span>, <span className="text-amber-500 font-semibold">High</span>, <span className="text-blue-500 font-semibold">Medium</span>, <span className="text-emerald-500 font-semibold">Low</span>) and maintain full visibility with status tracking.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-all hover:shadow-md hover:border-indigo-200">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 mb-5">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            Real-time Audio Alarms & Bells
                        </h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Receive Web Audio chimes, browser desktop notifications, and in-app alerts when each task reaches its scheduled deadline.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-all hover:shadow-md hover:border-indigo-200">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 mb-5">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            Automatic Overdue Detection
                        </h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Tasks that cross deadlines without completion are automatically tagged as Overdue by background monitoring and highlighted on your dashboard.
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-all hover:shadow-md hover:border-indigo-200">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 mb-5">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            Visual KPI Dashboard
                        </h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Track completion rates, pending workloads, active in-progress tasks, and upcoming due dates in an intuitive dashboard.
                        </p>
                    </div>

                    {/* Feature 5 */}
                    <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-all hover:shadow-md hover:border-indigo-200">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 mb-5">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            Dynamic Search & Filtering
                        </h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Search keywords instantly and filter by status, priority, due date (Today, This Week, Overdue), and custom sort criteria.
                        </p>
                    </div>

                    {/* Feature 6 */}
                    <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-all hover:shadow-md hover:border-indigo-200">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400 mb-5">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            Cards & List Dual Views
                        </h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Switch easily between rich interactive cards with countdown timers or a dense table list view for fast batch management.
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <p>TaskTrack &copy; {new Date().getFullYear()} &mdash; Task Management and Deadline Notification System.</p>
            </footer>
        </div>
    );
}
