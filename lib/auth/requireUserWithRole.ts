// lib/auth/requireUserWithRole.ts
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

type Role = "INTERN" | "SUPERVISOR";

export const requireUserWithRole = async (
  expectedRole: Role,
  {
    redirectOnMissingUser = "/",
    redirectIfNotOnboarded = "/onboarding",
    redirectIfWrongRole = "/dashboard",
  } = {}
) => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.email) redirect(redirectOnMissingUser);

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: {
      id: true,
      role: true,
      onboardingCompleted: true,
    },
  });

  if (!dbUser) redirect(redirectOnMissingUser);
  if (!dbUser.onboardingCompleted) redirect(redirectIfNotOnboarded);
  if (dbUser.role !== expectedRole) redirect(redirectIfWrongRole);

  return dbUser; // return dbUser if everything passes
};
