// import { Button } from "@/components/ui/button";
// import {
//   RegisterLink,
//   LoginLink,
//   LogoutLink,
// } from "@kinde-oss/kinde-auth-nextjs/components";
// import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
// import Link from "next/link";

// export default async function Home() {
//   const { isAuthenticated } = getKindeServerSession();
//   const isLoggedIn = await isAuthenticated();
//   return (
//     <div className="w-full h-screen flex flex-col items-center justify-center">
//       <div className="max-w-7xl mx-auto">
//         <div className="text-center">
//           <h1 className="text-4xl md:text-5xl lg-text-6xl font-bold trace-tight">
//             <p>Your personal workspace</p>
//             <p className="text-5xl md:text-6xl">
//               for <span className="text-blue-600">better productivity</span>
//             </p>
//           </h1>
//           <p className="mt-6 text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
//             Start managing your tasks efficiently with our intuitive task
//             manager.
//           </p>

//           <div className="flex-items-center justify-center gap-4 mt-6">
//             {isLoggedIn ? ( // Conditional rendering
//               // Logged-in state
//               <>
//                 <Button asChild>
//                   <Link href="/dashboard">Go to dashboard</Link>
//                 </Button>
//                 <Button asChild variant={"outline"}>
//                   <LogoutLink>Log out</LogoutLink>
//                 </Button>
//               </>
//             ) : (
//               // Logged-out state
//               <>
//                 <Button>
//                   <RegisterLink>Get Started</RegisterLink>
//                 </Button>
//                 <Button asChild variant={"outline"}>
//                   <LoginLink>Sign in</LoginLink>
//                 </Button>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// app/page.tsx
import { redirect } from "next/navigation";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/db";

export default async function Home() {
  const { getUser, isAuthenticated } = getKindeServerSession();
  const loggedIn = await isAuthenticated();

  if (!loggedIn) {
    redirect("/api/auth/login");
  }

  // Get the user session
  const user = await getUser();
  if (!user?.email) redirect("/api/auth/login");

  // Check if user exists in DB
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { onboardingCompleted: true },
  });

  if (!dbUser) {
    // New user → go to onboarding
    redirect("/onboarding");
  }

  // Existing user → dashboard
  redirect("/dashboard");
}
