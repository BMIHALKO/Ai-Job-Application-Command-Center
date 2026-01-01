import Link from "next/link";
import { MOCK_APPLICATIONS } from "../data";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const app = MOCK_APPLICATIONS.find((x) => x.application_id === id);

  if (!app) {
    return (
      <main className="p-8">
        <div className="text-sm text-gray-800">Application not found.</div>
        <Link
          href="/applications"
          className="mt-4 inline-flex rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          ← Back to Applications
        </Link>
      </main>
    );
  }

  return (
    <main className="p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/applications" className="text-sm text-gray-800 hover:underline">
            ← Back
          </Link>

          <h1 className="mt-2 text-2xl font-semibold">
            {app.company_name} — {app.role_title}
          </h1>

          <p className="mt-1 text-sm text-gray-800">
            {[
              app.location,
              app.work_mode,
              app.applied_at ? `Applied ${app.applied_at}` : null,
            ]
              .filter(Boolean)
              .join(" • ")}
          </p>
        </div>

        <div className="flex gap-2">
          <span className="rounded-full border px-3 py-1 text-xs font-medium">
            Status: {app.status}
          </span>
          <span className="rounded-full border px-3 py-1 text-xs font-medium">
            Priority: {app.priority}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border bg-white p-4">
          <div className="text-sm font-medium">Timeline</div>

          <div className="mt-3 space-y-2 text-sm text-gray-900">
            <div className="flex justify-between gap-4">
              <div className="text-gray-800">Applied</div>
              <div className="font-medium">{app.applied_at ?? "—"}</div>
            </div>

            <div className="flex justify-between gap-4">
              <div className="text-gray-800">Last touch</div>
              <div className="font-medium">{app.last_touch_at ?? "—"}</div>
            </div>

            <div className="flex justify-between gap-4">
              <div className="text-gray-800">Next action</div>
              <div className="font-medium">{app.next_action_at ?? "—"}</div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-4">
          <div className="text-sm font-medium">Notes</div>
          <div className="mt-2 text-sm text-gray-900">{app.notes ?? "—"}</div>
        </section>
      </div>
    </main>
  );
}