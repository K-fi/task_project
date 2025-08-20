"use server";

import { prisma } from "@/lib/db";
import { userRequired } from "@/app/data/user/is-user-authenticated";
import { TaskStatus } from "@/lib/generated/prisma";

export const completeTaskAction = async ({
  taskId,
  submission,
}: {
  taskId: string;
  submission?: string;
}) => {
  const { user } = await userRequired();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email as string },
    select: { id: true },
  });

  if (!dbUser) throw new Error("User not found");

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { assignee: true },
  });

  if (!task || task.assignedId !== dbUser.id) {
    throw new Error("You are not authorized to complete this task");
  }

  const now = new Date();

  // helper to normalize to start of the day (ignore time part)
  const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const isLate = startOfDay(task.dueDate) < startOfDay(now);

  const newStatus: TaskStatus = isLate ? TaskStatus.LATE : TaskStatus.COMPLETED;

  await prisma.$transaction([
    // 1. Update task's current status and submission
    prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        submission,
      },
    }),

    // 2. Record submission history
    prisma.submissionLog.create({
      data: {
        taskId,
        content: submission ?? "",
        userId: dbUser.id,
      },
    }),
  ]);

  return newStatus;
};
