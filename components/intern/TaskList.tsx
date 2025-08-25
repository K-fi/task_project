"use client";

import { useState, useMemo, useEffect } from "react";
import { TaskStatus } from "@/lib/generated/prisma";
import TaskCard from "../TaskCard";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";

type ExtraStatus = "ALL" | "TODO_OVERDUE" | "COMPLETED_LATE";

const TASKS_PER_PAGE = 6;

// ---------- Normalizers ----------
const VALID_STATUSES: (ExtraStatus | TaskStatus)[] = [
  "ALL",
  "TODO_OVERDUE",
  "COMPLETED_LATE",
  ...Object.values(TaskStatus),
];

function normalizeStatus(
  value: string | null | undefined
): ExtraStatus | TaskStatus {
  if (!value) return "ALL";
  return VALID_STATUSES.includes(value as ExtraStatus | TaskStatus)
    ? (value as ExtraStatus | TaskStatus)
    : "ALL";
}

function normalizePage(value: number | string | null | undefined): number {
  const num = typeof value === "number" ? value : parseInt(value ?? "", 10);
  return isNaN(num) || num < 1 ? 1 : num;
}

function normalizeDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}
// --------------------------------

export default function TaskList({
  allTasks = [],
  initialStatus,
  initialPage,
}: {
  allTasks?: any[];
  initialStatus?: ExtraStatus | TaskStatus;
  initialPage?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Validate incoming props/params
  const safeStatus = normalizeStatus(initialStatus as string);
  const safePage = normalizePage(initialPage);

  const [statusFilter, setStatusFilter] = useState<ExtraStatus | TaskStatus>(
    safeStatus
  );
  const [currentPage, setCurrentPage] = useState(safePage);
  const [isUpdatingURL, setIsUpdatingURL] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Dates that have tasks, based on current status filter (for calendar dots)
  const allTaskDates = useMemo(() => {
    let filteredForCalendar = allTasks;

    if (statusFilter === "TODO_OVERDUE") {
      filteredForCalendar = allTasks.filter((t) =>
        [TaskStatus.TODO, TaskStatus.OVERDUE].includes(t.status)
      );
    } else if (statusFilter === "COMPLETED_LATE") {
      filteredForCalendar = allTasks.filter((t) =>
        [TaskStatus.COMPLETED, TaskStatus.LATE].includes(t.status)
      );
    } else if (statusFilter !== "ALL") {
      filteredForCalendar = allTasks.filter((t) => t.status === statusFilter);
    }

    return new Set(
      filteredForCalendar
        .filter((t) => !!t?.dueDate)
        .map((t) => new Date(t.dueDate).toDateString())
    );
  }, [allTasks, statusFilter]);

  const { filteredTasks, totalPages, paginatedTasks, completedCount } =
    useMemo(() => {
      let filtered = allTasks;

      // Status filter
      if (statusFilter === "TODO_OVERDUE") {
        filtered = allTasks.filter((t) =>
          [TaskStatus.TODO, TaskStatus.OVERDUE].includes(t.status)
        );
      } else if (statusFilter === "COMPLETED_LATE") {
        filtered = allTasks
          .filter((t) =>
            [TaskStatus.COMPLETED, TaskStatus.LATE].includes(t.status)
          )
          .sort(
            (a, b) =>
              new Date(b.updatedAt || b.submittedAt || b.createdAt).getTime() -
              new Date(a.updatedAt || a.submittedAt || a.createdAt).getTime()
          );
      } else if (statusFilter !== "ALL") {
        filtered = allTasks.filter((t) => t.status === statusFilter);
      } else {
        const priority = (t: any) =>
          t.status === TaskStatus.OVERDUE
            ? 0
            : t.status === TaskStatus.TODO
            ? 1
            : 2;

        filtered = [...allTasks].sort((a, b) => {
          const p = priority(a) - priority(b);
          if (p !== 0) return p;

          const aDate = new Date(
            a.updatedAt || a.submittedAt || a.createdAt || 0
          );
          const bDate = new Date(
            b.updatedAt || b.submittedAt || b.createdAt || 0
          );
          return bDate.getTime() - aDate.getTime();
        });
      }

      // Date filter
      if (selectedDate) {
        const sel = selectedDate.toDateString();
        filtered = filtered.filter(
          (t) => !!t?.dueDate && new Date(t.dueDate).toDateString() === sel
        );
      }

      // Search by title
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        filtered = filtered.filter((t) => t.title?.toLowerCase().includes(q));
      }

      const total = Math.max(1, Math.ceil(filtered.length / TASKS_PER_PAGE));
      const safePage = Math.min(currentPage, total); // clamp currentPage
      const start = (safePage - 1) * TASKS_PER_PAGE;
      const paginated = filtered.slice(start, start + TASKS_PER_PAGE);

      const completed = filtered.filter((t) =>
        [TaskStatus.COMPLETED, TaskStatus.LATE].includes(t.status)
      ).length;

      return {
        filteredTasks: filtered,
        totalPages: total,
        paginatedTasks: paginated,
        completedCount: completed,
      };
    }, [allTasks, statusFilter, currentPage, selectedDate, searchQuery]);

  // Auto reset page if empty (e.g., after filtering)
  useEffect(() => {
    if (paginatedTasks.length === 0 && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [paginatedTasks, currentPage]);

  // Sync URL (?status= & ?page=)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (statusFilter === "ALL") params.delete("status");
      else params.set("status", statusFilter);

      if (currentPage === 1) params.delete("page");
      else params.set("page", currentPage.toString());

      setIsUpdatingURL(true);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      setIsUpdatingURL(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [statusFilter, currentPage, pathname, router, searchParams]);

  // Handlers
  const handleStatusChange = (value: ExtraStatus | TaskStatus) => {
    setStatusFilter(normalizeStatus(value));
    setCurrentPage(1);
    setSelectedDate(undefined);
  };

  const handlePageChange = (page: number) =>
    setCurrentPage(normalizePage(page));

  // Ellipsis pagination
  const getVisiblePages = () => {
    const maxVisible = 5;
    if (totalPages <= maxVisible)
      return Array.from({ length: totalPages }, (_, i) => i + 1);

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) (start = 2), (end = 4);
    else if (currentPage >= totalPages - 2)
      (start = totalPages - 3), (end = totalPages - 1);

    return [
      1,
      ...(start > 2 ? ["left-ellipsis"] : []),
      ...Array.from({ length: end - start + 1 }, (_, i) => start + i),
      ...(end < totalPages - 1 ? ["right-ellipsis"] : []),
      totalPages,
    ];
  };

  const visiblePages =
    totalPages > 1 ? (getVisiblePages() as (number | string)[]) : [];

  const filters = [
    { value: "TODO_OVERDUE", label: "TODO" },
    { value: "COMPLETED_LATE", label: "COMPLETED" },
    ...Object.values(TaskStatus)
      .filter(
        (status) => !["TODO", "OVERDUE", "COMPLETED", "LATE"].includes(status)
      )
      .map((status) => ({ value: status, label: status })),
    { value: "ALL", label: "ALL" },
  ];

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex flex-col">
        <Input
          placeholder="Search by title..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Type any keyword to filter tasks by title.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground dark:text-foreground">
          Your Tasks
        </h2>

        <div className="flex gap-2 flex-wrap items-center">
          {filters.map(({ value, label }) => (
            <button
              key={value}
              onClick={() =>
                handleStatusChange(value as ExtraStatus | TaskStatus)
              }
              disabled={isUpdatingURL}
              className={`text-sm px-2 py-1 rounded transition border ${
                statusFilter === value
                  ? "bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground"
                  : "bg-muted text-muted-foreground dark:bg-muted/50 dark:text-muted-foreground hover:bg-muted/70 dark:hover:bg-muted/60"
              }`}
            >
              {label}
            </button>
          ))}

          {/* Calendar Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Calendar className="w-4 h-4" />{" "}
                {selectedDate ? selectedDate.toDateString() : "Due Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setCurrentPage(1);
                }}
                modifiers={{
                  hasTask: (date) => allTaskDates.has(date.toDateString()),
                  today: (date) =>
                    date.toDateString() === new Date().toDateString(),
                }}
                modifiersClassNames={{
                  hasTask:
                    "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary",
                  today: "border border-primary rounded-full",
                }}
              />
              {selectedDate && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => setSelectedDate(undefined)}
                >
                  Clear date
                </Button>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Empty state or list */}
      {filteredTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
          You have no tasks assigned.
        </p>
      ) : (
        <>
          {/* Summary */}
          <p className="text-muted-foreground dark:text-muted-foreground text-sm">
            {statusFilter === "COMPLETED_LATE" ? (
              <>
                You have {filteredTasks.length} completed task
                {filteredTasks.length !== 1 ? "s" : ""} ✅
              </>
            ) : statusFilter === "TODO_OVERDUE" ? (
              (() => {
                const todoCount = filteredTasks.filter(
                  (t) => t.status === TaskStatus.TODO
                ).length;
                const overdueCount = filteredTasks.filter(
                  (t) => t.status === TaskStatus.OVERDUE
                ).length;
                return (
                  <>
                    You have {todoCount} todo task{todoCount !== 1 ? "s" : ""}
                    {overdueCount > 0 && (
                      <>
                        {" "}
                        and{" "}
                        <span className="text-red-500 font-medium dark:text-red-400">
                          {overdueCount} overdue task
                          {overdueCount !== 1 ? "s" : ""} ⚠️
                        </span>
                      </>
                    )}
                  </>
                );
              })()
            ) : (
              <>
                You have {filteredTasks.length} task
                {filteredTasks.length !== 1 ? "s" : ""}.{" "}
                {completedCount > 0 && `${completedCount} completed ✅`}
              </>
            )}
          </p>

          {/* Task cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paginatedTasks.map((task) => (
              <TaskCard key={task.id} task={task} viewerRole="INTERN" />
            ))}
          </div>

          {/* Ellipsis Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6 flex-wrap">
              {/* Prev */}
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isUpdatingURL}
                className={`px-3 py-1 rounded border dark:border-border ${
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "bg-background dark:bg-background"
                }`}
                aria-label="Previous page"
              >
                &lt;
              </button>

              {visiblePages.map((p, idx) =>
                p === "left-ellipsis" || p === "right-ellipsis" ? (
                  <span
                    key={`ellipsis-${p}-${idx}`}
                    className="px-2 text-foreground dark:text-foreground"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={`page-${p}-${idx}`}
                    onClick={() => handlePageChange(p as number)}
                    disabled={isUpdatingURL}
                    className={`px-3 py-1 rounded border dark:border-border ${
                      p === currentPage
                        ? "bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground"
                        : "bg-background text-foreground dark:bg-background dark:text-foreground hover:bg-muted/70 dark:hover:bg-muted/60"
                    }`}
                    aria-current={p === currentPage ? "page" : undefined}
                  >
                    {p}
                  </button>
                )
              )}

              {/* Next */}
              <button
                onClick={() =>
                  handlePageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages || isUpdatingURL}
                className={`px-3 py-1 rounded border dark:border-border ${
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : "bg-background dark:bg-background"
                }`}
                aria-label="Next page"
              >
                &gt;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
