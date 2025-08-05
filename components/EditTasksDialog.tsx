"use client";

import React, { useState, useTransition } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSelectTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    setSelectedTaskId(taskId);
    setTitle(task?.title || "");
    setDescription(task?.description || "");
    setDueDate(task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "");
  };

  const handleSave = () => {
    if (!selectedTaskId) return;
    startTransition(async () => {
      await updateTaskAction({
        id: selectedTaskId,
        title,
        description,
        dueDate,
      });
      router.refresh();
      setIsOpen(false); // Close after done
    });
  };

  const handleDelete = () => {
    if (!selectedTaskId) return;
    startTransition(async () => {
      await deleteTaskAction(selectedTaskId);
      setSelectedTaskId(null);
      router.refresh();
      setIsOpen(false); // Close after done
    });
  };

  const resetDialog = () => {
    setSelectedTaskId(null);
    setTitle("");
    setDescription("");
    setDueDate("");
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
        <Button variant="outline" className="w-full">Edit Tasks</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tasks for {internName}</DialogTitle>
        </DialogHeader>

        {!selectedTaskId ? (
          <fieldset disabled={isPending} className="space-y-2">
            {tasks.map((task) => (
              <Button
                key={task.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleSelectTask(task.id)}
              >
                {task.title}
              </Button>
            ))}
          </fieldset>
        ) : (
          <fieldset disabled={isPending} className="space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
            />
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />

            <div className="flex gap-2 justify-between">
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                {isPending ? "Deleting..." : "Delete Task"}
              </Button>
              <Button
                onClick={handleSave}
              >
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            <Button
              variant="secondary"
              onClick={resetDialog}
              className="w-full mt-2"
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
