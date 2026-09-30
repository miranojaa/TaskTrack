export * from './auth';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface Task {
    id: number;
    user_id: number;
    title: string;
    description: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    due_date: string;
    completed_at: string | null;
    notified_overdue: boolean;
    is_overdue: boolean;
    time_remaining_seconds: number;
    time_remaining_formatted: string;
    file_path?: string | null;
    file_name?: string | null;
    file_url?: string | null;
    file_type?: string | null;
    file_size?: number | null;
    file_uploaded_at?: string | null;
    alarm_sound?: string | null;
    created_at: string;
    updated_at: string;
}

export interface TaskAlert {
    id: number;
    user_id: number;
    task_id: number;
    type: 'deadline_reached' | 'overdue' | 'created' | 'updated' | 'completed';
    message: string;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    task?: Task;
}

export interface ActivityLog {
    id: number;
    activity: string;
    status: string | null;
    details: string | null;
    created_at: string;
    user?: { name: string; email: string };
    task?: Task;
}

export interface DashboardStats {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    overdue: number;
    completion_rate: number;
}

export interface Filters {
    search: string;
    status: string;
    priority: string;
    due: string;
    sort_by: string;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: PaginationLink[];
}
