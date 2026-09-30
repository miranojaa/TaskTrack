import React, { useState, useRef, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import { TaskAlert } from '@/types';

interface NotificationBellProps {
    alerts: TaskAlert[];
    unreadCount: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
    alerts,
    unreadCount,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [alertItems, setAlertItems] = useState(alerts);
    const [alertsLoaded, setAlertsLoaded] = useState(alerts.length > 0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAllAsRead = () => {
        setAlertItems((current) => current.map((alert) => ({ ...alert, is_read: true })));
        router.post('/api/alerts/read', {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const markSingleAsRead = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setAlertItems((current) => current.map((alert) => alert.id === id ? { ...alert, is_read: true } : alert));
        router.post(`/api/alerts/read/${id}`, {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const toggleOpen = () => {
        const opening = !isOpen;
        setIsOpen(opening);
        if (opening && !alertsLoaded) {
            setAlertsLoaded(true);
            fetch('/api/alerts/recent', { headers: { Accept: 'application/json' } })
                .then((response) => response.ok ? response.json() : Promise.reject())
                .then((data: { alerts: TaskAlert[] }) => setAlertItems(data.alerts))
                .catch(() => setAlertsLoaded(false));
        }
    };

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                type="button"
                onClick={toggleOpen}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Deadline Notifications"
                title="Deadline Notifications & Alarms"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                                Notifications
                            </h3>
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            {/* Mark all as read */}
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllAsRead}
                                    className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Alerts List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {alertItems.length === 0 ? (
                            <div className="p-6 text-center text-sm text-slate-400 dark:text-slate-500">
                                <svg className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                No notifications right now.
                            </div>
                        ) : (
                            alertItems.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={`flex items-start gap-3 p-3.5 transition-colors ${
                                        !alert.is_read
                                            ? 'bg-indigo-50/40 hover:bg-indigo-50/70 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}
                                >
                                    {/* Alert Icon */}
                                    <div className="mt-0.5 shrink-0">
                                        {alert.type === 'overdue' ? (
                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                        ) : (
                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Alert Content */}
                                    <div className="flex-1 min-w-0">
                                        <Link href="/notifications" onClick={() => setIsOpen(false)} className="block truncate text-xs font-semibold text-slate-800 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400">
                                            {alert.task ? alert.task.title : 'Task notification'}
                                        </Link>
                                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                            {alert.message}
                                        </p>
                                        <span className="mt-1 block text-[11px] text-slate-400 dark:text-slate-500">
                                            {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    {/* Mark Read Action */}
                                    {!alert.is_read && (
                                        <button
                                            type="button"
                                            onClick={(e) => markSingleAsRead(alert.id, e)}
                                            className="shrink-0 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1"
                                            title="Mark as read"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    <Link href="/notifications" onClick={() => setIsOpen(false)} className="block border-t border-slate-100 px-4 py-3 text-center text-xs font-semibold text-indigo-600 hover:bg-slate-50 dark:border-slate-800 dark:text-indigo-400 dark:hover:bg-slate-800/50">
                        View all notifications
                    </Link>
                </div>
            )}
        </div>
    );
};

