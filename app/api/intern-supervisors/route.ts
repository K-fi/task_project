// app/api/intern-supervisors/route.ts
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const internId = url.searchParams.get("internId");

  if (!internId) {
    return NextResponse.json({ error: "Missing internId" }, { status: 400 });
  }

  const intern = await prisma.user.findUnique({
    where: { id: internId },
    select: {
      supervisedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  return NextResponse.json(intern?.supervisedBy ?? []);
}
