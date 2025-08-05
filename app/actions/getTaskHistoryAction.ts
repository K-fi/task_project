"use server";

import { prisma } from "@/lib/db";
import { userRequired } from "@/app/data/user/is-user-authenticated";

export const getTaskHistoryAction = async (taskId: string) => {
  const { user } = await userRequired();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email as string },
    select: { id: true },
  });

  if (!dbUser) throw new Error("User not found");

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: true,
      submissionLogs: {
        orderBy: { submittedAt: "desc" },
        include: {
          submittedBy: { select: { name: true } },
        },
      },
    },
  });

  if (!task || task.assignedId !== dbUser.id) {
    throw new Error("You are not authorized to view this task");
  }

  return task.submissionLogs.map((log) => ({
    id: log.id,
    content: log.content,
    submittedAt: log.submittedAt,
    submittedBy: { name: log.submittedBy?.name ?? "Unknown" },
  }));
};
