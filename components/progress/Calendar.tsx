"use client";

import React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export interface CalendarProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
}

export default function Calendar({ selectedDate, onSelect }: CalendarProps) {
  return (
    <div className="p-3 rounded-md border bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm max-w-[320px]">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={(date) => {
          if (date) onSelect(date);
        }}
        className="text-gray-900 dark:text-gray-100"
        modifiersClassNames={{
          selected:
            "bg-blue-600 text-white dark:bg-blue-500 dark:text-white rounded-full",
          today:
            "font-semibold underline underline-offset-2 dark:text-yellow-400",
          disabled: "text-gray-400 dark:text-gray-600",
          outside: "text-gray-500 dark:text-gray-600",
        }}
        styles={{
          day: {
            borderRadius: "0.375rem",
          },
          caption: {
            color: "inherit",
          },
          head: {
            color: "inherit",
          },
        }}
      />
    </div>
  );
}
