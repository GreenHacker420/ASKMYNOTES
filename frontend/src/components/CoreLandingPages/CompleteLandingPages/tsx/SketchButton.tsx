"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/src/lib/utils";

// Hand-drawn style button with SVG border and hover highlight
export function SketchButton({
    children,
    className,
    type = "button",
    ...buttonProps
}: HTMLMotionProps<"button">) {
    const content = children as React.ReactNode;

    return (
        <motion.button
            type={type}
            whileHover={{ scale: 1.05, rotate: -1 }}
            whileTap={{ scale: 0.95, rotate: 1 }}
            className={cn(
                "relative px-8 py-3 font-bold text-slate-800 transition-colors group",
                buttonProps.disabled ? "opacity-60 cursor-not-allowed" : "",
                className
            )}
            {...buttonProps}
        >
            {/* The Button Border (SVG for perfect stroke control) */}
            <div className="absolute inset-0 h-full w-full" style={{ filter: "url(#squiggle)" }}>
                <svg className="h-full w-full overflow-visible">
                    <rect
                        x="2"
                        y="2"
                        width="100%"
                        height="100%"
                        rx="8"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-slate-800"
                    />
                </svg>
            </div>

            {/* Background Fill (Offset) */}
            <div
                className="absolute inset-0 top-1 left-1 -z-10 h-full w-full rounded-lg bg-yellow-300 opacity-0 transition-opacity group-hover:opacity-100"
                style={{ filter: "url(#squiggle)" }}
            />

            <span className="relative z-10 flex items-center gap-2">{content}</span>
        </motion.button>
    );
}
