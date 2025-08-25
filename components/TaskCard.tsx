"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, ClipboardCheck, FileClock } from "lucide-react";
import dayjs from "dayjs";
import { completeTaskAction } from "@/app/actions/completeTasks";
import { getTaskHistoryAction } from "@/app/actions/getTaskHistoryAction";
import { getTaskHistoryForSupervisor } from "@/app/actions/getTaskHistoryForSupervisor";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    creator?: { name: string | null } | null;
    createdAt: Date;
    dueDate: Date;
    submission?: string | null;
    submissionLogs: {
      id: string;
      content: string;
      submittedAt: Date;
      submittedBy: { name: string | null };
    }[];
  };
  viewerRole: "INTERN" | "SUPERVISOR";
}

const TaskCard = ({ task, viewerRole }: TaskCardProps) => {
  const [open, setOpen] = useState(false);
  const [submission, setSubmission] = useState(task.submission ?? "");
  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(task.status);
  const [localSubmission, setLocalSubmission] = useState(task.submission ?? "");
  const [tab, setTab] = useState("submit");
  const [logs, setLogs] = useState(task.submissionLogs);
  const [logsLoaded, setLogsLoaded] = useState(false);

  const router = useRouter();
  const isCompleted = localStatus === "COMPLETED" || localStatus === "LATE";

  useEffect(() => {
    if (tab === "history" && !logsLoaded) {
      const getLogs =
        viewerRole === "SUPERVISOR"
          ? getTaskHistoryForSupervisor
          : getTaskHistoryAction;

      getLogs(task.id).then((fetchedLogs) => {
        setLogs(fetchedLogs);
        setLogsLoaded(true);
      });
    }
  }, [tab, logsLoaded, task.id, viewerRole]);

  const handleSubmit = () => {
    if (viewerRole !== "INTERN" || !submission.trim()) return;

    setOpen(false);
    startTransition(async () => {
      const updatedStatus = await completeTaskAction({
        taskId: task.id,
        submission,
      });

      setLocalStatus(updatedStatus);
      setLocalSubmission(submission);

      const updatedLogs = await getTaskHistoryAction(task.id);
      setLogs(updatedLogs);
      setLogsLoaded(true);
      router.refresh();
    });
  };

  return (
    <Card className="relative border border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-gray-900 dark:text-gray-100">
          {task.title}
        </CardTitle>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Assigned by: {task.creator?.name ?? "Unknown"}
        </p>
      </CardHeader>

      {/* Make CardContent a flex column with full height */}
      <CardContent className="flex flex-col h-full text-sm text-gray-800 dark:text-gray-200 space-y-2">
        {task.description && (
          <p className="text-gray-700 dark:text-gray-300">{task.description}</p>
        )}

        <div className="flex items-center justify-between mt-2">
          <span>
            <strong>Status:</strong>{" "}
            <span
              className={
                localStatus === "COMPLETED"
                  ? "text-green-600 font-semibold"
                  : localStatus === "LATE"
                  ? "text-orange-500 font-semibold"
                  : localStatus === "OVERDUE"
                  ? "text-red-600 font-semibold"
                  : "text-yellow-600 font-semibold"
              }
            >
              {localStatus}
            </span>
          </span>
          <span>
            <strong>Priority:</strong>{" "}
            <span
              className={
                task.priority === "HIGH"
                  ? "text-red-600 font-semibold"
                  : task.priority === "MEDIUM"
                  ? "text-orange-500 font-semibold"
                  : "text-blue-600 font-medium"
              }
            >
              {task.priority}
            </span>
          </span>
        </div>

        <div className="text-xs space-y-1 mt-2">
          <p>Created: {dayjs(task.createdAt).format("MMM D, YYYY")}</p>
          <p>Due: {dayjs(task.dueDate).format("MMM D, YYYY")}</p>
          {localSubmission && (
            <>
              <p>
                <strong>Submission:</strong> {localSubmission}
              </p>
              {logs.length > 0 && (
                <p>
                  <strong>Latest submission:</strong>{" "}
                  {dayjs(logs[0].submittedAt).format("MMM D, YYYY h:mm A")}
                </p>
              )}
            </>
          )}
        </div>

        {/* Push buttons to bottom using mt-auto */}
        <div className="mt-auto space-y-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="w-full bg-gray-100 dark:bg-gray-700 dark:text-gray-200 text-gray-900 hover:bg-gray-200 dark:hover:bg-gray-600"
                disabled={viewerRole === "INTERN" && isPending}
              >
                {viewerRole === "INTERN" ? (
                  <>
                    <ClipboardCheck className="w-4 h-4 mr-2" />
                    {isCompleted ? "Resubmit Task" : "Submit & Complete"}
                  </>
                ) : (
                  <>
                    <FileClock className="w-4 h-4 mr-2" />
                    View Submission History
                  </>
                )}
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg bg-gray-50 dark:bg-gray-800">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-gray-100">
                  {viewerRole === "INTERN"
                    ? isCompleted
                      ? "Resubmit Task"
                      : "Submit Task"
                    : "Submission History"}
                </DialogTitle>
              </DialogHeader>

              {viewerRole === "INTERN" ? (
                <Tabs value={tab} onValueChange={setTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="submit">Submit</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="submit"
                    className="pt-4 space-y-3 flex flex-col"
                  >
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add description or link"
                        value={submission}
                        onChange={(e) => setSubmission(e.target.value)}
                        maxLength={500}
                        className="resize-none w-full min-h-[100px] max-h-[200px] overflow-y-auto whitespace-pre-wrap"
                        style={{ overflowWrap: "anywhere" }}
                      />
                      <p className="text-sm text-gray-500 text-right dark:text-gray-400">
                        {500 - submission.length} characters remaining
                      </p>
                    </div>

                    {/* Push submit button to bottom of TabsContent */}
                    <div className="mt-auto">
                      <DialogFooter>
                        <Button
                          onClick={handleSubmit}
                          disabled={isPending || !submission.trim()}
                          className="w-full bg-black hover:bg-gray-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {isCompleted ? "Resubmit" : "Submit & Complete"}
                        </Button>
                      </DialogFooter>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="history"
                    className="pt-4 max-h-64 overflow-y-auto space-y-2"
                  >
                    {logs.length > 0 ? (
                      logs.map((log) => (
                        <div
                          key={log.id}
                          className="border rounded p-2 text-xs text-gray-700 dark:text-gray-300"
                        >
                          <div>
                            <strong>
                              {log.submittedBy?.name ?? "Unknown"}:
                            </strong>{" "}
                            {log.content}
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">
                            {dayjs(log.submittedAt).format(
                              "MMM D, YYYY h:mm A"
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        No submission history found.
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="pt-4 max-h-64 overflow-y-auto space-y-2">
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="border rounded p-2 text-xs text-gray-700 dark:text-gray-300"
                      >
                        <div>
                          <strong>{log.submittedBy?.name ?? "Unknown"}:</strong>{" "}
                          {log.content}
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">
                          {dayjs(log.submittedAt).format("MMM D, YYYY h:mm A")}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      No submission history found.
                    </p>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
