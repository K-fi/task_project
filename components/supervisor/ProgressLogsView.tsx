"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DownloadIcon, CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

const LOGS_PER_PAGE = 6;
const MAX_VISIBLE_PAGES = 5;

export default function ProgressLogsView({
  logs,
  internName,
}: {
  logs: {
    id: string;
    title: string;
    description: string;
    hoursWorked: number;
    date: Date;
    createdAt: Date;
    taskTitle?: string | null;
  }[];
  internName: string;
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Dates with logs
  const allLogDates = useMemo(
    () => new Set(logs.map((log) => new Date(log.date).toDateString())),
    [logs]
  );

  // Filter + sort logs
  const { filteredLogs, totalPages, paginatedLogs } = useMemo(() => {
    let filtered = logs;

    if (selectedDate) {
      filtered = filtered.filter(
        (log) =>
          new Date(log.date).toDateString() === selectedDate.toDateString()
      );
      // Sort by createdAt descending when date is filtered
      filtered = filtered
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    } else {
      // Sort by log date descending when showing all logs
      filtered = filtered
        .slice()
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }

    const total = Math.ceil(filtered.length / LOGS_PER_PAGE);
    const start = (currentPage - 1) * LOGS_PER_PAGE;
    const paginated = filtered.slice(start, start + LOGS_PER_PAGE);

    return {
      filteredLogs: filtered,
      totalPages: total,
      paginatedLogs: paginated,
    };
  }, [logs, selectedDate, currentPage]);

  // Pagination helpers
  const getVisiblePages = (): (number | string)[] => {
    if (totalPages <= MAX_VISIBLE_PAGES)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);
    if (currentPage <= 3) (start = 2), (end = 4);
    else if (currentPage >= totalPages - 2)
      (start = totalPages - 3), (end = totalPages - 1);

    const pages: (number | string)[] = [1];
    if (start > 2) pages.push("…");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("…");
    pages.push(totalPages);
    return pages;
  };

  const visiblePages = getVisiblePages();

  // CSV export
  const convertToCSV = (logsToExport: typeof filteredLogs) => {
    const headers = ["Date", "Task Title", "Log Title", "Description", "Hours"];
    const rows = logsToExport.map((log) => [
      new Date(log.date).toLocaleDateString("en-US"),
      log.taskTitle ?? "General",
      log.title,
      log.description,
      log.hoursWorked.toString(),
    ]);
    return [headers, ...rows]
      .map((row) => row.map((f) => `"${f.replace(/"/g, '""')}"`).join(","))
      .join("\n");
  };

  const downloadCSV = (logsToExport: typeof filteredLogs, fileName: string) => {
    const csv = convertToCSV(logsToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {selectedDate
                  ? selectedDate.toLocaleDateString()
                  : "Filter by date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <DayPicker
                mode="single"
                selected={selectedDate ?? undefined}
                onSelect={(date) => {
                  if (date) setSelectedDate(date);
                  setIsCalendarOpen(false);
                  setCurrentPage(1);
                }}
                modifiers={{
                  hasLog: (date) => allLogDates.has(date.toDateString()),
                  today: (date) =>
                    date.toDateString() === new Date().toDateString(),
                }}
                modifiersClassNames={{
                  hasLog:
                    "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary",
                  today: "border border-primary rounded-md",
                }}
              />
              {selectedDate && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={clearDateFilter}
                >
                  Clear date
                </Button>
              )}
            </PopoverContent>
          </Popover>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            downloadCSV(filteredLogs, `${internName}-progress.csv`)
          }
        >
          <DownloadIcon className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border-2 border-gray-300 dark:border-gray-600">
        <Table className="min-w-full text-base border-collapse border border-gray-300 dark:border-gray-600">
          <TableHeader>
            <TableRow className="h-14 border-b-2 border-gray-300 dark:border-gray-600">
              <TableHead className="px-6 py-4 font-semibold">Date</TableHead>
              <TableHead className="px-6 py-4 font-semibold">
                Task Title
              </TableHead>
              <TableHead className="px-6 py-4 font-semibold">
                Log Title
              </TableHead>
              <TableHead className="px-6 py-4 font-semibold">
                Description
              </TableHead>
              <TableHead className="px-6 py-4 text-right font-semibold">
                Hours
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogs.map((log) => (
              <TableRow
                key={log.id}
                className="h-16 hover:bg-muted/30 dark:hover:bg-muted/20 border-b border-gray-300 dark:border-gray-600"
              >
                <TableCell className="px-6 py-4">
                  {new Date(log.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Badge
                    variant={log.taskTitle ? "outline" : "secondary"}
                    className="text-sm py-1 px-2"
                  >
                    {log.taskTitle ?? "General"}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-normal break-words max-w-xs">
                  {log.title}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-normal break-words max-w-sm">
                  {log.description}
                </TableCell>
                <TableCell className="px-6 py-4 text-right">
                  {log.hoursWorked}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredLogs.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            {selectedDate
              ? `No logs found for ${selectedDate.toLocaleDateString()}`
              : `${internName} hasn't logged any progress yet`}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border dark:border-border bg-background dark:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
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
                  key={`page-${p}`}
                  onClick={() => setCurrentPage(p)}
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
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border dark:border-border bg-background dark:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
