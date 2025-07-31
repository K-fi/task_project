// components/InternView.tsx
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InternViewProps {
  userId: string;
  name: string;
}

const InternView = async ({ userId, name }: InternViewProps) => {
  // Fetch tasks assigned to the intern and include the creator (supervisor)
  const tasks = await prisma.task.findMany({
    where: {
      assignedId: userId,
    },
    orderBy: {
      dueDate: "asc",
    },
    include: {
      creator: {
        select: {
          name: true,
        },
      },
    },
  });

  // Fetch supervisors of the intern
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      supervisedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const supervisors = user?.supervisedBy || [];
  const completedCount = tasks.filter((task) => task.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
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

      {/* Task Board */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your Tasks</h2>

        {tasks.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              You have no tasks assigned.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <CardTitle>{task.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {task.description && (
                    <p className="text-muted-foreground">{task.description}</p>
                  )}
                  <p>
                    <strong>Status:</strong> {task.status}
                  </p>
                  <p>
                    <strong>Priority:</strong> {task.priority}
                  </p>
                  <p>
                    <strong>Assigned by:</strong> {task.creator?.name ?? "Unknown"}
                  </p>
                  <p>
                    <strong>Created date:</strong>{" "}
                    {new Date(task.createdAt).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Due:</strong>{" "}
                    {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InternView;
