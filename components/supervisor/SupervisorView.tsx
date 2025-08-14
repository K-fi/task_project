"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AssignTaskForm from "./AssignTaskForm";
import EditTasksDialog from "./EditTasksDialog";

const TASKS_PER_PAGE = 6;

const isTaskCompleted = (status: string) =>
  status === "COMPLETED" || status === "LATE";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  createdAt: Date;
  status: string;
}

interface Intern {
  id: string;
  name: string;
  assignedTasks: Task[];
}

interface SupervisorViewProps {
  internsData: Intern[];
  supervisorName: string;
}

export default function SupervisorView({
  internsData,
  supervisorName,
}: SupervisorViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter interns by search term
  const filteredInterns = useMemo(() => {
    if (!searchTerm.trim()) return internsData;
    return internsData.filter((intern) =>
      intern.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [internsData, searchTerm]);

  // Paginate filtered interns
  const { paginatedInterns, totalPages } = useMemo(() => {
    const total = Math.ceil(filteredInterns.length / TASKS_PER_PAGE);
    const start = (currentPage - 1) * TASKS_PER_PAGE;
    const paginated = filteredInterns.slice(start, start + TASKS_PER_PAGE);
    return { paginatedInterns: paginated, totalPages: total };
  }, [filteredInterns, currentPage]);

  const handlePageChange = (page: number) => setCurrentPage(page);

  return (
    <div className="space-y-6">
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Welcome, Supervisor {supervisorName} 👋
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            You are currently supervising {internsData.length} intern
            {internsData.length !== 1 ? "s" : ""}.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Your Interns</h2>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search interns..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset page when searching
          }}
          className="w-full p-2 border rounded-md mb-4"
        />

        {filteredInterns.length === 0 ? (
          <Card className="p-6">
            <p className="text-muted-foreground text-sm">
              No interns found matching "{searchTerm}".
            </p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedInterns.map((intern) => {
                const completedCount = intern.assignedTasks.filter((task) =>
                  isTaskCompleted(task.status)
                ).length;

                return (
                  <Card key={intern.id} className="h-full">
                    <CardHeader>
                      <CardTitle>{intern.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Tasks Assigned: {intern.assignedTasks.length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Tasks Completed: {completedCount}
                      </p>

                      <Button asChild variant="secondary" className="w-full">
                        <Link
                          href={`/supervisor/interns/${intern.id}/progress`}
                        >
                          View Progress
                        </Link>
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full">Assign Task</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Assign Task to {intern.name}
                            </DialogTitle>
                          </DialogHeader>
                          <AssignTaskForm internId={intern.id} />
                        </DialogContent>
                      </Dialog>

                      <EditTasksDialog
                        internName={intern.name}
                        tasks={intern.assignedTasks}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded border ${
                    currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  &lt;
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded border ${
                        page === currentPage
                          ? "bg-primary text-white"
                          : "bg-muted hover:bg-muted/70"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded border ${
                    currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  &gt;
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
