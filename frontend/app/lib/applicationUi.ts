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

function getUserTimeZone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function formatTimeInTZ(d: Date, timeZone: string) {
    return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        timeZone,
    }).format(d);
}

function formatDateShortInTZ(d: Date, timeZone: string) {
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        timeZone,
    }).format(d);
}

export function formatNextAction(nextActionISO: string | null): { label: string; tone: Tone} {
    if (!nextActionISO) return { label: "—", tone: "gray" };

    const tz = getUserTimeZone();

    const now = new Date();
    const due = new Date(nextActionISO);

    const dayKey = (d: Date) =>
        new Intl.DateTimeFormat("en-CA", {
            timeZone: tz,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(d);

        const todayKey = dayKey(now);
        const dueKey = dayKey(due);

        const keyToNum = (k: string) => Number(k.replaceAll("-", ""));
        const todayNum = keyToNum(todayKey);
        const dueNum = keyToNum(dueKey);

        if (dueNum < todayNum) {
            const msPerDay = 24 * 60 * 60 * 1000;
            const overDueDays = Math.max(1, Math.round((todayNum - dueNum)));

            return { label: `Overdue • ${overDueDays}d`, tone: "red"}
        }

        if (dueNum === todayNum) {
            return {
                label: `Today at ${formatTimeInTZ(due, tz)}`,
                tone: "yellow"
            }
        }

        const tomorrow = new Date(now)
        tomorrow.setDate(now.getDate() + 1);
        const tomorrowNum = keyToNum(dayKey(tomorrow));

        if (dueNum === tomorrowNum) return { label: "Tomorrow", tone: "gray"};

        return { label: formatDateShortInTZ(due, tz), tone: "gray" };
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