"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authClient } from "@/src/lib/auth-client";
import type { User, Session } from "better-auth";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    error: Error | null;
    refetchSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSession = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const { data, error } = await authClient.getSession();

            if (error) {
                throw new Error(error.message ?? "Failed to get session");
            }

            setUser(data?.user ?? null);
            setSession(data?.session ?? null);

            // Also store a simple flag in localStorage to help with redirect flashes
            if (data?.user) {
                localStorage.setItem("askmynotes_auth_status", "authenticated");
            } else {
                localStorage.removeItem("askmynotes_auth_status");
            }
        } catch (err) {
            console.error("Auth context error:", err);
            setUser(null);
            setSession(null);
            setError(err instanceof Error ? err : new Error(String(err)));
            localStorage.removeItem("askmynotes_auth_status");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSession();
    }, []);

    return (
        <AuthContext.Provider value={{ user, session, isLoading, error, refetchSession: fetchSession }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
