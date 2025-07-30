"use server";

import { prisma } from "@/lib/db";
import { userRequired } from "@/app/data/user/is-user-authenticated";

// Fetch interns that are NOT supervised by the current user
export const fetchAvailableInterns = async () => {
  const { user } = await userRequired();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email as string },
    select: { id: true },
  });

  if (!dbUser) throw new Error("User not found");

  const interns = await prisma.user.findMany({
    where: {
      role: "INTERN",
      supervisedBy: {
        none: { id: dbUser.id },
      },
    },
    select: { id: true, name: true },
  });

  return interns;
};

// Assign interns to the current supervisor
export const assignInternsToSupervisor = async (internIds: string[]) => {
  const { user } = await userRequired();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email as string },
    select: { id: true },
  });

  if (!dbUser) throw new Error("User not found");

  await Promise.all(
    internIds.map(async (internId) => {
      await prisma.user.update({
        where: { id: internId },
        data: {
          supervisedBy: {
            connect: { id: dbUser.id },
          },
        },
      });
    })
  );
};

// Fetch supervised interns
export const fetchSupervisedInterns = async () => {
  const { user } = await userRequired();
  if (!user) throw new Error("Not authenticated");
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email as string },
    select: { id: true },
  });

  if (!dbUser) throw new Error("User not found");

  const interns = await prisma.user.findMany({
    where: {
      role: "INTERN",
      supervisedBy: { some: { id: dbUser.id } },
    },
    select: { id: true, name: true },
  });

  return interns;
};

// Remove supervision
export const removeInternsFromSupervisor = async (internIds: string[]) => {
  const { user } = await userRequired();
  if (!user) throw new Error("Not authenticated");
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email as string },
    select: { id: true },
  });

  if (!dbUser) throw new Error("User not found");

  await Promise.all(
    internIds.map(async (internId) => {
      await prisma.user.update({
        where: { id: internId },
        data: {
          supervisedBy: {
            disconnect: { id: dbUser.id },
          },
        },
      });
    })
  );
};


