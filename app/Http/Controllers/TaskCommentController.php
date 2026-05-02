<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskComment;
use App\Events\TaskCommentSent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TaskCommentController extends Controller
{
    public function store(Request $request, Task $task): RedirectResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $comment = $task->comments()->create([
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
        ]);

        broadcast(new TaskCommentSent($comment))->toOthers();

        return back();
    }

    public function destroy(TaskComment $comment): RedirectResponse
    {
        abort_unless($comment->user_id === request()->user()->id, 403);

        $comment->delete();

        return back();
    }
}
