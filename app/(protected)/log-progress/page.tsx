import { prisma } from "@/lib/db";
import { requireUserWithRole } from "@/lib/auth/requireUserWithRole";
import { startOfDay } from "date-fns";
import ProgressLog from "@/components/progress/ProgressLog";

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

  // Fetch progress logs for today (initial date)
  const start = today;
  const end = new Date(today);
  end.setDate(end.getDate() + 1);

  const rawLogs = await prisma.progressLog.findMany({
    where: {
      userId: user.id,
      date: {
        gte: start,
        lt: end,
      },
    },
    include: { task: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ProgressLog
      tasks={tasks}
      initialDate={today.toISOString()}
      initialLogs={rawLogs}
    />
  );
}
