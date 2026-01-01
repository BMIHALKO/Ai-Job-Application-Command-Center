import * as React from "react";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<BadgeTone, string> = {
    neutral: "bg-neutral-100 text-neutral-800 border-neutral-200",
    success: "bg-emerald-100 text-emerald-900 border-emerald-200",
    warning: "bg-amber-100 text-amber-900 border-amber-200",
    danger: "bg-rose-100 text-rose-900 border-rose-200",
    info: "bg-sky-100 text-sky-900 border-sky-200",
};

export function Badge({
    children,
    tone = "neutral",
}: {
    children: React.ReactNode;
    tone?: BadgeTone;
}) {
    return (
        <span
            className={[
                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                toneClasses[tone],
            ].join(" ")}
            >
            {children}
        </span>
    );
}

export function Section ({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className = "rounded-x1 border bg-white p-4">
            <h2 className = "text-sm font-semibold text-neutral-900">{title}</h2>
            <div className = "mt-3">{children}</div>
        </section>
    );
}

export function KV({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className = "space-y-1">
            <div className = "text-xs text-neutral-500">{label}</div>
            <div className = "text-sm text-neutral-900">{value}</div>
        </div>
    )
}