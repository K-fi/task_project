// app/manage-interns/page.tsx
import { userRequired } from "@/app/data/user/is-user-authenticated";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import ManageInternsClient from "@/components/supervisor/ManageInterns";
import { requireUserWithRole } from "@/lib/auth/requireUserWithRole";

export default async function ManageInternsPage() {
  //  Ensure only SUPERVISORs can view this page
  const dbUser = await requireUserWithRole("SUPERVISOR");

  // Fetch both available and supervised interns on the server
  const availableInterns = await prisma.user.findMany({
    where: {
      role: "INTERN",
      supervisedBy: { none: { id: dbUser.id } },
    },
    select: { id: true, name: true },
  });

  const supervisedInterns = await prisma.user.findMany({
    where: {
      role: "INTERN",
      supervisedBy: { some: { id: dbUser.id } },
    },
    select: { id: true, name: true },
  });

  return (
    <ManageInternsClient
      availableInterns={availableInterns}
      supervisedInterns={supervisedInterns}
    />
  );
}
