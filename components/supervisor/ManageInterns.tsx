"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  assignInternsToSupervisor,
  removeInternsFromSupervisor,
} from "@/app/actions/supervisor";
import { Loader2, Search, ChevronDown, X } from "lucide-react";

type Intern = { id: string; name: string };

export default function ManageInterns({
  availableInterns: initialAvailable,
  supervisedInterns: initialSupervised,
}: {
  availableInterns: Intern[];
  supervisedInterns: Intern[];
}) {
  const [availableInterns, setAvailableInterns] = useState(initialAvailable);
  const [supervisedInterns, setSupervisedInterns] = useState(initialSupervised);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [selectedToRemove, setSelectedToRemove] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState<"assign" | "remove" | null>(null);

  const [searchAdd, setSearchAdd] = useState("");
  const [searchRemove, setSearchRemove] = useState("");

  const [dropdownAddOpen, setDropdownAddOpen] = useState(false);
  const [dropdownRemoveOpen, setDropdownRemoveOpen] = useState(false);

  const addRef = useRef<HTMLDivElement>(null);
  const removeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addRef.current && !addRef.current.contains(event.target as Node)) {
        setDropdownAddOpen(false);
      }
      if (
        removeRef.current &&
        !removeRef.current.contains(event.target as Node)
      ) {
        setDropdownRemoveOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (id: string, type: "add" | "remove") => {
    const current = type === "add" ? selectedToAdd : selectedToRemove;
    const setState = type === "add" ? setSelectedToAdd : setSelectedToRemove;
    setState(() => {
      const newSet = new Set(current);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const removeFromSelection = (id: string, type: "add" | "remove") => {
    const setState = type === "add" ? setSelectedToAdd : setSelectedToRemove;
    setState((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleAssign = async () => {
    setLoading("assign");
    await assignInternsToSupervisor(Array.from(selectedToAdd));
    const assigned = availableInterns.filter((intern) =>
      selectedToAdd.has(intern.id)
    );
    setAvailableInterns((prev) => prev.filter((i) => !selectedToAdd.has(i.id)));
    setSupervisedInterns((prev) => [...prev, ...assigned]);
    setSelectedToAdd(new Set());
    setLoading(null);
  };

  const handleRemove = async () => {
    setLoading("remove");
    await removeInternsFromSupervisor(Array.from(selectedToRemove));
    const removed = supervisedInterns.filter((intern) =>
      selectedToRemove.has(intern.id)
    );
    setSupervisedInterns((prev) =>
      prev.filter((i) => !selectedToRemove.has(i.id))
    );
    setAvailableInterns((prev) => [...prev, ...removed]);
    setSelectedToRemove(new Set());
    setLoading(null);
  };

  const filteredAvailable = availableInterns.filter((i) =>
    i.name.toLowerCase().includes(searchAdd.toLowerCase())
  );
  const filteredSupervised = supervisedInterns.filter((i) =>
    i.name.toLowerCase().includes(searchRemove.toLowerCase())
  );

  const renderSelectedList = (
    selectedSet: Set<string>,
    type: "add" | "remove"
  ) => {
    const allInterns = type === "add" ? availableInterns : supervisedInterns;
    const selectedInterns = allInterns.filter((i) => selectedSet.has(i.id));

    if (selectedInterns.length === 0) return null;

    return (
      <div className="border rounded-md p-2 max-h-24 overflow-y-auto mt-2 space-y-1 bg-muted">
        {selectedInterns.map((intern) => (
          <div
            key={intern.id}
            className="flex items-center justify-between bg-background px-2 py-1 rounded shadow-sm"
          >
            <span>{intern.name}</span>
            <X
              className="h-4 w-4 text-muted-foreground cursor-pointer"
              onClick={() => removeFromSelection(intern.id, type)}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-8">
      {/* Assign Interns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Assign Interns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" ref={addRef}>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search or select available interns..."
              value={searchAdd}
              onChange={(e) => setSearchAdd(e.target.value)}
              onFocus={() => setDropdownAddOpen(true)}
              className="pl-8 pr-8"
            />
            <ChevronDown
              className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer"
              onClick={() => setDropdownAddOpen((prev) => !prev)}
            />
            {dropdownAddOpen && (
              <div className="absolute mt-1 w-full bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto z-10">
                {filteredAvailable.length === 0 ? (
                  <p className="p-2 text-muted-foreground text-sm">
                    No available interns.
                  </p>
                ) : (
                  filteredAvailable.map((intern) => (
                    <div
                      key={intern.id}
                      className="px-3 py-2 hover:bg-accent cursor-pointer flex items-center gap-2"
                      onClick={() => toggle(intern.id, "add")}
                    >
                      <Checkbox checked={selectedToAdd.has(intern.id)} />
                      {intern.name}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected List */}
          {renderSelectedList(selectedToAdd, "add")}

          <Button
            onClick={handleAssign}
            disabled={selectedToAdd.size === 0 || loading !== null}
            className="mt-4 bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            {loading === "assign" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Assign Selected
          </Button>
        </CardContent>
      </Card>

      {/* Remove Interns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">
            Remove Interns
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" ref={removeRef}>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search or select supervised interns..."
              value={searchRemove}
              onChange={(e) => setSearchRemove(e.target.value)}
              onFocus={() => setDropdownRemoveOpen(true)}
              className="pl-8 pr-8"
            />
            <ChevronDown
              className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer"
              onClick={() => setDropdownRemoveOpen((prev) => !prev)}
            />
            {dropdownRemoveOpen && (
              <div className="absolute mt-1 w-full bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto z-10">
                {filteredSupervised.length === 0 ? (
                  <p className="p-2 text-muted-foreground text-sm">
                    No interns under your supervision.
                  </p>
                ) : (
                  filteredSupervised.map((intern) => (
                    <div
                      key={intern.id}
                      className="px-3 py-2 hover:bg-accent cursor-pointer flex items-center gap-2"
                      onClick={() => toggle(intern.id, "remove")}
                    >
                      <Checkbox checked={selectedToRemove.has(intern.id)} />
                      {intern.name}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected List */}
          {renderSelectedList(selectedToRemove, "remove")}

          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={selectedToRemove.size === 0 || loading !== null}
            className="mt-4 transition-all duration-300 hover:bg-red-700 dark:hover:bg-red-500"
          >
            {loading === "remove" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Remove Selected
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
