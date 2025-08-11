// lib/statusRoutes.ts
import { TaskStatus } from "@/lib/generated/prisma";

export const taskStatusRoutes: Record<"ALL" | TaskStatus, string> = {
  ALL: "/dashboard/all",
  TODO: "/dashboard",
  COMPLETED: "/dashboard/completed",
  LATE: "/dashboard/late",
  OVERDUE: "/dashboard/overdue",
};
