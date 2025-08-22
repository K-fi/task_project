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
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
    <div className="space-y-8">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Welcome, Supervisor {supervisorName} 👋
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You are currently supervising{" "}
            <span className="font-semibold text-primary">
              {internsData.length}
            </span>{" "}
            intern{internsData.length !== 1 ? "s" : ""}.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Header + Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-xl font-semibold">Your Interns</h2>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search interns..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>

        {internsData.length === 0 ? (
          <Card className="p-6 text-center border-dashed">
            <p className="text-muted-foreground">No interns available.</p>
          </Card>
        ) : filteredInterns.length === 0 ? (
          <Card className="p-6 text-center border-dashed">
            <p className="text-muted-foreground">
              No interns found matching{" "}
              <span className="font-medium">"{searchTerm}"</span>.
            </p>
          </Card>
        ) : (
          <>
            {/* Intern Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedInterns.map((intern) => {
                const completedCount = intern.assignedTasks.filter((task) =>
                  isTaskCompleted(task.status)
                ).length;

                return (
                  <Card
                    key={intern.id}
                    className="h-full border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all duration-200 rounded-xl bg-gray-50 dark:bg-gray-800"
                  >
                    <CardHeader className="pb-0">
                      <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-100">
                        {intern.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          Assigned:
                        </span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {intern.assignedTasks.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          Completed:
                        </span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {completedCount}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
                        <div
                          className="h-2 bg-green-500 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              intern.assignedTasks.length
                                ? (completedCount /
                                    intern.assignedTasks.length) *
                                  100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>

                      <Button asChild variant="outline" className="w-full">
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
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  &lt;
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  &gt;
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
