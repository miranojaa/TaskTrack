<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $query = ActivityLog::with('task')->where('user_id', $request->user()->id)->latest();

        if ($request->filled('activity')) {
            $query->where('activity', $request->string('activity'));
        }
        if ($request->filled('task')) {
            $query->whereHas('task', fn ($task) => $task->where('title', 'like', '%'.$request->string('task').'%'));
        }

        return Inertia::render('history', ['history' => $query->limit(100)->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'activity' => ['required', 'string', 'max:100'],
            'task_id' => ['nullable', 'integer', 'exists:tasks,id'],
            'details' => ['nullable', 'string', 'max:1000'],
        ]);

        ActivityLog::create([...$validated, 'user_id' => $request->user()->id]);

        if ($request->wantsJson() && !$request->header('X-Inertia')) {
            return response()->json(['success' => true]);
        }

        return back();
    }
}