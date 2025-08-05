// app/dashboard/page.tsx
import { prisma } from "@/lib/db";
import { userRequired } from "@/app/data/user/is-user-authenticated";
import { Navbar } from "@/components/Navbar";
import SupervisorView from "@/components/SupervisorView";
import InternView from "@/components/InternView";
import React from "react";
import { AccessLevel } from "@/lib/generated/prisma";
import { redirect } from "next/navigation"; 

const DashboardPage = async () => {
  const { user } = await userRequired();
  if (!user) throw new Error("User not authenticated");

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email as string },
    select: {
      id: true,
      name: true,
      role: true,
      onboardingCompleted: true, 
    },
  });

  // Redirect if onboarding not completed
  if (!dbUser?.onboardingCompleted) {
    redirect("/onboarding");
  }

  if (!dbUser || (dbUser.role !== "INTERN" && dbUser.role !== "SUPERVISOR")) {
    return (
      <div className="text-center mt-10 text-red-600">
        Access denied. You do not have permission to view this dashboard.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {dbUser.role === "SUPERVISOR" ? (
          <SupervisorView userId={dbUser.id} name={dbUser.name} />
        ) : (
          <InternView userId={dbUser.id} name={dbUser.name} />
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
