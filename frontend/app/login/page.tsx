"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, Lock, LogIn, Mail, Eye, EyeOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { authClient } from "@/src/lib/auth-client";
import { GraphPaper } from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/GraphPaper";
import { SketchButton } from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/SketchButton";
import { SquiggleFilter } from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/SquiggleFilter";
import { AskMyNotesLogo } from "@/src/components/AskMyNotesLogo";

interface LoginFormData {
  email: string;
  password: string;
}

type LoginFieldErrors = Partial<Record<keyof LoginFormData, string>>;

interface SketchyInputProps {
  icon: LucideIcon;
  type: "email" | "password";
  name: keyof LoginFormData;
  placeholder: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

function SketchyInput({
  icon: Icon,
  type,
  name,
  placeholder,
  value,
  onChange,
  error
}: SketchyInputProps): React.ReactElement {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="flex flex-col gap-1 mb-3 w-full">
      <div className="relative group w-full">
        <div className="absolute inset-0 h-full w-full pointer-events-none" style={{ filter: "url(#squiggle)" }}>
          <svg className="h-full w-full overflow-visible">
            <rect
              x="2"
              y="2"
              width="100%"
              height="100%"
              rx="6"
              fill="white"
              stroke={error ? "#ef4444" : "#1e293b"}
              strokeWidth="2.5"
              className="transition-colors duration-300"
            />
          </svg>
        </div>

        <div
          className="absolute inset-0 top-1 left-1 -z-10 h-full w-full rounded-lg bg-yellow-100 opacity-0 transition-opacity group-focus-within:opacity-100"
          style={{ filter: "url(#squiggle)" }}
        />

        <div className="relative z-10 flex items-center px-4 py-3">
          <Icon
            className={cn(
              "w-5 h-5 mr-3 transition-colors",
              error ? "text-red-500" : "text-slate-400 group-focus-within:text-yellow-600"
            )}
          />
          <input
            type={inputType}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="w-full bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 font-medium md:text-lg"
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="ml-2 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {error ? (
        <motion.div
          initial={{ opacity: 0, y: -5, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          className="flex items-center gap-1 text-red-500 text-sm font-bold ml-2 mt-1"
        >
          <AlertCircle size={14} />
          <span>{error}</span>
        </motion.div>
      ) : null}
    </div>
  );
}

import { useLoginStore } from "@/src/store/useLoginStore";
import { useAuth } from "@/src/contexts/AuthContext";

export default function LoginPage(): React.ReactElement | null {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const {
    formData,
    setFormData,
    errors,
    setErrors,
    isSubmitting,
    setIsSubmitting,
    isGoogleSubmitting,
    setIsGoogleSubmitting,
    serverError,
    setServerError
  } = useLoginStore();

  React.useEffect(() => {
    if (!isLoading && user) {
      router.push("/study");
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return null; // or a custom loader
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (name in errors) {
      setErrors((prev) => ({
        ...prev,
        [name]: ""
      }));
    }

    if (serverError) {
      setServerError("");
    }
  };

  const validate = (): boolean => {
    const nextErrors: LoginFieldErrors = {};

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      nextErrors.email = "Please enter a valid email.";
    }

    if (!formData.password) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setServerError("");

    try {
      const result = await authClient.signIn.email({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        callbackURL: `${window.location.origin}/study`
      });

      if (result.error) {
        setServerError(result.error.message ?? "Login failed.");
        return;
      }

      router.push("/study");
      router.refresh();
    } catch {
      setServerError("Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    setIsGoogleSubmitting(true);
    setServerError("");

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/study`
      });

      if (result.error) {
        setServerError(result.error.message ?? "Google sign-in failed.");
      }
    } catch {
      setServerError("Google sign-in failed. Please try again.");
    } finally {
      setIsGoogleSubmitting(false);
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
          <AskMyNotesLogo />
          AskMyNotes.
        </Link>
        <Link
          href="/register"
          className="rounded border-2 border-slate-900 bg-white px-4 py-2 font-bold text-xs uppercase tracking-widest hover:bg-blue-100 transition-colors"
          style={{ filter: "url(#squiggle)" }}
        >
          Sign Up
        </Link>
      </nav>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-md mt-16 z-10"
      >
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [5, 15, 5] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute -top-10 -right-8 opacity-80 pointer-events-none"
        >
          <LogIn size={56} className="text-yellow-500" strokeWidth={1.5} />
        </motion.div>

        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [-10, -5, -10] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-10 -left-6 opacity-80 pointer-events-none"
        >
          <svg className="w-20 h-20 text-blue-400" viewBox="0 0 100 100" style={{ filter: "url(#squiggle)" }}>
            <path d="M 50 10 L 90 90 L 10 90 Z" fill="transparent" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
          </svg>
        </motion.div>

        <div className="relative group">
          <div className="absolute inset-0 bg-slate-900 rounded-lg -translate-x-2 translate-y-3" style={{ filter: "url(#squiggle)" }} />

          <div className="relative bg-white border-3 border-slate-900 p-8 md:p-10 rounded-lg" style={{ filter: "url(#squiggle)" }}>
            <div className="absolute -top-4 right-1/4 h-8 w-28 translate-x-1/2 bg-white/60 shadow-[0_1px_3px_rgba(0,0,0,0.1)] -rotate-3 border border-slate-200 backdrop-blur-sm" />

            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 inline-block relative">
                Welcome Back
                <svg className="absolute -bottom-2 left-0 w-full h-3 overflow-visible text-yellow-500" style={{ filter: "url(#squiggle)" }}>
                  <path d="M -5 5 Q 50 10 105 5" fill="none" stroke="currentColor" strokeWidth="4" />
                </svg>
              </h1>
              <p className="mt-4 text-slate-500 font-medium">Time to hit the notes again.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-2 relative z-10">
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

              {serverError ? (
                <div className="rounded border-2 border-red-400 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {serverError}
                </div>
              ) : null}

              <div className="mt-3 w-full">
                <SketchButton type="submit" disabled={isSubmitting || isGoogleSubmitting} className="w-full flex justify-center py-4 text-lg">
                  {isSubmitting ? "Logging in..." : "Log In"}
                </SketchButton>
              </div>

              <div className="w-full">
                <SketchButton
                  type="button"
                  disabled={isSubmitting || isGoogleSubmitting}
                  onClick={handleGoogleSignIn}
                  className="w-full flex justify-center py-4 text-lg"
                >
                  {isGoogleSubmitting ? "Redirecting..." : "Continue with Google"}
                </SketchButton>
              </div>
            </form>

            <div className="mt-8 text-center text-sm font-medium text-slate-600">
              <Link
                href="/forgot-password"
                className="font-bold text-slate-500 hover:text-slate-700 decoration-wavy hover:underline underline-offset-4"
              >
                Forgot your password?
              </Link>
            </div>

            <div className="mt-3 text-center text-sm font-medium text-slate-600">
              New here?{" "}
              <Link
                href="/register"
                className="font-bold text-yellow-600 hover:text-yellow-700 decoration-wavy hover:underline underline-offset-4 pointer-events-auto"
              >
                Create an account.
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
