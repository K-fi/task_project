import { prisma } from '@/lib/db';
import { userRequired } from '@/app/data/user/is-user-authenticated';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import {LogoutLink} from "@kinde-oss/kinde-auth-nextjs/components";
import Link from 'next/link';

// Example logout link (adjust to your auth provider)
const LogoutButton = () => (
  <Button asChild variant="outline" className="ml-auto">
    <LogoutLink>Log out</LogoutLink>
  </Button>
);

const Navbar = ({ name }: { name: string }) => (
  <nav className="w-full flex items-center justify-between px-6 py-4 border-b bg-background">
    <span className="font-semibold text-lg">DailyTM Dashboard</span>
    <div className="flex items-center gap-4">
      <span className="text-muted-foreground">Hello, {name}</span>
      <LogoutButton />
    </div>
  </nav>
);

const DashboardPage = async () => {
  const { user } = await userRequired();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email as string },
    select: { role: true, name: true }
  });

  if (!dbUser || (dbUser.role !== "INTERN" && dbUser.role !== "SUPERVISOR")) {
    return (
      <div className="text-center mt-10 text-red-600">
        Access denied. You do not have permission to view this dashboard.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar name={dbUser.name} />
      <main className="flex flex-col items-center justify-center py-10 px-4">
        <Card className="w-full max-w-xl shadow-lg">
          <CardHeader>
            <CardTitle>
              {dbUser.role === "SUPERVISOR" ? "Supervisor Dashboard" : "Intern Dashboard"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dbUser.role === "SUPERVISOR" ? (
              <div className="space-y-4">
                <p className="text-lg">Welcome, Supervisor! Here you can manage interns and tasks.</p>
                {/* Add supervisor-specific components here */}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-lg">Welcome, Intern! Here you can view your assigned tasks and progress.</p>
                {/* Add intern-specific components here */}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DashboardPage;