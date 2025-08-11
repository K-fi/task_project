"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateTaskAction(task: {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
}) {
  if (task.title.length > 100) {
    throw new Error("Title must be 100 characters or less");
  }

  if (task.description && task.description.length > 500) {
    throw new Error("Description must be 500 characters or less");
  }

  await prisma.task.update({
    where: { id: task.id },
    data: {
      title: task.title,
      description: task.description,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      priority: task.priority,
    },
  });

  revalidatePath("/dashboard");
}

export async function deleteTaskAction(taskId: string) {
  await prisma.task.delete({
    where: { id: taskId },
  });

  revalidatePath("/dashboard");
}
