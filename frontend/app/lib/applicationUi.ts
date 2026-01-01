import type { ApplicationStatus } from "../applications/data";

export function statusTone(status: ApplicationStatus) {
    switch (status) {
        case "offer":
            return "success";
        case "interview":
        case "screen":
            return "info";
        case "rejected":
            return "danger";
        case "withdrawn":
        case "ghosted":
            return "warning";
        case "applied":
        case "draft":
        default:
            return "neutral";
    }
}

export function priorityLabel(p: number) {
    if (p <= 1) return "High";
    if (p === 2) return "High";
    if (p === 3) return "Medium";
    return "Low";
}

export function priorityTone(p: number) {
    if (p <= 1) return "danger";
    if (p === 2) return "warning";
    if (p === 3) return "neutral";
    return "neutral";
}

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