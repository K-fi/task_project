// components/supervisor/StatusFilter.tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskStatus } from "@/lib/generated/prisma";

export default function StatusFilter({
  currentStatus,
  onValueChange,
  disabled = false,
}: {
  currentStatus?: TaskStatus | "all";
  onValueChange: (value: TaskStatus | "all") => void;
  disabled?: boolean;
}) {
  return (
    <Select
      value={currentStatus || "all"}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filter status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Statuses</SelectItem>
        <SelectItem value="TODO">To Do</SelectItem>
        <SelectItem value="COMPLETED">Completed</SelectItem>
        <SelectItem value="LATE">Late</SelectItem>
        <SelectItem value="OVERDUE">Overdue</SelectItem>
      </SelectContent>
    </Select>
  );
}
