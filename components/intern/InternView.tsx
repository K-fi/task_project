"use server";

import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TaskCard from "../TaskCard";
import { TaskStatus } from "@/lib/generated/prisma";
import InternFilters from "./InternFilters";
import InternPagination from "./InternPagination";

type ExtraStatus = "ALL" | "TODO_OVERDUE" | "COMPLETED_LATE";

interface InternViewProps {
  userId: string;
  name: string;
  searchParams: {
    status: ExtraStatus | TaskStatus;
    page: string;
  };
}

const TASKS_PER_PAGE = 6;

const InternView = async ({ userId, name, searchParams }: InternViewProps) => {
  const currentStatus = searchParams.status;
  const currentPage = Math.max(1, parseInt(searchParams.page) || 1);

  // Build the where clause
  let where: any = { assignedId: userId };

  if (currentStatus === "ALL") {
    // no additional filter
  } else if (currentStatus === "TODO_OVERDUE") {
    where.status = { in: [TaskStatus.TODO, TaskStatus.OVERDUE] };
  } else if (currentStatus === "COMPLETED_LATE") {
    where.status = { in: [TaskStatus.COMPLETED, TaskStatus.LATE] };
  } else {
    where.status = currentStatus;
  }

  // Fetch data
  const [totalTasks, tasks, user] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      orderBy: { dueDate: "asc" },
      skip: (currentPage - 1) * TASKS_PER_PAGE,
      take: TASKS_PER_PAGE,
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
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        supervisedBy: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const supervisors = user?.supervisedBy || [];
  const completedCount = tasks.filter(
    (task) => task.status === "COMPLETED" || task.status === "LATE"
  ).length;

  const totalPages = Math.ceil(totalTasks / TASKS_PER_PAGE);

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
            You have {totalTasks} task{totalTasks !== 1 ? "s" : ""}.{" "}
            {completedCount > 0 && `${completedCount} completed ✅`}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Tasks</h2>
          <InternFilters currentStatus={currentStatus} />
        </div>

        {tasks.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              You have no tasks assigned.
            </p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} viewerRole="INTERN" />
              ))}
            </div>

            <InternPagination
              totalPages={totalPages}
              currentPage={currentPage}
              currentStatus={currentStatus}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default InternView;
