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
  date: Date;
  onSaved?: () => void; // optional callback
};

export default function ProgressLogForm({ taskId, date, onSaved }: Props) {
  const [description, setDescription] = useState("");
  const [hoursString, setHoursString] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const parsedHours = parseFloat(hoursString);
  const canSave =
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
          description: description.trim(),
          hoursWorked: parsedHours,
          date: date.toISOString().split("T")[0],
        });

        setDescription("");
        setHoursString("");
        // refresh the current route's server data
        router.refresh();
        if (onSaved) onSaved();
      } catch (err) {
        console.error("Failed to create progress log", err);
        // show toast/UI error if you have one
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border p-4 rounded-md">
      <h3 className="font-semibold">Progress for {date.toDateString()}</h3>
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your progress..."
      />
      <Input
        type="number"
        step="0.1"
        value={hoursString}
        onChange={(e) => setHoursString(e.target.value)}
        placeholder="Hours worked"
      />
      <Button type="submit" disabled={isPending || !canSave}>
        {isPending ? "Saving..." : "Save Progress"}
      </Button>
    </form>
  );
}
