import React from 'react';
import { Link, usePage } from '@inertiajs/react';

interface GuestLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
}

export const GuestLayout: React.FC<GuestLayoutProps> = ({
    children,
    title,
    subtitle,
}) => {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            {/* Flash Messages */}
            {flash?.success && (
                <div className="fixed top-4 inset-x-4 max-w-md mx-auto z-50 bg-emerald-500 text-white px-4 py-2.5 rounded-2xl text-center text-xs sm:text-sm font-medium shadow-lg">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="fixed top-4 inset-x-4 max-w-md mx-auto z-50 bg-rose-500 text-white px-4 py-2.5 rounded-2xl text-center text-xs sm:text-sm font-medium shadow-lg">
                    {flash.error}
                </div>
            )}

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
                <Link href="/" className="inline-flex items-center gap-2.5 font-black text-2xl tracking-tight text-indigo-600 dark:text-indigo-400">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    </div>
                    <span className="text-slate-900 dark:text-white font-black text-2xl">Task<span className="text-indigo-600 dark:text-indigo-400">Track</span></span>
                </Link>

                {title && (
                    <h2 className="mt-6 text-2xl font-extrabold text-slate-900 dark:text-white">
                        {title}
                    </h2>
                )}
                {subtitle && (
                    <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        {subtitle}
                    </p>
                )}
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
                <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xl ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
                    {children}
                </div>
            </div>
        </div>
    );
};

