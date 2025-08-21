// components/progress/ProgressLogForm.tsx
"use client";

import { useState, useTransition } from "react";
import { createProgressLogAction } from "@/app/actions/progressLogActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

type Props = {
  taskId: string;
  taskTitle: string; // Parent task title
  date: Date;
  onSaved?: () => void; // optional callback
};

export default function ProgressLogForm({
  taskId,
  taskTitle,
  date,
  onSaved,
}: Props) {
  const [logTitle, setLogTitle] = useState(""); // NEW: title for this log
  const [description, setDescription] = useState("");
  const [hoursString, setHoursString] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const parsedHours = parseFloat(hoursString);
  const canSave =
    logTitle.trim().length > 0 &&
    description.trim().length > 0 &&
    !Number.isNaN(parsedHours) &&
    parsedHours > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    startTransition(async () => {
      try {
        await createProgressLogAction({
          taskId,
          taskTitle, // ✅ pass parent task title correctly
          title: logTitle.trim(), // ✅ progress log title
          description: description.trim(),
          hoursWorked: parsedHours,
          date: date.toISOString().split("T")[0],
        });

        // Reset form after save
        setLogTitle("");
        setDescription("");
        setHoursString("");
        router.refresh();
        if (onSaved) onSaved();
      } catch (err) {
        console.error("Failed to create progress log", err);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border p-4 rounded-md">
      <h3 className="font-semibold">Progress for {date.toDateString()}</h3>

      {/* Progress Log Title */}
      <Input
        value={logTitle}
        onChange={(e) => setLogTitle(e.target.value)}
        placeholder="Progress log title"
      />

      {/* Progress Description */}
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your progress..."
      />

      {/* Hours Worked */}
      <Input
        type="number"
        step="0.1"
        value={hoursString}
        onChange={(e) => setHoursString(e.target.value)}
        placeholder="Hours worked"
      />

      {/* Submit Button */}
      <Button type="submit" disabled={isPending || !canSave}>
        {isPending ? "Saving..." : "Save Progress"}
      </Button>
    </form>
  );
}
