// app/status-test/page.tsx
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function StatusTestPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams; // ✅ MUST await in Next.js 15
  const status = params.status || "ALL";

  const tasks =
    status === "ALL"
      ? await prisma.task.findMany()
      : await prisma.task.findMany({
          where: { status: status as any },
        });

  return (
    <div style={{ padding: 20 }}>
      <h1>Status Filter Test (DB)</h1>

      {/* Filter Links */}
      <div style={{ marginBottom: 16 }}>
        <Link href="?status=ALL" style={{ marginRight: 8 }}>
          All
        </Link>
        <Link href="?status=TODO" style={{ marginRight: 8 }}>
          Todo
        </Link>
        <Link href="?status=COMPLETED" style={{ marginRight: 8 }}>
          Completed
        </Link>
        <Link href="?status=OVERDUE">Overdue</Link>
      </div>

      {/* Show Selected Status */}
      <h2>Current Status: {status}</h2>

      {/* Render tasks */}
      {tasks.length > 0 ? (
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              {task.title} — <strong>{task.status}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p>No tasks found for this status.</p>
      )}
    </div>
  );
}
