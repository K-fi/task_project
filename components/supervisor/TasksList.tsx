"use client";

import { useState, useMemo, useEffect } from "react";
import { TaskStatus } from "@/lib/generated/prisma";
import TaskCard from "@/components/TaskCard";
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
import Pagination from "@/components/Pagination"; // <-- import your reusable Pagination

const TASKS_PER_PAGE = 6;

const VALID_STATUSES = ["all", ...Object.values(TaskStatus)] as const;
type StatusFilter = (typeof VALID_STATUSES)[number];

// --- Helpers to normalize query params ---
function normalizeStatus(value: string | null): StatusFilter {
  if (!value) return "all";
  return VALID_STATUSES.includes(value as StatusFilter)
    ? (value as StatusFilter)
    : "all";
}

function normalizePage(value: string | null): number {
  const page = value ? parseInt(value, 10) : 1;
  return isNaN(page) || page < 1 ? 1 : page;
}

function normalizeDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

export default function TasksList({
  allTasks = [],
  initialStatus,
  initialPage,
}: {
  allTasks?: any[];
  initialStatus?: TaskStatus | "all";
  initialPage?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Normalize incoming URL params
  const initialStatusParam = normalizeStatus(searchParams.get("status"));
  const initialPageParam = normalizePage(searchParams.get("page"));
  const initialDateParam = normalizeDate(searchParams.get("date")); // future use

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    initialStatus || initialStatusParam || "all"
  );
  const [currentPage, setCurrentPage] = useState(
    initialPage || initialPageParam || 1
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialDateParam
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isUpdatingURL, setIsUpdatingURL] = useState(false);

  // Collect task dates based on current status filter
  const allTaskDates = useMemo(() => {
    let filteredTasksForCalendar = allTasks;

    if (statusFilter !== "all") {
      filteredTasksForCalendar = allTasks.filter(
        (t) => t.status === statusFilter
      );
    }

    return new Set(
      filteredTasksForCalendar
        .filter((t) => t.dueDate)
        .map((t) => new Date(t.dueDate).toDateString())
    );
  }, [allTasks, statusFilter]);

  // Filter + paginate tasks
  const { filteredTasks, totalPages, paginatedTasks } = useMemo(() => {
    let tasksToFilter = Array.isArray(allTasks) ? allTasks : [];

    // Status filter
    if (statusFilter !== "all") {
      tasksToFilter = tasksToFilter.filter((t) => t.status === statusFilter);
    }

    // Date filter
    if (selectedDate) {
      tasksToFilter = tasksToFilter.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate).toDateString() === selectedDate.toDateString()
      );
    }

    // Search by title
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      tasksToFilter = tasksToFilter.filter((t) =>
        t.title.toLowerCase().includes(q)
      );
    }

    // Sort by updatedAt descending
    const sorted = tasksToFilter.slice().sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA;
    });

    // Paginate
    const total = Math.ceil(sorted.length / TASKS_PER_PAGE) || 1;
    const start = (currentPage - 1) * TASKS_PER_PAGE;
    const paginated = sorted.slice(start, start + TASKS_PER_PAGE);

    return {
      filteredTasks: sorted,
      totalPages: total,
      paginatedTasks: paginated,
    };
  }, [allTasks, statusFilter, currentPage, selectedDate, searchQuery]);

  // Clamp currentPage if > totalPages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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

  const handleStatusChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setCurrentPage(1);
    setSelectedDate(undefined); // reset date filter on status change
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

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

      {/* Filters + Calendar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-2 flex-wrap items-center">
          {/* Status buttons */}
          {VALID_STATUSES.map((status) => (
            <Button
              key={status}
              size="sm"
              variant={statusFilter === status ? "default" : "outline"}
              onClick={() => handleStatusChange(status)}
              disabled={isUpdatingURL}
            >
              {status.toUpperCase()}
            </Button>
          ))}

          {/* Calendar Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
              >
                <Calendar className="w-4 h-4" />
                {selectedDate ? selectedDate.toDateString() : "Due Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
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
              <TaskCard key={task.id} task={task} viewerRole="SUPERVISOR" />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              isDisabled={isUpdatingURL}
            />
          )}
        </>
      )}
    </div>
  );
}
