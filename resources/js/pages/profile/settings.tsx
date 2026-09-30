import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { Auth } from '@/types';
import { soundManager } from '@/lib/sound';

export default function Settings() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth.user;

    const preferencesForm = useForm({
        alarm_sound: user?.alarm_sound || 'classic',
        alarm_volume: user?.alarm_volume ?? 70,
    });

    const handlePreferencesSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        preferencesForm.patch('/profile/preferences', {
            onSuccess: () => {
                soundManager.setSoundType(preferencesForm.data.alarm_sound);
                soundManager.setVolume(preferencesForm.data.alarm_volume);
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Settings" />
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">Application Settings</h1>
                    <p className="mt-1 text-sm text-slate-500">Manage your default alarm sound and volume.</p>
                </div>

                <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6">Alarm & Audio Settings</h2>
                    <form onSubmit={handlePreferencesSubmit} className="space-y-6 max-w-xl">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Default Alarm Sound</label>
                            <select
                                value={preferencesForm.data.alarm_sound}
                                onChange={(e) => {
                                    preferencesForm.setData('alarm_sound', e.target.value);
                                    soundManager.setSoundType(e.target.value);
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            >
                                <option value="classic">Classic Alarm</option>
                                <option value="digital">Digital Alarm</option>
                                <option value="loud">Loud Alarm</option>
                                <option value="bell">Bell Alarm</option>
                                <option value="wake_up">Wake-Up Alarm</option>
                                <option value="strong">Strong Alarm</option>
                                <option value="emergency">Emergency Alarm</option>
                            </select>
                            <button type="button" onClick={() => soundManager.playTest()} className="mt-2 text-xs font-semibold text-indigo-600 hover:underline">
                                🔊 Test Sound
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Alarm Volume ({preferencesForm.data.alarm_volume}%)</label>
                            <input
                                type="range"
                                min="25" max="100" step="25"
                                value={preferencesForm.data.alarm_volume}
                                onChange={(e) => {
                                    const v = parseInt(e.target.value);
                                    preferencesForm.setData('alarm_volume', v);
                                    soundManager.setVolume(v);
                                }}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button type="submit" disabled={preferencesForm.processing} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 disabled:opacity-50">
                                Save Settings
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

