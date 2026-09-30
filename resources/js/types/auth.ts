export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    avatar_url?: string | null;
    role?: 'user' | 'admin';
    theme?: 'light' | 'dark';
    alarm_sound_enabled?: boolean;
    alarm_sound?: string;
    alarm_volume?: number;
    notify_task_created?: boolean;
    notify_task_updated?: boolean;
    notify_task_completed?: boolean;
    notify_overdue?: boolean;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User | null;
};
