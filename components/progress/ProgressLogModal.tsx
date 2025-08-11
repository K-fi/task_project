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
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hoursString, setHoursString] = useState("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(defaultDate ?? new Date());

  // Character limits
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

  // Load form state
  useEffect(() => {
    if (initialData) {
      setHoursString(String(initialData.hoursWorked));
      setTaskId(initialData.taskId ?? null);

      const normalizedDate =
        typeof initialData.date === "string"
          ? parseDateInput(initialData.date.split("T")[0])
          : parseDateInput(formatDateInput(initialData.date));
      setDate(normalizedDate);

      setTitle(initialData.title);
      setDescription(initialData.description);
    } else {
      setTitle("");
      setDescription("");
      setHoursString("");
      setTaskId(null);
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
          taskId,
          title: finalTitle,
          description: finalDescription,
          hoursWorked: parsedHours,
          date: dateStr,
        });
      } else {
        await createProgressLogAction({
          taskId,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Progress" : "Log Progress"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title field */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
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
              className="w-full"
            />
            <div className="flex justify-between">
              <p id="title-help" className="text-sm text-muted-foreground">
                Brief summary of your work
              </p>
              <span className="text-sm text-muted-foreground">
                {TITLE_LIMIT - title.length} characters remaining
              </span>
            </div>
            {linkedTask && (
              <p className="text-xs text-gray-500">
                Linked task: {linkedTask.title}
              </p>
            )}
          </div>

          {/* Description field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <div className="relative">
              <Textarea
                id="description"
                value={description}
                placeholder="Describe what you worked on in detail..."
                rows={3}
                maxLength={500}
                onChange={(e) => setDescription(e.target.value)}
                aria-describedby="description-help"
                className="resize-none w-full min-h-[80px] max-h-[200px] overflow-y-auto whitespace-pre-wrap"
                style={{ overflowWrap: "anywhere" }}
              />
            </div>
            <div className="flex justify-between">
              <p
                id="description-help"
                className="text-sm text-muted-foreground"
              >
                Detailed notes about your progress
              </p>
              <span className="text-sm text-muted-foreground">
                {DESCRIPTION_LIMIT - description.length} characters remaining
              </span>
            </div>
          </div>

          {/* Hours worked */}
          <div className="space-y-2">
            <Label htmlFor="hours">Hours Worked</Label>
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
            />
            <p id="hours-help" className="text-sm text-muted-foreground">
              Enter time spent in hours (e.g., 1.5 for 1 hour 30 minutes)
            </p>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formatDateInput(date)}
              onChange={(e) => setDate(parseDateInput(e.target.value))}
              max={formatDateInput(new Date())}
              disabled={saving}
              aria-describedby="date-help"
            />
            <p id="date-help" className="text-sm text-muted-foreground">
              Select the date when work was done
            </p>
          </div>

          {/* Task selector */}
          <div className="space-y-2">
            <Label htmlFor="task">Related Task (optional)</Label>
            <select
              id="task"
              className="w-full border rounded p-2 text-sm"
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
            <p id="task-help" className="text-sm text-muted-foreground">
              Link to a specific task if applicable
            </p>
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button
            variant="secondary"
            onClick={() => !saving && onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave || saving}>
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
