"use client";

import { motion } from "framer-motion";
import { Scissors } from "lucide-react";
import { cn } from "@/src/lib/utils";

// A sticky note card with tape, rotation, and hover animation
export function StickyNote({
    children,
    color = "bg-yellow-200",
    rotate = 0,
    className,
}: {
    children: React.ReactNode;
    color?: string;
    rotate?: number;
    className?: string;
}) {
    return (
        <motion.div
            whileHover={{ scale: 1.1, rotate: rotate * -1, zIndex: 10 }}
            className={cn(
                "relative flex h-64 w-64 flex-col justify-between p-6 shadow-sm",
                color,
                className
            )}
            style={{
                filter: "url(#squiggle)",
                transform: `rotate(${rotate}deg)`,
            }}
        >
            {/* Tape Effect */}
            <div className="absolute -top-3 left-1/2 h-8 w-24 -translate-x-1/2 bg-white/40 shadow-sm rotate-1" />

            <div className="font-handwriting text-slate-800 text-lg leading-relaxed">
                {children}
            </div>

            <div className="self-end opacity-50">
                <Scissors size={16} />
            </div>
        </motion.div>
    );
}
