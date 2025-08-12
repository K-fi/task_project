// app/(protected)/supervisor/interns/[internId]/progress/page.tsx
import { prisma } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskCard from "@/components/TaskCard";
import { notFound, redirect } from "next/navigation";
import { requireUserWithRole } from "@/lib/auth/requireUserWithRole";
import ProgressLogsView from "@/components/supervisor/ProgressLogsView";
import { TaskStatus } from "@/lib/generated/prisma";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TASKS_PER_PAGE = 6; // Same as InternView

export default async function Page({
  params,
  searchParams,
}: {
  params: { internId: string };
  searchParams: Promise<{
    status?: TaskStatus;
    page?: string;
  }>;
}) {
  await requireUserWithRole("SUPERVISOR");
  const parsedParams = await searchParams;
  const currentPage = Math.max(1, parseInt(parsedParams.page || "1") || 1);
  const statusFilter = parsedParams.status;

  // Fetch data
  const [intern, progressLogs, totalTasks] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.internId, role: "INTERN" },
      select: {
        id: true,
        name: true,
        assignedTasks: {
          where: statusFilter ? { status: statusFilter } : {},
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
            assignedTasks: statusFilter
              ? { where: { status: statusFilter } }
              : true,
          },
        },
      },
    }),
    prisma.progressLog.findMany({
      where: { userId: params.internId },
      orderBy: { date: "desc" },
      include: {
        task: { select: { id: true, title: true } },
      },
    }),
    prisma.task.count({
      where: {
        assignedId: params.internId,
        ...(statusFilter ? { status: statusFilter } : {}),
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

  const totalPages = Math.ceil(totalTasks / TASKS_PER_PAGE);

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
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <Link href={`?`} scroll={false}>
                  <SelectItem value="all">All Statuses</SelectItem>
                </Link>
                <Link href={`?status=TODO`} scroll={false}>
                  <SelectItem value="TODO">To Do</SelectItem>
                </Link>
                <Link href={`?status=COMPLETED`} scroll={false}>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </Link>
                <Link href={`?status=LATE`} scroll={false}>
                  <SelectItem value="LATE">Late</SelectItem>
                </Link>
                <Link href={`?status=OVERDUE`} scroll={false}>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </Link>
              </SelectContent>
            </Select>
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
                        href={`?status=${statusFilter || ""}&page=${page}`}
                        className={`px-3 py-1 rounded border ${
                          page === currentPage
                            ? "bg-primary text-white"
                            : "bg-muted hover:bg-muted/70"
                        }`}
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
