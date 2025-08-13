// components/supervisor/TasksList.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { TaskStatus } from "@/lib/generated/prisma";
import StatusFilter from "./StatusFilter";
import TaskCard from "@/components/TaskCard";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const TASKS_PER_PAGE = 6;

export default function TasksList({
  allTasks = [], // Provide default empty array
  initialStatus,
  initialPage,
}: {
  allTasks?: any[]; // Make prop optional
  initialStatus?: TaskStatus;
  initialPage?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State for filtering and pagination
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">(
    initialStatus || "all"
  );
  const [currentPage, setCurrentPage] = useState(initialPage || 1);
  const [isUpdatingURL, setIsUpdatingURL] = useState(false);

  // Filter and paginate tasks client-side with null checks
  const { filteredTasks, totalPages, paginatedTasks } = useMemo(() => {
    // Ensure allTasks exists before filtering
    const tasksToFilter = Array.isArray(allTasks) ? allTasks : [];

    // Apply status filter
    const filtered =
      statusFilter === "all"
        ? tasksToFilter
        : tasksToFilter.filter((task) => task?.status === statusFilter);

    // Calculate pagination
    const total = Math.ceil(filtered.length / TASKS_PER_PAGE);
    const start = (currentPage - 1) * TASKS_PER_PAGE;
    const paginated = filtered.slice(start, start + TASKS_PER_PAGE);

    return {
      filteredTasks: filtered,
      totalPages: total,
      paginatedTasks: paginated,
    };
  }, [allTasks, statusFilter, currentPage]);

  // Update URL when filters or page changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (statusFilter === "all") {
        params.delete("status");
      } else {
        params.set("status", statusFilter);
      }

      if (currentPage === 1) {
        params.delete("page");
      } else {
        params.set("page", currentPage.toString());
      }

      setIsUpdatingURL(true);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      setIsUpdatingURL(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [statusFilter, currentPage, pathname, router, searchParams]);

  // Handle status filter change
  const handleStatusChange = (value: TaskStatus | "all") => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    disabled={isUpdatingURL}
                    className={`px-3 py-1 rounded border ${
                      page === currentPage
                        ? "bg-primary text-white"
                        : "bg-muted hover:bg-muted/70"
                    } ${isUpdatingURL ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
