"use client";

import { useEffect, useState } from "react";
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
  fetchAvailableInterns,
  fetchSupervisedInterns,
  removeInternsFromSupervisor,
} from "@/app/actions/supervisor";

type Intern = { id: string; name: string };

export default function ManageInternsPage() {
  const [availableInterns, setAvailableInterns] = useState<Intern[]>([]);
  const [supervisedInterns, setSupervisedInterns] = useState<Intern[]>([]);

  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [selectedToRemove, setSelectedToRemove] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      const [available, supervised] = await Promise.all([
        fetchAvailableInterns(),
        fetchSupervisedInterns(),
      ]);
      setAvailableInterns(available);
      setSupervisedInterns(supervised);
    };
    fetchData();
  }, []);

  const toggle = (
    id: string,
    type: "add" | "remove"
  ) => {
    const setState =
      type === "add" ? setSelectedToAdd : setSelectedToRemove;
    const current =
      type === "add" ? selectedToAdd : selectedToRemove;

    setState((prev) => {
      const newSet = new Set(current);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const handleAssign = async () => {
    await assignInternsToSupervisor(Array.from(selectedToAdd));
    const [available, supervised] = await Promise.all([
    fetchAvailableInterns(),
    fetchSupervisedInterns(),
    ]);
    setAvailableInterns(available);
    setSupervisedInterns(supervised);
    setSelectedToAdd(new Set());

  };

  const handleRemove = async () => {
    await removeInternsFromSupervisor(Array.from(selectedToRemove));
    const [available, supervised] = await Promise.all([
    fetchAvailableInterns(),
    fetchSupervisedInterns(),
    ]);
    setAvailableInterns(available);
    setSupervisedInterns(supervised);
    setSelectedToRemove(new Set());

  };

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-8">
      {/* Assign Interns Section */}
      <Card>
        <CardHeader>
          <CardTitle>Available Interns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableInterns.length === 0 ? (
            <p className="text-muted-foreground">No available interns.</p>
          ) : (
            availableInterns.map((intern) => (
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
            disabled={selectedToAdd.size === 0}
            className="mt-4"
          >
            Assign Selected Interns
          </Button>
        </CardContent>
      </Card>

      {/* Supervised Interns Section */}
      <Card>
        <CardHeader>
          <CardTitle>Currently Supervised Interns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {supervisedInterns.length === 0 ? (
            <p className="text-muted-foreground">No interns under your supervision.</p>
          ) : (
            supervisedInterns.map((intern) => (
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
            disabled={selectedToRemove.size === 0}
            className="mt-4"
          >
            Remove Selected Interns
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
