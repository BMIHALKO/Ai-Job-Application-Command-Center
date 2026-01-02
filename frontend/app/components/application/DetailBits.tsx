import * as React from "react";
import type { Tone } from "../../lib/applicationUi";

export type BadgeTone = Tone;

const toneClasses: Record<BadgeTone, string> = {
    gray: "border-gray-200 bg-gray-50 text-gray-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-green-200 bg-green-50 text-green-700",
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-800",
    red: "border-red-200 bg-red-50 text-red-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
};

export function Badge({
    children,
    tone = "gray",
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
            <h2 className = "text-xs font-semibold uppercase tracking-wide text-neutral-600">{title}</h2>
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