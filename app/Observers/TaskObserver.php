<?php

namespace App\Observers;

use App\Mail\TaskNotificationMail;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class TaskObserver
{
    public function created(Task $task)
    {
        $this->sendNotification($task, 'created');
    }

    public function updated(Task $task)
    {
        // Only send notification if relevant fields changed
        if ($task->wasChanged(['title', 'description', 'priority', 'status', 'due_date', 'assigned_to'])) {
            $this->sendNotification($task, 'updated');
        }
    }

    protected function sendNotification(Task $task, string $action)
    {
        try {
            // Notify assigned user
            if ($task->assigned_to) {
                $assignedUser = User::find($task->assigned_to);
                if ($assignedUser && $assignedUser->email) {
                    $message = $action === 'created' 
                        ? 'You have been assigned a new task.' 
                        : 'A task assigned to you has been updated.';
                    
                    Mail::to($assignedUser->email)->send(new TaskNotificationMail($task, $assignedUser, $action, $message));
                }
            }

            // Notify task creator if someone else updated it
            if ($task->created_by && $task->created_by !== auth()->id() && $task->created_by !== $task->assigned_to) {
                $creator = User::find($task->created_by);
                if ($creator && $creator->email) {
                    $message = $action === 'created' 
                        ? 'A task you created has been assigned.' 
                        : 'A task you created has been updated.';
                    
                    Mail::to($creator->email)->send(new TaskNotificationMail($task, $creator, $action, $message));
                }
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to send task notification email: ' . $e->getMessage());
        }
    }
}
