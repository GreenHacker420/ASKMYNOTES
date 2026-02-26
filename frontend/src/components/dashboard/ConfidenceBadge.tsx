"use client";

import { cn } from "@/src/lib/utils";

interface ConfidenceBadgeProps {
    level: "High" | "Medium" | "Low";
}

const CONFIG = {
    High: { bg: "bg-green-100", border: "border-green-400", text: "text-green-800", icon: "🟢" },
    Medium: { bg: "bg-amber-100", border: "border-amber-400", text: "text-amber-800", icon: "🟡" },
    Low: { bg: "bg-red-100", border: "border-red-400", text: "text-red-800", icon: "🔴" },
} as const;

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
    const c = CONFIG[level];
    return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-bold uppercase tracking-wider", c.bg, c.border, c.text)}>
            <span>{c.icon}</span>
            {level}
        </span>
    );
}
