"use client";

import { useState, useMemo, useEffect } from "react";
import { TaskStatus } from "@/lib/generated/prisma";
import StatusFilter from "./StatusFilter";
import TaskCard from "@/components/TaskCard";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const TASKS_PER_PAGE = 6;
const MAX_VISIBLE_PAGES = 5;

export default function TasksList({
  allTasks = [],
  initialStatus,
  initialPage,
}: {
  allTasks?: any[];
  initialStatus?: TaskStatus;
  initialPage?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">(
    initialStatus || "all"
  );
  const [currentPage, setCurrentPage] = useState(initialPage || 1);
  const [isUpdatingURL, setIsUpdatingURL] = useState(false);

  // Filter + paginate tasks
  const { filteredTasks, totalPages, paginatedTasks } = useMemo(() => {
    const tasksToFilter = Array.isArray(allTasks) ? allTasks : [];

    // Filter tasks based on status
    const filtered =
      statusFilter === "all"
        ? tasksToFilter
        : tasksToFilter.filter((task) => task?.status === statusFilter);

    // Sort by updatedAt descending (latest first)
    const sorted = filtered.slice().sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA; // descending
    });

    // Paginate
    const total = Math.ceil(sorted.length / TASKS_PER_PAGE);
    const start = (currentPage - 1) * TASKS_PER_PAGE;
    const paginated = sorted.slice(start, start + TASKS_PER_PAGE);

    return {
      filteredTasks: sorted,
      totalPages: total,
      paginatedTasks: paginated,
    };
  }, [allTasks, statusFilter, currentPage]);

  // Update URL on filter/page change
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (statusFilter === "all") params.delete("status");
      else params.set("status", statusFilter);

      if (currentPage === 1) params.delete("page");
      else params.set("page", currentPage.toString());

      setIsUpdatingURL(true);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      setIsUpdatingURL(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [statusFilter, currentPage, pathname, router, searchParams]);

  const handleStatusChange = (value: TaskStatus | "all") => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Compute visible pages with ellipses
  const getVisiblePages = (): (number | string)[] => {
    if (totalPages <= MAX_VISIBLE_PAGES) {
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

    const pages: (number | string)[] = [1];
    if (start > 2) pages.push("…");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("…");
    pages.push(totalPages);
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <>
      {/* Status Filters */}
      <div className="flex justify-between items-center mb-4">
        <StatusFilter
          currentStatus={statusFilter}
          onValueChange={handleStatusChange}
          disabled={isUpdatingURL}
        />
      </div>

      {/* Empty state */}
      {filteredTasks.length === 0 ? (
        <p className="text-muted-foreground text-sm dark:text-muted-foreground">
          {statusFilter !== "all"
            ? `No ${statusFilter.toLowerCase()} tasks`
            : "No tasks assigned"}
        </p>
      ) : (
        <>
          {/* Task Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paginatedTasks.map((task) => (
              <TaskCard key={task?.id} task={task} viewerRole="SUPERVISOR" />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {/* Previous */}
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isUpdatingURL}
                className={`px-3 py-1 rounded border dark:border-border ${
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "bg-background dark:bg-background"
                }`}
              >
                &lt;
              </button>

              {visiblePages.map((p, idx) =>
                typeof p === "string" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-foreground dark:text-foreground"
                  >
                    {p}
                  </span>
                ) : (
                  <button
                    key={`page-${p}-${idx}`}
                    onClick={() => handlePageChange(p)}
                    disabled={isUpdatingURL}
                    className={`px-3 py-1 rounded border dark:border-border ${
                      p === currentPage
                        ? "bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground"
                        : "bg-background text-foreground dark:bg-background dark:text-foreground hover:bg-muted/70 dark:hover:bg-muted/60"
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
                className={`px-3 py-1 rounded border dark:border-border ${
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : "bg-background dark:bg-background"
                }`}
              >
                &gt;
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
