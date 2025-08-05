"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateTaskAction(task: {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
}) {
  await prisma.task.update({
    where: { id: task.id },
    data: {
      title: task.title,
      description: task.description,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
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
