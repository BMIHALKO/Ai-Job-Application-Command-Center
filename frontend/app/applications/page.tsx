"use client";
import Link from "next/link";

import { MOCK_APPLICATIONS } from "./data";
import FilterBar, { type ApplicationFilters } from "./FilterBar";
import { Badge } from "../components/application/DetailBits";
import { priorityLabel, priorityTone, statusLabel, statusTone, formatNextAction } from "../lib/applicationUi";
import type { Tone } from "../lib/applicationUi";

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

function formatDateShort(d: Date) {
    return d.toLocaleDateString(undefined, {month: "short", day: "numeric"});
}

export default function ApplicationsPage() {
    const allRows = useMemo(() => MOCK_APPLICATIONS, []);

    const DEFAULT_FILTERS: ApplicationFilters = {
        search: "",
        status: "all",
        priority: "all",
        workMode: "all",
    };

    const [filters, setFilters] = useState<ApplicationFilters>(DEFAULT_FILTERS);

    const rows = useMemo(() => {
        const q = filters.search.trim().toLowerCase();

        return allRows.filter((r) => {
            // status
            if (filters.status !== "all" && r.status !== filters.status) return false;

            // priority
            if (filters.priority !== "all" && r.priority !== filters.priority) return false;

            // work mode (normalize null + casing)
            if (filters.workMode !== "all") {
                const mode = (r.work_mode ?? "").toLowerCase();
                if (mode !== filters.workMode) return false;
            }

            // search (company or role)
            if (q) {
                const company = r.company_name.toLowerCase();
                const role = r.role_title.toLowerCase();
                if (!company.includes(q) && !role.includes(q)) return false;
            }

            return true;
        });
    }, [allRows, filters]);

    const [selectedId, setSelectedId] = useState < string | null > (null);

    const selected = useMemo(() => rows.find((r) => r.application_id === selectedId) ?? null, [
        rows,
        selectedId,
    ]);

    useEffect(() => {
        if (!selectedId) return;
        const stillVisible = rows.some((r) => r.application_id === selectedId);
        if (!stillVisible) setSelectedId(null);
    }, [rows, selectedId]);

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
            {/* Header Row */}
            <div className = "flex items-end justify-between gap-4">
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

            <FilterBar
                filters = {filters}
                onChange = {(next) => {
                    setSelectedId(null);
                    setFilters(next);
                }}
                onReset = {() => {
                    setSelectedId(null);
                    setFilters(DEFAULT_FILTERS);
                }}
            />

            {allRows.length === 0 ? (
                <div className = "mt-6 rounded-xl border bg-white p-6">
                    <div className = "text-sm font-medium text-gray-900">
                        No applications yet.
                    </div>
                    <div className = "mt-1 text-sm text-gray-600">
                        Add your first aplication to start tracking your pipeline.
                    </div>

                    <button type = "button" className = "mt-4 rounded-lg bg-black px-4 py-2 text-sm text-white hover:opacity-90">
                        + New Application
                    </button>
                </div>
            ) : rows.length === 0 ? (
                <div className = "mt-6 rounded-x1 border bg-white p-6">
                    <div className = "text-sm font-medium text-gray-900">
                        No application match your filters.
                    </div>
                    <div className = "mt-1 text-sm text-gray-600">
                        Try clearing filters or adjusting your search.
                    </div>

                    <div className = "mt-4 flex gap-2">
                        <button className = "rounded-lg bg-black px-4 py-2 text-sm text-white hover:opacity-90" onClick = {() => {
                            setSelectedId(null);
                            setFilters(DEFAULT_FILTERS);
                        }}>
                            Reset Filters
                        </button>

                        <button className = "rounded-lg border px-4 py-2 text-sm hover:bg-gray-50" onClick = {() => {
                            setFilters((prev) => ({ ...prev, search: ""}));
                        }}>
                            Clear search
                        </button>
                    </div>
                </div>
            ) : (
                <div className = "mt-6 overflow-x-auto rounded-xl border bg-white">
                    <table className = "min-w-full text-sm">
                        <thead className = "bg-gray-50 text-sm font-medium uppercase tracking-wide text-gray-600">
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
                                        <td className = "px-4 py-3 font-medium">{row.company_name}</td>
                                        <td className = "px-4 py-3">{row.role_title}</td>

                                        <td className = "px-4 py-3">
                                            <div className = "flex items-center">
                                                <Badge tone = {statusTone(row.status)}>{statusLabel(row.status)}</Badge>
                                            </div>
                                        </td>

                                        <td className = "px-4 py-3">
                                            <div className = "flex items-center">
                                                <Badge tone = {priorityTone(row.priority)}>
                                                    {priorityLabel(row.priority)} (P{row.priority})
                                                </Badge>
                                            </div>
                                        </td>

                                        <td className = "px-4 py-3">
                                            <div className = "flex items-center">
                                                <Badge tone = {next.tone}>{next.label}</Badge>
                                            </div>
                                        </td>

                                        <td className = "px-4 py-3 text-gray-700">
                                            {row.last_touch_at ? formatDateShort(new Date(row.last_touch_at)) : "—"}
                                        </td>

                                        <td className = "px-4 py-3 text-gray-700">
                                            {row.applied_at ? formatDateShort(new Date(row.applied_at)) : "—"}
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
            )}

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
                            <Badge tone = {statusTone(selected.status)}>{statusLabel(selected.status)}</Badge>

                            <Badge tone = {priorityTone(selected.priority)}>
                                {priorityLabel(selected.priority)} (P{selected.priority})
                            </Badge>
                        </div>

                        <div className="mt-5 space-y-3 text-sm">
                            <div className="flex justify-between gap-4">
                                <div>
                                    <div className="text-gray-700">Next action:</div>

                                
                                    {selected.next_action_label ? (
                                        <div className = "mt-2 w-full text-left text-sm font-medium text-gray-900">{selected.next_action_label}</div>
                                    ) : (
                                        <div className = "mt-2 w-full text-left text-sm italic text-gray-500"> No next action set</div>
                                    )}
                                </div>
                                
                                <div className = "flex flex-col items-start text-right">
                                    <div className = "self-end">
                                        <Badge tone = {formatNextAction(selected.next_action_at).tone}>
                                            {formatNextAction(selected.next_action_at).label}
                                        </Badge>
                                    </div>
                                </div>
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

                            {selected.notes?.trim() ? (
                                <p className = "mt-1 whitespace-pre-wrap text-sm text-gray-700">
                                    {selected.notes}
                                </p>
                            ) : (
                                <p className = "mt-1 text-sm text-gray-500">
                                    No notes yet. Add key details after screens/interviews.
                                </p>
                            )}
                        </div>

                        <div className="mt-6 flex gap-2">
                            <Link href = {`/applications/${selected.application_id}`} className = "flex-1 rounded-lg bg-black px-3 py-2 text-center text-sm text-white hover:opacity-90">
                                Open Details
                            </Link>
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