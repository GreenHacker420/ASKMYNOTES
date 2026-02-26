"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, Lock, ShieldCheck } from "lucide-react";
import { authClient } from "@/src/lib/auth-client";
import { GraphPaper } from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/GraphPaper";
import { SketchButton } from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/SketchButton";
import { SquiggleFilter } from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/SquiggleFilter";

export default function ResetPasswordPage(): React.ReactElement {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();

        if (!password || password.length < 6) {
            setServerError("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setServerError("Passwords do not match.");
            return;
        }

        const token = searchParams.get("token");
        if (!token) {
            setServerError("Invalid or expired reset link. Please request a new one.");
            return;
        }

        setIsSubmitting(true);
        setServerError("");
        setSuccessMessage("");

        try {
            const result = await authClient.resetPassword({
                newPassword: password,
                token
            });

            if (result.error) {
                setServerError(result.error.message ?? "Reset failed.");
                return;
            }

            setSuccessMessage("Password reset successfully! Redirecting to login...");
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } catch {
            setServerError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="relative min-h-screen w-full text-slate-800 overflow-x-hidden font-sans selection:bg-yellow-300 selection:text-black flex items-center justify-center p-4">
            <SquiggleFilter />
            <GraphPaper />

            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-xl font-black tracking-tighter hover:scale-105 transition-transform"
                >
                    <div className="h-8 w-8 rounded border-2 border-slate-900 bg-slate-800" />
                    AskMyNotes.
                </Link>
                <Link
                    href="/login"
                    className="rounded border-2 border-slate-900 bg-white px-4 py-2 font-bold text-xs uppercase tracking-widest hover:bg-blue-100 transition-colors"
                    style={{ filter: "url(#squiggle)" }}
                >
                    Log In
                </Link>
            </nav>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative w-full max-w-md mt-16 z-10"
            >
                <motion.div
                    animate={{ y: [0, -10, 0], rotate: [-10, -5, -10] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute -top-12 -left-12 opacity-80 pointer-events-none"
                >
                    <ShieldCheck size={64} className="text-green-500" strokeWidth={1.5} />
                </motion.div>

                <div className="relative group">
                    <div className="absolute inset-0 bg-slate-900 rounded-lg translate-x-2 translate-y-3" style={{ filter: "url(#squiggle)" }} />

                    <div className="relative bg-white border-3 border-slate-900 p-8 md:p-10 rounded-lg" style={{ filter: "url(#squiggle)" }}>
                        <div className="absolute -top-4 left-1/2 h-8 w-32 -translate-x-1/2 bg-white/60 shadow-[0_1px_3px_rgba(0,0,0,0.1)] rotate-2 border border-slate-200 backdrop-blur-sm" />

                        <div className="text-center mb-10">
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 inline-block relative">
                                New Password
                                <svg className="absolute -bottom-3 left-0 w-full h-4 overflow-visible text-green-500" style={{ filter: "url(#squiggle)" }}>
                                    <path d="M -5 10 Q 50 0 105 10" fill="none" stroke="currentColor" strokeWidth="4" />
                                </svg>
                            </h1>
                            <p className="mt-4 text-slate-500 font-medium">Choose a new password for your account.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-2 relative z-10">
                            <div className="flex flex-col gap-1 mb-3 w-full">
                                <div className="relative group w-full">
                                    <div className="absolute inset-0 h-full w-full pointer-events-none" style={{ filter: "url(#squiggle)" }}>
                                        <svg className="h-full w-full overflow-visible">
                                            <rect x="2" y="2" width="100%" height="100%" rx="6" fill="white" stroke="#1e293b" strokeWidth="2.5" />
                                        </svg>
                                    </div>
                                    <div className="relative z-10 flex items-center px-4 py-3">
                                        <Lock className="w-5 h-5 mr-3 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                                        <input
                                            type="password"
                                            placeholder="New Password"
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value); setServerError(""); }}
                                            className="w-full bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 font-medium md:text-lg"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 mb-3 w-full">
                                <div className="relative group w-full">
                                    <div className="absolute inset-0 h-full w-full pointer-events-none" style={{ filter: "url(#squiggle)" }}>
                                        <svg className="h-full w-full overflow-visible">
                                            <rect x="2" y="2" width="100%" height="100%" rx="6" fill="white" stroke="#1e293b" strokeWidth="2.5" />
                                        </svg>
                                    </div>
                                    <div className="relative z-10 flex items-center px-4 py-3">
                                        <Lock className="w-5 h-5 mr-3 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                                        <input
                                            type="password"
                                            placeholder="Repeat New Password"
                                            value={confirmPassword}
                                            onChange={(e) => { setConfirmPassword(e.target.value); setServerError(""); }}
                                            className="w-full bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 font-medium md:text-lg"
                                        />
                                    </div>
                                </div>
                            </div>

                            {serverError ? (
                                <div className="rounded border-2 border-red-400 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 flex items-center gap-2">
                                    <AlertCircle size={14} />
                                    {serverError}
                                </div>
                            ) : null}

                            {successMessage ? (
                                <div className="rounded border-2 border-green-400 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                                    {successMessage}
                                </div>
                            ) : null}

                            <div className="mt-3 w-full">
                                <SketchButton type="submit" disabled={isSubmitting} className="w-full flex justify-center py-4 text-lg">
                                    {isSubmitting ? "Resetting..." : "Reset Password"}
                                </SketchButton>
                            </div>
                        </form>

                        <div className="mt-8 text-center text-sm font-medium text-slate-600">
                            Remember your password?{" "}
                            <Link
                                href="/login"
                                className="font-bold text-green-600 hover:text-green-700 decoration-wavy hover:underline underline-offset-4"
                            >
                                Log in here.
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </main>
    );
}
