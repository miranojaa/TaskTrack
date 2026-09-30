/**
 * Synthesizes audio alert sounds using the browser's Web Audio API.
 * Does not require external audio files or CDN dependencies.
 */

class SoundAlertManager {
    private audioCtx: AudioContext | null = null;
    private soundEnabled: boolean = true;
    private soundType: string = 'classic';
    private volume: number = 70; // 0 to 100

    constructor() {
        // AudioContext will be initialized on first user interaction to comply with browser autoplay policies
    }

    private getAudioContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;

        if (!this.audioCtx) {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioContextClass) {
                this.audioCtx = new AudioContextClass();
            }
        }

        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            void this.audioCtx.resume();
        }

        return this.audioCtx;
    }

    public setEnabled(enabled: boolean) {
        this.soundEnabled = enabled;
        if (!enabled) this.stopLoopingAlarm();
    }

    public isEnabled(): boolean {
        return this.soundEnabled;
    }

    public setSoundType(type: string) {
        this.soundType = type;
    }

    public setVolume(volume: number) {
        this.volume = volume;
    }

    private getGainMultiplier(): number {
        return Math.max(0, Math.min(100, this.volume)) / 100;
    }

    /**
     * Helper to play a specific sequence of tones
     */
    private playToneSequence(tones: { freq: number, type?: OscillatorType, delay: number, duration: number, vol: number }[]) {
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const volumeMultiplier = this.getGainMultiplier();

            tones.forEach(tone => {
                const startTime = now + tone.delay;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = tone.type || 'sine';
                osc.frequency.setValueAtTime(tone.freq, startTime);

                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(tone.vol * volumeMultiplier, startTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + tone.duration);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + tone.duration);
            });
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    }

    /**
     * Pulsing attention chime for urgent/overdue deadlines.
     */
    public playOverdueAlarm() {
        if (!this.soundEnabled) return;
        this.playConfiguredSound();
    }

    private playConfiguredSound() {
        switch (this.soundType) {
            case 'digital':
                this.playToneSequence([
                    { freq: 1250, type: 'square', delay: 0, duration: 0.32, vol: 0.7 },
                    { freq: 1650, type: 'square', delay: 0.42, duration: 0.32, vol: 0.7 },
                    { freq: 1250, type: 'square', delay: 0.84, duration: 0.32, vol: 0.7 },
                    { freq: 1650, type: 'square', delay: 1.26, duration: 0.32, vol: 0.7 },
                    { freq: 1250, type: 'square', delay: 1.68, duration: 0.32, vol: 0.7 },
                    { freq: 1650, type: 'square', delay: 2.1, duration: 0.32, vol: 0.7 },
                ]);
                break;
            case 'loud':
                this.playToneSequence([
                    { freq: 740, type: 'sawtooth', delay: 0, duration: 0.72, vol: 0.8 },
                    { freq: 880, type: 'sawtooth', delay: 0.82, duration: 0.72, vol: 0.8 },
                    { freq: 740, type: 'sawtooth', delay: 1.64, duration: 0.72, vol: 0.8 },
                ]);
                break;
            case 'bell':
                this.playToneSequence([
                    { freq: 784, type: 'sine', delay: 0, duration: 0.85, vol: 0.65 },
                    { freq: 988, type: 'sine', delay: 0.95, duration: 0.85, vol: 0.65 },
                    { freq: 1175, type: 'sine', delay: 1.9, duration: 0.85, vol: 0.65 },
                ]);
                break;
            case 'wake_up':
                this.playToneSequence([
                    { freq: 523, type: 'triangle', delay: 0, duration: 0.55, vol: 0.65 },
                    { freq: 659, type: 'triangle', delay: 0.62, duration: 0.55, vol: 0.68 },
                    { freq: 784, type: 'triangle', delay: 1.24, duration: 0.55, vol: 0.72 },
                    { freq: 1047, type: 'triangle', delay: 1.86, duration: 0.65, vol: 0.78 },
                ]);
                break;
            case 'strong':
                this.playToneSequence([
                    { freq: 880, type: 'square', delay: 0, duration: 0.72, vol: 0.85 },
                    { freq: 880, type: 'square', delay: 0.82, duration: 0.72, vol: 0.85 },
                    { freq: 1047, type: 'square', delay: 1.64, duration: 0.72, vol: 0.9 },
                ]);
                break;
            case 'emergency':
                this.playToneSequence([
                    { freq: 1047, type: 'square', delay: 0, duration: 0.38, vol: 0.9 },
                    { freq: 784, type: 'square', delay: 0.42, duration: 0.38, vol: 0.9 },
                    { freq: 1047, type: 'square', delay: 0.84, duration: 0.38, vol: 0.9 },
                    { freq: 784, type: 'square', delay: 1.26, duration: 0.38, vol: 0.9 },
                    { freq: 1047, type: 'square', delay: 1.68, duration: 0.38, vol: 0.9 },
                    { freq: 784, type: 'square', delay: 2.1, duration: 0.38, vol: 0.9 },
                ]);
                break;
            case 'urgent':
                this.playToneSequence([
                    { freq: 659, type: 'triangle', delay: 0, duration: 0.55, vol: 0.75 },
                    { freq: 784, type: 'triangle', delay: 0.35, duration: 0.55, vol: 0.8 },
                    { freq: 988, type: 'triangle', delay: 0.7, duration: 0.75, vol: 0.85 },
                    { freq: 1175, type: 'triangle', delay: 1.4, duration: 0.75, vol: 0.9 },
                ]);
                break;
            case 'classic':
            default:
                this.playToneSequence([
                    { freq: 880, type: 'square', delay: 0, duration: 0.42, vol: 0.72 },
                    { freq: 660, type: 'square', delay: 0.52, duration: 0.42, vol: 0.72 },
                    { freq: 880, type: 'square', delay: 1.04, duration: 0.42, vol: 0.78 },
                    { freq: 660, type: 'square', delay: 1.56, duration: 0.42, vol: 0.78 },
                    { freq: 880, type: 'square', delay: 2.08, duration: 0.42, vol: 0.82 },
                ]);
                break;
        }
    }

    private activeOscillators: OscillatorNode[] = [];
    private alarmIntervalId: ReturnType<typeof setInterval> | null = null;

    /**
     * Quick test sound to confirm audio output is working.
     */
    public playTest() {
        const prev = this.soundEnabled;
        this.soundEnabled = true;
        this.playConfiguredSound();
        this.soundEnabled = prev;
    }

    /**
     * Starts a continuous, looping urgent alarm for exact-time deadlines.
     */
    public startLoopingAlarm() {
        if (!this.soundEnabled) return;
        this.stopLoopingAlarm();

        // Play the pattern immediately once
        this.playOverdueAlarm();

        // Repeat the selected phone-alarm pattern until acknowledged.
        this.alarmIntervalId = setInterval(() => {
            this.playOverdueAlarm();
        }, 2800);
    }

    /**
     * Stops the looping alarm.
     */
    public stopLoopingAlarm() {
        if (this.alarmIntervalId) {
            clearInterval(this.alarmIntervalId);
            this.alarmIntervalId = null;
        }
    }
}

export const soundManager = new SoundAlertManager();
