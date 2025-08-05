"use client";

import { assignTask } from "@/app/actions/assignTask";
import { useRef, useTransition } from "react";
import { useEffect, useState } from "react";

export default function AssignTaskForm({ internId }: { internId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [minDate, setMinDate] = useState("");

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setMinDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await assignTask(formData);
      formRef.current?.reset();
    });
  };

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <input type="hidden" name="assignedId" value={internId} />

      <div className="space-y-1">
        <label htmlFor="title" className="text-sm font-medium">Title</label>
        <input
          name="title"
          id="title"
          className="w-full border p-2 rounded"
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="text-sm font-medium">Description</label>
        <textarea
          name="description"
          id="description"
          className="w-full border p-2 rounded"
          rows={3}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="priority" className="text-sm font-medium">Priority</label>
        <select
          name="priority"
          id="priority"
          className="w-full border p-2 rounded"
          defaultValue="LOW"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="dueDate" className="text-sm font-medium">Due Date</label>
        <input
          type="date"
          name="dueDate"
          id="dueDate"
          className="w-full border p-2 rounded"
          min={minDate}
          required
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {isPending ? "Assigning..." : "Assign Task"}
      </button>
    </form>
  );
}
