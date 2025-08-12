import Link from "next/link";
import { TaskStatus } from "@/lib/generated/prisma";

type ExtraStatus = "ALL" | "TODO_OVERDUE" | "COMPLETED_LATE";

interface InternPaginationProps {
  totalPages: number;
  currentPage: number;
  currentStatus: ExtraStatus | TaskStatus;
}

const InternPagination = ({
  totalPages,
  currentPage,
  currentStatus,
}: InternPaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center gap-2 mt-4">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={`?status=${currentStatus}&page=${p}`}
          className={`px-3 py-1 rounded border ${
            p === currentPage
              ? "bg-primary text-white"
              : "bg-muted hover:bg-muted/70"
          }`}
        >
          {p}
        </Link>
      ))}
    </div>
  );
};

export default InternPagination;
