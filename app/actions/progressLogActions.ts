"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUserWithRole } from "@/lib/auth/requireUserWithRole";

type CreateProgressLogParams = {
  taskId: string | null; // allow null for general logs
  title: string; // user-supplied title (required)
  description: string;
  hoursWorked: number;
  date: string; // YYYY-MM-DD
};

export async function createProgressLogAction({
  taskId,
  title,
  description,
  hoursWorked,
  date,
}: CreateProgressLogParams) {
  const user = await requireUserWithRole("INTERN");

  if (!title || !title.trim()) throw new Error("Title is required");
  if (!description || !description.trim())
    throw new Error("Description is required");
  if (Number.isNaN(hoursWorked) || hoursWorked <= 0) {
    throw new Error("Hours worked must be a positive number");
  }

  const parsed = new Date(date);
  parsed.setHours(0, 0, 0, 0);

  // If taskId passed, validate it exists and optionally is assigned to this intern
  if (taskId) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error("Task not found");
    if (task.assignedId && task.assignedId !== user.id) {
      throw new Error("You are not assigned to this task");
    }
  }

  const created = await prisma.progressLog.create({
    data: {
      taskId: taskId ?? null,
      title: title.trim(), // <-- store user's title always
      description: description.trim(),
      hoursWorked,
      date: parsed,
      userId: user.id,
    },
    include: {
      task: { select: { id: true, title: true } },
    },
  });

  revalidatePath(`/log-progress/${user.id}`);
  return created;
}

export async function getMyProgressLogsByDateAction({
  date,
}: {
  date: string;
}) {
  const user = await requireUserWithRole("INTERN");

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return prisma.progressLog.findMany({
    where: {
      userId: user.id,
      date: {
        gte: start,
        lt: end,
      },
    },
    include: {
      task: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateProgressLogAction({
  id,
  taskId,
  title,
  description,
  hoursWorked,
  date,
}: {
  id: string;
  taskId: string | null;
  title: string;
  description: string;
  hoursWorked: number;
  date: string;
}) {
  const user = await requireUserWithRole("INTERN");
  const existing = await prisma.progressLog.findUnique({ where: { id } });
  if (!existing) throw new Error("Progress log not found");
  if (existing.userId !== user.id) throw new Error("Not authorized");

  if (!title || !title.trim()) throw new Error("Title is required");
  if (!description || !description.trim())
    throw new Error("Description is required");
  if (Number.isNaN(hoursWorked) || hoursWorked <= 0) {
    throw new Error("Hours worked must be a positive number");
  }

  const parsed = new Date(date);
  parsed.setHours(0, 0, 0, 0);

  // If taskId passed, validate it exists and optionally is assigned to this intern
  if (taskId) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error("Task not found");
    if (task.assignedId && task.assignedId !== user.id) {
      throw new Error("You are not assigned to this task");
    }
  }

  const updated = await prisma.progressLog.update({
    where: { id },
    data: {
      taskId: taskId ?? null,
      title: title.trim(), // <-- preserve user-supplied title
      description: description.trim(),
      hoursWorked,
      date: parsed,
    },
    include: { task: { select: { id: true, title: true } } },
  });

  revalidatePath(`/log-progress/${user.id}`);
  return updated;
}

export async function deleteProgressLogAction({ id }: { id: string }) {
  const user = await requireUserWithRole("INTERN");
  const existing = await prisma.progressLog.findUnique({ where: { id } });
  if (!existing) throw new Error("Progress log not found");
  if (existing.userId !== user.id) throw new Error("Not authorized");

  await prisma.progressLog.delete({ where: { id } });
  revalidatePath(`/log-progress/${user.id}`);
  return { success: true };
}
