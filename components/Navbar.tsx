// components/Navbar.tsx
import { Button } from "@/components/ui/button";
import { AccessLevel } from "@/lib/generated/prisma";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import Link from "next/link";

export const Navbar = ({ name, role }: { name: string; role: AccessLevel }) => {
  return (
    <header className="w-full border-b bg-white dark:bg-background shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
        {/* Left: Logo and Links */}
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-2xl font-bold text-foreground no-underline hover:opacity-80 transition"
          >
            DailyTM
          </Link>

          {/* Role-based links */}
          {role === "SUPERVISOR" ? (
            <>
              <Link href="/manage-interns" className="text-sm text-muted-foreground hover:text-primary">
                Manage Interns
              </Link>
              <Link href="/task-progress" className="text-sm text-muted-foreground hover:text-primary">
                View Progress
              </Link>
            </>
          ) : (
            <>
              <Link href="/tasks" className="text-sm text-muted-foreground hover:text-primary">
                My Tasks
              </Link>
              <Link href="/log-progress" className="text-sm text-muted-foreground hover:text-primary">
                Log Progress
              </Link>
            </>
          )}
        </div>

        {/* Right: Greeting and Logout */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {role?.charAt(0).toUpperCase() + role?.slice(1).toLowerCase()} {name}
          </span>
          <Button asChild variant="outline">
            <LogoutLink>Log out</LogoutLink>
          </Button>
        </div>
      </div>
    </header>
  );
};
