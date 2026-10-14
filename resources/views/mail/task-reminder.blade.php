<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>TaskTrack reminder</title>
</head>
<body style="margin:0;background:#f3f6f8;color:#172b45;font-family:Arial,sans-serif;">
    <main style="max-width:560px;margin:32px auto;padding:28px;background:#fff;border:1px solid #dce5eb;border-radius:12px;">
        <p style="margin:0 0 20px;color:#087e8b;font-size:13px;font-weight:700;letter-spacing:1px;">TASKTRACK REMINDER</p>
        <h1 style="margin:0 0 16px;font-size:22px;">{{ $task->title }}</h1>
        <p style="margin:0 0 8px;"><strong>Deadline:</strong> {{ $task->due_date->format('M j, Y g:i A') }}</p>
        <p style="margin:0 0 8px;"><strong>Priority:</strong> {{ ucfirst($task->priority) }}</p>
        <p style="margin:0 0 24px;"><strong>Reminder:</strong> {{ $warningAt->format('M j, Y g:i A') }} ({{ $warningMinutes }} minutes before deadline)</p>
        <a href="{{ $taskUrl }}" style="display:inline-block;padding:11px 16px;background:#12304a;color:#fff;text-decoration:none;border-radius:6px;font-weight:700;">Open my tasks</a>
    </main>
</body>
</html>