"use server";

import { prisma } from "@/lib/db";
import { TaskStatus } from "@/lib/generated/prisma";
import dayjs from "dayjs";

export async function markOverdueTasksAction(userId?: string) {
  // Get the start of today (00:00:00 of current day)
  const startOfToday = dayjs().startOf("day").toDate();

  const whereClauseBase: any = {};
  if (userId) {
    whereClauseBase.assignedId = userId;
  }

  // 1️⃣ Mark TODO tasks with past dueDate as OVERDUE
  const markOverdue = await prisma.task.updateMany({
    where: {
      ...whereClauseBase,
      dueDate: { lt: startOfToday },
      status: TaskStatus.TODO,
    },
    data: {
      status: TaskStatus.OVERDUE,
    },
  });

  // 2️⃣ Reset OVERDUE tasks with future dueDate back to TODO
  const resetToTodo = await prisma.task.updateMany({
    where: {
      ...whereClauseBase,
      dueDate: { gte: startOfToday },
      status: TaskStatus.OVERDUE,
    },
    data: {
      status: TaskStatus.TODO,
    },
  });

  return {
    markedOverdue: markOverdue.count,
    resetToTodo: resetToTodo.count,
  };
}
