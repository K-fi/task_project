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
    <div className="p-3 rounded-md border bg-white shadow-sm max-w-[320px]">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={(date) => {
          if (date) onSelect(date);
        }}
      />
    </div>
  );
}
