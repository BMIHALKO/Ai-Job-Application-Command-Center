"use client";

import type { ApplicationStatus } from "./data";

export type ApplicationFilters = {
    search: string;
    status: ApplicationStatus | "all";
    priority: number | "all";
    workMode: string | "all";
};

type FilterBarProps = {
    filters: ApplicationFilters;
    onChange: (next: ApplicationFilters) => void;
    onReset?: () => void;
};

const STATUS_OPTIONS: Array<ApplicationStatus | "all"> = [
    "all",
    "draft",
    "applied",
    "screen",
    "interview",
    "offer",
    "rejected",
    "withdrawn",
    "ghosted",
];

const PRIORITY_OPTIONS: Array<number | "all"> = ["all", 1, 2, 3, 4, 5];
const WORKMODE_OPTIONS: Array<string | "all"> = ["all", "Remote", "Hybrid", "On-site"];

export default function FilterBar({ filters, onChange, onReset }: FilterBarProps) {
    return (
        <div
            style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 12,
            }}
        >
            {/* Search */}
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Search</span>
                <input
                type="text"
                value={filters.search}
                placeholder="Company or role..."
                onChange={(e) => onChange({ ...filters, search: e.target.value })}
                style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ccc", minWidth: 220 }}
                />
            </label>

            {/* Status */}
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Status</span>
                <select
                value={filters.status}
                onChange={(e) => onChange({ ...filters, status: e.target.value as ApplicationFilters["status"] })}
                style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ccc" }}
                >
                {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                    {s === "all" ? "All" : s}
                    </option>
                ))}
                </select>
            </label>

            {/* Priority */}
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Priority</span>
                <select
                value={filters.priority}
                onChange={(e) =>
                    onChange({
                    ...filters,
                    priority: e.target.value === "all" ? "all" : Number(e.target.value),
                    })
                }
                style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ccc" }}
                >
                {PRIORITY_OPTIONS.map((p) => (
                    <option key={String(p)} value={String(p)}>
                    {p === "all" ? "All" : p}
                    </option>
                ))}
                </select>
            </label>

            {/* Work mode */}
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Work Mode</span>
                <select
                value={filters.workMode}
                onChange={(e) => onChange({ ...filters, workMode: e.target.value })}
                style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ccc" }}
                >
                {WORKMODE_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                    {m === "all" ? "All" : m}
                    </option>
                ))}
                </select>
            </label>

            {/* Reset */}
            <button
                type="button"
                onClick={() => (onReset ? onReset() : onChange({ search: "", status: "all", priority: "all", workMode: "all" }))}
                style={{
                color: "#1a1a1aff",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #ccc",
                background: "white",
                cursor: "pointer",
                marginTop: 18, // aligns with inputs since labels have titles
                }}
            >
                Reset
            </button>
        </div>
    )
}