// app/manage-interns/page.tsx
import { userRequired } from "@/app/data/user/is-user-authenticated";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

import { requireUserWithRole } from "@/lib/auth/requireUserWithRole";
import ManageInterns from "@/components/supervisor/ManageInterns";

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
    <ManageInterns
      availableInterns={availableInterns}
      supervisedInterns={supervisedInterns}
    />
  );
}
