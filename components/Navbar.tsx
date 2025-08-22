import { Button } from "@/components/ui/button";
import { AccessLevel } from "@/lib/generated/prisma";
import {
  LogoutLink,
  LoginLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";

interface NavbarProps {
  name?: string;
  role?: AccessLevel;
  isAuthenticated?: boolean;
  hasDbUser?: boolean; // new prop: only show role-specific links if true
}

export const Navbar = ({
  name = "",
  role = "INTERN",
  isAuthenticated = false,
  hasDbUser = false,
}: NavbarProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
        {/* Left: Logo and Links */}
        <div className="flex items-center gap-6">
          <Link
            href={isAuthenticated ? "/dashboard" : "/"}
            className="text-2xl font-bold text-foreground no-underline hover:opacity-80 transition"
          >
            TMProject
          </Link>

          {
            isAuthenticated && hasDbUser ? (
              role === "SUPERVISOR" ? (
                <Link
                  href="/manage-interns"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Manage Interns
                </Link>
              ) : (
                <Link
                  href="/log-progress"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Log Progress
                </Link>
              )
            ) : !isAuthenticated ? (
              <>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  About
                </Link>
                <Link
                  href="/features"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Features
                </Link>
              </>
            ) : null /* logged in but no DB user → hide role links */
          }
        </div>

        {/* Right: Auth + Theme Toggle */}
        <div className="flex items-center gap-4">
          <ModeToggle />
          {isAuthenticated ? (
            <>
              {hasDbUser && (
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
                  {name && ` ${name}`}
                </span>
              )}
              <Button asChild variant="outline">
                <LogoutLink>Log out</LogoutLink>
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <LoginLink>Sign in</LoginLink>
              </Button>
              <Button asChild>
                <RegisterLink>Sign up</RegisterLink>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
