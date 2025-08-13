// components/supervisor/StatusFilter.tsx
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
}: {
  currentStatus?: TaskStatus;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleValueChange = (value: TaskStatus | "all") => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    params.set("page", "1"); // Reset to first page when changing status
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select value={currentStatus || "all"} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue
          placeholder={
            currentStatus
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
