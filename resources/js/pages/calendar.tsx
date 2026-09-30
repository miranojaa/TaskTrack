import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { Task } from '@/types';

interface CalendarProps {
    tasks: Task[];
    month: string;
}

const manilaDateKey = (date: Date) => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(date);

const manilaMonthKey = (date: Date) => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit',
}).format(date);

export default function Calendar({ tasks, month: monthKey }: CalendarProps) {
    const [month, setMonth] = useState(() => new Date(`${monthKey}-01T00:00:00Z`));
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const days = useMemo(() => {
        const first = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1));
        const start = new Date(first);
        start.setUTCDate(first.getUTCDate() - first.getUTCDay());
        return Array.from({ length: 42 }, (_, index) => {
            const day = new Date(start);
            day.setUTCDate(start.getUTCDate() + index);
            return day;
        });
    }, [month]);
    const tasksByDate = useMemo(() => {
        const grouped = new Map<string, Task[]>();
        tasks.forEach((task) => {
            const key = manilaDateKey(new Date(task.due_date));
            grouped.set(key, [...(grouped.get(key) || []), task]);
        });
        return grouped;
    }, [tasks]);

    const navigateMonth = (nextMonth: Date) => {
        setMonth(nextMonth);
        const key = manilaMonthKey(nextMonth);
        router.get('/calendar', { month: key }, { preserveState: true, preserveScroll: true });
    };

    const changeMonth = (offset: number) => navigateMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + offset, 1)));
    const goToToday = () => navigateMonth(new Date(`${manilaMonthKey(new Date())}-01T00:00:00Z`));

    return (
        <AppLayout>
            <Head title="Calendar" />
            <div className="space-y-5 pb-12">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">Calendar</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Scheduled tasks by date and time.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-lg font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">‹</button>
                        <h2 className="min-w-40 text-center text-sm font-bold text-slate-800 dark:text-slate-100">{month.toLocaleDateString([], { month: 'long', year: 'numeric', timeZone: 'Asia/Manila' })}</h2>
                        <button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-lg font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">›</button>
                        <button type="button" onClick={goToToday} className="ml-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">Today</button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="py-3">{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7">
                        {days.map((day) => {
                            const dayTasks = tasksByDate.get(manilaDateKey(day)) || [];
                            const inMonth = day.getUTCMonth() === month.getUTCMonth();
                            return (
                                <div key={manilaDateKey(day)} className={`min-h-28 border-b border-r border-slate-100 p-1.5 sm:min-h-32 sm:p-2 dark:border-slate-800 ${inMonth ? '' : 'bg-slate-50/70 dark:bg-slate-950/50'}`}>
                                    <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${manilaDateKey(day) === manilaDateKey(new Date()) ? 'bg-indigo-600 text-white' : inMonth ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>{day.getUTCDate()}</div>
                                    <div className="space-y-1">
                                        {dayTasks.slice(0, 3).map((task) => (
                                            <button key={task.id} type="button" onClick={() => setSelectedTask(task)} className="block w-full truncate rounded-md border-l-2 border-indigo-500 bg-indigo-50 px-1.5 py-1 text-left text-[10px] font-semibold text-indigo-800 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:text-indigo-200 dark:hover:bg-indigo-900 sm:text-xs">
                                                <span className="mr-1 font-bold">{new Date(task.due_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' })}</span>{task.title}
                                            </button>
                                        ))}
                                        {dayTasks.length > 3 && <p className="px-1 text-[10px] font-semibold text-slate-500">+{dayTasks.length - 3} more</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedTask(null); }}>
                    <section role="dialog" aria-modal="true" aria-labelledby="calendar-task-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Scheduled task</p>
                                <h2 id="calendar-task-title" className="mt-1 text-xl font-black text-slate-900 dark:text-white">{selectedTask.title}</h2>
                            </div>
                            <button type="button" onClick={() => setSelectedTask(null)} aria-label="Close task details" className="rounded-lg p-1 text-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">×</button>
                        </div>
                        <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{new Date(selectedTask.due_date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Manila' })} (Asia/Manila)</p>
                        {selectedTask.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-400">{selectedTask.description}</p>}
                        <div className="mt-4 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{selectedTask.priority} priority</span>
                            <span className="rounded-lg bg-indigo-50 px-2.5 py-1.5 font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">{selectedTask.status.replace('_', ' ')}</span>
                        </div>
                        {selectedTask.file_name && selectedTask.file_url && <a href={selectedTask.file_url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">Attachment: {selectedTask.file_name}</a>}
                    </section>
                </div>
            )}
        </AppLayout>
    );
}