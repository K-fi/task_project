"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  createProgressLogAction,
  updateProgressLogAction,
} from "@/app/actions/progressLogActions";
import { Task } from "@/lib/generated/prisma";

export interface ProgressLogFormData {
  id?: string;
  title: string;
  description: string;
  hoursWorked: number;
  date: Date | string;
  taskId: string | null;
  taskTitle: string | null; // Added taskTitle field
}

export default function ProgressLogModal({
  open,
  onOpenChange,
  initialData,
  tasks,
  defaultDate,
  saving,
  setSaving,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialData?: ProgressLogFormData;
  tasks: Task[];
  defaultDate?: Date;
  saving: boolean;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hoursString, setHoursString] = useState("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState<string | null>(null); // Added taskTitle state
  const [date, setDate] = useState<Date>(defaultDate ?? new Date());
  const [useCustomTask, setUseCustomTask] = useState(false); // Toggle for custom task entry

  const TITLE_LIMIT = 100;
  const DESCRIPTION_LIMIT = 500;

  function formatDateInput(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function parseDateInput(value: string) {
    const [y, m, day] = value.split("-").map(Number);
    return new Date(y, m - 1, day);
  }

  useEffect(() => {
    if (initialData) {
      setHoursString(String(initialData.hoursWorked));
      setTaskId(initialData.taskId ?? null);
      setTaskTitle(initialData.taskTitle ?? null);
      const normalizedDate =
        typeof initialData.date === "string"
          ? parseDateInput(initialData.date.split("T")[0])
          : parseDateInput(formatDateInput(initialData.date));
      setDate(normalizedDate);

      setTitle(initialData.title);
      setDescription(initialData.description);

      // If there's a taskTitle but no taskId, show custom task input
      if (initialData.taskTitle && !initialData.taskId) {
        setUseCustomTask(true);
      }
    } else {
      setTitle("");
      setDescription("");
      setHoursString("");
      setTaskId(null);
      setTaskTitle(null);
      setUseCustomTask(false);
      setDate(defaultDate ?? new Date());
    }
  }, [initialData, open, defaultDate, tasks]);

  const parsedHours = Number(hoursString);
  const canSave =
    title.trim().length > 0 &&
    title.length <= TITLE_LIMIT &&
    description.length <= DESCRIPTION_LIMIT &&
    !Number.isNaN(parsedHours) &&
    parsedHours > 0 &&
    toStartOfDay(date).getTime() <= toStartOfDay(new Date()).getTime();

  const filteredTasks = useMemo(() => {
    if (!initialData?.taskId) {
      return tasks.filter((t) => t.status === "TODO" || t.status === "OVERDUE");
    }
    return tasks.filter(
      (t) =>
        t.status === "TODO" ||
        t.status === "OVERDUE" ||
        t.id === initialData.taskId
    );
  }, [tasks, initialData]);

  const linkedTask = taskId ? tasks.find((t) => t.id === taskId) : null;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const dateStr = formatDateInput(date);
      const finalTitle = title.trim();
      const finalDescription = description.trim();

      if (initialData?.id) {
        await updateProgressLogAction({
          id: initialData.id,
          taskId: useCustomTask ? null : taskId, // Send null if using custom task
          taskTitle: useCustomTask ? taskTitle : null, // Send custom task title
          title: finalTitle,
          description: finalDescription,
          hoursWorked: parsedHours,
          date: dateStr,
        });
      } else {
        await createProgressLogAction({
          taskId: useCustomTask ? null : taskId, // Send null if using custom task
          taskTitle: useCustomTask ? taskTitle : null, // Send custom task title
          title: finalTitle,
          description: finalDescription,
          hoursWorked: parsedHours,
          date: dateStr,
        });
      }

      onOpenChange(false);
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Progress" : "Log Progress"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="dark:text-gray-200">
              Title
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="What did you work on?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
              required
              maxLength={TITLE_LIMIT}
              aria-describedby="title-help"
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            />
            <div className="flex justify-between">
              <p
                id="title-help"
                className="text-sm text-gray-600 dark:text-gray-300"
              >
                Brief summary of your work
              </p>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {TITLE_LIMIT - title.length} characters remaining
              </span>
            </div>
          </div>

          {/* Description field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="dark:text-gray-200">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              placeholder="Describe what you worked on in detail..."
              rows={3}
              maxLength={500}
              onChange={(e) => setDescription(e.target.value)}
              aria-describedby="description-help"
              className="resize-none w-full min-h-[80px] max-h-[200px] overflow-y-auto whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              style={{ overflowWrap: "anywhere" }}
            />
            <div className="flex justify-between">
              <p
                id="description-help"
                className="text-sm text-gray-600 dark:text-gray-300"
              >
                Detailed notes about your progress
              </p>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {DESCRIPTION_LIMIT - description.length} characters remaining
              </span>
            </div>
          </div>

          {/* Hours worked */}
          <div className="space-y-2">
            <Label htmlFor="hours" className="dark:text-gray-200">
              Hours Worked
            </Label>
            <Input
              id="hours"
              type="number"
              inputMode="decimal"
              placeholder="1.5"
              value={hoursString}
              onChange={(e) => setHoursString(e.target.value)}
              disabled={saving}
              min="0.1"
              step="0.1"
              aria-describedby="hours-help"
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            />
            <p
              id="hours-help"
              className="text-sm text-gray-600 dark:text-gray-300"
            >
              Enter time spent in hours (e.g., 1.5 for 1 hour 30 minutes)
            </p>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="dark:text-gray-200">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={formatDateInput(date)}
              onChange={(e) => setDate(parseDateInput(e.target.value))}
              max={formatDateInput(new Date())}
              disabled={saving}
              aria-describedby="date-help"
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            />
            <p
              id="date-help"
              className="text-sm text-gray-600 dark:text-gray-300"
            >
              Select the date when work was done
            </p>
          </div>

          {/* Task selection */}
          <div className="space-y-2">
            <Label className="dark:text-gray-200">Related Task</Label>

            {/* Toggle between task selection and custom task input */}
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant={!useCustomTask ? "default" : "outline"}
                size="sm"
                onClick={() => setUseCustomTask(false)}
                className="flex-1"
              >
                Select Task
              </Button>
              <Button
                type="button"
                variant={useCustomTask ? "default" : "outline"}
                size="sm"
                onClick={() => setUseCustomTask(true)}
                className="flex-1"
              >
                Custom Task
              </Button>
            </div>

            {!useCustomTask ? (
              <>
                <select
                  className="w-full border rounded p-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  value={taskId ?? ""}
                  onChange={(e) =>
                    setTaskId(e.target.value === "" ? null : e.target.value)
                  }
                  disabled={saving}
                  aria-describedby="task-help"
                >
                  <option value="">-- General Progress --</option>
                  {filteredTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
                {linkedTask && (
                  <p className="text-xs text-gray-500 dark:text-gray-300">
                    Selected task: {linkedTask.title}
                  </p>
                )}
              </>
            ) : (
              <Input
                type="text"
                placeholder="Enter task name..."
                value={taskTitle ?? ""}
                onChange={(e) => setTaskTitle(e.target.value || null)}
                disabled={saving}
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />
            )}

            <p
              id="task-help"
              className="text-sm text-gray-600 dark:text-gray-300"
            >
              {!useCustomTask
                ? "Link to a specific task if applicable"
                : "Enter the name of the task you worked on"}
            </p>
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button
            variant="secondary"
            onClick={() => !saving && onOpenChange(false)}
            disabled={saving}
            className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="bg-gray-900 dark:bg-gray-100 text-white dark:text-black hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toStartOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
