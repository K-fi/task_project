"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUserWithRole } from "@/lib/auth/requireUserWithRole";

type CreateProgressLogParams = {
  taskId: string | null;      // reference only, no enforced relation
  taskTitle: string | null;   // stored as plain string
  title: string;              // required user-supplied title
  description: string;
  hoursWorked: number;
  date: string;               // YYYY-MM-DD
};

// Create
export async function createProgressLogAction({
  taskId,
  taskTitle,
  title,
  description,
  hoursWorked,
  date,
}: CreateProgressLogParams) {
  const user = await requireUserWithRole("INTERN");

  if (!title?.trim()) throw new Error("Title is required");
  if (!description?.trim()) throw new Error("Description is required");
  if (Number.isNaN(hoursWorked) || hoursWorked <= 0) {
    throw new Error("Hours worked must be a positive number");
  }

  const parsedDate = new Date(date);
  parsedDate.setHours(0, 0, 0, 0);

  let finalTaskTitle: string | null = null;

  if (taskId) {
    // fetch the task only to validate & get title
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, title: true, assignedId: true },
    });
    if (!task) throw new Error("Task not found");
    if (task.assignedId && task.assignedId !== user.id) {
      throw new Error("You are not assigned to this task");
    }
    finalTaskTitle = task.title;
  } else if (taskTitle) {
    finalTaskTitle = taskTitle.trim();
  }

  const created = await prisma.progressLog.create({
    data: {
      taskId,
      taskTitle: finalTaskTitle,
      title: title.trim(),
      description: description.trim(),
      hoursWorked,
      date: parsedDate,
      userId: user.id,
    },
  });

  revalidatePath(`/log-progress/${user.id}`);
  return created;
}

// Get logs by date
export async function getMyProgressLogsByDateAction({ date }: { date: string }) {
  const user = await requireUserWithRole("INTERN");

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return prisma.progressLog.findMany({
    where: {
      userId: user.id,
      date: { gte: start, lt: end },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Update
export async function updateProgressLogAction({
  id,
  taskId,
  taskTitle,
  title,
  description,
  hoursWorked,
  date,
}: {
  id: string;
  taskId: string | null;
  taskTitle: string | null;
  title: string;
  description: string;
  hoursWorked: number;
  date: string;
}) {
  const user = await requireUserWithRole("INTERN");
  const existing = await prisma.progressLog.findUnique({ where: { id } });

  if (!existing) throw new Error("Progress log not found");
  if (existing.userId !== user.id) throw new Error("Not authorized");

  if (!title?.trim()) throw new Error("Title is required");
  if (!description?.trim()) throw new Error("Description is required");
  if (Number.isNaN(hoursWorked) || hoursWorked <= 0) {
    throw new Error("Hours worked must be a positive number");
  }

  const parsedDate = new Date(date);
  parsedDate.setHours(0, 0, 0, 0);

  let finalTaskTitle: string | null = null;

  if (taskId) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, title: true, assignedId: true },
    });
    if (!task) throw new Error("Task not found");
    if (task.assignedId && task.assignedId !== user.id) {
      throw new Error("You are not assigned to this task");
    }
    finalTaskTitle = task.title;
  } else if (taskTitle) {
    finalTaskTitle = taskTitle.trim();
  }

  const updated = await prisma.progressLog.update({
    where: { id },
    data: {
      taskId,
      taskTitle: finalTaskTitle,
      title: title.trim(),
      description: description.trim(),
      hoursWorked,
      date: parsedDate,
    },
  });

  revalidatePath(`/log-progress/${user.id}`);
  return updated;
}

// Delete
export async function deleteProgressLogAction({ id }: { id: string }) {
  const user = await requireUserWithRole("INTERN");
  const existing = await prisma.progressLog.findUnique({ where: { id } });

  if (!existing) throw new Error("Progress log not found");
  if (existing.userId !== user.id) throw new Error("Not authorized");

  await prisma.progressLog.delete({ where: { id } });
  revalidatePath(`/log-progress/${user.id}`);

  return { success: true };
}
