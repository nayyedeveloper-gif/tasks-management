<?php

namespace App\Http\Controllers;

use App\Models\Space;
use App\Models\Task;
use App\Models\TaskStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AllTasksController extends Controller
{
    /**
     * Show all tasks across workspace (ClickUp-style List view)
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get all accessible spaces (non-personal + personal for user)
        $spaces = Space::where(function ($q) use ($user) {
                $q->where('is_personal', false)
                  ->orWhere(function ($qq) use ($user) {
                      $qq->where('is_personal', true)
                         ->where('created_by', $user->id);
                  });
            })
            ->pluck('id');

        // Fetch all tasks in those spaces
        $tasks = Task::visibleTo($user)
            ->with([
                'list:id,name,space_id',
                'list.space:id,name',
                'assignedTo:id,name',
                'createdBy:id,name',
                'subtasks.assignedTo:id,name',
            ])
            ->withCount(['subtasks', 'comments'])
            ->whereIn('space_id', $spaces)
            ->whereNull('parent_task_id') // Top-level tasks only; subtasks loaded via relation
            ->orderByRaw('due_date IS NULL, due_date ASC')
            ->orderByDesc('updated_at')
            ->get();

        // Get all statuses for filter/status options
        $statuses = TaskStatus::whereIn('task_list_id', function ($q) use ($spaces) {
                $q->select('id')->from('task_lists')->whereIn('space_id', $spaces);
            })
            ->distinct()
            ->get(['key', 'label', 'color', 'position']);

        // Group tasks by status for default view
        $grouped = $tasks->groupBy('status');

        // Ensure all statuses have a group (even if empty)
        $groupedByStatus = [];
        foreach ($statuses->sortBy('position') as $st) {
            $groupedByStatus[$st->key] = [
                'status' => $st,
                'tasks' => $grouped[$st->key] ?? collect(),
            ];
        }

        // Append any tasks with unknown status to end
        foreach ($grouped as $statusKey => $taskGroup) {
            if (!isset($groupedByStatus[$statusKey])) {
                $groupedByStatus[$statusKey] = [
                    'status' => ['key' => $statusKey, 'label' => ucfirst(str_replace('_', ' ', $statusKey)), 'color' => '#6b7280'],
                    'tasks' => $taskGroup,
                ];
            }
        }

        return Inertia::render('AllTasks/Index', [
            'tasks' => $tasks,
            'groupedByStatus' => $groupedByStatus,
            'statuses' => $statuses,
            'spaces' => Space::whereIn('id', $spaces)->get(['id', 'name']),
        ]);
    }
}
