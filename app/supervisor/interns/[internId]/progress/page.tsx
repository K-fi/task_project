// app/(protected)/supervisor/interns/[internId]/progress/page.tsx
import { prisma } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notFound } from "next/navigation";
import { requireUserWithRole } from "@/lib/auth/requireUserWithRole";
import ProgressLogsView from "@/components/supervisor/ProgressLogsView";
import { TaskStatus } from "@/lib/generated/prisma";
import TasksList from "@/components/supervisor/TasksList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({
  params,
  searchParams,
}: {
  params: { internId: string };
  searchParams: { status?: TaskStatus; page?: string };
}) {
  // First await the authentication check
  await requireUserWithRole("SUPERVISOR");

  // Properly await both params and searchParams
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    Promise.resolve(params),
    Promise.resolve(searchParams),
  ]);

  // Now fetch all data using the resolved params
  const [intern, progressLogs, allTasks] = await Promise.all([
    prisma.user.findUnique({
      where: { id: resolvedParams.internId, role: "INTERN" },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            assignedTasks: true,
          },
        },
      },
    }),
    prisma.progressLog.findMany({
      where: { userId: resolvedParams.internId },
      orderBy: { date: "desc" },
      include: {
        task: { select: { id: true, title: true } },
      },
    }),
    prisma.task.findMany({
      where: { assignedId: resolvedParams.internId },
      orderBy: { dueDate: "asc" },
      include: {
        creator: { select: { name: true } },
        submissionLogs: {
          orderBy: { submittedAt: "desc" },
          include: { submittedBy: { select: { name: true } } },
        },
      },
    }),
  ]);

  if (!intern) return notFound();

  const logsWithDates = progressLogs.map((log) => ({
    ...log,
    date: new Date(log.date),
    createdAt: new Date(log.createdAt),
    updatedAt: new Date(log.updatedAt),
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Progress Report for {intern.name}</h1>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">
            Tasks ({intern._count.assignedTasks})
          </TabsTrigger>
          <TabsTrigger value="logs">
            Progress Logs ({logsWithDates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <TasksList
            allTasks={allTasks}
            initialStatus={resolvedSearchParams.status}
            initialPage={
              resolvedSearchParams.page
                ? parseInt(resolvedSearchParams.page)
                : 1
            }
          />
        </TabsContent>

        <TabsContent value="logs">
          <ProgressLogsView logs={logsWithDates} internName={intern.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
