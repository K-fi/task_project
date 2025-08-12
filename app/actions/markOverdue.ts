"use server";

import { prisma } from "@/lib/db";
import { TaskStatus } from "@/lib/generated/prisma";
import dayjs from "dayjs";

export async function markOverdueTasksAction(userId?: string) {
  const now = dayjs().toDate();

  const whereClause: any = {
    dueDate: { lt: now },
    status: TaskStatus.TODO,
  };

  if (userId) {
    whereClause.assignedId = userId; // filter by assigned user if provided
  }

  const result = await prisma.task.updateMany({
    where: whereClause,
    data: {
      status: TaskStatus.OVERDUE,
    },
  });

  return result.count;
}
