import React from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { Auth, Paginated, TaskAlert } from '@/types';
import { PaginationLinks } from '@/components/pagination-links';

interface NotificationsProps {
    alerts: Paginated<TaskAlert>;
}

export default function Notifications({ alerts }: NotificationsProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth.user;
    const preferencesForm = useForm({
        alarm_sound_enabled: user?.alarm_sound_enabled ?? true,
        notify_task_created: user?.notify_task_created ?? true,
        notify_task_updated: user?.notify_task_updated ?? true,
        notify_task_completed: user?.notify_task_completed ?? true,
        notify_overdue: user?.notify_overdue ?? true,
    });
    const [desktopEnabled, setDesktopEnabled] = React.useState(() => typeof window !== 'undefined' && localStorage.getItem('tasktrack-desktop-notifications') === 'true');
    const [permission, setPermission] = React.useState<NotificationPermission>(() => typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied');

    const markAsRead = (id: number) => {
        router.post(`/api/alerts/read/${id}`, {}, { preserveScroll: true });
    };

    const clearAll = () => {
        router.post(`/api/alerts/read`, {}, { preserveScroll: true });
    };

    const deleteAlert = (id: number) => {
        router.delete(`/api/alerts/${id}`, { preserveScroll: true });
    };

    const savePreferences = (event: React.FormEvent) => {
        event.preventDefault();
        preferencesForm.patch('/profile/preferences', {
            preserveScroll: true,
            onSuccess: () => window.dispatchEvent(new Event('tasktrack:refresh-alarms')),
        });
    };

    const toggleDesktopNotifications = async () => {
        if (desktopEnabled) {
            localStorage.setItem('tasktrack-desktop-notifications', 'false');
            setDesktopEnabled(false);
            return;
        }
        if (!('Notification' in window)) return;
        const nextPermission = permission === 'granted' ? permission : await Notification.requestPermission();
        setPermission(nextPermission);
        if (nextPermission === 'granted') {
            localStorage.setItem('tasktrack-desktop-notifications', 'true');
            setDesktopEnabled(true);
        }
    };

    return (
        <AppLayout>
            <Head title="Notifications" />
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">Notifications</h1>
                        <p className="mt-1 text-sm font-medium text-slate-500">Task activity, deadline alarms, and notification preferences.</p>
                    </div>
                    {alerts.data.some(a => !a.is_read) && (
                        <button onClick={clearAll} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                            Mark all as read
                        </button>
                    )}
                </div>

                <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Notification preferences</h2>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Choose which task events appear here and whether deadline alarms use sound.</p>
                        </div>
                        <button type="button" onClick={toggleDesktopNotifications} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                            {desktopEnabled ? 'Disable desktop notifications' : permission === 'denied' ? 'Browser permission blocked' : 'Enable desktop notifications'}
                        </button>
                    </div>
                    <form onSubmit={savePreferences} className="mt-5">
                        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                            {([
                                ['alarm_sound_enabled', 'Play alarm sound at task deadlines'],
                                ['notify_task_created', 'New task notifications'],
                                ['notify_task_updated', 'Task updated notifications'],
                                ['notify_task_completed', 'Task completed notifications'],
                                ['notify_overdue', 'Task overdue notifications'],
                            ] as const).map(([field, label]) => (
                                <label key={field} className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                                    <input type="checkbox" checked={preferencesForm.data[field]} onChange={(event) => preferencesForm.setData(field, event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-900" />
                                    {label}
                                </label>
                            ))}
                        </div>
                        <button type="submit" disabled={preferencesForm.processing} className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                            {preferencesForm.processing ? 'Saving...' : 'Save preferences'}
                        </button>
                    </form>
                </section>

                <div className="space-y-3">
                    {alerts.data.length === 0 ? (
                        <div className="rounded-3xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
                            <p className="text-sm text-slate-500">You have no notifications right now.</p>
                        </div>
                    ) : (
                        alerts.data.map(alert => (
                            <div key={alert.id} className={`flex items-start gap-4 rounded-2xl p-5 shadow-sm transition ring-1 ${alert.is_read ? 'bg-white ring-slate-100 dark:bg-slate-900 dark:ring-slate-800 opacity-70' : 'bg-indigo-50/50 ring-indigo-100 dark:bg-indigo-900/20 dark:ring-indigo-900/50'}`}>
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${alert.is_read ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' : 'bg-indigo-600 text-white'}`}>
                                    🔔
                                </div>
                                <div className="flex-1">
                                    <h4 className={`text-sm font-bold ${alert.is_read ? 'text-slate-900 dark:text-white' : 'text-indigo-900 dark:text-indigo-100'}`}>
                                        {alert.message}
                                    </h4>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {new Date(alert.created_at).toLocaleString()}
                                    </p>
                                </div>
                                {!alert.is_read && (
                                    <button onClick={() => markAsRead(alert.id)} className="rounded-lg bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300">
                                        Mark Read
                                    </button>
                                )}
                                <button onClick={() => deleteAlert(alert.id)} aria-label={`Delete notification: ${alert.message}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400" title="Delete notification">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 7h12m-10 0V5h8v2m-7 0v12m4-12v12M5 7l1 14h12l1-14" /></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
                <PaginationLinks links={alerts.links} />
            </div>
        </AppLayout>
    );
}
