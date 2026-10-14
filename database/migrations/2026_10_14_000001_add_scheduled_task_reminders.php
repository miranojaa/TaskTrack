<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'alert_threshold_minutes')) {
            Schema::table('users', function (Blueprint $table) {
                $table->unsignedInteger('alert_threshold_minutes')->default(50);
            });
        }

        if (! Schema::hasColumn('users', 'notify_approaching')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('notify_approaching')->default(true);
            });
        }

        if (! Schema::hasColumn('users', 'notify_email_reminders')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('notify_email_reminders')->default(true);
            });
        }

        if (! Schema::hasColumn('task_alerts', 'reminder_key')) {
            Schema::table('task_alerts', function (Blueprint $table) {
                $table->string('reminder_key')->nullable();
            });
        }

        if (! Schema::hasColumn('task_alerts', 'email_queued_at')) {
            Schema::table('task_alerts', function (Blueprint $table) {
                $table->timestamp('email_queued_at')->nullable();
            });
        }

        if (
            Schema::hasColumn('task_alerts', 'reminder_key')
            && ! Schema::hasIndex('task_alerts', ['task_id', 'reminder_key'], 'unique')
        ) {
            Schema::table('task_alerts', function (Blueprint $table) {
                $table->unique(['task_id', 'reminder_key']);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasIndex('task_alerts', ['task_id', 'reminder_key'], 'unique')) {
            Schema::table('task_alerts', function (Blueprint $table) {
                $table->dropUnique(['task_id', 'reminder_key']);
            });
        }

        foreach (['reminder_key', 'email_queued_at'] as $column) {
            if (Schema::hasColumn('task_alerts', $column)) {
                Schema::table('task_alerts', function (Blueprint $table) use ($column) {
                    $table->dropColumn($column);
                });
            }
        }

        foreach (['alert_threshold_minutes', 'notify_approaching', 'notify_email_reminders'] as $column) {
            if (Schema::hasColumn('users', $column)) {
                Schema::table('users', function (Blueprint $table) use ($column) {
                    $table->dropColumn($column);
                });
            }
        }
    }
};
