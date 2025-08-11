"use client";

import { assignTask } from "@/app/actions/assignTask";
import { useRef, useTransition, useState } from "react";
import { useEffect } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function AssignTaskForm({ internId }: { internId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [minDate, setMinDate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const today = new Date();
    setMinDate(today.toISOString().split("T")[0]);
  }, []);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await assignTask(formData);
      formRef.current?.reset();
      setTitle("");
      setDescription("");
    });
  };

  return (
    <DialogContent aria-describedby="dialog-description">
      <DialogHeader>
        <DialogTitle>Assign New Task</DialogTitle>
        <DialogDescription id="dialog-description">
          Create a new task assignment for this intern
        </DialogDescription>
      </DialogHeader>

      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <input type="hidden" name="assignedId" value={internId} />

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            name="title"
            id="title"
            required
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-describedby="title-help"
          />
          <div className="flex justify-between">
            <p id="title-help" className="text-sm text-muted-foreground">
              Enter a clear, descriptive title
            </p>
            <span className="text-sm text-muted-foreground">
              {100 - title.length} characters remaining
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            name="description"
            id="description"
            rows={3}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-describedby="description-help"
            className="resize-none w-full min-h-[80px] max-h-[200px] overflow-y-auto whitespace-pre-wrap break-all"
          />
          <div className="flex justify-between">
            <p id="description-help" className="text-sm text-muted-foreground">
              Provide detailed instructions
            </p>
            <span className="text-sm text-muted-foreground">
              {500 - description.length} characters remaining
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <select
            name="priority"
            id="priority"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            defaultValue="LOW"
            aria-describedby="priority-help"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <p id="priority-help" className="text-sm text-muted-foreground">
            Select the urgency level for this task
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            type="date"
            name="dueDate"
            id="dueDate"
            min={minDate}
            required
            aria-describedby="dueDate-help"
          />
          <p id="dueDate-help" className="text-sm text-muted-foreground">
            Set the deadline for task completion
          </p>
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Assigning..." : "Assign Task"}
        </Button>
      </form>
    </DialogContent>
  );
}
