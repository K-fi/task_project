import { prisma } from "@/lib/db";
import { userRequired } from "@/app/data/user/is-user-authenticated";
import SupervisorView from "@/components/supervisor/SupervisorView";
import InternView from "@/components/intern/InternView";
import { redirect } from "next/navigation";
import { markOverdueTasksAction } from "@/app/actions/markOverdue";
import { TaskStatus } from "@/lib/generated/prisma";

type ExtraStatus = "ALL" | "TODO_OVERDUE" | "COMPLETED_LATE";

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
  if (!user) throw new Error("User not authenticated");

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
    throw new Error("User not found in database");
  }

  await markOverdueTasksAction(dbUser.id);

  if (!dbUser.onboardingCompleted) {
    redirect("/onboarding");
  }

  if (dbUser.role !== "INTERN" && dbUser.role !== "SUPERVISOR") {
    return (
      <div className="text-center mt-10 text-red-600">
        Access denied. You do not have permission to view this dashboard.
      </div>
    );
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

  const page = params.page || "1";

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {dbUser.role === "SUPERVISOR" ? (
          <SupervisorView userId={dbUser.id} name={dbUser.name} />
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
