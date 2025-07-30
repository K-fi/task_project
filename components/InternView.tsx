// components/InternView.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Task } from "@/lib/generated/prisma";

interface InternViewProps {
  userId: string;
  name: string;
}

interface Supervisor {
  id: string;
  name: string;
  email?: string;
}

const InternView = ({ userId, name }: InternViewProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const res = await fetch(`/api/tasks?assignedId=${userId}`);
      const data = await res.json();
      setTasks(data);
    };

    const fetchSupervisors = async () => {
      const res = await fetch(`/api/intern-supervisors?internId=${userId}`);
      const data = await res.json();
      setSupervisors(data);
    };

    fetchTasks();
    fetchSupervisors();
  }, [userId]);

  const completedCount = tasks.filter((task) => task.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Welcome, {name} 👋
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-muted-foreground text-sm">
            You are supervised by{" "}
            {supervisors.length > 0
              ? supervisors.map((s) => s.name).join(", ")
              : "no one yet."}
          </p>
          <p className="text-muted-foreground text-sm">
            You have {tasks.length} task{tasks.length !== 1 ? "s" : ""}.{" "}
            {completedCount > 0 && `${completedCount} completed ✅`}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your Tasks</h2>
        {/* Placeholder for TaskBoard */}
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            TaskBoard component coming soon...
          </p>
        </Card>
      </div>
    </div>
  );
};

export default InternView;
