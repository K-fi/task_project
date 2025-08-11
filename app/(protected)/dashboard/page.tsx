// app/dashboard/page.tsx
import { prisma } from "@/lib/db";
import { userRequired } from "@/app/data/user/is-user-authenticated";
import SupervisorView from "@/components/supervisor/SupervisorView";
import InternView from "@/components/intern/InternView";
import React from "react";
import { redirect } from "next/navigation";

const DashboardPage = async () => {
  // User authentication
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

  // Render different views based on user role
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {dbUser.role === "SUPERVISOR" ? (
          <SupervisorView userId={dbUser.id} name={dbUser.name} />
        ) : (
          <InternView
            userId={dbUser.id}
            name={dbUser.name}
            currentStatus="TODO" // default: TODO tasks
          />
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
