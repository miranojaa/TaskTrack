<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $columnsByTable = [
            'users' => ['email_verified_at', 'created_at', 'updated_at'],
            'tasks' => ['due_date', 'completed_at', 'file_uploaded_at', 'created_at', 'updated_at'],
            'task_alerts' => ['read_at', 'created_at', 'updated_at'],
            'activity_logs' => ['created_at', 'updated_at'],
        ];

        foreach ($columnsByTable as $table => $columns) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            foreach ($columns as $column) {
                if (!Schema::hasColumn($table, $column)) {
                    continue;
                }

                DB::table($table)
                    ->whereNotNull($column)
                    ->orderBy('id')
                    ->chunkById(500, function ($rows) use ($table, $column) {
                        foreach ($rows as $row) {
                            $localValue = Carbon::parse($row->{$column}, 'UTC')
                                ->setTimezone('Asia/Manila')
                                ->format('Y-m-d H:i:s');

                            DB::table($table)->where('id', $row->id)->update([$column => $localValue]);
                        }
                    });
            }
        }
    }

    public function down(): void
    {
        $columnsByTable = [
            'users' => ['email_verified_at', 'created_at', 'updated_at'],
            'tasks' => ['due_date', 'completed_at', 'file_uploaded_at', 'created_at', 'updated_at'],
            'task_alerts' => ['read_at', 'created_at', 'updated_at'],
            'activity_logs' => ['created_at', 'updated_at'],
        ];

        foreach ($columnsByTable as $table => $columns) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            foreach ($columns as $column) {
                if (!Schema::hasColumn($table, $column)) {
                    continue;
                }

                DB::table($table)
                    ->whereNotNull($column)
                    ->orderBy('id')
                    ->chunkById(500, function ($rows) use ($table, $column) {
                        foreach ($rows as $row) {
                            $utcValue = Carbon::parse($row->{$column}, 'Asia/Manila')
                                ->setTimezone('UTC')
                                ->format('Y-m-d H:i:s');

                            DB::table($table)->where('id', $row->id)->update([$column => $utcValue]);
                        }
                    });
            }
        }
    }
};
