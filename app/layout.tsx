import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Toaster } from "sonner";
import { prisma } from "@/lib/db";
import { Navbar } from "@/components/Navbar";
import { AccessLevel } from "@/lib/generated/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { ThemeProvider } from "@/components/theme-provider";

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
  // Get fresh session data every time layout loads
  const { getUser, isAuthenticated } = getKindeServerSession();
  const loggedIn = await isAuthenticated();
  const sessionUser = await getUser();

  // Default: userData is null if DB user not found
  let userData: { name: string; role: AccessLevel } | null = null;

  if (loggedIn && sessionUser?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: sessionUser.email },
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
            {/* Navbar shows session info; role links only if DB user exists */}
            <Navbar
              name={userData?.name}
              role={userData?.role}
              isAuthenticated={!!loggedIn} // coerce null → false
              hasDbUser={!!userData}
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
