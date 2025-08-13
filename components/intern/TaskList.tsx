"use server";

import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import TaskCard from "../TaskCard";
import { TaskStatus } from "@/lib/generated/prisma";
import Link from "next/link";

type ExtraStatus = "ALL" | "TODO_OVERDUE" | "COMPLETED_LATE";

interface TaskListProps {
  userId: string;
  searchParams: {
    status: ExtraStatus | TaskStatus;
    page: string;
  };
}

const TASKS_PER_PAGE = 6;

const TaskList = async ({ userId, searchParams }: TaskListProps) => {
  const currentStatus = searchParams.status;
  const currentPage = Math.max(1, parseInt(searchParams.page) || 1);

  let where: any = { assignedId: userId };

  if (currentStatus === "ALL") {
    // no filter
  } else if (currentStatus === "TODO_OVERDUE") {
    where.status = { in: [TaskStatus.TODO, TaskStatus.OVERDUE] };
  } else if (currentStatus === "COMPLETED_LATE") {
    where.status = { in: [TaskStatus.COMPLETED, TaskStatus.LATE] };
  } else {
    where.status = currentStatus;
  }

  const [totalTasks, tasks] = await Promise.all([
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
  ]);

  const completedCount = tasks.filter(
    (task) => task.status === "COMPLETED" || task.status === "LATE"
  ).length;

  const totalPages = Math.ceil(totalTasks / TASKS_PER_PAGE);

  const filters = [
    { value: "TODO_OVERDUE", label: "TODO" },
    { value: "COMPLETED_LATE", label: "COMPLETED" },
    ...Object.values(TaskStatus)
      .filter(
        (status) => !["TODO", "OVERDUE", "COMPLETED", "LATE"].includes(status)
      )
      .map((status) => ({ value: status, label: status })),
    { value: "ALL", label: "ALL" },
  ];

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Tasks</h2>
        <div className="flex gap-2">
          {filters.map(({ value, label }) => (
            <Link
              key={value}
              href={`?status=${value}&page=1`}
              className={`text-sm px-2 py-1 rounded transition ${
                currentStatus === value
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {tasks.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            You have no tasks assigned.
          </p>
        </Card>
      ) : (
        <>
          {/* Task count */}
          <p className="text-muted-foreground text-sm">
            You have {totalTasks} task{totalTasks !== 1 ? "s" : ""}.{" "}
            {completedCount > 0 && `${completedCount} completed ✅`}
          </p>

          {/* Task grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} viewerRole="INTERN" />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`?status=${currentStatus}&page=${p}`}
                  className={`px-3 py-1 rounded border ${
                    p === currentPage
                      ? "bg-primary text-white"
                      : "bg-muted hover:bg-muted/70"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TaskList;
