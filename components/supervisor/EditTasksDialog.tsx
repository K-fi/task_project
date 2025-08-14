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
  const [filterDate, setFilterDate] = useState<string>(""); // for calendar filter
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Sort tasks by createdAt (newest first)
  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Filtered tasks based on selected filter date
  const filteredTasks = sortedTasks.filter((task) => {
    if (!filterDate) return true; // show all if no date selected
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
  };

  const handleSave = () => {
    if (!selectedTaskId || !title.trim()) return;

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
          <div className="relative space-y-2">
            {/* Calendar filter */}
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
          <fieldset disabled={isPending} className="space-y-4">
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
              <p className="text-sm text-muted-foreground text-right">
                {100 - title.length} characters remaining
              </p>
            </div>

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
                onPaste={(e) => {
                  const pastedText = e.clipboardData
                    .getData("text/plain")
                    .slice(0, 500 - description.length);
                  const value = description + pastedText;
                  setDescription(value.slice(0, 500));
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
              {description.length > 450 && (
                <p className="text-xs text-orange-500">
                  You're approaching the character limit
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="task-due-date" className="text-sm font-medium">
                Due Date
              </label>
              <Input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

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
