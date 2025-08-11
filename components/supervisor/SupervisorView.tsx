// components/SupervisorView.tsx
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AssignTaskForm from "./AssignTaskForm";
import EditTasksDialog from "./EditTasksDialog";

// Helper to check if task is considered completed
const isTaskCompleted = (status: string) =>
  status === "COMPLETED" || status === "LATE";

const SupervisorView = async ({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) => {
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
            You are currently supervising {interns.length} intern
            {interns.length !== 1 ? "s" : ""}.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Your Interns</h2>

        {interns.length === 0 ? (
          <Card className="p-6">
            <p className="text-muted-foreground text-sm">
              You are not supervising any interns yet.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {interns.map((intern) => {
              const completedCount = intern.assignedTasks.filter((task) =>
                isTaskCompleted(task.status)
              ).length;

              return (
                <Card key={intern.id} className="h-full">
                  <CardHeader>
                    <CardTitle>{intern.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Tasks Assigned: {intern.assignedTasks.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tasks Completed: {completedCount}
                    </p>

                    {/* View Progress Button */}
                    <Button asChild variant="secondary" className="w-full">
                      <Link href={`/supervisor/interns/${intern.id}/progress`}>
                        View Progress
                      </Link>
                    </Button>

                    {/* Assign Task Button */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full">Assign Task</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Assign Task to {intern.name}
                          </DialogTitle>
                        </DialogHeader>
                        <AssignTaskForm internId={intern.id} />
                      </DialogContent>
                    </Dialog>

                    {/* Edit Tasks Button */}
                    <EditTasksDialog
                      internName={intern.name}
                      tasks={intern.assignedTasks}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupervisorView;
