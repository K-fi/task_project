"use client";

import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isDisabled?: boolean;
  maxVisiblePages?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  isDisabled = false,
  maxVisiblePages = 5,
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = (): (number | string)[] => {
    if (totalPages <= maxVisiblePages)
      return Array.from({ length: totalPages }, (_, i) => i + 1);

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) (start = 2), (end = 4);
    else if (currentPage >= totalPages - 2)
      (start = totalPages - 3), (end = totalPages - 1);

    const pages: (number | string)[] = [1];
    if (start > 2) pages.push("ellipsis-start");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("ellipsis-end");
    pages.push(totalPages);
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1 || isDisabled}
        className="px-3 py-1 rounded border dark:border-border bg-background dark:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
      >
        &lt;
      </button>

      {visiblePages.map((p, idx) =>
        typeof p === "string" ? (
          <span
            key={`ellipsis-${p}-${idx}`} // unique key for ellipsis
            className="px-2 text-foreground dark:text-foreground"
          >
            …
          </span>
        ) : (
          <button
            key={`page-${p}`} // unique key for page number
            onClick={() => onPageChange(p)}
            disabled={isDisabled}
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
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages || isDisabled}
        className="px-3 py-1 rounded border dark:border-border bg-background dark:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
      >
        &gt;
      </button>
    </div>
  );
};

export default Pagination;
