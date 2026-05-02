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
        $query = Space::whereNull('parent_id');

        // If not admin, restrict to spaces the user is a member of or created
        if (auth()->user()->role_id !== 1) {
            $query->where(function ($q) {
                $q->where('created_by', auth()->id())
                  ->orWhereHas('users', function ($uq) {
                      $uq->where('user_id', auth()->id());
                  });
            });
        }

        $spaces = $query->with('children', 'createdBy')
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
            'color' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:50',
            'parent_id' => 'nullable|exists:spaces,id',
        ]);

        $space = Space::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'color' => $validated['color'] ?? '#7c3aed',
            'icon' => $validated['icon'] ?? 'Layers',
            'parent_id' => $validated['parent_id'] ?? null,
            'created_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Space created successfully.');
    }

    public function show($id)
    {
        $user = auth()->user();
        $space = Space::with([
            'createdBy',
            'children',
            'users:id,name,email,avatar_color',
            'invitations' => function ($query) {
                $query->where('status', 'pending')->where('expires_at', '>', now());
            },
            'folders.lists.tasks' => function ($q) use ($user) {
                $q->visibleTo($user)->select('id', 'task_list_id', 'status', 'priority', 'start_date', 'due_date', 'assigned_to');
            },
            'folders.lists.createdBy:id,name',
            'lists.tasks' => function ($q) use ($user) {
                $q->visibleTo($user)->select('id', 'task_list_id', 'status', 'priority', 'start_date', 'due_date', 'assigned_to');
            },
            'lists.createdBy:id,name',
        ])->findOrFail($id);

        // Authorization check
        if (auth()->user()->role_id !== 1 && $space->created_by !== auth()->id()) {
            if (!$space->users()->where('user_id', auth()->id())->exists()) {
                abort(403, 'You do not have access to this space.');
            }
        }

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
            'color' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:50',
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
