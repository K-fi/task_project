// components/supervisor/ManageInternsClient.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { assignInternsToSupervisor } from "@/app/actions/supervisor";
import { useRouter } from "next/navigation";

type Intern = { id: string; name: string };

export default function ManageInternsClient({ initialInterns }: { initialInterns: Intern[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const router = useRouter();

  const toggle = (id: string) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const handleSubmit = async () => {
    await assignInternsToSupervisor(Array.from(selected));
    router.push("/dashboard");
  };

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Interns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {initialInterns.length === 0 ? (
            <p className="text-muted-foreground">No available interns.</p>
          ) : (
            initialInterns.map((intern) => (
              <label key={intern.id} className="flex items-center gap-2">
                <Checkbox
                  checked={selected.has(intern.id)}
                  onCheckedChange={() => toggle(intern.id)}
                />
                {intern.name}
              </label>
            ))
          )}
          <Button
            onClick={handleSubmit}
            disabled={selected.size === 0}
            className="mt-4"
          >
            Assign Selected Interns
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
