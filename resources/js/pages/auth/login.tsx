import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { GuestLayout } from '@/layouts/guest-layout';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    const fillDemoCredentials = () => {
        setData({
            email: 'test@example.com',
            password: 'password',
            remember: true,
        });
    };

    return (
        <GuestLayout
            title="Welcome back to TaskTrack"
            subtitle="Sign in to track your tasks and stay ahead of deadlines"
        >
            <Head title="Sign In" />

            {/* Quick Demo Fill Button */}
            <div className="mb-6 rounded-2xl bg-indigo-50/70 p-3 text-center dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
                <p className="text-xs text-indigo-900 dark:text-indigo-200">
                    Want to test immediately with sample tasks & deadline alarms?
                </p>
                <button
                    type="button"
                    onClick={fillDemoCredentials}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Autofill Demo Account
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        required
                        autoFocus
                    />
                    {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Password
                        </label>
                    </div>
                    <input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        required
                    />
                    {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password}</p>}
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-400">Remember me</span>
                    </label>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={processing}
                    className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50 transition"
                >
                    {processing ? 'Signing In...' : 'Sign In'}
                </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Don't have an account?{' '}
                <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline">
                    Create one now
                </Link>
            </div>
        </GuestLayout>
    );
}

