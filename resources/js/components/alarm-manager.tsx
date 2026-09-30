import React, { useEffect, useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import { soundManager } from '@/lib/sound';
import { TaskAlert } from '@/types';

interface AlarmManagerProps {
    soundEnabled: boolean;
    onNewAlert?: (alert: TaskAlert) => void;
}

export const AlarmManager: React.FC<AlarmManagerProps> = ({
    soundEnabled,
    onNewAlert,
}) => {
    const [floatingAlerts, setFloatingAlerts] = useState<Array<{ id: number; title: string; message: string; type: string }>>([]);
    const [activeAlert, setActiveAlert] = useState<TaskAlert | null>(null);
    const knownAlertIdsRef = useRef<Set<number>>(new Set());
    const isFirstLoadRef = useRef(true);

    // Sync soundEnabled setting with sound manager
    useEffect(() => {
        soundManager.setEnabled(soundEnabled);
    }, [soundEnabled]);

    useEffect(() => {
        if (activeAlert && (activeAlert.type === 'overdue' || activeAlert.type === 'deadline_reached') && soundEnabled) {
            soundManager.startLoopingAlarm();
        } else if (!soundEnabled || !activeAlert) {
            soundManager.stopLoopingAlarm();
        }
    }, [activeAlert, soundEnabled]);

    // Background poller for real-time deadline monitoring
    useEffect(() => {
        let polling = false;
        let pollTimer: ReturnType<typeof setTimeout> | null = null;

        const schedulePoll = (nextAlarmAt?: string | null) => {
            if (pollTimer) clearTimeout(pollTimer);
            const untilAlarm = nextAlarmAt ? Date.parse(nextAlarmAt) - Date.now() : 30_000;
            const delay = Math.max(0, Math.min(untilAlarm, 30_000));
            pollTimer = setTimeout(pollAlerts, delay);
        };

        const pollAlerts = async () => {
            if (polling) return;
            polling = true;

            try {
                const response = await fetch('/api/alerts', {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) {
                    schedulePoll();
                    return;
                }

                const data = await response.json();
                const unread: TaskAlert[] = data.unread_alerts || [];
                schedulePoll(data.next_alarm_at);

                unread.forEach((alert) => {
                    if (!knownAlertIdsRef.current.has(alert.id)) {
                        knownAlertIdsRef.current.add(alert.id);

                        if (!isFirstLoadRef.current || alert.type === 'overdue' || alert.type === 'deadline_reached') {
                            // Desktop Notification
                            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && localStorage.getItem('tasktrack-desktop-notifications') === 'true') {
                                new Notification(`TaskTrack: ${alert.type.replace('_', ' ')}`, {
                                    body: alert.message,
                                    icon: '/favicon.ico',
                                });
                            }

                            // Add to floating UI toast
                            setFloatingAlerts((prev) => [
                                ...prev,
                                {
                                    id: alert.id,
                                    title: alert.type === 'overdue' || alert.type === 'deadline_reached' ? 'Task Deadline' : `Task ${alert.type}`,
                                    message: alert.message,
                                    type: alert.type,
                                },
                            ]);

                            if (onNewAlert) {
                                onNewAlert(alert);
                            }
                        }
                    }
                });

                setActiveAlert((currentActive) => {
                    if (currentActive) return currentActive;
                    const deadlineAlert = unread.find(a => a.type === 'overdue' || a.type === 'deadline_reached');
                    if (deadlineAlert) {
                        return deadlineAlert;
                    }
                    return null;
                });

                isFirstLoadRef.current = false;
            } catch (error) {
                // Silently handle network polling fails
                schedulePoll();
            } finally {
                polling = false;
            }
        };

        const refreshAlarmSchedule = () => void pollAlerts();
        const refreshWhenVisible = () => {
            if (document.visibilityState === 'visible') refreshAlarmSchedule();
        };

        window.addEventListener('tasktrack:refresh-alarms', refreshAlarmSchedule);
        window.addEventListener('focus', refreshAlarmSchedule);
        document.addEventListener('visibilitychange', refreshWhenVisible);
        void pollAlerts();

        return () => {
            if (pollTimer) clearTimeout(pollTimer);
            window.removeEventListener('tasktrack:refresh-alarms', refreshAlarmSchedule);
            window.removeEventListener('focus', refreshAlarmSchedule);
            document.removeEventListener('visibilitychange', refreshWhenVisible);
        };
    }, [onNewAlert]);

    const dismissToast = (id: number) => {
        setFloatingAlerts((prev) => prev.filter((a) => a.id !== id));
    };

    const completeTask = () => {
        if (!activeAlert) return;
        const alert = activeAlert;
        soundManager.stopLoopingAlarm();
        setActiveAlert(null);
        router.patch(`/tasks/${alert.task_id}/status`, { status: 'completed' }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => router.post(`/api/alerts/read/${alert.id}`, {}, { preserveState: true, preserveScroll: true }),
        });
    };

    const snoozeTask = () => {
        if (!activeAlert) return;
        const alert = activeAlert;
        soundManager.stopLoopingAlarm();
        setActiveAlert(null);
        router.post(`/tasks/${alert.task_id}/snooze`, { alert_id: alert.id }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => window.dispatchEvent(new Event('tasktrack:refresh-alarms')),
        });
    };

    return (
        <>
            {activeAlert && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
                    <section role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl ring-1 ring-white/20 dark:bg-slate-900">
                        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-indigo-600 text-2xl text-white">!</div>
                        <p className="text-center text-xs font-black uppercase tracking-[0.2em] text-fuchsia-600 dark:text-fuchsia-300">TASK REMINDER</p>
                        <h2 className="mt-2 text-center text-2xl font-black text-slate-900 dark:text-white">Task: {activeAlert.task?.title || 'Unknown Task'}</h2>
                        {activeAlert.task?.due_date && <p className="mt-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">Scheduled for: {new Date(activeAlert.task.due_date).toLocaleString([], { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Manila' })} (Asia/Manila)</p>}
                        {activeAlert.task?.file_url && (
                            <a href={activeAlert.task.file_url} target="_blank" rel="noreferrer" className="mt-5 block text-center text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">Open {activeAlert.task.file_name || 'attachment'}</a>
                        )}
                        <div className="mt-7 grid grid-cols-2 gap-3">
                            <button type="button" onClick={completeTask} className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700">OK / Mark as Completed</button>
                            <button type="button" onClick={snoozeTask} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Do Later (10 min)</button>
                        </div>
                    </section>
                </div>
            )}
            {/* Floating Toast Notification Stack */}
            <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                {floatingAlerts.map((alert) => (
                    <div
                        key={alert.id}
                        className={`pointer-events-auto flex items-start gap-3 rounded-2xl p-4 shadow-xl ring-1 transition-all animate-bounce ${
                            alert.type === 'overdue' || alert.type === 'deadline_reached'
                                ? 'bg-rose-50 ring-rose-300 text-rose-900 dark:bg-rose-950 dark:ring-rose-800 dark:text-rose-100'
                                : 'bg-amber-50 ring-amber-300 text-amber-900 dark:bg-amber-950 dark:ring-amber-800 dark:text-amber-100'
                        }`}
                    >
                        <div className="shrink-0 mt-0.5">
                            {alert.type === 'overdue' || alert.type === 'deadline_reached' ? (
                                <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm">{alert.title}</h4>
                            <p className="mt-0.5 text-xs opacity-90">{alert.message}</p>
                        </div>

                        <button
                            type="button"
                            onClick={() => dismissToast(alert.id)}
                            className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </>
    );
};

