// components/supervisor/TasksList.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { TaskStatus } from "@/lib/generated/prisma";
import StatusFilter from "./StatusFilter";
import TaskCard from "@/components/TaskCard";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const TASKS_PER_PAGE = 6;

export default function TasksList({
  initialTasks,
  initialStatus,
  initialPage,
}: {
  initialTasks: any[];
  initialStatus?: TaskStatus;
  initialPage?: number;
}) {
  const [tasks] = useState(initialTasks);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State initialization
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">(
    initialStatus || "all"
  );
  const [currentPage, setCurrentPage] = useState(initialPage || 1);

  // Sync with URL changes
  useEffect(() => {
    const status = searchParams.get("status");
    const page = searchParams.get("page");

    if (status) {
      setStatusFilter(status as TaskStatus);
    } else {
      setStatusFilter("all");
    }
    if (page) setCurrentPage(parseInt(page));
  }, [searchParams]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (statusFilter === "all") {
      return tasks;
    }
    return tasks.filter((task) => task.status === statusFilter);
  }, [tasks, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE);
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * TASKS_PER_PAGE;
    return filteredTasks.slice(start, start + TASKS_PER_PAGE);
  }, [filteredTasks, currentPage]);

  const handleStatusChange = (value: TaskStatus | "all") => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    params.set("page", "1"); // Reset to first page

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <StatusFilter
          currentStatus={statusFilter}
          onValueChange={handleStatusChange}
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
              <TaskCard key={task.id} task={task} viewerRole="SUPERVISOR" />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded border ${
                      page === currentPage
                        ? "bg-primary text-white"
                        : "bg-muted hover:bg-muted/70"
                    }`}
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
