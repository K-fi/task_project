"use client";

import { assignTask } from "@/app/actions/assignTask";
import { useRef, useTransition, useState, useEffect } from "react";
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
    <DialogContent
      aria-describedby="dialog-description"
      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
    >
      <DialogHeader>
        <DialogTitle>Assign New Task</DialogTitle>
        <DialogDescription id="dialog-description">
          Create a new task assignment for this intern
        </DialogDescription>
      </DialogHeader>

      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <input type="hidden" name="assignedId" value={internId} />

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="dark:text-gray-200">
            Title
          </Label>
          <Input
            name="title"
            id="title"
            required
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-describedby="title-help"
            className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
          />
          <div className="flex justify-between">
            <p
              id="title-help"
              className="text-sm text-gray-600 dark:text-gray-300"
            >
              Enter a clear, descriptive title
            </p>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {100 - title.length} characters remaining
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="dark:text-gray-200">
            Description
          </Label>
          <Textarea
            name="description"
            id="description"
            rows={3}
            maxLength={500}
            value={description}
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
              Provide detailed instructions
            </p>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {500 - description.length} characters remaining
            </span>
          </div>
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label htmlFor="priority" className="dark:text-gray-200">
            Priority
          </Label>
          <select
            name="priority"
            id="priority"
            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-offset-gray-800"
            defaultValue="LOW"
            aria-describedby="priority-help"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <p
            id="priority-help"
            className="text-sm text-gray-600 dark:text-gray-300"
          >
            Select the urgency level for this task
          </p>
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <Label htmlFor="dueDate" className="dark:text-gray-200">
            Due Date
          </Label>
          <Input
            type="date"
            name="dueDate"
            id="dueDate"
            min={minDate}
            required
            aria-describedby="dueDate-help"
            className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
          />
          <p
            id="dueDate-help"
            className="text-sm text-gray-600 dark:text-gray-300"
          >
            Set the deadline for task completion
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isPending}
          className="
    w-full 
    bg-gray-100 dark:bg-gray-700 
    text-gray-900 dark:text-gray-100 
    border border-gray-300 dark:border-gray-600
    hover:bg-gray-200 dark:hover:bg-gray-600 
    focus:outline-none 
    focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 
    transition-colors
  "
        >
          {isPending ? "Assigning..." : "Assign Task"}
        </Button>
      </form>
    </DialogContent>
  );
}
