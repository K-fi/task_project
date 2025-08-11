import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TaskCard from "../TaskCard";
import Link from "next/link";
import { TaskStatus } from "@/lib/generated/prisma";
import { taskStatusRoutes } from "@/lib/statusRoutes"; // optional helper for cleaner links

interface InternViewProps {
  userId: string;
  name: string;
  currentStatus: "ALL" | TaskStatus;
}

const InternView = async ({ userId, name, currentStatus }: InternViewProps) => {
  const tasks = await prisma.task.findMany({
    where: {
      assignedId: userId,
      ...(currentStatus !== "ALL" ? { status: currentStatus } : {}),
    },
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

  // Reordered filters with TODO first, then other statuses, then ALL
  const filters: (TaskStatus | "ALL")[] = [
    "TODO",
    ...Object.values(TaskStatus).filter(status => status !== "TODO"),
    "ALL"
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Welcome, {name} 👋</CardTitle>
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

          {/* Filter buttons with page-based routing */}
          <div className="flex gap-2">
            {filters.map((status) => {
              const isActive = currentStatus === status;

              return (
                <Link
                  key={status}
                  href={taskStatusRoutes[status]}
                  className={`text-sm px-2 py-1 rounded transition ${
                    isActive
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {status}
                </Link>
              );
            })}
          </div>
        </div>

        {tasks.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">You have no tasks assigned.</p>
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