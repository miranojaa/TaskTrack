import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ToastViewport } from '@/components/toast-viewport';

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
            <ToastViewport flash={flash} />

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
                <Link href="/" className="inline-flex flex-col items-center gap-1 font-black tracking-tight">
                    <img src="/tasktrack-mark.svg" alt="" className="h-16 w-16" />
                    <span className="text-slate-900 dark:text-white font-black text-2xl">Task<span className="text-[#0875F5]">Track</span></span>
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

