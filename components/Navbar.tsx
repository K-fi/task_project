// components/Navbar.tsx
import { Button } from "@/components/ui/button";
import { AccessLevel } from "@/lib/generated/prisma";
import {
  LogoutLink,
  LoginLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import Link from "next/link";

interface NavbarProps {
  name?: string;
  role?: AccessLevel;
  isAuthenticated?: boolean;
}

export const Navbar = ({
  name = "",
  role = "INTERN",
  isAuthenticated = false,
}: NavbarProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      {/* Removed transparency/backdrop classes */}
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
        {/* Left: Logo and Links */}
        <div className="flex items-center gap-6">
          <Link
            href={isAuthenticated ? "/dashboard" : "/"}
            className="text-2xl font-bold text-foreground no-underline hover:opacity-80 transition"
          >
            TMProject
          </Link>

          {/* Navigation Links */}
          {isAuthenticated ? (
            <>
              {role === "SUPERVISOR" ? (
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
              )}
            </>
          ) : (
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
          )}
        </div>

        {/* Right: Auth or User Info */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
                {name && ` ${name}`}
              </span>
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
