"use client";

import React, { useState, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Button } from "@/components/ui/button";
import ProgressLogModal, {
  ProgressLogFormData,
} from "@/components/progress/ProgressLogModal";
import { Task } from "@/lib/generated/prisma";
import { deleteProgressLogAction } from "@/app/actions/progressLogActions";
import { useRouter } from "next/navigation";

export type ServerLog = {
  id: string;
  title: string;
  description: string;
  hoursWorked: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  taskId: string | null;
  taskTitle: string | null;
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const LOGS_PER_PAGE = 6;
const MAX_VISIBLE_PAGES = 5;

export default function ProgressLog({
  tasks,
  initialDate,
  allLogs,
}: {
  tasks: Task[];
  initialDate: string;
  allLogs: any[];
}) {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProgressLogFormData | undefined>(
    undefined
  );
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  function toStartOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  const isSelectedFuture = useMemo(() => {
    const selected = new Date(selectedDate);
    return toStartOfDay(selected).getTime() > todayStart.getTime();
  }, [selectedDate, todayStart]);

const logsForDate = useMemo(() => {
  const target = toStartOfDay(new Date(selectedDate)).getTime();
  return allLogs
    .filter((log) => toStartOfDay(new Date(log.date)).getTime() === target)
    .map((log) => ({
      ...log,
      date: new Date(log.date),
      createdAt: new Date(log.createdAt),
      updatedAt: new Date(log.updatedAt),
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); //  newest first
}, [allLogs, selectedDate]);


  const totalPages = Math.ceil(logsForDate.length / LOGS_PER_PAGE);
  const paginatedLogs = logsForDate.slice(
    (currentPage - 1) * LOGS_PER_PAGE,
    currentPage * LOGS_PER_PAGE
  );

  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [logsForDate, totalPages, currentPage]);

  async function handleDelete(id: string) {
    if (saving) return;
    setSaving(true);
    try {
      await deleteProgressLogAction({ id });
      router.refresh();
    } catch (err) {
      console.error("delete failed", err);
    } finally {
      setSaving(false);
    }
  }

  function openCreateModal() {
    if (isSelectedFuture || saving) return;
    setEditing(undefined);
    setIsModalOpen(true);
  }

  function editLog(log: ServerLog) {
    if (saving) return;
    if (toStartOfDay(new Date(log.date)).getTime() > todayStart.getTime())
      return;

    setEditing({
      id: log.id,
      title: log.title,
      description: String(log.description),
      hoursWorked: Number(log.hoursWorked),
      date: new Date(log.date),
      taskId: log.taskId ?? null,
      taskTitle: log.taskTitle ?? null,
    });

    setIsModalOpen(true);
  }

  function formatDateConsistent(d: Date | string) {
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateTimeFormatter.format(dateObj);
  }

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= MAX_VISIBLE_PAGES)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);
    pages.push(1);
    if (left > 2) pages.push("…");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("…");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground dark:text-foreground">
          Progress — {new Date(selectedDate).toDateString()}
        </h2>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsCalendarOpen(true)} disabled={saving}>
            Select date
          </Button>
          <Button
            onClick={openCreateModal}
            disabled={isSelectedFuture || saving}
          >
            Add Entry
          </Button>
        </div>
      </div>

      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background dark:bg-background p-4 rounded shadow-lg">
            <DayPicker
              mode="single"
              selected={new Date(selectedDate)}
              onSelect={(date: Date | undefined) => {
                if (!date || saving) return;
                const picked = toStartOfDay(date);
                if (picked.getTime() > todayStart.getTime()) return;
                setSelectedDate(date.toISOString());
                setIsCalendarOpen(false);
              }}
              disabled={{ after: new Date() }}
              className="text-foreground dark:text-foreground"
            />
            <div className="mt-3 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setIsCalendarOpen(false)}
                disabled={saving}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 relative">
        {paginatedLogs.length === 0 && (
          <div className="rounded border border-border bg-background dark:bg-background p-4 shadow-sm">
            <p className="text-muted-foreground dark:text-muted-foreground">
              No logs for this date.
            </p>
            <p className="text-xs mt-2 text-muted-foreground dark:text-muted-foreground">
              {isSelectedFuture
                ? "You cannot log progress for future dates."
                : 'Click "Log Progress" to add a new entry for this date.'}
            </p>
          </div>
        )}

        {paginatedLogs.map((log: ServerLog) => (
          <div
            key={log.id}
            className="rounded border border-border dark:border-border p-4 bg-background dark:bg-background shadow-sm flex flex-col md:flex-row md:justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-foreground dark:text-foreground">
                  {log.title}
                </div>
                <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                  • You
                </div>
              </div>

              {log.taskTitle ? (
                <div className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                  Linked task: {log.taskTitle}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                  General
                </div>
              )}

              <p className="mt-2 text-sm text-foreground dark:text-foreground">
                {log.description}
              </p>

              <div className="mt-2 text-xs text-muted-foreground dark:text-muted-foreground">
                Hours: {log.hoursWorked} • Created:{" "}
                {formatDateConsistent(log.createdAt)} • Updated:{" "}
                {formatDateConsistent(log.updatedAt)}
              </div>
            </div>

            <div className="flex items-start gap-2">
              {toStartOfDay(new Date(log.date)).getTime() <=
                todayStart.getTime() && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => editLog(log)}
                    disabled={saving}
                    className="transition-colors duration-200 bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(log.id)}
                    disabled={saving}
                    className="transition-colors duration-200 bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              &lt;
            </Button>

            {getVisiblePages().map((p, idx) =>
              p === "…" ? (
                <span
                  key={idx}
                  className="px-2 text-foreground dark:text-foreground"
                >
                  …
                </span>
              ) : (
                <Button
                  key={p}
                  size="sm"
                  variant={p === currentPage ? "default" : "outline"}
                  onClick={() => setCurrentPage(p as number)}
                >
                  {p}
                </Button>
              )
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
            >
              &gt;
            </Button>
          </div>
        )}
      </div>

      <ProgressLogModal
        open={isModalOpen}
        onOpenChange={(v) => {
          if (saving) return;
          setIsModalOpen(v);
          if (!v) setEditing(undefined);
        }}
        initialData={editing}
        tasks={tasks}
        defaultDate={new Date(selectedDate)}
        saving={saving}
        setSaving={setSaving}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
