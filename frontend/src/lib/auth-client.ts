"use client";

import { createAuthClient } from "better-auth/react";

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export const authClient = createAuthClient({
  baseURL: backendBaseUrl
});
