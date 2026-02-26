"use client";

import React, { createContext, useContext } from "react";
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
  const {
    data,
    isPending,
    error,
    refetch
  } = authClient.useSession();

  return (
    <AuthContext.Provider
      value={{
        user: data?.user ?? null,
        session: data?.session ?? null,
        isLoading: isPending,
        error: error ? new Error(error.message ?? "Failed to get session") : null,
        refetchSession: refetch
      }}
    >
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
