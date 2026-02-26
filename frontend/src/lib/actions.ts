"use server";

import { cookies } from "next/headers";

const DEFAULT_BACKEND_BASE_URL = "http://localhost:3001";

export const BACKEND_ROUTES = {
  health: "/health",
  ask: "/api/ask",
  authBase: "/api/auth"
} as const;

export interface AskRequestPayload {
  question: string;
  subjectId: string;
  threadId: string;
  subjectName?: string;
}

export interface Citation {
  fileName: string;
  page: number | null;
  chunkId: string;
}

export interface AskFoundResponse {
  answer: string;
  citations: Citation[];
  confidence: "High" | "Medium" | "Low";
  evidence: string[];
  found: true;
}

export type AskResponsePayload = AskFoundResponse | string;

export interface ActionResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

function normalizeBackendBaseUrl(): string {
  const raw = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_BACKEND_BASE_URL;
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

async function getCookieHeader(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  if (allCookies.length === 0) {
    return undefined;
  }

  return allCookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

async function callBackend(path: string, init: RequestInit): Promise<Response> {
  const backendUrl = `${normalizeBackendBaseUrl()}${path}`;
  const headers = new Headers(init.headers);
  const cookieHeader = await getCookieHeader();

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  return fetch(backendUrl, {
    ...init,
    headers,
    cache: "no-store"
  });
}

export async function askNotesAction(input: AskRequestPayload): Promise<ActionResult<AskResponsePayload>> {
  const question = input.question.trim();
  const subjectId = input.subjectId.trim();
  const threadId = input.threadId.trim();
  const subjectName = input.subjectName?.trim();

  if (!question || !subjectId || !threadId) {
    return {
      ok: false,
      status: 400,
      error: "question, subjectId, and threadId are required."
    };
  }

  try {
    const response = await callBackend(BACKEND_ROUTES.ask, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        question,
        subjectId,
        threadId,
        ...(subjectName ? { subjectName } : {})
      })
    });

    const contentType = response.headers.get("content-type") ?? "";

    if (!response.ok) {
      const errorPayload = contentType.includes("application/json") ? await response.json() : await response.text();
      const message =
        typeof errorPayload === "string"
          ? errorPayload
          : typeof errorPayload?.error === "string"
            ? errorPayload.error
            : `Backend request failed with status ${response.status}`;

      return {
        ok: false,
        status: response.status,
        error: message
      };
    }

    if (contentType.includes("application/json")) {
      const data = (await response.json()) as AskFoundResponse;
      return {
        ok: true,
        status: response.status,
        data
      };
    }

    const text = await response.text();
    return {
      ok: true,
      status: response.status,
      data: text
    };
  } catch {
    return {
      ok: false,
      status: 500,
      error: "Failed to reach backend."
    };
  }
}

export async function checkBackendHealthAction(): Promise<ActionResult<{ ok: boolean }>> {
  try {
    const response = await callBackend(BACKEND_ROUTES.health, {
      method: "GET"
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: `Health check failed with status ${response.status}`
      };
    }

    const data = (await response.json()) as { ok: boolean };
    return {
      ok: true,
      status: response.status,
      data
    };
  } catch {
    return {
      ok: false,
      status: 500,
      error: "Failed to reach backend."
    };
  }
}
