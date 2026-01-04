import Link from "next/link";
import { MOCK_APPLICATIONS } from "../data";

import { Badge, KV, Section } from "../../components/application/DetailBits";
import {
  formatDate,
  priorityLabel,
  priorityTone,
  statusLabel,
  statusTone,
  formatNextAction
} from "../../lib/applicationUi";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const app = MOCK_APPLICATIONS.find((x) => x.id === id);

  if (!app) {
    return (
      <main className = "p-8">
        <div className = "rounded-2xl border bg-white p-6">
          <div className = "text-xs font-medium text-neutral-500">
            Not found
          </div>
          <h1 className = "mt-2 text-xl font-semibold text-neutral-900">
            Application not found
          </h1>
          <p className = "mt-2 text-sm text-neutral-700">
            We couldn't find an application with ID{" "}
            <span className = "rounded border bg-neutral-50 px-1.5 py-0.5 font-mono text-xs">
              {id}
            </span>
            . It may have been removed or the link is incorrect.
          </p>

          <div>
            <Link href = "/application" className = "inline-flex items-center rounded-lg bg-black px-4 py-2 text-sm text-white hover:opacity-90">
              ← Back to Application
            </Link>

            <Link href = "/applications" className = "inline-flex items-center rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
              View all applications
            </Link>
          </div>
        </div>
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
            <Badge tone = {statusTone(app.status)}>{statusLabel(app.status)}</Badge>
            <Badge tone = {priorityTone(app.priority)}>
              Priority: {priorityLabel(app.priority)}
            </Badge>
            {app.work_mode ? <Badge tone = "gray">{app.work_mode}</Badge> : null}
          </div>
        </div>
      </div>

      {/* Two-column body */}
      <div className = "grid gap-4 md:grid-cols-2">
        <Section title = "Overview">
          <div className = "grid grid-cols-2 gap-4">
            <KV
              label = "Status"
              value = {<Badge tone = {statusTone(app.status)}>{statusLabel(app.status)}</Badge>}
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
            <div className = "col-span-2 grid grid-cols-2">
              <div>
                <div className = " text-sm front-medium text-gray-700">
                  Next Action
                </div>
                
                <div className = "mt-1 text-sm text-gray-900">
                  {app.next_action_label ?? "—"}
                </div>
              </div>

              <div className = "self-start">
                <Badge tone = {formatNextAction(app.next_action_at).tone}>
                  {formatNextAction(app.next_action_at).label}
                </Badge>
              </div>
            </div>
            <KV label = "Application ID" value = {app.id} />
          </div>
        </Section>
      </div>

      <Section title = "Notes">
        <div className = "rounded-xl border bg-white p-4">
          {app.notes && app.notes.trim().length > 0 ? (
            <div className = "text-sm text-gray-800 whitespace-pre-line">
              {app.notes}
            </div>
          ) : (
            <div className = "text-sm text-gray-500 italic">
              No notes added yet.
            </div>
          )}
        </div>
      </Section>
    </main>
  );
}