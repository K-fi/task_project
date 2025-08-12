import { prisma } from "@/lib/db";
import { userRequired } from "@/app/data/user/is-user-authenticated";
import InternView from "@/components/intern/InternView";
import { redirect } from "next/navigation";
import { requireUserWithRole } from "@/lib/auth/requireUserWithRole";

export default async function CompletedPage() {
  const { user } = await userRequired();
  if (!user) throw new Error("User not authenticated");

  const dbUser = await requireUserWithRole("INTERN");

  return (
    <InternView
      userId={dbUser.id}
      name={dbUser.name}
      currentStatus="COMPLETED_LATE"
    />
  );
}
