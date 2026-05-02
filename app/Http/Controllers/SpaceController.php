<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Space;
use App\Models\Task;
use Illuminate\Support\Str;

class SpaceController extends Controller
{
    public function index()
    {
        $spaces = Space::whereNull('parent_id')
            ->with('children', 'createdBy')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Spaces', [
            'spaces' => $spaces,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:spaces,id',
        ]);

        $space = Space::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'parent_id' => $validated['parent_id'] ?? null,
            'created_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Space created successfully.');
    }

    public function show($id)
    {
        $space = Space::with([
            'createdBy',
            'children',
            'users:id,name,email,avatar_color',
            'folders.lists.tasks:id,task_list_id,status,priority,start_date,due_date,assigned_to',
            'folders.lists.createdBy:id,name',
            'lists.tasks:id,task_list_id,status,priority,start_date,due_date,assigned_to',
            'lists.createdBy:id,name',
        ])->findOrFail($id);

        // Decorate lists with computed stats (progress / start / end / priority / owner)
        $decorate = function ($list) {
            $tasks = $list->tasks ?? collect();
            $total = $tasks->count();
            $done = $tasks->where('status', 'done')->count()
                + $tasks->where('status', 'completed')->count()
                + $tasks->where('status', 'closed')->count();
            $starts = $tasks->pluck('start_date')->filter();
            $ends = $tasks->pluck('due_date')->filter();
            $priorities = $tasks->pluck('priority')->filter()->unique()->values();
            $rank = ['urgent' => 4, 'high' => 3, 'medium' => 2, 'low' => 1];
            $topPriority = $priorities->sortByDesc(fn ($p) => $rank[$p] ?? 0)->first();

            $list->stats = [
                'total' => $total,
                'done' => $done,
                'progress' => $total > 0 ? round(($done / $total) * 100) : 0,
                'start' => optional($starts->min())->toDateString(),
                'end' => optional($ends->max())->toDateString(),
                'top_priority' => $topPriority,
            ];
            unset($list->tasks);
            return $list;
        };

        $space->lists = $space->lists->map($decorate);
        $space->folders = $space->folders->map(function ($f) use ($decorate) {
            $f->lists = $f->lists->map($decorate);
            return $f;
        });

        return Inertia::render('SpaceDetail', [
            'space' => $space,
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $space = Space::findOrFail($id);
        $space->update($validated);

        return redirect()->back()->with('success', 'Space updated successfully.');
    }

    public function destroy($id)
    {
        $space = Space::findOrFail($id);
        $space->delete();

        return redirect()->back()->with('success', 'Space deleted successfully.');
    }
}
