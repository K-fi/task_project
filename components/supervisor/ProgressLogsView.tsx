"use client";

import { useState } from "react";
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
import { DownloadIcon, CalendarIcon, XIcon } from "lucide-react";
import Calendar from "@/components/progress/Calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
    taskTitle?: string | null; // ✅ use taskTitle from schema
  }[];
  internName: string;
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const filteredLogs = selectedDate
    ? logs.filter((log) => {
        const logDate = new Date(log.date);
        return (
          logDate.getDate() === selectedDate.getDate() &&
          logDate.getMonth() === selectedDate.getMonth() &&
          logDate.getFullYear() === selectedDate.getFullYear()
        );
      })
    : logs;

  const clearDateFilter = () => setSelectedDate(null);

  // ----------------------------
  // CSV Export Helper Functions
  // ----------------------------
  const convertToCSV = (logsToExport: typeof filteredLogs) => {
    const headers = ["Date", "Task Title", "Log Title", "Description", "Hours"];
    const rows = logsToExport.map((log) => [
      new Date(log.date).toLocaleDateString("en-US"),
      log.taskTitle ? log.taskTitle : "General", // ✅ use taskTitle directly
      log.title,
      log.description,
      log.hoursWorked.toString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((field) => `"${field.replace(/"/g, '""')}"`) // escape quotes
          .join(",")
      )
      .join("\n");

    return csvContent;
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
            <PopoverContent className="w-auto p-0">
              <Calendar
                selectedDate={selectedDate || new Date()}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setIsCalendarOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
          {selectedDate && (
            <Button variant="ghost" size="sm" onClick={clearDateFilter}>
              <XIcon className="h-4 w-4" />
            </Button>
          )}
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

      <div className="overflow-x-auto rounded-md border">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Task Title</TableHead>
              <TableHead>Log Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Hours</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {new Date(log.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  {log.taskTitle ? (
                    <Badge variant="outline">{log.taskTitle}</Badge> // ✅ show taskTitle
                  ) : (
                    <Badge variant="secondary">General</Badge>
                  )}
                </TableCell>
                <TableCell className="whitespace-normal break-words max-w-xs">
                  {log.title}
                </TableCell>
                <TableCell className="whitespace-normal break-words max-w-sm">
                  {log.description}
                </TableCell>
                <TableCell className="text-right">{log.hoursWorked}</TableCell>
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
      </div>
    </div>
  );
}
