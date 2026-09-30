<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'priority',
        'status',
        'due_date',
        'completed_at',
        'notified_overdue',
        'alarm_snoozed_until',
        'file_path',
        'file_name',
        'file_type',
        'file_uploaded_at',
        'alarm_sound',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'completed_at' => 'datetime',
        'file_uploaded_at' => 'datetime',
        'notified_overdue' => 'boolean',
        'alarm_snoozed_until' => 'datetime',
    ];

    protected $appends = [
        'is_overdue',
        'time_remaining_seconds',
        'time_remaining_formatted',
        'file_url',
    ];

    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path ? asset('storage/' . $this->file_path) : null;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(TaskAlert::class);
    }

    public function getIsOverdueAttribute(): bool
    {
        if ($this->status === 'completed') {
            return false;
        }

        return $this->due_date ? Carbon::now()->isAfter($this->due_date) : false;
    }

    public function getTimeRemainingSecondsAttribute(): int
    {
        if (!$this->due_date) {
            return 0;
        }

        $now = Carbon::now();
        if ($now->isAfter($this->due_date)) {
            return -$now->diffInSeconds($this->due_date);
        }

        return $now->diffInSeconds($this->due_date);
    }

    public function getTimeRemainingFormattedAttribute(): string
    {
        if (!$this->due_date) {
            return '';
        }

        if ($this->status === 'completed') {
            return 'Completed: ' . ($this->completed_at ? $this->completed_at->format('M j, Y \a\t g:i A') : '');
        }

        $now = Carbon::now();
        if ($now->isAfter($this->due_date)) {
            return 'Overdue since: ' . $this->due_date->format('M j, Y \a\t g:i A');
        }

        return 'Due: ' . $this->due_date->format('M j, Y \a\t g:i A');
    }

    /**
     * Scope for tasks belonging to a specific user.
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

}

