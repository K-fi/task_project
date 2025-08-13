"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Button } from "@/components/ui/button";
import ProgressLogModal, {
  ProgressLogFormData,
} from "@/components/progress/ProgressLogModal";
import { Task } from "@/lib/generated/prisma";
import {
  getMyProgressLogsByDateAction,
  deleteProgressLogAction,
} from "@/app/actions/progressLogActions";
import { useRouter } from "next/navigation";

export type ServerLog = {
  id: string;
  title: string;
  description: string;
  hoursWorked: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  task: { id: string; title: string } | null;
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

export default function ProgressLog({
  tasks,
  initialDate,
  initialLogs,
}: {
  tasks: Task[];
  initialDate: string;
  initialLogs: any[];
}) {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [logs, setLogs] = useState<ServerLog[]>(() =>
    initialLogs.map((log) => ({
      ...log,
      date: new Date(log.date),
      createdAt: new Date(log.createdAt),
      updatedAt: new Date(log.updatedAt),
    }))
  );
  const logsRef = useRef<ServerLog[]>(logs);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProgressLogFormData | undefined>(
    undefined
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // ✅ Fixed: always load logs when selectedDate changes
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const res = await getMyProgressLogsByDateAction({
          date: selectedDate,
        });

        if (!mounted) return;

        const mappedLogs = res.map((log: any) => ({
          ...log,
          date: new Date(log.date),
          createdAt: new Date(log.createdAt),
          updatedAt: new Date(log.updatedAt),
        }));

        setLogs(mappedLogs);
        logsRef.current = mappedLogs;
        setCurrentPage(1); // Reset to first page on new date
      } catch (err) {
        console.error("load logs", err);
        if (mounted) {
          setLogs(logsRef.current);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [selectedDate, refreshKey]);

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
      taskId: log.task?.id ?? null,
    });
    setIsModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (saving) return;
    setSaving(true);
    try {
      await deleteProgressLogAction({ id });
      setRefreshKey((k) => k + 1);
      router.refresh();
    } catch (err) {
      console.error("delete failed", err);
    } finally {
      setSaving(false);
    }
  }

  function formatDateConsistent(d: Date | string) {
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateTimeFormatter.format(dateObj);
  }

  const totalPages = Math.ceil(logs.length / LOGS_PER_PAGE);
  const paginatedLogs = logs.slice(
    (currentPage - 1) * LOGS_PER_PAGE,
    currentPage * LOGS_PER_PAGE
  );

  // --- Windowed Pagination Logic ---
  const MAX_VISIBLE_PAGES = 5;

  const getVisiblePages = () => {
    if (totalPages <= MAX_VISIBLE_PAGES)
      return Array.from({ length: totalPages }, (_, i) => i + 1);

    let start = Math.max(1, currentPage - Math.floor(MAX_VISIBLE_PAGES / 2));
    let end = start + MAX_VISIBLE_PAGES - 1;

    if (end > totalPages) {
      end = totalPages;
      start = end - MAX_VISIBLE_PAGES + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
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
            Log Progress
          </Button>
        </div>
      </div>

      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white p-4 rounded shadow-lg">
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
        {paginatedLogs.length === 0 && !loading && (
          <div className="rounded border p-4 bg-white shadow-sm">
            <p className="text-muted-foreground">No logs for this date.</p>
            <p className="text-xs mt-2 text-gray-500">
              {isSelectedFuture
                ? "You cannot log progress for future dates."
                : 'Click "Log Progress" to add a new entry for this date.'}
            </p>
          </div>
        )}

        {paginatedLogs.map((log) => (
          <div
            key={log.id}
            className="rounded border p-4 bg-white shadow-sm flex flex-col md:flex-row md:justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">{log.title}</div>
                <div className="text-xs text-gray-500">• You</div>
              </div>

              {log.task ? (
                <div className="text-xs text-gray-500 mt-1">
                  Linked task: {log.task.title}
                </div>
              ) : (
                <div className="text-xs text-gray-500 mt-1">General</div>
              )}

              <p className="mt-2 text-sm">{log.description}</p>

              <div className="mt-2 text-xs text-gray-500">
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
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(log.id)}
                    disabled={saving}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-gray-600 font-medium">
            Loading logs...
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-2">
            <Button
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              &lt;
            </Button>

            {getVisiblePages().map((p) => (
              <Button
                key={p}
                size="sm"
                variant={p === currentPage ? "default" : "outline"}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </Button>
            ))}

            <Button
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
        onSaved={() => {
          setRefreshKey((k) => k + 1);
          router.refresh();
        }}
      />
    </div>
  );
}
