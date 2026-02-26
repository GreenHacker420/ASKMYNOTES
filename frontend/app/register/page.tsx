"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, AlertCircle, UserPlus } from "lucide-react";
import { SquiggleFilter, GraphPaper, SketchButton } from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/Sketchy";
import Link from "next/link";
import { cn } from "@/src/lib/utils";

// --- Sketchy Input Component ---
function SketchyInput({
    icon: Icon,
    type,
    name,
    placeholder,
    value,
    onChange,
    error,
}: any) {
    return (
        <div className="flex flex-col gap-1 mb-3 w-full">
            <div className="relative group w-full">
                {/* The border with SVG filter for the hand-drawn look */}
                <div className="absolute inset-0 h-full w-full pointer-events-none" style={{ filter: "url(#squiggle)" }}>
                    <svg className="h-full w-full overflow-visible">
                        <rect
                            x="2" y="2"
                            width="100%" height="100%"
                            rx="6"
                            fill="white"
                            stroke={error ? "#ef4444" : "#1e293b"}
                            strokeWidth="2.5"
                            className="transition-colors duration-300"
                        />
                    </svg>
                </div>

                {/* Subtle hover/focus background effect */}
                <div className="absolute inset-0 top-1 left-1 -z-10 h-full w-full rounded-lg bg-blue-100 opacity-0 transition-opacity group-focus-within:opacity-100" style={{ filter: "url(#squiggle)" }} />

                <div className="relative z-10 flex items-center px-4 py-3">
                    <Icon className={cn("w-5 h-5 mr-3 transition-colors", error ? "text-red-500" : "text-slate-400 group-focus-within:text-blue-600")} />
                    <input
                        type={type}
                        name={name}
                        placeholder={placeholder}
                        value={value}
                        onChange={onChange}
                        className="w-full bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 font-medium md:text-lg"
                    />
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -5, rotate: -2 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    className="flex items-center gap-1 text-red-500 text-sm font-bold ml-2 mt-1"
                >
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </motion.div>
            )}
        </div>
    );
}

// --- Main Register Page ---
export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle Form Change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Clear the error for the relevant field when typing
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: "" });
        }
    };

    // Validation Logic
    const validate = () => {
        let newErrors: any = {};
        if (!formData.name.trim()) newErrors.name = "We need a name for your notes!";
        else if (formData.name.length < 3) newErrors.name = "Name must be at least 3 characters.";

        if (!formData.email.trim()) newErrors.email = "Email is required.";
        else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Hmm, that email doesn't look valid.";

        if (!formData.password) newErrors.password = "Don't forget your secure password.";
        else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters.";

        if (formData.confirmPassword !== formData.password) {
            newErrors.confirmPassword = "Oops, passwords don't match.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit Handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            setIsSubmitting(true);
            // Simulate API call for now
            setTimeout(() => {
                setIsSubmitting(false);
                alert("Registered successfully! (Mock API Call)");
            }, 1500);
        }
    };

    return (
        <main className="relative min-h-screen w-full text-slate-800 overflow-x-hidden font-sans selection:bg-yellow-300 selection:text-black flex items-center justify-center p-4">
            {/* Required filters & backgrounds from the design language */}
            <SquiggleFilter />
            <GraphPaper />

            {/* Navbar (Kept minimal for Auth pages) */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 backdrop-blur-sm">
                <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tighter hover:scale-105 transition-transform">
                    <div className="h-8 w-8 rounded border-2 border-slate-900 bg-slate-800" />
                    AskMyNotes.
                </Link>
                <Link
                    href="/login"
                    className="rounded border-2 border-slate-900 bg-white px-4 py-2 font-bold text-xs uppercase tracking-widest hover:bg-pink-100 transition-colors"
                    style={{ filter: "url(#squiggle)" }}
                >
                    Log In
                </Link>
            </nav>

            {/* Auth Card Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative w-full max-w-md mt-16 z-10"
            >
                {/* Floating background doodles */}
                <motion.div
                    animate={{ y: [0, -10, 0], rotate: [-10, -5, -10] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute -top-12 -left-12 opacity-80 pointer-events-none"
                >
                    <UserPlus size={64} className="text-blue-500" strokeWidth={1.5} />
                </motion.div>

                <motion.div
                    animate={{ scale: [1, 1.1, 1], rotate: [10, 15, 10] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                    className="absolute -bottom-8 -right-4 opacity-80 pointer-events-none"
                >
                    <svg className="w-24 h-24 text-yellow-400" viewBox="0 0 100 100" style={{ filter: "url(#squiggle)" }}>
                        <path d="M 20 80 Q 50 10 80 80" fill="transparent" stroke="currentColor" strokeWidth="4" />
                        <path d="M 30 50 L 70 50" fill="transparent" stroke="currentColor" strokeWidth="4" />
                    </svg>
                </motion.div>

                {/* The sketch card */}
                <div className="relative group">
                    {/* Card Shadow/Offset */}
                    <div className="absolute inset-0 bg-slate-900 rounded-lg translate-x-2 translate-y-3" style={{ filter: "url(#squiggle)" }} />

                    <div
                        className="relative bg-white border-3 border-slate-900 p-8 md:p-10 rounded-lg"
                        style={{ filter: "url(#squiggle)" }}
                    >
                        {/* Cellotape detail */}
                        <div className="absolute -top-4 left-1/2 h-8 w-32 -translate-x-1/2 bg-white/60 shadow-[0_1px_3px_rgba(0,0,0,0.1)] rotate-2 border border-slate-200 backdrop-blur-sm" />

                        {/* Header */}
                        <div className="text-center mb-10">
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 inline-block relative">
                                Join the Class
                                {/* Hand-drawn underline */}
                                <svg className="absolute -bottom-3 left-0 w-full h-4 overflow-visible text-blue-500" style={{ filter: "url(#squiggle)" }}>
                                    <path d="M -5 10 Q 50 0 105 10" fill="none" stroke="currentColor" strokeWidth="4" />
                                </svg>
                            </h1>
                            <p className="mt-4 text-slate-500 font-medium">Create your study notes account.</p>
                        </div>

                        {/* Registration Form */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-2 relative z-10">
                            <SketchyInput
                                icon={User}
                                type="text"
                                name="name"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                                error={errors.name}
                            />

                            <SketchyInput
                                icon={Mail}
                                type="email"
                                name="email"
                                placeholder="Student Email"
                                value={formData.email}
                                onChange={handleChange}
                                error={errors.email}
                            />

                            <SketchyInput
                                icon={Lock}
                                type="password"
                                name="password"
                                placeholder="Secret Password"
                                value={formData.password}
                                onChange={handleChange}
                                error={errors.password}
                            />

                            <SketchyInput
                                icon={Lock}
                                type="password"
                                name="confirmPassword"
                                placeholder="Repeat Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                error={errors.confirmPassword}
                            />

                            <div className="mt-6 w-full" onClick={handleSubmit}>
                                <SketchButton className="w-full flex justify-center py-4 text-lg">
                                    {isSubmitting ? "Enrolling..." : "Create Account"}
                                </SketchButton>
                            </div>
                        </form>

                        {/* Footer Link */}
                        <div className="mt-8 text-center text-sm font-medium text-slate-600">
                            Already enrolled?{" "}
                            <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700 decoration-wavy hover:underline underline-offset-4 pointer-events-auto">
                                Log in here.
                            </Link>
                        </div>

                    </div>
                </div>
            </motion.div>
        </main>
    );
}
