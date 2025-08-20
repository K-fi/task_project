"use client";

import { useState, useMemo, useEffect } from "react";
import { TaskStatus } from "@/lib/generated/prisma";
import TaskCard from "../TaskCard";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

type ExtraStatus = "ALL" | "TODO_OVERDUE" | "COMPLETED_LATE";

const TASKS_PER_PAGE = 6;

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

  const [statusFilter, setStatusFilter] = useState<ExtraStatus | TaskStatus>(
    initialStatus || "ALL"
  );
  const [currentPage, setCurrentPage] = useState(initialPage || 1);
  const [isUpdatingURL, setIsUpdatingURL] = useState(false);

  // Apply filter + paginate client-side
  const { filteredTasks, totalPages, paginatedTasks, completedCount } =
    useMemo(() => {
      let filtered = allTasks;

      if (statusFilter === "ALL") {
        // no filter
      } else if (statusFilter === "TODO_OVERDUE") {
        filtered = allTasks.filter((t) =>
          [TaskStatus.TODO, TaskStatus.OVERDUE].includes(t.status)
        );
      } else if (statusFilter === "COMPLETED_LATE") {
        filtered = allTasks.filter((t) =>
          [TaskStatus.COMPLETED, TaskStatus.LATE].includes(t.status)
        );
      } else {
        filtered = allTasks.filter((t) => t.status === statusFilter);
      }

      const total = Math.ceil(filtered.length / TASKS_PER_PAGE);
      const start = (currentPage - 1) * TASKS_PER_PAGE;
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
    }, [allTasks, statusFilter, currentPage]);

  // 🔥 Auto go back if current page is empty
  useEffect(() => {
    if (paginatedTasks.length === 0 && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [paginatedTasks, currentPage]);

  // Update URL on filter/page change
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

  const handleStatusChange = (value: ExtraStatus | TaskStatus) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Improved pagination logic (no duplicates, clean ellipses)
  const getVisiblePages = () => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) {
      start = 2;
      end = 4;
    } else if (currentPage >= totalPages - 2) {
      start = totalPages - 3;
      end = totalPages - 1;
    }

    return [
      1,
      ...(start > 2 ? ["…"] : []),
      ...Array.from({ length: end - start + 1 }, (_, i) => start + i),
      ...(end < totalPages - 1 ? ["…"] : []),
      totalPages,
    ];
  };

  const visiblePages = getVisiblePages();

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
      {/* Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Tasks</h2>
        <div className="flex gap-2">
          {filters.map(({ value, label }) => (
            <button
              key={value}
              onClick={() =>
                handleStatusChange(value as ExtraStatus | TaskStatus)
              }
              disabled={isUpdatingURL}
              className={`text-sm px-2 py-1 rounded transition ${
                statusFilter === value
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filteredTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You have no tasks assigned.
        </p>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
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
                        <span className="text-red-500 font-medium">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paginatedTasks.map((task) => (
              <TaskCard key={task.id} task={task} viewerRole="INTERN" />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {/* Prev */}
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isUpdatingURL}
                className={`px-3 py-1 rounded border ${
                  currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                &lt;
              </button>

              {visiblePages.map((p, idx) =>
                p === "…" ? (
                  <span key={`ellipsis-${idx}`} className="px-2">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p as number)}
                    disabled={isUpdatingURL}
                    className={`px-3 py-1 rounded border ${
                      p === currentPage
                        ? "bg-primary text-white"
                        : "bg-muted hover:bg-muted/70"
                    }`}
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
                className={`px-3 py-1 rounded border ${
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
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
