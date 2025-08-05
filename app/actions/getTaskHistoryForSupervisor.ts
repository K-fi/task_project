"use server";

import { prisma } from "@/lib/db";
import { userRequired } from "@/app/data/user/is-user-authenticated";

export const getTaskHistoryForSupervisor = async (taskId: string) => {
  const { user } = await userRequired();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email as string },
    select: {
      id: true,
      supervising: { select: { id: true } }, // interns they supervise
    },
  });

  if (!dbUser) throw new Error("User not found");

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: { select: { id: true } },
      submissionLogs: {
        orderBy: { submittedAt: "desc" },
        include: { submittedBy: { select: { name: true } } },
      },
    },
  });

  if (!task || !task.assignee) {
    throw new Error("Task not found or has no assignee");
  }

  const isSupervisorOfTask = dbUser.supervising.some(
    (intern) => intern.id === task.assignee!.id
  );

  if (!isSupervisorOfTask) {
    throw new Error("You are not authorized to view this task");
  }

  return task.submissionLogs.map((log) => ({
    id: log.id,
    content: log.content,
    submittedAt: log.submittedAt,
    submittedBy: { name: log.submittedBy?.name ?? "Unknown" },
  }));
};
