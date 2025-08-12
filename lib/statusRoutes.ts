// lib/statusRoutes.ts
import { TaskStatus } from "@/lib/generated/prisma";

type ExtraStatus = "ALL" | "TODO_OVERDUE" | "COMPLETED_LATE";
type StatusKey = TaskStatus | ExtraStatus;

export const taskStatusRoutes: Record<StatusKey, string> = {
  ALL: "/dashboard/all",
  TODO: "/dashboard",
  COMPLETED: "/dashboard/completed",
  LATE: "/dashboard/late",
  OVERDUE: "/dashboard/overdue",
  TODO_OVERDUE: "/dashboard",
  COMPLETED_LATE: "/dashboard/completed", // combined route
};
