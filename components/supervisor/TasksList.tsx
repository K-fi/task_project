"use client";

import { useState, useMemo, useEffect } from "react";
import { TaskStatus } from "@/lib/generated/prisma";
import StatusFilter from "./StatusFilter";
import TaskCard from "@/components/TaskCard";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const TASKS_PER_PAGE = 6;

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

  const { filteredTasks, totalPages, paginatedTasks } = useMemo(() => {
    const tasksToFilter = Array.isArray(allTasks) ? allTasks : [];

    const filtered =
      statusFilter === "all"
        ? tasksToFilter
        : tasksToFilter.filter((task) => task?.status === statusFilter);

    const total = Math.ceil(filtered.length / TASKS_PER_PAGE);
    const start = (currentPage - 1) * TASKS_PER_PAGE;
    const paginated = filtered.slice(start, start + TASKS_PER_PAGE);

    return {
      filteredTasks: filtered,
      totalPages: total,
      paginatedTasks: paginated,
    };
  }, [allTasks, statusFilter, currentPage]);

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

  // Compute visible pages with ellipsis logic
  const getVisiblePages = () => {
    const maxVisible = 5;
    if (totalPages <= maxVisible)
      return Array.from({ length: totalPages }, (_, i) => i + 1);

    let start = Math.max(2, currentPage - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 3;

    if (end >= totalPages) {
      end = totalPages - 1;
      start = end - maxVisible + 3;
    }

    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <StatusFilter
          currentStatus={statusFilter}
          onValueChange={handleStatusChange}
          disabled={isUpdatingURL}
        />
      </div>

      {filteredTasks.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {statusFilter !== "all"
            ? `No ${statusFilter.toLowerCase()} tasks`
            : "No tasks assigned"}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paginatedTasks.map((task) => (
              <TaskCard key={task?.id} task={task} viewerRole="SUPERVISOR" />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {/* Previous */}
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isUpdatingURL}
                className={`px-3 py-1 rounded border ${
                  currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                &lt;
              </button>

              {/* First page */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={isUpdatingURL}
                className={`px-3 py-1 rounded border ${
                  currentPage === 1
                    ? "bg-primary text-white"
                    : "bg-muted hover:bg-muted/70"
                }`}
              >
                1
              </button>

              {/* Left ellipsis */}
              {visiblePages[0] > 2 && <span className="px-2">…</span>}

              {/* Middle pages */}
              {visiblePages.map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  disabled={isUpdatingURL}
                  className={`px-3 py-1 rounded border ${
                    page === currentPage
                      ? "bg-primary text-white"
                      : "bg-muted hover:bg-muted/70"
                  }`}
                >
                  {page}
                </button>
              ))}

              {/* Right ellipsis */}
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <span className="px-2">…</span>
              )}

              {/* Last page */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={isUpdatingURL}
                className={`px-3 py-1 rounded border ${
                  currentPage === totalPages
                    ? "bg-primary text-white"
                    : "bg-muted hover:bg-muted/70"
                }`}
              >
                {totalPages}
              </button>

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
    </>
  );
}
