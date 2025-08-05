"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  assignInternsToSupervisor,
  removeInternsFromSupervisor,
} from "@/app/actions/supervisor";
import { Loader2 } from "lucide-react";

type Intern = { id: string; name: string };

export default function ManageInternsClient({
  availableInterns: initialAvailable,
  supervisedInterns: initialSupervised,
}: {
  availableInterns: Intern[];
  supervisedInterns: Intern[];
}) {
  const [availableInterns, setAvailableInterns] = useState(initialAvailable);
  const [supervisedInterns, setSupervisedInterns] = useState(initialSupervised);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [selectedToRemove, setSelectedToRemove] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<"assign" | "remove" | null>(null);

  const toggle = (id: string, type: "add" | "remove") => {
    const setState = type === "add" ? setSelectedToAdd : setSelectedToRemove;
    const current = type === "add" ? selectedToAdd : selectedToRemove;
    setState(prev => {
      const newSet = new Set(current);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const handleAssign = async () => {
    setLoading("assign");
    await assignInternsToSupervisor(Array.from(selectedToAdd));
    const assigned = availableInterns.filter(intern => selectedToAdd.has(intern.id));
    setAvailableInterns(prev => prev.filter(i => !selectedToAdd.has(i.id)));
    setSupervisedInterns(prev => [...prev, ...assigned]);
    setSelectedToAdd(new Set());
    setLoading(null);
  };

  const handleRemove = async () => {
    setLoading("remove");
    await removeInternsFromSupervisor(Array.from(selectedToRemove));
    const removed = supervisedInterns.filter(intern => selectedToRemove.has(intern.id));
    setSupervisedInterns(prev => prev.filter(i => !selectedToRemove.has(i.id)));
    setAvailableInterns(prev => [...prev, ...removed]);
    setSelectedToRemove(new Set());
    setLoading(null);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-8">
      {/* Assign Interns Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-600">Assign Interns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableInterns.length === 0 ? (
            <p className="text-muted-foreground">No available interns.</p>
          ) : (
            availableInterns.map(intern => (
              <label key={intern.id} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedToAdd.has(intern.id)}
                  onCheckedChange={() => toggle(intern.id, "add")}
                />
                {intern.name}
              </label>
            ))
          )}
          <Button
            onClick={handleAssign}
            disabled={selectedToAdd.size === 0 || loading !== null}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading === "assign" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Selected
          </Button>
        </CardContent>
      </Card>

      {/* Supervised Interns Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Remove Interns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {supervisedInterns.length === 0 ? (
            <p className="text-muted-foreground">No interns under your supervision.</p>
          ) : (
            supervisedInterns.map(intern => (
              <label key={intern.id} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedToRemove.has(intern.id)}
                  onCheckedChange={() => toggle(intern.id, "remove")}
                />
                {intern.name}
              </label>
            ))
          )}
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={selectedToRemove.size === 0 || loading !== null}
            className="mt-4"
          >
            {loading === "remove" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remove Selected
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
