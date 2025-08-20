"use client";

import React, { useState, useTransition } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateTaskAction, deleteTaskAction } from "@/app/actions/taskActions";
import { useRouter } from "next/navigation";

interface EditTasksDialogProps {
  internName: string;
  tasks: {
    id: string;
    title: string;
    description?: string | null;
    dueDate?: Date | null;
    priority: "LOW" | "MEDIUM" | "HIGH";
    createdAt: Date;
  }[];
}

export default function EditTasksDialog({
  internName,
  tasks,
}: EditTasksDialogProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("LOW");
  const [filterDate, setFilterDate] = useState<string>("");
  const [createdDate, setCreatedDate] = useState<string>(""); // keep track of createdAt
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredTasks = sortedTasks.filter((task) => {
    if (!filterDate) return true;
    if (!task.dueDate) return false;
    return new Date(task.dueDate).toISOString().split("T")[0] === filterDate;
  });

  const handleSelectTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    setSelectedTaskId(taskId);
    setTitle(task.title);
    setDescription(task.description || "");
    setDueDate(
      task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
    );
    setPriority(task.priority);

    // set created date (for due date restriction)
    setCreatedDate(new Date(task.createdAt).toISOString().split("T")[0]);
  };

  const handleSave = () => {
    if (!selectedTaskId || !title.trim()) return;

    // Validation: prevent dueDate earlier than createdDate
    if (dueDate && createdDate && new Date(dueDate) < new Date(createdDate)) {
      alert("Due date cannot be earlier than the created date.");
      return;
    }

    startTransition(async () => {
      await updateTaskAction({
        id: selectedTaskId,
        title,
        description,
        dueDate,
        priority,
      });
      resetDialog();
      router.refresh();
      setIsOpen(false);
    });
  };

  const handleDelete = () => {
    if (!selectedTaskId) return;

    startTransition(async () => {
      await deleteTaskAction(selectedTaskId);
      resetDialog();
      router.refresh();
      setIsOpen(false);
    });
  };

  const resetDialog = () => {
    setSelectedTaskId(null);
    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("LOW");
    setCreatedDate("");
  };

  const handleDialogChange = (open: boolean) => {
    if (!isPending) {
      setIsOpen(open);
      if (!open) resetDialog();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Edit Tasks
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tasks for {internName}</DialogTitle>
          <DialogDescription>
            {selectedTaskId
              ? "Modify task details below"
              : "Select a task to edit (may sort by due date)"}
          </DialogDescription>
        </DialogHeader>

        {!selectedTaskId ? (
          /* Task list */
          <div className="relative space-y-2">
            <div className="flex gap-2 items-center">
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => setFilterDate("")}
                size="sm"
              >
                Show All
              </Button>
            </div>

            <fieldset
              disabled={isPending}
              className="space-y-2 max-h-[400px] overflow-y-auto pb-4"
            >
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <Button
                    key={task.id}
                    variant="outline"
                    className="w-full justify-start text-left"
                    onClick={() => handleSelectTask(task.id)}
                  >
                    <div className="truncate w-full text-left">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Created:{" "}
                        {new Date(task.createdAt).toLocaleDateString("en-GB")}
                        {task.dueDate &&
                          ` | Due: ${new Date(task.dueDate).toLocaleDateString(
                            "en-GB"
                          )}`}
                      </div>
                    </div>
                  </Button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-[100px] text-muted-foreground">
                  <p>No tasks available</p>
                  <p className="text-sm">Please assign tasks first</p>
                </div>
              )}
            </fieldset>
          </div>
        ) : (
          /* Edit form */
          <fieldset disabled={isPending} className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="task-title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                required
                maxLength={100}
              />
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">
                  Provide a clear and concise title
                </p>
                <span
                  className={`text-sm ${
                    title.length > 80
                      ? "text-orange-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {100 - title.length} characters remaining
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="task-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 500);
                  setDescription(value);
                }}
                placeholder="Task description"
                maxLength={500}
                className="resize-none w-full min-h-[80px] max-h-[200px] overflow-y-auto whitespace-pre-wrap"
                style={{ overflowWrap: "anywhere" }}
              />
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">
                  Provide detailed instructions
                </p>
                <span
                  className={`text-sm ${
                    description.length > 450
                      ? "text-orange-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {500 - description.length} characters remaining
                </span>
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label htmlFor="task-due-date" className="text-sm font-medium">
                Due Date
              </label>
              <Input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]} // Prevent choosing past dates
              />
              <p className="text-xs text-muted-foreground">
                Cannot be earlier than today
              </p>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label htmlFor="task-priority" className="text-sm font-medium">
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")
                }
                className="w-full border rounded-md p-2 text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-between pt-4">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? "Deleting..." : "Delete Task"}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isPending || !title.trim()}
              >
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            <Button
              variant="secondary"
              onClick={resetDialog}
              className="w-full"
              disabled={isPending}
            >
              Back to Task List
            </Button>
          </fieldset>
        )}
      </DialogContent>
    </Dialog>
  );
}
