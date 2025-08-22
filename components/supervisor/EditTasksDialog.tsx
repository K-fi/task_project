"use client";

import React, { useState, useTransition, useMemo } from "react";
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
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

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

// HOISTED to avoid ReferenceError
function formatDateToInput(date: Date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  const [searchTitle, setSearchTitle] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [groupDeleteMode, setGroupDeleteMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const router = useRouter();

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [tasks]
  );

  // All task due dates for calendar dots
  const allTaskDueDates = useMemo(() => {
    return new Set(
      tasks
        .filter((t) => t.dueDate)
        .map((t) => new Date(t.dueDate!).toDateString())
    );
  }, [tasks]);

  // Filter tasks for list display
  const filteredTasks = sortedTasks.filter((task) => {
    if (
      filterDate &&
      (!task.dueDate ||
        formatDateToInput(new Date(task.dueDate)) !== filterDate)
    ) {
      return false;
    }
    if (
      searchTitle &&
      !task.title.toLowerCase().includes(searchTitle.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleSelectTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    setSelectedTaskId(taskId);
    setTitle(task.title);
    setDescription(task.description || "");
    setDueDate(task.dueDate ? formatDateToInput(new Date(task.dueDate)) : "");
    setPriority(task.priority);
  };

  const handleSave = () => {
    if (!selectedTaskId || !title.trim()) return;

    const taskCreated = tasks.find((t) => t.id === selectedTaskId)?.createdAt;
    if (dueDate && taskCreated && new Date(dueDate) < new Date(taskCreated)) {
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

  const handleDelete = async (ids: string[]) => {
    if (ids.length === 0) return;

    startTransition(async () => {
      await Promise.all(ids.map((id) => deleteTaskAction(id)));
      resetDialog();
      setSelectedTasks(new Set());
      router.refresh();
      setIsOpen(false);
    });
  };

  const toggleSelectTask = (id: string) => {
    const newSet = new Set(selectedTasks);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedTasks(newSet);
  };

  const selectAllTasks = () =>
    setSelectedTasks(new Set(filteredTasks.map((t) => t.id)));
  const deselectAllTasks = () => setSelectedTasks(new Set());

  const resetDialog = () => {
    setSelectedTaskId(null);
    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("LOW");
    setGroupDeleteMode(false);
    setSelectedTasks(new Set());
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

      <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tasks for {internName}</DialogTitle>
          <DialogDescription>
            {selectedTaskId
              ? "Modify task details below"
              : "You can filter by title or due date"}
          </DialogDescription>
        </DialogHeader>

        {!selectedTaskId && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Input
                type="text"
                placeholder="Search by title..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                className="flex-1 min-w-[150px] bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    {filterDate
                      ? new Date(filterDate).toDateString()
                      : "Filter by Due Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <DayPicker
                    mode="single"
                    selected={filterDate ? new Date(filterDate) : undefined}
                    onSelect={(date) =>
                      setFilterDate(date ? formatDateToInput(date) : "")
                    }
                    modifiers={{
                      hasTask: (date) =>
                        allTaskDueDates.has(date.toDateString()),
                      today: (date) =>
                        date.toDateString() === new Date().toDateString(),
                    }}
                    modifiersClassNames={{
                      hasTask:
                        "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary",
                      today: "border border-primary rounded-full",
                    }}
                  />
                  {filterDate && (
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => setFilterDate("")}
                    >
                      Clear date
                    </Button>
                  )}
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterDate("");
                  setSearchTitle("");
                }}
              >
                Clear Filters
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <Button
                variant={groupDeleteMode ? "default" : "outline"}
                size="sm"
                onClick={() => setGroupDeleteMode(!groupDeleteMode)}
              >
                {groupDeleteMode ? "Cancel Group Delete" : "Group Delete"}
              </Button>

              {groupDeleteMode && filteredTasks.length > 0 && (
                <>
                  <Button size="sm" onClick={selectAllTasks}>
                    Select All
                  </Button>
                  <Button size="sm" onClick={deselectAllTasks}>
                    Deselect All
                  </Button>
                  {selectedTasks.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(Array.from(selectedTasks))}
                    >
                      Delete Selected ({selectedTasks.size})
                    </Button>
                  )}
                </>
              )}
            </div>

            <fieldset
              disabled={isPending}
              className="space-y-2 max-h-[400px] overflow-y-auto pb-4"
            >
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2">
                    {groupDeleteMode && (
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(task.id)}
                        onChange={() => toggleSelectTask(task.id)}
                        className="w-4 h-4"
                      />
                    )}
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => handleSelectTask(task.id)}
                    >
                      <div className="truncate w-full text-left">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          Created:{" "}
                          {new Date(task.createdAt).toLocaleDateString("en-GB")}
                          {task.dueDate &&
                            ` | Due: ${new Date(
                              task.dueDate
                            ).toLocaleDateString("en-GB")}`}
                        </div>
                      </div>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-[100px] text-gray-500 dark:text-gray-300">
                  <p>No tasks available</p>
                  <p className="text-sm">Please assign tasks first</p>
                </div>
              )}
            </fieldset>
          </div>
        )}

        {selectedTaskId && (
          <fieldset disabled={isPending} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="task-title"
                className="text-sm font-medium dark:text-gray-200"
              >
                Title
              </label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                required
                maxLength={100}
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="task-description"
                className="text-sm font-medium dark:text-gray-200"
              >
                Description
              </label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                placeholder="Task description"
                maxLength={500}
                className="resize-none w-full min-h-[80px] max-h-[200px] overflow-y-auto whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="task-due-date"
                className="text-sm font-medium dark:text-gray-200"
              >
                Due Date
              </label>
              <Input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="task-priority"
                className="text-sm font-medium dark:text-gray-200"
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")
                }
                className="w-full border rounded-md p-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="flex gap-2 justify-between pt-4 flex-wrap">
              <Button
                variant="destructive"
                onClick={() => handleDelete([selectedTaskId!])}
                disabled={isPending}
                className="hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
              >
                {isPending ? "Deleting..." : "Delete Task"}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isPending || !title.trim()}
                className="hover:bg-gray-300 dark:hover:bg-gray-300 transition-colors"
              >
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            <Button
              variant="secondary"
              onClick={resetDialog}
              className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors mt-2"
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
