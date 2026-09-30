<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $fillable = ['user_id', 'task_id', 'activity', 'status', 'details'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public static function record(User $user, string $activity, ?Task $task = null, ?string $details = null, ?string $status = null): self
    {
        return static::create([
            'user_id' => $user->id,
            'task_id' => $task?->id,
            'activity' => $activity,
            'details' => $details,
            'status' => $status,
        ]);
    }
}