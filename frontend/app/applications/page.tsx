"use client";
import { useEffect, useMemo, useState } from "react";

type ApplicationStatus = 
    | "draft"
    | "applied"
    | "screen"
    | "interview"
    | "offer"
    | "rejected"
    | "withdrawn"
    | "ghosted";

type ApplicationRow = {
    application_id:  string;
    company_name: string;
    role_title: string;
    status: ApplicationStatus;
    priority: number; // 1 (high) -> 5 (low)
    applied_at: string | null;
    last_touch_at: string | null;
    next_action_at: string | null;
    location: string | null;
    work_mode: string | null; // remote/hybrid/onsite
    notes?: string | null;
};

const MOCK: ApplicationRow[] = [
    {
      application_id: "1",
      company_name: "Example Co",
      role_title: "Software Engineer",
      status: "applied",
      priority: 2,
      applied_at: "2025-12-20",
      last_touch_at: "2025-12-22T14:30:00Z",
      next_action_at: "2025-12-30T15:00:00Z",
      location: "Charlotte, NC",
      work_mode: "hybrid",
      notes: "Follow up if no response by end of week.",
    },
    {
      application_id: "2",
      company_name: "Another Corp",
      role_title: "Frontend Engineer",
      status: "screen",
      priority: 1,
      applied_at: "2025-12-10",
      last_touch_at: "2025-12-18T16:00:00Z",
      next_action_at: "2025-12-29T12:00:00Z",
      location: "Remote",
      work_mode: "remote",
      notes: "Recruiter reached out on LinkedIn. Waiting on next steps."
    },
    {
      application_id: "3",
      company_name: "No Response LLC",
      role_title: "Backend Engineer",
      status: "ghosted",
      priority: 3,
      applied_at: "2025-11-30",
      last_touch_at: "2025-12-02T18:00:00Z",
      next_action_at: "2025-12-20T12:00:00Z",
      location: "Charlotte, NC",
      work_mode: "on-site",
      notes: "Send one last check-in, then mark as ghosted."
    },
];

function formatDateShort(d: Date) {
    return d.toLocaleDateString(undefined, {month: "short", day: "numeric"});
}

function formatNextAction(nextActionISO: string | null) {
    if (!nextActionISO) return { label: "—", tone: "neutral" as const };

    const now = new Date();
    const due = new Date(nextActionISO);

    // normalize to dates for "today/tomorrow"
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDue = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const msPerDay = 24 * 60 * 60 * 1000;
    const dayDiff = Math.round((startOfDue.getTime() - startOfToday.getTime()) / msPerDay);

    if (due.getTime() < now.getTime()) {
        // overdue
        const overdueDays = Math.max(1, Math.floor((startOfToday.getTime() - startOfDue.getTime()) / msPerDay));
        return { label: `Overdue • ${overdueDays}d`, tone: "danger" as const };
    }

    if (dayDiff === 0) return { label: "Today", tone: "warning" as const };
    if (dayDiff === 1) return { label: "Tomorrow", tone: "neutral" as const };

    return { label: formatDateShort(due), tone: "neutral" as const }
}

function statusChipClass(status: ApplicationStatus) {
    switch (status) {
        case "offer":
            return "bg-green-50 text-green-700 border-green-200";
        case "interview":
            return "bg-blue-50 text-blue-700 border-blue-200";
        case "screen":
            return "bg-indigo-50 text-indigo-700 border-indigo-200";
        case "applied":
            return "bg-gray-50 text-gray-700 border-gray-200";
        case "draft":
            return "bg-slate-50 text-slate-700 border-slate-200";
        case "rejected":
        case "withdrawn":
            return "bg-red-50 text-red-700 border-red-200";
        case "ghosted":
            return "bg-amber-50 text-amber-800 border-amber-200";
        default:
            return "bg-gray-50 text-gray-700 border-gray-200";
    }
}

function priorityChipClass(priority: number) {
    if (priority <= 1) return "bg-red-50 text-red-700 border-red-200";
    if (priority === 2) return "bg-amber-50 text-amber-800 border-amber-200";
    if (priority === 3) return "bg-gray-50 text-gray-700 border-gray-200";

    return "bg-slate-50 text-slate-600 border-slate-200";
}

function toneChipClass(tone: "neutral" | "warning" | "danger") {
    if (tone === "danger") return "bg-red-50 text-red-700 border-red-200";
    if (tone == "warning") return "bg-amber-50 text-amber-800 border-amber-200";

    return "bg-gray-50 text-gray-700 border-gray-200";
}

