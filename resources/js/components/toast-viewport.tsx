import { useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

export interface ToastInput {
    kind: ToastKind;
    title: string;
    message: string;
    dedupeKey?: string;
    onDismiss?: () => void;
}

interface ToastEntry extends ToastInput {
    id: string;
}

interface ToastViewportProps {
    flash?: {
        success?: string;
        error?: string;
    };
}

interface ToastPageProps {
    errors?: Record<string, string | string[]>;
    [key: string]: unknown;
}

const lifetimeMs = 5000;
const exitDurationMs = 180;

export function showToast(toast: ToastInput): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
        new CustomEvent<ToastInput>('tasktrack:toast', { detail: toast }),
    );
}

function ToastIcon({ kind }: { kind: ToastKind }) {
    const paths: Record<ToastKind, React.ReactNode> = {
        success: <path d="m5 12 4 4L19 6" />,
        error: <path d="m7 7 10 10M17 7 7 17" />,
        warning: (
            <path d="M12 9v4m0 4h.01M10.3 3.9 2.8 17.5A1.7 1.7 0 0 0 4.3 20h15.4a1.7 1.7 0 0 0 1.5-2.5L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        ),
        info: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5m0-8h.01" />
            </>
        ),
    };

    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 h-5 w-5 shrink-0"
        >
            {paths[kind]}
        </svg>
    );
}

function ToastCard({
    toast,
    setToasts,
}: {
    toast: ToastEntry;
    setToasts: React.Dispatch<React.SetStateAction<ToastEntry[]>>;
}) {
    const [entered, setEntered] = useState(false);
    const [exiting, setExiting] = useState(false);
    const dismissed = useRef(false);
    const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const removeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const removeSelf = () =>
        setToasts((current) => current.filter((item) => item.id !== toast.id));

    const beginExit = (manual: boolean) => {
        if (dismissed.current) return;
        dismissed.current = true;
        if (exitTimer.current) clearTimeout(exitTimer.current);
        if (removeTimer.current) clearTimeout(removeTimer.current);
        if (manual) toast.onDismiss?.();
        setExiting(true);
        removeTimer.current = setTimeout(removeSelf, exitDurationMs);
    };

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            setEntered(true);
            exitTimer.current = setTimeout(() => {
                dismissed.current = true;
                setExiting(true);
            }, lifetimeMs - exitDurationMs);
            removeTimer.current = setTimeout(() => {
                dismissed.current = true;
                setToasts((current) =>
                    current.filter((item) => item.id !== toast.id),
                );
            }, lifetimeMs);
        });

        return () => {
            cancelAnimationFrame(frame);
            if (exitTimer.current) clearTimeout(exitTimer.current);
            if (removeTimer.current) clearTimeout(removeTimer.current);
        };
    }, [setToasts, toast.id]);

    const accent: Record<ToastKind, string> = {
        success: 'border-l-[#10B981] text-[#10B981]',
        error: 'border-l-[#EF4444] text-[#EF4444]',
        warning: 'border-l-[#F59E0B] text-[#F59E0B]',
        info: 'border-l-[#38BDF8] text-[#38BDF8]',
    };

    return (
        <div
            role={
                toast.kind === 'error' || toast.kind === 'warning'
                    ? 'alert'
                    : 'status'
            }
            className={`pointer-events-auto flex w-full items-start gap-3 rounded-lg border border-l-[3px] border-white/10 bg-[#17233B] p-3.5 text-[#F8FAFC] shadow-[0_12px_32px_rgba(2,6,23,0.35)] transition-[opacity,transform] duration-[180ms] ease-out motion-reduce:transition-none ${accent[toast.kind]} ${entered && !exiting ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}
        >
            <ToastIcon kind={toast.kind} />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#F8FAFC]">
                    {toast.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed break-words text-[#CBD5E1]">
                    {toast.message}
                </p>
            </div>
            <button
                type="button"
                onClick={() => beginExit(true)}
                aria-label="Dismiss notification"
                title="Dismiss notification"
                className="-mt-1 -mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#94A3B8] transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:outline-none"
            >
                <span aria-hidden="true" className="text-lg leading-none">
                    ×
                </span>
            </button>
        </div>
    );
}

export function ToastViewport({ flash }: ToastViewportProps) {
    const { errors = {} } = usePage<ToastPageProps>().props;
    const [toasts, setToasts] = useState<ToastEntry[]>([]);

    const addToast = (input: ToastInput) => {
        setToasts((current) => {
            const duplicate = current.some((item) =>
                input.dedupeKey
                    ? item.dedupeKey === input.dedupeKey
                    : item.kind === input.kind &&
                      item.title === input.title &&
                      item.message === input.message,
            );
            if (duplicate) return current;
            const id =
                typeof crypto !== 'undefined' && 'randomUUID' in crypto
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random()}`;
            return [...current, { ...input, id }];
        });
    };

    useEffect(() => {
        const onToast = (event: Event) =>
            addToast((event as CustomEvent<ToastInput>).detail);
        window.addEventListener('tasktrack:toast', onToast);
        return () => window.removeEventListener('tasktrack:toast', onToast);
    }, []);

    useEffect(() => {
        if (flash?.success)
            addToast({
                kind: 'success',
                title: 'Success',
                message: flash.success,
            });
        if (flash?.error)
            addToast({
                kind: 'error',
                title: 'Something went wrong',
                message: flash.error,
            });
    }, [flash?.success, flash?.error]);

    const firstError = Object.values(errors).flat()[0];
    useEffect(() => {
        if (firstError) {
            addToast({
                kind: 'error',
                title: 'Please check your details',
                message: firstError,
            });
        }
    }, [firstError]);

    return (
        <div
            className="pointer-events-none fixed inset-x-3 top-3 z-[100] flex max-h-[70vh] flex-col items-end gap-2 overflow-y-auto sm:inset-x-auto sm:top-4 sm:right-4 sm:w-[min(24rem,calc(100vw-2rem))]"
            aria-label="Temporary notifications"
        >
            {toasts.map((toast) => (
                <ToastCard key={toast.id} toast={toast} setToasts={setToasts} />
            ))}
        </div>
    );
}
