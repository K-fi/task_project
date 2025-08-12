import Link from "next/link";
import { TaskStatus } from "@/lib/generated/prisma";

type ExtraStatus = "ALL" | "TODO_OVERDUE" | "COMPLETED_LATE";

interface InternFiltersProps {
  currentStatus: ExtraStatus | TaskStatus;
}

const InternFilters = ({ currentStatus }: InternFiltersProps) => {
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
    <div className="flex gap-2">
      {filters.map(({ value, label }) => (
        <Link
          key={value}
          href={`?status=${value}&page=1`}
          className={`text-sm px-2 py-1 rounded transition ${
            currentStatus === value
              ? "bg-primary text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/70"
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
};

export default InternFilters;
