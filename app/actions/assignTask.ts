// app/actions/assignTask.ts
"use server";

import { prisma } from "@/lib/db";
import { userRequired } from "@/app/data/user/is-user-authenticated";
import { revalidatePath } from "next/cache";

export async function assignTask(formData: FormData) {
  const title = formData.get("title")?.toString();
  const description = formData.get("description")?.toString() || "";
  const assignedId = formData.get("assignedId")?.toString();
  const priority = formData.get("priority")?.toString() as "LOW" | "MEDIUM" | "HIGH";
  const dueDate = formData.get("dueDate")?.toString();

  if (!title || !assignedId || !dueDate) {
    throw new Error("Missing required fields");
  }

  const { user } = await userRequired();
  if (!user) {
     throw new Error("User not authenticated");
  }

  const creator = await prisma.user.findUnique({
    where: { email: user.email ?? "" },
    select: { id: true },
  });

  if (!creator) throw new Error("Supervisor not found");

  await prisma.task.create({
    data: {
      title,
      description,
      assignedId,
      creatorId: creator.id,
      priority: priority || "LOW",
      dueDate: new Date(dueDate),
      startDate: new Date(),
    },
  });

  revalidatePath("/dashboard");
}
