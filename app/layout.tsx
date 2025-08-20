// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Toaster } from "sonner";
import { prisma } from "@/lib/db";
import { Navbar } from "@/components/Navbar";
import { AccessLevel } from "@/lib/generated/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { ThemeProvider } from "@/components/theme-provider"; // ✅ import

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
  // ✅ Get fresh session data every time layout loads
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  let userData: { name: string; role: AccessLevel } | null = null;

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
      <html lang="en" className="scroll-smooth" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Navbar will always have the latest session */}
            <Navbar
              name={userData?.name}
              role={userData?.role}
              isAuthenticated={!!user}
            />

            <main className="max-w-7xl mx-auto px-4 py-20 min-h-screen">
              {children}
            </main>

            <Toaster position="top-right" />
          </ThemeProvider>
        </body>
      </html>
    </AuthProvider>
  );
}
