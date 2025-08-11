// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Toaster } from "sonner";
import { userRequired } from "@/app/data/user/is-user-authenticated";
import { prisma } from "@/lib/db";
import { Navbar } from "@/components/Navbar";
import { AccessLevel } from "@/lib/generated/prisma";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskManager",
  description: "Intern-Supervisor Task Manager App",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Attempt to get authenticated user, fallback to null if not authenticated
  const { user } = await userRequired().catch(() => ({ user: null }));

  let userData: { name: string; role: AccessLevel } | null = null;

  // Fetch user data if authenticated
  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email as string },
      select: { name: true, role: true },
    });

    if (dbUser) {
      userData = {
        name: dbUser.name || "",
        role: dbUser.role as AccessLevel,
      };
    }
  }

  return (
    <AuthProvider>
      <html lang="en" className="scroll-smooth">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        >
          {/* Sticky Navbar - always visible */}
          <Navbar
            name={userData?.name}
            role={userData?.role}
            isAuthenticated={!!user}
          />

          {/* Main content with extra top padding to account for fixed navbar */}
          <main className="max-w-7xl mx-auto px-4 py-20 min-h-screen">
            {children}
          </main>

          {/* Toast notifications */}
          <Toaster position="top-right" />
        </body>
      </html>
    </AuthProvider>
  );
}
