import { prisma } from "@/lib/db";
import { requireUserWithRole } from "@/lib/auth/requireUserWithRole";
import ProgressLog from "@/components/progress/ProgressLog";
import { startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requireUserWithRole("INTERN");
  const today = startOfDay(new Date());

  // Fetch tasks assigned to user
  const tasks = await prisma.task.findMany({
    where: { assignedId: user.id },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
      startDate: true,
      submission: true,
      assignedId: true,
      creatorId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Fetch all progress logs for this user
  const allLogs = await prisma.progressLog.findMany({
    where: { userId: user.id },
    include: { task: { select: { id: true, title: true } } },
    orderBy: { date: "desc" },
  });

  return (
    <ProgressLog
      tasks={tasks}
      initialDate={today.toISOString()}
      allLogs={allLogs}
    />
  );
}
