// components/SupervisorView.tsx
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

interface SupervisorViewProps {
  userId: string;
  name: string;
}

const SupervisorView = async ({ userId, name }: SupervisorViewProps) => {
  const interns = await prisma.user.findMany({
    where: {
      supervisedBy: { some: { id: userId } },
      role: "INTERN",
    },
    include: {
      assignedTasks: true,
    },
  });

  return (
    <div className="space-y-6">
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Welcome, Supervisor {name} 👋
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            You are currently supervising {interns.length} intern{interns.length !== 1 ? "s" : ""}.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Your Interns</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {interns.map((intern) => (
            <Card key={intern.id} className="h-full">
              <CardHeader>
                <CardTitle>{intern.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Tasks Assigned: {intern.assignedTasks.length}
                </p>
                <Button asChild variant="secondary" className="w-full">
                  <Link href={`/supervisor/interns/${intern.id}/progress`}>
                    View Progress
                  </Link>
                </Button>
                <Button asChild variant="default" className="w-full">
                  <Link href={`/supervisor/interns/${intern.id}/assign-task`}>
                    Assign Task
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupervisorView;
