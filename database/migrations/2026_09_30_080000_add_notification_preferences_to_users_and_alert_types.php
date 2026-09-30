<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('tasks', 'alarm_sound')) {
            Schema::table('tasks', function (Blueprint $table) {
                $table->string('alarm_sound')->nullable();
            });
        }
        if (!Schema::hasColumn('tasks', 'file_uploaded_at')) {
            Schema::table('tasks', function (Blueprint $table) {
                $table->dateTime('file_uploaded_at')->nullable();
                if (Schema::hasColumn('tasks', 'notified_approaching')) {
                    $table->dropColumn('notified_approaching');
                }
            });
        }
        if (Schema::hasColumn('tasks', 'file_path')) {
            DB::table('tasks')->whereNotNull('file_path')->update(['file_uploaded_at' => DB::raw('updated_at')]);
        }

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'alert_threshold_minutes')) {
                $table->dropColumn('alert_threshold_minutes');
            }
            $table->boolean('notify_task_created')->default(true);
            $table->boolean('notify_task_updated')->default(true);
            $table->boolean('notify_task_completed')->default(true);
            $table->boolean('notify_overdue')->default(true);
        });

        Schema::table('task_alerts', function (Blueprint $table) {
            $table->string('type')->change();
        });
        DB::table('task_alerts')->where('type', 'approaching')->delete();
    }

    public function down(): void
    {
        DB::table('task_alerts')
            ->whereNotIn('type', ['approaching', 'deadline_reached', 'overdue'])
            ->update(['type' => 'overdue']);

        Schema::table('task_alerts', function (Blueprint $table) {
            $table->enum('type', ['approaching', 'deadline_reached', 'overdue'])->change();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('alert_threshold_minutes')->default(60);
            $table->dropColumn([
                'notify_task_created',
                'notify_task_updated',
                'notify_task_completed',
                'notify_overdue',
            ]);
        });

        if (Schema::hasColumn('tasks', 'file_uploaded_at')) {
            Schema::table('tasks', function (Blueprint $table) {
                $table->dropColumn('file_uploaded_at');
                $table->boolean('notified_approaching')->default(false);
            });
        }
    }
};