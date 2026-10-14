<?php

namespace App\Console\Commands;

use App\Services\DeadlineMonitoringService;
use Illuminate\Console\Command;

class CheckDeadlinesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tasks:check-deadlines';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check configured task warning times, update overdue status, and queue reminder emails';

    /**
     * Execute the console command.
     */
    public function handle(DeadlineMonitoringService $monitoringService): int
    {
        $this->info('Checking task deadlines...');

        $result = $monitoringService->checkDeadlines();

        $this->info("Completed check: {$result['overdue_count']} overdue tasks and {$result['reminder_count']} upcoming reminders created.");

        return Command::SUCCESS;
    }
}
