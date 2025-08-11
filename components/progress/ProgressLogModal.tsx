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
import {
  createProgressLogAction,
  updateProgressLogAction,
} from "@/app/actions/progressLogActions";
import { Task } from "@/lib/generated/prisma";

export interface ProgressLogFormData {
  id?: string; // optional so creation doesn't require id
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hoursString, setHoursString] = useState("");
  const [taskId, setTaskId] = useState<string | null>(null); // default to null for "General"
  const [date, setDate] = useState<Date>(defaultDate ?? new Date());

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

      // IMPORTANT: use the saved title (not the linked task title)
      setTitle(initialData.title);
      setDescription(initialData.description);
    } else {
      setTitle("");
      setDescription("");
      setHoursString("");
      setTaskId(null); // default to General (no linked task)
      setDate(defaultDate ?? new Date());
    }
  }, [initialData, open, defaultDate, tasks]);

  const parsedHours = Number(hoursString);
  const canSave =
    title.trim().length > 0 &&
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

  // Show linked task under title; DO NOT override title when selecting a task.
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Progress" : "Log Progress"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title field — user always editable */}
          <div>
            <Input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
              required
            />
            {linkedTask && (
              <p className="text-xs text-gray-500 mt-1">
                Linked task: {linkedTask.title}
              </p>
            )}
          </div>

          {/* Description field */}
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you worked on..."
            disabled={saving}
          />

          {/* Hours worked */}
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Hours (e.g. 1.5)"
            value={hoursString}
            onChange={(e) => setHoursString(e.target.value)}
            disabled={saving}
          />

          {/* Date */}
          <div>
            <label className="text-sm block mb-1">Date</label>
            <input
              type="date"
              className="border rounded p-2 w-full"
              value={formatDateInput(date)}
              onChange={(e) => setDate(parseDateInput(e.target.value))}
              max={formatDateInput(new Date())}
              disabled={saving}
            />
          </div>

          {/* Task selector */}
          <div>
            <label className="text-sm block mb-1">Task (optional)</label>
            <select
              className="w-full border rounded p-2"
              value={taskId ?? ""}
              onChange={(e) =>
                setTaskId(e.target.value === "" ? null : e.target.value)
              }
              disabled={saving}
            >
              <option value="">-- General Task --</option>
              {filteredTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
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
