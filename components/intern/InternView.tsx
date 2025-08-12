import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TaskCard from "../TaskCard";
import Link from "next/link";
import { taskStatusRoutes } from "@/lib/statusRoutes";
import { TaskStatus } from "@/lib/generated/prisma";

type ExtraStatus = "ALL" | "TODO_OVERDUE" | "COMPLETED_LATE";

interface InternViewProps {
  userId: string;
  name: string;
  currentStatus: ExtraStatus | TaskStatus;
}

const InternView = async ({ userId, name, currentStatus }: InternViewProps) => {
  let where: any = { assignedId: userId };

  if (currentStatus === "ALL") {
    // no status filter
  } else if (currentStatus === "TODO_OVERDUE") {
    where.status = { in: [TaskStatus.TODO, TaskStatus.OVERDUE] };
  } else if (currentStatus === "COMPLETED_LATE") {
    where.status = { in: [TaskStatus.COMPLETED, TaskStatus.LATE] };
  } else {
    where.status = currentStatus;
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { dueDate: "asc" },
    include: {
      creator: { select: { name: true } },
      submissionLogs: {
        select: {
          id: true,
          content: true,
          submittedAt: true,
          submittedBy: { select: { name: true } },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      supervisedBy: { select: { id: true, name: true, email: true } },
    },
  });

  const supervisors = user?.supervisedBy || [];
  const completedCount = tasks.filter(
    (task) => task.status === "COMPLETED" || task.status === "LATE"
  ).length;

  // Filters: Combine TODO+OVERDUE and COMPLETED+LATE
  const filters: (ExtraStatus | TaskStatus)[] = [
    "TODO_OVERDUE",
    "COMPLETED_LATE",
    ...Object.values(TaskStatus).filter(
      (status) =>
        status !== "TODO" &&
        status !== "OVERDUE" &&
        status !== "COMPLETED" &&
        status !== "LATE"
    ),
    "ALL",
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Welcome, {name} 👋
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-muted-foreground text-sm">
            You are supervised by{" "}
            {supervisors.length > 0
              ? supervisors.map((s) => s.name).join(", ")
              : "no one yet."}
          </p>
          <p className="text-muted-foreground text-sm">
            You have {tasks.length} task{tasks.length !== 1 ? "s" : ""}.{" "}
            {completedCount > 0 && `${completedCount} completed ✅`}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Tasks</h2>

          {/* Filter buttons */}
          <div className="flex gap-2">
            {filters.map((status) => {
              const isActive = currentStatus === status;
              const label =
                status === "TODO_OVERDUE"
                  ? "TODO"
                  : status === "COMPLETED_LATE"
                  ? "COMPLETED"
                  : status;

              return (
                <Link
                  key={status}
                  href={taskStatusRoutes[status] ?? "#"}
                  className={`text-sm px-2 py-1 rounded transition ${
                    isActive
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {tasks.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              You have no tasks assigned.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} viewerRole="INTERN" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InternView;
