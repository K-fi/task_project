import { prisma } from "@/lib/db";
import { userRequired } from "@/app/data/user/is-user-authenticated";
import SupervisorView from "@/components/supervisor/SupervisorView";
import InternView from "@/components/intern/InternView";
import { redirect } from "next/navigation";
import { markOverdueTasksAction } from "@/app/actions/markOverdue";
import { TaskStatus } from "@/lib/generated/prisma";

type ExtraStatus = "ALL" | "TODO_OVERDUE" | "COMPLETED_LATE";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  createdAt: Date;
  status: string;
};

type Intern = {
  id: string;
  name: string;
  assignedTasks: Task[];
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;

  const { user } = await userRequired();
  if (!user) {
    redirect("/"); // not logged in, go home
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email as string },
    select: {
      id: true,
      name: true,
      role: true,
      onboardingCompleted: true,
    },
  });

  if (!dbUser) {
    redirect("/"); // no user record, force back to home
  }

  await markOverdueTasksAction(dbUser.id);

  if (!dbUser.onboardingCompleted) {
    redirect("/onboarding");
  }

  // ✅ if role isn’t valid, clear session and send home
  if (dbUser.role !== "INTERN" && dbUser.role !== "SUPERVISOR") {
    redirect("/api/auth/logout"); // or just redirect("/") if you don’t want logout
  }

  const validStatuses = [
    "ALL",
    "TODO_OVERDUE",
    "COMPLETED_LATE",
    ...Object.values(TaskStatus),
  ];

  const status =
    params.status && validStatuses.includes(params.status)
      ? (params.status as ExtraStatus | TaskStatus)
      : "TODO_OVERDUE";

  const page = params.page || "1"; // keep as string for InternView

  // Fetch interns server-side
  let internsData: Intern[] = [];
  if (dbUser.role === "SUPERVISOR") {
    internsData = await prisma.user.findMany({
      where: {
        supervisedBy: { some: { id: dbUser.id } },
        role: "INTERN",
      },
      include: {
        assignedTasks: true,
      },
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {dbUser.role === "SUPERVISOR" ? (
          <SupervisorView
            supervisorName={dbUser.name}
            internsData={internsData}
          />
        ) : (
          <InternView
            userId={dbUser.id}
            name={dbUser.name}
            searchParams={{ status, page }}
          />
        )}
      </main>
    </div>
  );
}
