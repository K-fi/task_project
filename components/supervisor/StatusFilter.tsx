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
}: {
  currentStatus?: TaskStatus | "all";
  onValueChange: (value: TaskStatus | "all") => void;
}) {
  return (
    <Select value={currentStatus || "all"} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue
          placeholder={
            currentStatus && currentStatus !== "all"
              ? `${currentStatus.charAt(0)}${currentStatus
                  .slice(1)
                  .toLowerCase()}`
              : "All Statuses"
          }
        />
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
