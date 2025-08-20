"use server";

import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TaskList from "./TaskList";
import { TaskStatus } from "@/lib/generated/prisma";

type ExtraStatus = "ALL" | "TODO_OVERDUE" | "COMPLETED_LATE";

interface InternViewProps {
  userId: string;
  name: string;
  searchParams: {
    status?: ExtraStatus | TaskStatus;
    page?: string;
  };
}

const InternView = async ({ userId, name, searchParams }: InternViewProps) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      supervisedBy: { select: { id: true, name: true, email: true } },
    },
  });

  const supervisors = user?.supervisedBy || [];

  // Fetch all tasks once
  const allTasks = await prisma.task.findMany({
    where: { assignedId: userId },
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

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 shadow-md">
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
        </CardContent>
      </Card>

      <TaskList
        allTasks={allTasks}
        initialStatus={searchParams.status}
        initialPage={searchParams.page ? parseInt(searchParams.page) : 1}
      />
    </div>
  );
};

export default InternView;
