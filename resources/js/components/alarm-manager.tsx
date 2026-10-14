import React, { useEffect, useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import { soundManager } from '@/lib/sound';
import { TaskAlert } from '@/types';
import { showToast } from '@/components/toast-viewport';

interface AlarmManagerProps {
    soundEnabled: boolean;
    onNewAlert?: (alert: TaskAlert) => void;
}

export const AlarmManager: React.FC<AlarmManagerProps> = ({
    soundEnabled,
    onNewAlert,
}) => {
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
                const latestApproachingAlert = unread.find((alert) => alert.type === 'approaching');
                schedulePoll(data.next_alarm_at);

                unread.forEach((alert) => {
                    if (!knownAlertIdsRef.current.has(alert.id)) {
                        knownAlertIdsRef.current.add(alert.id);

                        const showMissedWarning = isFirstLoadRef.current
                            && alert.id === latestApproachingAlert?.id;
                        if (!isFirstLoadRef.current || alert.type === 'overdue' || alert.type === 'deadline_reached' || showMissedWarning) {
                            // Desktop Notification
                            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && localStorage.getItem('tasktrack-desktop-notifications') === 'true') {
                                new Notification(`TaskTrack: ${alert.type.replace('_', ' ')}`, {
                                    body: alert.message,
                                    icon: '/tasktrack-mark.svg',
                                });
                            }

                            const isDeadline = alert.type === 'overdue' || alert.type === 'deadline_reached';
                            const isUrgent = alert.type === 'approaching' && alert.task?.priority === 'urgent';
                            if (alert.type === 'approaching') {
                                soundManager.playOverdueAlarm();
                            }
                            showToast({
                                kind: isDeadline || isUrgent ? 'error' : alert.type === 'approaching' ? 'warning' : 'info',
                                title: isDeadline ? 'Task deadline' : alert.type === 'approaching' ? 'Upcoming task' : 'Task update',
                                message: alert.message,
                                dedupeKey: `task-alert-${alert.id}`,
                                onDismiss: () => router.post(`/api/alerts/read/${alert.id}`, {}, { preserveState: true, preserveScroll: true }),
                            });

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
        </>
    );
};

