import Link from "next/link";
import { MOCK_APPLICATIONS } from "../data";

import { Badge, KV, Section } from "../../components/application/DetailBits";
import {
  formatDate,
  priorityLabel,
  priorityTone,
  statusTone,
} from "../../lib/applicationUi";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const app = MOCK_APPLICATIONS.find((x) => x.application_id === id);

  if (!app) {
    return (
      <main className = "p-8">
        <div className = "text-sm text-gray-800">Application not found.</div>
        <Link
          href = "/applications"
          className = "mt-4 inline-flex rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          ← Back to Applications
        </Link>
      </main>
    );
  }

  return (
    <main className = "mx-auto max-w-4xl space-y-4 p-4">
      {/* Top bar */}
      <div className = "flex items-center justify-between">
        <Link
          href = "/applications"
          className = "text-sm text-neutral-600 hover:text-neutral-900"
        >
          ← Back to applications
        </Link>

        <button
          type = "button"
          disabled
          className = "rounded-lg border px-3 py-2 text-sm text-neutral-400"
          title = "Editing coming soon"
        >
          Edit (soon)
        </button>
      </div>

      {/* Header */}
      <div className = "rounded-2xl border bg-white p-5">
        <div className = "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className = "text-xs text-neutral-500">Company</div>
            <h1 className = "mt-1 text-2xl font-semibold text-neutral-900">
              {app.company_name}
            </h1>

            <div className = "mt-2 text-sm text-neutral-700">
              <span className = "text-neutral-500">Role:</span>{" "}
              <span className = "font-medium text-neutral-900">
                {app.role_title}
              </span>
            </div>
          </div>

          <div className = "flex flex-wrap gap-2">
            <Badge tone = {statusTone(app.status)}>{app.status}</Badge>
            <Badge tone = {priorityTone(app.priority)}>
              Priority: {priorityLabel(app.priority)}
            </Badge>
            {app.work_mode ? <Badge tone = "neutral">{app.work_mode}</Badge> : null}
          </div>
        </div>
      </div>

      {/* Two-column body */}
      <div className = "grid gap-4 md:grid-cols-2">
        <Section title = "Overview">
          <div className = "grid grid-cols-2 gap-4">
            <KV
              label = "Status"
              value = {<Badge tone = {statusTone(app.status)}>{app.status}</Badge>}
            />
            <KV
              label = "Priority"
              value = {
                <Badge tone = {priorityTone(app.priority)}>
                  {priorityLabel(app.priority)}
                </Badge>
              }
            />
            <KV label = "Work mode" value = {app.work_mode ?? "—"} />
            <KV label = "Location" value = {app.location ?? "—"} />
          </div>
        </Section>

        <Section title = "Timeline">
          <div className = "grid grid-cols-2 gap-4">
            <KV label = "Applied" value = {formatDate(app.applied_at)} />
            <KV label = "Last touch" value = {formatDate(app.last_touch_at)} />
            <KV label = "Next action" value = {formatDate(app.next_action_at)} />
            <KV label = "Application ID" value = {app.application_id} />
          </div>
        </Section>
      </div>

      <Section title = "Notes">
        {app.notes?.trim() ? (
          <p className = "whitespace-pre-wrap text-sm text-neutral-800">
            {app.notes}
          </p>
        ) : (
          <p className = "text-sm text-neutral-500">
            No notes yet. Add key details after screens/interviews.
          </p>
        )}
      </Section>
    </main>
  );
}