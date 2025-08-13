"use server";

import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TaskList from "./TaskList";

type ExtraStatus = "ALL" | "TODO_OVERDUE" | "COMPLETED_LATE";
import { TaskStatus } from "@/lib/generated/prisma";

interface InternViewProps {
  userId: string;
  name: string;
  searchParams: {
    status: ExtraStatus | TaskStatus;
    page: string;
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
        </CardContent>
      </Card>

      {/* Pass only userId + searchParams */}
      <TaskList userId={userId} searchParams={searchParams} />
    </div>
  );
};

export default InternView;
