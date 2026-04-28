<?php

namespace App\Http\Controllers;

use App\Models\Folder;
use App\Models\Space;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;

class FolderController extends Controller
{
    public function store(Request $request, Space $space): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:16'],
        ]);

        $position = (int) Folder::where('space_id', $space->id)->max('position') + 1;

        Folder::create([
            ...$validated,
            'space_id' => $space->id,
            'created_by' => $request->user()->id,
            'position' => $position,
        ]);

        return redirect()->route('spaces.show', $space->id);
    }

    public function update(Request $request, Folder $folder): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:16'],
        ]);

        $folder->update($validated);

        return back();
    }

    public function destroy(Folder $folder): RedirectResponse
    {
        $folder->delete();

        return back();
    }
}
