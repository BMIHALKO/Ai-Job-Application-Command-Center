"use client";
import Link from "next/link";

import type {  ApplicationRow, ApplicationStatus } from "./data";
import FilterBar, { type ApplicationFilters } from "./FilterBar";
import { Badge } from "../components/application/DetailBits";
import { priorityLabel, priorityTone, statusLabel, statusTone, formatNextAction } from "../lib/applicationUi";
import type { Tone } from "../lib/applicationUi";

import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebaseClient";

import { useEffect, useMemo, useState } from "react";

function formatDateShort(d: Date) {
    return d.toLocaleDateString(undefined, {month: "short", day: "numeric"});
}

export default function ApplicationsPage() {
    const [allRows, setAllRows] = useState<ApplicationRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [isCreateOpen, setIsCreateOpen] = useState(false);

    type NewAppForm = {
        company_name: string;
        role_title: string;
        status: ApplicationStatus;
        priority: number;
        applied_at: string;
        next_action_at: string;
        next_action_label: string;
        location: string;
        work_mode: string;
        notes: string;
    };

    const INITIAL_NEW_APP: NewAppForm = {
        company_name: "",
        role_title: "",
        status: "applied",
        priority: 3,
        applied_at: "",
        next_action_at: "",
        next_action_label: "",
        location: "",
        work_mode: "",
        notes: "",
    }

    const [newApp, setNewApp] = useState<NewAppForm>(INITIAL_NEW_APP);

    const DEFAULT_FILTERS: ApplicationFilters = {
        search: "",
        status: "all",
        priority: "all",
        workMode: "all",
    };

    const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);

    type EditAppForm = {
        company_name: string;
        role_title: string;
        status: ApplicationStatus;
        priority: number;
        applied_at: string;
        last_touch_at: string;
        next_action_at: string;
        next_action_label: string;
        location: string;
        work_mode: string;
        notes: string;
    };

    const EMPTY_EDIT_APP: EditAppForm = {
        company_name: "",
        role_title: "",
        status: "applied",
        priority: 3,
        applied_at: "",
        last_touch_at: "",
        next_action_at: "",
        next_action_label: "",
        location: "",
        work_mode: "",
        notes: "",
    };

    const [editInitial, setEditInitial] = useState<EditAppForm>(EMPTY_EDIT_APP);
    const [editForm, setEditForm] = useState<EditAppForm>(EMPTY_EDIT_APP);



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

    const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [
        rows,
        selectedId,
    ]);

    useEffect(() => {
        if (!selectedId) return;
        const stillVisible = rows.some((r) => r.id === selectedId);
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

    useEffect(() => {
        let cancelled = false;

        async function loadApplications() {
            try {
                const q = query(
                    collection(db, "applications"),
                    orderBy("company_name")
                );

                const snap = await getDocs(q);

                const rows: ApplicationRow[] = snap.docs.map((doc) => {
                    const data = doc.data() as Omit<ApplicationRow, "id">;
                    return {
                        id: doc.id,
                        ...data,
                    };
                });
                
                if (!cancelled) {
                    setAllRows(rows);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        loadApplications();

        return () => {
            cancelled = true;
        }
    }, []);

    function normalizeEditForm(app: ApplicationRow): EditAppForm {
        return {
            company_name: app.company_name ?? "",
            role_title: app.role_title ?? "",
            status: app.status,
            priority: app.priority,
            applied_at: app.applied_at ?? "",
            last_touch_at: app.last_touch_at ?? "",
            next_action_at: app.next_action_at ?? "",
            next_action_label: app.next_action_label ?? "",
            location: app.location ?? "",
            work_mode: app.work_mode ?? "",
            notes: app.notes ?? "",
        };
    }

    function shallowEqual(a: Record<string, any>, b: Record<string, any>) {
        const ak = Object.keys(a);
        const bk = Object.keys(b);
        if (ak.length !== bk.length) return false;
        for (const k of ak) if (a[k] !== b[k]) return false;
        return true;
    }

    function openQuickEdit(app: ApplicationRow) {
        const norm = normalizeEditForm(app);
        setEditInitial(norm);
        setEditForm(norm);
        setUpdateError(null);
        setIsQuickEditOpen(true);
    }

    async function saveQuickEdit() {
        if (!selected) return;
        if (isUpdating) return;

        if (shallowEqual(editInitial, editForm)) return;

        setIsUpdating(true);
        setUpdateError(null);

        try {
            const edit_appl = {
                company_name: editForm.company_name.trim(),
                company_name_lc: editForm.company_name.trim().toLowerCase(),
                role_title: editForm.role_title.trim(),
                status: editForm.status,
                priority: Math.min(5, Math.max(1, editForm.priority || 3)),
                applied_at: editForm.applied_at || null,
                last_touch_at: editForm.last_touch_at || null,
                next_action_at: editForm.next_action_at || null,
                next_action_label: editForm.next_action_label.trim() || null,
                location: editForm.location.trim() || null,
                work_mode: editForm.work_mode || null,
                notes: editForm.notes.trim() || null,
            };

            await updateDoc(doc(db, "applications", selected.id), edit_appl);

            const nextRow: ApplicationRow = {
                ...selected,
                ...edit_appl,
            };

            setAllRows((prev) => prev.map((r) => (r.id === selected.id ? nextRow : r)));

            setSelectedId(selected.id);

            setIsQuickEditOpen(false);
        } catch (e: any) {
            console.error("Update Failed:", e);
            setUpdateError(e?.message ?? "Update Failed.");
        } finally {
            setIsUpdating(false);
        }
    }

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

                <button className = "rounded-lg bg-black border px-4 py-2 text-sm text-white hover:opacity-90" onClick = {() => setIsCreateOpen(true)}>
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

            {isLoading? (
                <div className = "mt-6 rounded-xl border bg-white p-6 text-sm text-gray-700">
                    Loading applications . . .
                </div>
            ) : allRows.length === 0 ? (
                <div className = "mt-6 rounded-xl border bg-white p-6">
                    <div className = "text-sm font-medium text-gray-900">
                        No applications yet.
                    </div>
                    <div className = "mt-1 text-sm text-gray-600">
                        Add your first aplication to start tracking your pipeline.
                    </div>

                    <button type = "button" className = "mt-4 rounded-lg bg-black px-4 py-2 text-sm text-white hover:opacity-90" onClick = {() => setIsCreateOpen(true)}>
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
                                const isSelected = row.id === selectedId;

                                return (
                                    <tr key = {row.id} className={[
                                        "border-t hover:bg-gray-50 cursor-pointer",
                                        isSelected ? "bg-gray-50" : "",
                                    ].join(" ")}
                                    onClick={() => setSelectedId(row.id)}
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
                                <div className="text-lg font-semibold text-gray-900">{selected.role_title}</div>
                            </div>

                            <button
                                className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50 text-gray-900"
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
                                    <div className="font-bold text-gray-700 underline">Next action</div>

                                
                                    {selected.next_action_label ? (
                                        <div className = "mt-2 w-full text-left text-sm font-medium text-gray-900">{selected.next_action_label}</div>
                                    ) : (
                                        <div className = "mt-2 w-full text-left text-sm italic text-gray-500">No next action set</div>
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
                                <div className="font-bold text-gray-700 underline">Last touch</div>
                                <div className="font-medium text-gray-900">
                                {selected.last_touch_at ? formatDateShort(new Date(selected.last_touch_at)) : "—"}
                                </div>
                            </div>
                            <div className="flex justify-between gap-4">
                                <div className="font-bold text-gray-700 underline">Applied</div>
                                <div className="font-medium text-gray-900">{selected.applied_at ?? "—"}</div>
                            </div>
                            <div className="flex justify-between gap-4">
                                <div className="font-bold text-gray-700 underline">Location / Mode</div>
                                <div className="font-medium text-gray-900">
                                {[selected.location, selected.work_mode].filter(Boolean).join(" • ") || "—"}
                                </div>
                            </div>
                        </div>

                        <div className="mt-5">
                            <div className="text-sm font-bold text-gray-900 underline">Notes</div>

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
                            <Link href = {`/applications/${selected.id}`} className = "flex-1 rounded-lg bg-black px-3 py-2 text-center text-sm text-white hover:opacity-90">
                                Open Details
                            </Link>
                            <button 
                                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 text-gray-900"
                                onClick = {() => openQuickEdit(selected)}
                            >
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

            {isCreateOpen ? (
                <>
                    <div
                        className = "fixed inset-0 bg-black/30"
                        onClick = {() => setIsCreateOpen(false)}
                        aria-hidden = "true"
                    />

                    <aside className = "fixed right-0 top-0 h-full w-[520px] max-w-[95vw] border-l bg-white shadow-xl">
                        <div className = "h-full overflow-y-auto p-5">
                            <div className = "flex items-start justify-between gap-3">
                                <div>
                                    <div className = "text-sm text-gray-900">Create</div>
                                    <div className = "text-lg font-semibold text-gray-900">New Application</div>
                                </div>

                                <button className = "rounded-lg border px-3 py-1 text-sm hover:bg-gray-50 text-gray-900" onClick = {() => setIsCreateOpen(false)} aria-label = "Close" title = "Close">
                                    Close
                                </button>
                            </div>

                            <div className = "mt-5 space-y-4 text-sm">
                                <div>
                                    <div className = "font-medium text-gray-700">Company</div>
                                    <input 
                                        className = "mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 placeholder:text-gray-400"
                                        value = {newApp.company_name}
                                        onChange = {(e) => setNewApp((p) => ({ ...p, company_name: e.target.value }))}
                                        placeholder = "e.g., Google"
                                    />
                                </div>

                                <div>
                                    <div className = "font-medium text-gray-700">Role</div>
                                    <input 
                                        className = "mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 placeholder:text-gray-400"
                                        value = {newApp.role_title}
                                        onChange = {(e) => setNewApp((p) => ({ ...p, role_title: e.target.value }))}
                                        placeholder = "e.g., Entry Level Software Engineer"
                                    />
                                </div>

                                <div className = "grid grid-cols-2 gap-3">
                                    <div>
                                        <div className = "font-medium text-gray-700">Status</div>
                                        <select 
                                            className = "mt-1 w-full rounded-lg border px-3 py-2 text-gray-900"
                                            onChange = {(e) => setNewApp((p) => ({ ...p, status: e.target.value as ApplicationStatus }))}
                                        >
                                            <option value = "draft">Draft</option>
                                            <option value = "applied">Applied</option>
                                            <option value = "screen">Screen</option>
                                            <option value = "interview">Interview</option>
                                            <option value = "offer">Offer</option>
                                            <option value = "rejected">Rejected</option>
                                            <option value = "withdrawn">Withdrawn</option>
                                            <option value = "ghosted">Ghosted</option>
                                        </select>
                                    </div>

                                    <div>
                                        <div className = "font-medium text-gray-700">Priority (1 Highest - 5 Lowest)</div>
                                        <input 
                                            type = "number"
                                            min = {1}
                                            max = {5}
                                            className = "mt-1 w-full rounded-lg border px-3 py-2 text-gray-900"
                                            value = {newApp.priority}
                                            onChange = {(e) => setNewApp((p) => ({ ...p, priority: Number(e.target.value) }))}
                                        />
                                    </div>
                                </div>

                                <div className = "grid grid-cols-2 gap-3">
                                    <div>
                                        <div className = "font-medium text-gray-700">Applied Date</div>
                                        <input 
                                            type = "date"
                                            className = "mt-1 w-full rounded-lg border px-3 py-2 text-gray-900"
                                            value = {newApp.applied_at}
                                            onChange = {(e) => setNewApp((p) => ({ ...p, applied_at: e.target.value }))}
                                        />
                                    </div>

                                    <div>
                                        <div className = "font-medium text-gray-700">Next Action date/time</div>
                                        <input 
                                            type = "datetime-local"
                                            className = "mt-1 w-full rounded-lg border px-3 py-2 text-gray-900"
                                            onChange = {(e) => setNewApp((p) => ({ ...p, next_action_at: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className = "font-medium text-gray-700">Next action (what)</div>
                                    <input
                                        className = "mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 placeholder:text-gray-400"
                                        value = {newApp.next_action_label}
                                        onChange = {(e) => setNewApp((p) => ({ ...p, next_action_label: e.target.value }))}
                                        placeholder = "e.g., Recruiter screen / Follow up email"
                                    />
                                </div>

                                <div>
                                    <div>
                                        <div className = "font-medium text-gray-700">Location</div>
                                        <input
                                            className = "mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 placeholder:text-gray-400"
                                            value = {newApp.location}
                                            onChange = {(e) => setNewApp((p) => ({ ...p, location: e.target.value}))}
                                            placeholder = "e.g., Dallas, TX"
                                        />
                                    </div>

                                    <div>
                                        <div className = "font-medium text-gray-700">Work Mode</div>
                                        <select
                                            className = "mt-1 w-full rounded-lg border px-3 py-2 text-gray-900"
                                            value = {newApp.work_mode}
                                            onChange = {(e) => setNewApp((p)=> ({ ...p, work_mode: e.target.value}))}
                                        >
                                            <option value="">—</option>
                                            <option value="remote">Remote</option>
                                            <option value="hybrid">Hybrid</option>
                                            <option value="onsite">Onsite</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <div className = "font-medium text-gray-700">Notes</div>
                                    <textarea
                                        className = "mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 placeholder:text-gray-400"
                                        rows = {5}
                                        value = { newApp.notes }
                                        onChange = {(e) => setNewApp((p) => ({ ...p, notes: e.target.value}))}
                                        placeholder = "Add any key details..."
                                    />
                                </div>
                            </div>

                            <div className = "mt-6 flex gap-2">
                                <button
                                    className = "flex-1 rounded-lg bg-black px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
                                    disabled = { isSaving || !newApp.company_name.trim() || !newApp.role_title.trim() }
                                    onClick = { async() => {
                                        if (isSaving) return;

                                        setIsSaving(true);

                                        try {
                                            const company = newApp.company_name.trim();
                                            const role = newApp.role_title.trim();

                                            const appl_info = {
                                                company_name: company,
                                                company_name_lc: company.toLowerCase(),
                                                role_title: role,
                                                status: newApp.status,
                                                priority: Math.min(5, Math.max(1, newApp.priority || 3)),
                                                applied_at: newApp.applied_at ? newApp.applied_at : null,
                                                last_touch_at: null,
                                                next_action_at: newApp.next_action_at ? newApp.next_action_at : null,
                                                next_action_label: newApp.next_action_label.trim() || null,
                                                location: newApp.location.trim() || null,
                                                work_mode: newApp.work_mode || null,
                                                notes: newApp.notes.trim() || null,
                                            };

                                            const ref = await addDoc(collection(db, "applications"), appl_info);

                                            const newRow: ApplicationRow = {
                                                id: ref.id,
                                                company_name: appl_info.company_name,
                                                role_title: appl_info.role_title,
                                                status: appl_info.status,
                                                priority: appl_info.priority,
                                                applied_at: appl_info.applied_at,
                                                last_touch_at: appl_info.last_touch_at,
                                                next_action_at: appl_info.next_action_at,
                                                next_action_label: appl_info.next_action_label,
                                                location: appl_info.location,
                                                work_mode: appl_info.work_mode,
                                                notes: appl_info.notes,
                                            };

                                            setAllRows((prev) => [newRow, ...prev]);
                                            setIsCreateOpen(false);
                                            setNewApp(INITIAL_NEW_APP);
                                        } catch (e) {
                                            console.error("Create failed:", e);
                                            alert(`Create failed. Check console.\n\n${String(e)}`)
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }}
                                >
                                    {isSaving ? "Saving . . ." : "Create"}
                                </button>

                                <button
                                    className = "rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 text-gray-900"
                                    onClick = {() => {
                                        setIsCreateOpen(false);
                                        setNewApp(INITIAL_NEW_APP);
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                            <div className = "mt-4 text-xs text-gray-700">
                                Tip: Fill Company + Role to enable Create
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

            {isQuickEditOpen && selected ? (
                <>
                    {/* Backdrop */}
                    <div
                        className = "fixed inset-0 bg-black/30"
                        onClick = {() => {
                            if (!isUpdating) setIsQuickEditOpen(false);
                        }}

                        aria-hidden = "true"
                    />

                    {/* Sliding Pannel */}
                    <aside className = "fixed right-0 top-0 h-full w-[520px] max-w-[95vw] border-1 bg-white shadow-xl">
                        <div className = "h-full overflow-y-auto p-5">
                            <div className = "flex items-start justify-between gap-3">
                                <div>
                                    <div className = "text-sm text-gray-900">Quick Edit</div>
                                    <div className = "text-lg font-semibold text-gray-900">
                                        {selected.company_name} — {selected.role_title}
                                    </div>
                                </div>

                                <button
                                    className = "rounded-lg border px-3 py-1 text-sm hover:bg-gray-50 text-gray-900 disabled:opacity-50"
                                    onClick = {() => setIsQuickEditOpen(false)}
                                    disabled = {isUpdating}
                                    aria-label = "Close"
                                    title = "Close"
                                >
                                    Close
                                </button>
                            </div>

                            <div className = "mt-5 space-y-4 text-sm">
                                <div>
                                    <div className = "font-bold text-gray-900 underline">Company</div>
                                    <input
                                        className = "mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 placeholder:text-gray-400"
                                        value = {editForm.company_name}
                                        onChange = {(e) =>
                                            setEditForm((p) => ({ ...p, company_name: e.target.value }))
                                        }
                                        placeholder = "e.g., Google"
                                    />
                                </div>

                                <div>
                                    <div className = "font-bold text-gray-900 underline">Role</div>
                                    <input
                                        className = "mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 placeholder:text-gray-400"
                                        value = {editForm.role_title}
                                        onChange = {(e) =>
                                            setEditForm((p) => ({ ...p, role_title: e.target.value }))
                                        }
                                        placeholder = "e.g., Entry Level Software Engineer"
                                    />
                                </div>

                                <div className = "grid grid-col-2 gap-3">
                                    <div>
                                        <div className = "font-bold text-gray-900 underline">Status</div>
                                        <select
                                            className = "mt-1 w-full rounded-lg border px-3 py-2 text-gray-900"
                                            value = {editForm.status}
                                            onChange = {(e) => 
                                                setEditForm((p) => ({ ...p, status: e.target.value as ApplicationStatus }))
                                            }
                                        >
                                            <option value = "draft">Draft</option>
                                            <option value = "applied">Applied</option>
                                            <option value = "screen">Screen</option>
                                            <option value = "interview">Interview</option>
                                            <option value = "offer">Offer</option>
                                            <option value = "rejected">Rejected</option>
                                            <option value = "withdrawn">Withdrawn</option>
                                            <option value = "ghosted">Ghosted</option>
                                        </select>
                                    </div>

                                    <div>
                                        <div className = "font-bold text-gray-900 underline">Priority (1 Highest - 5 Lowest)</div>
                                        <input
                                            type = "number"
                                            min = {1}
                                            max = {5}
                                            className = "mt-1 w-full rounded-lg border px-3 py-2 text-gray-900"
                                            value = {editForm.priority}
                                            onChange = {(e) =>
                                                setEditForm((p) => ({ ...p, priority: Number(e.target.value), }))
                                            }
                                        />
                                    </div>
                                </div>

                                <div className = "grid grid-col-2 gap-3">
                                    <div>
                                        <div className = "font-bold text-gray-900 underline">Applied Date</div>
                                        <input
                                            type = "date"
                                            className = "mt-1 w-full rounded-lg border px-3 py-2 text-gray-900"
                                            value = {editForm.applied_at}
                                            onChange = {(e) => 
                                                setEditForm((p) => ({ ...p, applied_at: e.target.value }))
                                            }
                                        />
                                    </div>

                                    <div>
                                        <div className = "font-bold text-gray-900 underline">Next Action Date/Time</div>
                                        <input
                                            type = "datetime-local"
                                            className = "mt-1 w-full rounded-lg border px-3 py-2 text-gray-900"
                                            value = {editForm.next_action_at}
                                            onChange = {(e) =>
                                                setEditForm((p) => ({ ...p, next_action_at: e.target.value }))
                                            }
                                        />
                                    </div>
                                </div>

                                <div >
                                    <div className = "font-bold text-gray-900 underline">Next Action</div>
                                    <input
                                        className = "mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 placeholder:text-gray-400"
                                        value = {editForm.next_action_label}
                                        onChange = {(e) =>
                                            setEditForm((p) => ({ ...p, next_action_label: e.target.value }))
                                        }
                                        placeholder = "e.g., Recruiter screen / Follow-Up Email"
                                    />
                                </div>

                                <div>
                                    <div className = "font-bold text-gray-900 underline">Last Touch (date)</div>
                                    <input
                                        type = "date"
                                        className = "mt-1 w-full rounded-lg border px-3 py-2 text-gray-900"
                                        value = {editForm.last_touch_at}
                                        onChange = {(e) => 
                                            setEditForm((p) => ({ ...p, last_touch_at: e.target.value }))
                                        }
                                    />
                                    <div className = "mt-1 text-xs text-gray-500">
                                        Optional — set this when you email, screen, or interview
                                    </div>
                                </div>

                                <div>
                                    <div className = "font-bold text-gray-900 underline">Location</div>
                                    <input
                                        className = "mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 placeholder:text-gray-400"
                                        value = {editForm.location}
                                        onChange = {(e) =>
                                            setEditForm((p) => ({ ...p, location: e.target.value }))
                                        }
                                        placeholder = "e.g, Dallas, TX"
                                    />
                                </div>

                                <div>
                                    <div className = "font-bold text-gray-900 underline">Work Mode</div>
                                    <select
                                        className="mt-1 w-full rounded-lg border px-3 py-2 text-gray-900"
                                        value={editForm.work_mode}
                                        onChange={(e) =>
                                            setEditForm((p) => ({ ...p, work_mode: e.target.value }))
                                        }
                                    >
                                        <option value="">—</option>
                                        <option value="remote">Remote</option>
                                        <option value="hybrid">Hybrid</option>
                                        <option value="onsite">Onsite</option>
                                    </select>
                                </div>

                                <div>
                                    <div className = "font-bold text-gray-900 underline">Notes</div>
                                    <textarea
                                        className = "mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 placeholder:text-gray-400"
                                        value = {editForm.notes}
                                        onChange = {(e) =>
                                            setEditForm((p) => ({ ...p, notes: e.target.value }))
                                        }
                                        placeholder = "Add any key details . . ."
                                    />
                                </div>

                                {updateError ? (
                                    <div className = "rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                        {updateError}
                                    </div>
                                ) : null }
                            </div>
                            
                            {/* Dirty State Hit */}
                            <div className="mt-3 text-xs text-gray-600">
                                {shallowEqual(editInitial, editForm)
                                    ? "No changes to save."
                                    : "Changes ready to save."}
                            </div>

                            <div className = "mt-6 flex gap-2">
                                <button
                                    className = "rounded-lg border px-3 py-2 text-sm hover:opacity-gray-50 text-gray-900 disabled:opacity-50"
                                    onClick = {() => setIsQuickEditOpen(false)}
                                    disabled = {isUpdating}
                                >
                                    Cancel
                                </button>

                                <button
                                    className = "flex-1 rounded-lg bg-black px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
                                    disabled = {
                                        isUpdating ||
                                        shallowEqual(editInitial, editForm) ||
                                        !editForm.company_name.trim() ||
                                        !editForm.role_title.trim()
                                    }
                                    onClick = {saveQuickEdit}
                                >
                                    {isUpdating ? "Saving . . ." : "Save"}
                                </button>
                            </div>

                            <div className = "mt-4 text-xs text-gray-700">
                                Tip: press{" "}
                                <span className = "rounded border bg-gray-50 px-1 py-0.5">Esc</span> to close.
                            </div>
                        </div>
                    </aside>

                    {/* Slide-in animation (same as your other drawers) */}
                    <style jsx global> {`
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