export default function ApplicationsPage() {
    const rows = useMemo(() => MOCK, []);
    const [selectedId, setSelectedId] = useState < string | null > (null);

    const selected = useMemo(() => rows.find((r) => r.application_id === selectedId) ?? null, [
        rows,
        selectedId,
    ]);

    useEffect(() => {
        if (!selectedId) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSelectedId(null);
        };

        window.addEventListener("keydown", onKeyDown);
        
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [selectedId]);

    return (
        <main className = "p-8">
            <div className = "flex items-end justify-between gap 4">
                <div>
                    <h1 className = "text-2xl font-semibold">Applications</h1>
                    <p className = "mt-1 text-sm text-gray-600">
                        Your command center for statuses, follow-ups, and next actions.
                    </p>
                </div>

                <button className = "rounded-lg bg-black px-4 py-2 text-sm text-white hover:opacity-90">
                    + New Application
                </button>
            </div>

            <div className = "mt-6 overflow-x-auto rounded-x1 border bg-white">
                <table className = "min-w-full text-sm">
                    <thead className = "bg-gray-50 text-gray-700">
                        <tr className = "text-left">
                            <th className = "px-4 py-3">Company</th>
                            <th className = "px-4 py-3">Role</th>
                            <th className = "px-4 py-3">Status</th>
                            <th className = "px-4 py-3">Priority</th>
                            <th className = "px-4 py-3">Next Action</th>
                            <th className = "px-4 py-3">Last Touch</th>
                            <th className = "px-4 py-3">Applied</th>
                            <th className = "px-4 py-3">Location</th>
                        </tr>
                    </thead>

                    <tbody className = "text-gray-900">
                        {rows.map((row) => {
                            const next = formatNextAction(row.next_action_at);
                            const isSelected = row.application_id === selectedId;

                            return (
                                <tr key = {row.application_id} className={[
                                    "border-t hover:bg-gray-50 cursor-pointer",
                                    isSelected ? "bg-gray-50" : "",
                                  ].join(" ")}
                                  onClick={() => setSelectedId(row.application_id)}
                                  >
                                    <td className = "px-4 font-medium">{row.company_name}</td>
                                    <td className = "px-4 py-3">{row.role_title}</td>

                                    <td className = "px-4 py-3">
                                        <span
                                            className = {`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${statusChipClass(row.status

                                            )}`}
                                        >
                                            {row.status}
                                        </span>
                                    </td>

                                    <td className = "px-4 py-3">
                                        <span
                                            className = {`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${priorityChipClass(row.priority
                                            )}`}
                                        >
                                            P{row.priority}
                                        </span>
                                    </td>

                                    <td className = "px-4 py-3">
                                        <span
                                            className = {`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${toneChipClass(
                                                next.tone
                                            )}`}
                                        >
                                            {next.label}
                                        </span>
                                    </td>

                                    <td className = "px-4 text-gray-700">
                                        {row.last_touch_at ? formatDateShort(new Date(row.last_touch_at)) : "—"}
                                    </td>

                                    <td className = "px-4 py-3 text-gray-700">
                                        {row.applied_at ?? "—"}
                                    </td>

                                    <td className = "px-4 py-3 text-gray-700">
                                        {[row.location, row.work_mode].filter(Boolean).join(" • ") || "—"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Drawer + overlay (shows only when selected) */}
            {selected ? (
            <>
                {/* Backdrop */}
                <div
                className="fixed inset-0 bg-black/30"
                onClick={() => setSelectedId(null)}
                aria-hidden="true"
                />

                {/* Sliding panel */}
                <aside className="fixed right-0 top-0 h-full w-[420px] max-w-[90vw] border-l bg-white shadow-xl">
                <div className="h-full overflow-y-auto p-5">
                    <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-sm text-gray-700">{selected.company_name}</div>
                        <div className="text-lg font-semibold">{selected.role_title}</div>
                    </div>

                    <button
                        className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
                        onClick={() => setSelectedId(null)}
                        aria-label="Close"
                        title="Close"
                    >
                        Close
                    </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                    <span
                        className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${statusChipClass(
                        selected.status
                        )}`}
                    >
                        {selected.status}
                    </span>
                    <span
                        className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${priorityChipClass(
                        selected.priority
                        )}`}
                    >
                        P{selected.priority}
                    </span>
                    </div>

                    <div className="mt-5 space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                        <div className="text-gray-700">Next action</div>
                        <div className="font-medium">{formatNextAction(selected.next_action_at).label}</div>
                    </div>
                    <div className="flex justify-between gap-4">
                        <div className="text-gray-700">Last touch</div>
                        <div className="font-medium">
                        {selected.last_touch_at ? formatDateShort(new Date(selected.last_touch_at)) : "—"}
                        </div>
                    </div>
                    <div className="flex justify-between gap-4">
                        <div className="text-gray-700">Applied</div>
                        <div className="font-medium">{selected.applied_at ?? "—"}</div>
                    </div>
                    <div className="flex justify-between gap-4">
                        <div className="text-gray-700">Location / Mode</div>
                        <div className="font-medium">
                        {[selected.location, selected.work_mode].filter(Boolean).join(" • ") || "—"}
                        </div>
                    </div>
                    </div>

                    <div className="mt-5">
                    <div className="text-sm font-medium">Notes</div>
                    <div className="mt-1 text-sm text-gray-700">{selected.notes ?? "—"}</div>
                    </div>

                    <div className="mt-6 flex gap-2">
                    <button className="flex-1 rounded-lg bg-black px-3 py-2 text-sm text-white hover:opacity-90">
                        Open details
                    </button>
                    <button className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
                        Quick edit
                    </button>
                    </div>

                    <div className="mt-4 text-xs text-gray-700">
                    Tip: press <span className="rounded border bg-gray-50 px-1 py-0.5">Esc</span> to close.
                    </div>
                </div>
                </aside>

                {/* Slide-in animation via Tailwind (simple) */}
                <style jsx global>{`
                aside {
                    animation: slideIn 160ms ease-out;
                }
                @keyframes slideIn {
                    from {
                    transform: translateX(12px);
                    opacity: 0.6;
                    }
                    to {
                    transform: translateX(0);
                    opacity: 1;
                    }
                }
                `}</style>
            </>
            ) : null}

        </main>
    );
}