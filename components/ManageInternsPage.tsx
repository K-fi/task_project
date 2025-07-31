// app/supervisor/manage-interns/page.tsx (or similar)
import ManageInternsClient from "@/components/ManageInternsClient";
import { fetchAvailableInterns } from "@/app/actions/supervisor";

export default async function ManageInternsPage() {
  const interns = await fetchAvailableInterns(); // server-side
  return <ManageInternsClient initialInterns={interns} />;
}
