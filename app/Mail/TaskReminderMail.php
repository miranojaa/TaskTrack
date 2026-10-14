<?php

namespace App\Mail;

use App\Models\Task;
use Carbon\CarbonInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TaskReminderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 60;

    public function __construct(
        public Task $task,
        public int $warningMinutes,
        public CarbonInterface $warningAt,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "TaskTrack reminder: {$this->task->title}");
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.task-reminder',
            with: [
                'taskUrl' => route('tasks.index', ['search' => $this->task->title]),
                'warningAt' => $this->warningAt,
                'warningMinutes' => $this->warningMinutes,
            ],
        );
    }
}
