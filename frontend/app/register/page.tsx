"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, Lock, Mail, User, UserPlus, Eye, EyeOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { authClient } from "@/src/lib/auth-client";
import { GraphPaper } from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/GraphPaper";
import { SketchButton } from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/SketchButton";
import { SquiggleFilter } from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/SquiggleFilter";
import { AskMyNotesLogo } from "@/src/components/AskMyNotesLogo";

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type RegisterFieldErrors = Partial<Record<keyof RegisterFormData, string>>;

interface SketchyInputProps {
  icon: LucideIcon;
  type: "text" | "email" | "password";
  name: keyof RegisterFormData;
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
          className="absolute inset-0 top-1 left-1 -z-10 h-full w-full rounded-lg bg-blue-100 opacity-0 transition-opacity group-focus-within:opacity-100"
          style={{ filter: "url(#squiggle)" }}
        />

        <div className="relative z-10 flex items-center px-4 py-3">
          <Icon
            className={cn(
              "w-5 h-5 mr-3 transition-colors",
              error ? "text-red-500" : "text-slate-400 group-focus-within:text-blue-600"
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

import { useRegisterStore } from "@/src/store/useRegisterStore";
import { useAuth } from "@/src/contexts/AuthContext";

export default function RegisterPage(): React.ReactElement | null {
  const router = useRouter();
  const { user, isLoading, refetchSession } = useAuth();

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
    setServerError,
    successMessage,
    setSuccessMessage
  } = useRegisterStore();

  const [showResend, setShowResend] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && user) {
      router.replace("/study");
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return null;
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

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const validate = (): boolean => {
    const nextErrors: RegisterFieldErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Name is required.";
    } else if (formData.name.trim().length < 3) {
      nextErrors.name = "Name must be at least 3 characters.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      nextErrors.email = "Please enter a valid email.";
    }

    if (!formData.password) {
      nextErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    if (formData.confirmPassword !== formData.password) {
      nextErrors.confirmPassword = "Passwords do not match.";
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
    setSuccessMessage("");

    try {
      const result = await authClient.signUp.email({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        callbackURL: `${window.location.origin}/study`
      });

      if (result.error) {
        if (result.error.message?.toLowerCase().includes("already exists")) {
          setShowResend(true);
        }
        setServerError(result.error.message ?? "Registration failed.");
        return;
      }

      if (result.data?.token) {
        await refetchSession();
        router.replace("/study");
        router.refresh();
        return;
      }

      setSuccessMessage("Account created. Check your email to verify your account, then log in.");
    } catch {
      setServerError("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    setIsSubmitting(true);
    setServerError("");
    setSuccessMessage("");
    try {
      const result = await authClient.sendVerificationEmail({
        email: formData.email.trim().toLowerCase(),
        callbackURL: `${window.location.origin}/study`
      });

      if (result.error) {
        setServerError(result.error.message || "Failed to resend email.");
      } else {
        setSuccessMessage("Verification email resent! Please check your inbox.");
        setShowResend(false);
      }
    } catch {
      setServerError("Failed to resend email. Please try again.");
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
          href="/login"
          className="rounded border-2 border-slate-900 bg-white px-4 py-2 font-bold text-xs uppercase tracking-widest hover:bg-pink-100 transition-colors"
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

        <div className="relative group">
          <div className="absolute inset-0 bg-slate-900 rounded-lg translate-x-2 translate-y-3" style={{ filter: "url(#squiggle)" }} />

          <div className="relative bg-white border-3 border-slate-900 p-8 md:p-10 rounded-lg" style={{ filter: "url(#squiggle)" }}>
            <div className="absolute -top-4 left-1/2 h-8 w-32 -translate-x-1/2 bg-white/60 shadow-[0_1px_3px_rgba(0,0,0,0.1)] rotate-2 border border-slate-200 backdrop-blur-sm" />

            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 inline-block relative">
                Join the Class
                <svg className="absolute -bottom-3 left-0 w-full h-4 overflow-visible text-blue-500" style={{ filter: "url(#squiggle)" }}>
                  <path d="M -5 10 Q 50 0 105 10" fill="none" stroke="currentColor" strokeWidth="4" />
                </svg>
              </h1>
              <p className="mt-4 text-slate-500 font-medium">Create your study notes account.</p>
            </div>

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

              {serverError ? (
                <div className="rounded border-2 border-red-400 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 flex flex-col gap-2">
                  <span>{serverError}</span>
                  {showResend && (
                    <button
                      type="button"
                      onClick={handleResendEmail}
                      disabled={isSubmitting}
                      className="underline text-red-900 hover:text-red-700 font-bold self-start mt-1 disabled:opacity-50"
                    >
                      Resend Verification Email
                    </button>
                  )}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded border-2 border-green-400 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                  {successMessage}
                </div>
              ) : null}

              <div className="mt-3 w-full">
                <SketchButton type="submit" disabled={isSubmitting || isGoogleSubmitting} className="w-full flex justify-center py-4 text-lg">
                  {isSubmitting ? "Creating account..." : "Create Account"}
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
              Already enrolled?{" "}
              <Link
                href="/login"
                className="font-bold text-blue-600 hover:text-blue-700 decoration-wavy hover:underline underline-offset-4 pointer-events-auto"
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
