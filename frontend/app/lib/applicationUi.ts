import type { ApplicationStatus } from "../applications/data";

/* ---------- Types ---------- */

export type Tone = 
    | "gray"
    | "blue"
    | "green"
    | "yellow"
    | "red"
    | "purple";

/* ---------- Centralized Metadata ---------- */

const  STATUS_META: Record<
    ApplicationStatus,
    { label: string; tone: Tone }
> = {
    draft: { label: "Draft", tone: "gray" },
    applied: { label: "Applied", tone: "blue" },
    screen: { label: "Screen", tone: "purple" },
    interview: { label: "Interview", tone: "yellow" },
    offer: { label: "Offer", tone: "green" },
    rejected: { label: "Rejected", tone: "red" },
    withdrawn: { label: "Withdrawn", tone: "gray" },
    ghosted: { label: "Ghosted", tone: "gray" },
};

const PRIORITY_META: Record<
    number,
    { label: string; tone: Tone }
> = {
    1: { label: "Low", tone: "gray" },
    2: { label: "Medium", tone: "yellow" },
    3: { label: "High", tone: "red" },
};

/* ---------- Public Helpers ---------- */

export function statusLabel(status: ApplicationStatus) {
    return STATUS_META[status]?.label ?? "Unknown";
}

export function statusTone(status: ApplicationStatus): Tone {
    return STATUS_META[status]?.tone ?? "gray";
}

export function priorityLabel(priority: number) {
    return PRIORITY_META[priority]?.label ?? "Unknown";
}

export function priorityTone(priority: number): Tone {
    return PRIORITY_META[priority]?.tone ?? "gray";
}

/* ---------- Utilities ---------- */

export function formatDate(iso: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}