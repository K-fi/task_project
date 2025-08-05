// app/supervisor/interns/[internId]/progress/page.tsx

import { prisma } from "@/lib/db";
import TaskCard from "@/components/TaskCard";
import { notFound } from "next/navigation";
import { requireUserWithRole } from "@/lib/auth/requireUserWithRole"; 

interface InternProgressPageProps {
  params: { internId: string };
}

const InternProgressPage = async ({ params }: InternProgressPageProps) => {
  //  Ensure only SUPERVISORs can view this page
  const dbUser = await requireUserWithRole("SUPERVISOR");

  const intern = await prisma.user.findUnique({
    where: { id: params.internId, role: "INTERN" },
    include: {
      assignedTasks: {
        orderBy: { dueDate: "asc" },
        include: {
          creator: { select: { name: true } },
          submissionLogs: {
            orderBy: { submittedAt: "desc" },
            include: { submittedBy: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!intern) return notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        Progress Report for {intern.name}
      </h1>

      {intern.assignedTasks.length === 0 ? (
        <p className="text-muted-foreground text-sm">No tasks assigned.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {intern.assignedTasks.map((task) => (
            <TaskCard key={task.id} task={task} viewerRole="SUPERVISOR" />
          ))}
        </div>
      )}
    </div>
  );
};

export default InternProgressPage;
