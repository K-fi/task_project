"use server";

import { prisma } from "@/lib/db";
import { TaskStatus } from "@/lib/generated/prisma";
import dayjs from "dayjs";

export async function markOverdueTasksAction(userId?: string) {
  // Get the start of today (00:00:00 of current day)
  const startOfToday = dayjs().startOf("day").toDate();

  const whereClause: any = {
    // Due date is before today (meaning due date was yesterday or earlier)
    dueDate: { lt: startOfToday },
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
