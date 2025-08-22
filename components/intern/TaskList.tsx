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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Collect task dates based on current status filter
  const allTaskDates = useMemo(() => {
    let filteredForCalendar = allTasks;

    // Apply status filter
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
        .filter((t) => t.dueDate)
        .map((t) => new Date(t.dueDate).toDateString())
    );
  }, [allTasks, statusFilter]);

  const { filteredTasks, totalPages, paginatedTasks } = useMemo(() => {
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
            new Date(b.updatedAt || b.submittedAt).getTime() -
            new Date(a.updatedAt || a.submittedAt).getTime()
        );
    } else if (statusFilter !== "ALL") {
      filtered = allTasks.filter((t) => t.status === statusFilter);
    }

    // Date filter
    if (selectedDate) {
      filtered = filtered.filter(
        (t) =>
          new Date(t.dueDate).toDateString() === selectedDate.toDateString()
      );
    }

    // Search by title
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((t) => t.title.toLowerCase().includes(q));
    }

    const total = Math.ceil(filtered.length / TASKS_PER_PAGE);
    const start = (currentPage - 1) * TASKS_PER_PAGE;
    const paginated = filtered.slice(start, start + TASKS_PER_PAGE);

    return {
      filteredTasks: filtered,
      totalPages: total,
      paginatedTasks: paginated,
    };
  }, [allTasks, statusFilter, currentPage, selectedDate, searchQuery]);

  useEffect(() => {
    if (paginatedTasks.length === 0 && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [paginatedTasks, currentPage]);

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
    setSelectedDate(undefined); // reset date when status changes
  };

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

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
          You have no tasks assigned.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {paginatedTasks.map((task) => (
            <TaskCard key={task.id} task={task} viewerRole="INTERN" />
          ))}
        </div>
      )}
    </div>
  );
}
