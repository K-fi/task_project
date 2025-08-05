"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
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

  // Load logs on tab open
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
    <Card className="relative border-muted">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{task.title}</CardTitle>
        <p className="text-xs text-muted-foreground">
          Assigned by: {task.creator?.name ?? "Unknown"}
        </p>
      </CardHeader>

      <CardContent className="text-sm space-y-2">
        {task.description && (
          <p className="text-muted-foreground">{task.description}</p>
        )}

        <div className="flex items-center justify-between">
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

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Created: {dayjs(task.createdAt).format("MMM D, YYYY")}</p>
          <p>Due: {dayjs(task.dueDate).format("MMM D, YYYY")}</p>
          {localSubmission && (
            <p>
              <strong>Submission:</strong> {localSubmission}
            </p>
          )}
        </div>

        {/* ✅ Dialog shown for both roles now */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full"
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

          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
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

              <TabsContent value="submit" className="pt-4 space-y-3">
                <Textarea
                  placeholder="Add description or link"
                  value={submission}
                  onChange={(e) => setSubmission(e.target.value)}
                />
                <DialogFooter>
                  <Button
                    onClick={handleSubmit}
                    disabled={isPending || !submission.trim()}
                    className="w-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isCompleted ? "Resubmit" : "Submit & Complete"}
                  </Button>
                </DialogFooter>
              </TabsContent>

              <TabsContent
                value="history"
                className="pt-4 max-h-64 overflow-y-auto space-y-2"
              >
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="border rounded p-2 text-xs text-muted-foreground"
                    >
                      <div>
                        <strong>{log.submittedBy?.name ?? "Unknown"}:</strong>{" "}
                        {log.content}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {dayjs(log.submittedAt).format("MMM D, YYYY h:mm A")}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">
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
                    className="border rounded p-2 text-xs text-muted-foreground"
                  >
                    <div>
                      <strong>{log.submittedBy?.name ?? "Unknown"}:</strong>{" "}
                      {log.content}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {dayjs(log.submittedAt).format("MMM D, YYYY h:mm A")}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  No submission history found.
                </p>
              )}
            </div>
          )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
