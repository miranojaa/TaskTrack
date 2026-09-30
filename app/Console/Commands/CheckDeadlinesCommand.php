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
    protected $description = 'Check task deadlines, update overdue status, and generate deadline notifications';

    /**
     * Execute the console command.
     */
    public function handle(DeadlineMonitoringService $monitoringService): int
    {
        $this->info('Checking task deadlines...');

        $result = $monitoringService->checkDeadlines();

        $this->info("Completed check: {$result['overdue_count']} tasks marked overdue and deadline alerts created.");

        return Command::SUCCESS;
    }
}

