<?php

namespace App\Models;

use App\Observers\TaskObserver;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    protected static function booted()
    {
        static::observe(TaskObserver::class);
    }

    protected $fillable = [
        'title',
        'description',
        'status',
        'space_id',
        'task_list_id',
        'parent_task_id',
        'position',
        'created_by',
        'assigned_to',
        'due_date',
        'start_date',
        'date_done',
        'priority',
    ];

    protected $casts = [
        'due_date' => 'date',
        'start_date' => 'date',
        'date_done' => 'date',
    ];

    public function space(): BelongsTo
    {
        return $this->belongsTo(Space::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function list(): BelongsTo
    {
        return $this->belongsTo(TaskList::class, 'task_list_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'parent_task_id');
    }

    public function subtasks(): HasMany
    {
        return $this->hasMany(Task::class, 'parent_task_id')->orderBy('position');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TaskComment::class)->latest();
    }

    public function timeEntries(): HasMany
    {
        return $this->hasMany(TimeEntry::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'task_tag');
    }

    public function scopeVisibleTo($query, User $user)
    {
        // Admin and Manager can see everything in their accessible spaces
        if (in_array($user->role, ['admin', 'owner', 'manager'])) {
            return $query;
        }

        // Members can see:
        // 1. Tasks assigned to them or other members
        // 2. Unassigned tasks
        // 3. Tasks they created themselves
        return $query->where(function ($q) use ($user) {
            $q->where('created_by', $user->id)
              ->orWhereNull('assigned_to')
              ->orWhereIn('assigned_to', function ($sub) {
                  $sub->select('id')
                      ->from('users')
                      ->whereIn('role', ['member', 'user']);
              });
        });
    }
}
