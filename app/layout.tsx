// app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Toaster } from "sonner";

import { userRequired } from "@/app/data/user/is-user-authenticated";
import { prisma } from "@/lib/db";
import { Navbar } from "@/components/Navbar"; // your existing Navbar component
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

// Add a wrapper to inject Navbar server-side
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await userRequired().catch(() => ({ user: null }));

  let dbUser: { name: string; role: string } | null = null;

  if (user) {
    dbUser = await prisma.user.findUnique({
      where: { email: user.email as string },
      select: { name: true, role: true },
    });
  }

  return (
    <AuthProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        >
          {/* ✅ Show Navbar if authenticated and user exists */}
          {dbUser && <Navbar name={dbUser.name} role={dbUser.role as AccessLevel} />}

          {/* ✅ Main page content */}
          <main className="max-w-7xl mx-auto p-4">{children}</main>

          <Toaster />
        </body>
      </html>
    </AuthProvider>
  );
}
