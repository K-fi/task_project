// app/(protected)/supervisor/interns/[internId]/progress/page.tsx
import { prisma } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskCard from "@/components/TaskCard";
import { notFound } from "next/navigation";
import { requireUserWithRole } from "@/lib/auth/requireUserWithRole";
import ProgressLogsView from "@/components/supervisor/ProgressLogsView";
import { TaskStatus } from "@/lib/generated/prisma";
import Link from "next/link";
import StatusFilter from "@/components/supervisor/StatusFilter";

export const dynamic = "force-dynamic";

const TASKS_PER_PAGE = 6;

export default async function Page({
  params,
  searchParams,
}: {
  params: { internId: string };
  searchParams: {
    status?: TaskStatus;
    page?: string;
  };
}) {
  // First await the requireUserWithRole to ensure auth check
  await requireUserWithRole("SUPERVISOR");

  // Then resolve params and searchParams
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    Promise.resolve(params),
    Promise.resolve(searchParams),
  ]);

  const currentPage = Math.max(
    1,
    parseInt(resolvedSearchParams.page || "1") || 1
  );
  const statusFilter = resolvedSearchParams.status;

  // Build the where clause
  const taskWhere = {
    assignedId: resolvedParams.internId,
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  // Fetch data
  const [intern, progressLogs, totalTasks] = await Promise.all([
    prisma.user.findUnique({
      where: { id: resolvedParams.internId, role: "INTERN" },
      select: {
        id: true,
        name: true,
        assignedTasks: {
          where: taskWhere,
          orderBy: { dueDate: "asc" },
          skip: (currentPage - 1) * TASKS_PER_PAGE,
          take: TASKS_PER_PAGE,
          include: {
            creator: { select: { name: true } },
            submissionLogs: {
              orderBy: { submittedAt: "desc" },
              include: { submittedBy: { select: { name: true } } },
            },
          },
        },
        _count: {
          select: {
            assignedTasks: { where: taskWhere },
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
    prisma.task.count({
      where: taskWhere,
    }),
  ]);

  if (!intern) return notFound();

  const logsWithDates = progressLogs.map((log) => ({
    ...log,
    date: new Date(log.date),
    createdAt: new Date(log.createdAt),
    updatedAt: new Date(log.updatedAt),
  }));

  const totalPages = Math.ceil(totalTasks / TASKS_PER_PAGE);

  // Helper function to generate query string
  const getQueryString = (newPage: number) => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", newPage.toString());
    return params.toString();
  };

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
          <div className="flex justify-between items-center mb-4">
            <StatusFilter currentStatus={statusFilter} />
          </div>

          {intern.assignedTasks.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {statusFilter
                ? `No ${statusFilter.toLowerCase()} tasks`
                : "No tasks assigned"}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {intern.assignedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} viewerRole="SUPERVISOR" />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Link
                        key={page}
                        href={`?${getQueryString(page)}`}
                        className={`px-3 py-1 rounded border ${
                          page === currentPage
                            ? "bg-primary text-white"
                            : "bg-muted hover:bg-muted/70"
                        }`}
                        scroll={false}
                      >
                        {page}
                      </Link>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="logs">
          <ProgressLogsView logs={logsWithDates} internName={intern.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
