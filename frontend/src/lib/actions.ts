const DEFAULT_BACKEND_BASE_URL = "http://localhost:3001";

export const BACKEND_ROUTES = {
  health: "/health",
  ask: "/api/ask",
  askStream: "/api/ask/stream",
  subjects: "/api/subjects",
  subjectFiles: (subjectId: string) => `/api/subjects/${subjectId}/files`,
  voiceQuery: "/api/voice/query",
  me: "/api/me",
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

export interface AskNotFoundResponse {
  answer: string;
  citations: [];
  confidence: "Low";
  evidence: [];
  found: false;
}

export type AskResponsePayload = AskFoundResponse | AskNotFoundResponse;

export interface ActionResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

function normalizeBackendBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_BACKEND_BASE_URL;
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

async function callBackend(path: string, init: RequestInit): Promise<Response> {
  const backendUrl = `${normalizeBackendBaseUrl()}${path}`;
  const headers = new Headers(init.headers);

  return fetch(backendUrl, {
    ...init,
    headers,
    cache: "no-store",
    credentials: "include"
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

    if (!response.ok) {
      const contentType = response.headers.get("content-type") ?? "";
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

    const data = (await response.json()) as AskResponsePayload;
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

export interface SubjectRecord {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubjectFileRecord {
  fileName: string;
  chunkCount: number;
  maxPage: number | null;
  lastIngestedAt: string | null;
}

export interface MeProfile {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export async function getSubjectsAction(): Promise<ActionResult<{ subjects: SubjectRecord[] }>> {
  try {
    const response = await callBackend(BACKEND_ROUTES.subjects, {
      method: "GET"
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      return { ok: false, status: response.status, error: errorMsg };
    }

    const data = (await response.json()) as { subjects: SubjectRecord[] };
    return { ok: true, status: response.status, data };
  } catch {
    return { ok: false, status: 500, error: "Network error" };
  }
}

export async function createSubjectAction({ name }: { name: string }): Promise<ActionResult<{ subject: SubjectRecord }>> {
  try {
    const response = await callBackend(BACKEND_ROUTES.subjects, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name })
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      return { ok: false, status: response.status, error: errorMsg };
    }

    const data = (await response.json()) as { subject: SubjectRecord };
    return { ok: true, status: response.status, data };
  } catch {
    return { ok: false, status: 500, error: "Network error" };
  }
}

export interface UploadFilePayload {
  subjectId: string;
  subjectName?: string;
  file: File;
}

export interface IngestionResult {
  subjectId: string;
  subjectName: string;
  fileName: string;
  totalPages: number;
  chunkCount: number;
}

export async function uploadFileAction(payload: UploadFilePayload): Promise<ActionResult<{ ingestion: IngestionResult }>> {
  try {
    const contentBase64 = await fileToBase64(payload.file);

    const response = await callBackend(BACKEND_ROUTES.subjectFiles(payload.subjectId), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        subjectId: payload.subjectId,
        subjectName: payload.subjectName,
        fileName: payload.file.name,
        mimeType: payload.file.type,
        contentBase64
      })
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      return { ok: false, status: response.status, error: errorMsg };
    }

    const data = (await response.json()) as { ingestion: IngestionResult };
    return { ok: true, status: response.status, data };
  } catch {
    return { ok: false, status: 500, error: "Network error" };
  }
}

export async function getSubjectFilesAction(
  subjectId: string
): Promise<ActionResult<{ subject: SubjectRecord; files: SubjectFileRecord[] }>> {
  try {
    const response = await callBackend(BACKEND_ROUTES.subjectFiles(subjectId), {
      method: "GET"
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      return { ok: false, status: response.status, error: errorMsg };
    }

    const data = (await response.json()) as { subject: SubjectRecord; files: SubjectFileRecord[] };
    return { ok: true, status: response.status, data };
  } catch {
    return { ok: false, status: 500, error: "Network error" };
  }
}

export interface VoiceQueryInput {
  audio: Blob;
  mimeType: string;
  subjectId: string;
  threadId: string;
  subjectName?: string;
}

export interface VoiceQueryResult {
  audioBlob: Blob;
  mimeType: string;
  transcript?: string;
}

export async function voiceQueryAction(
  input: VoiceQueryInput
): Promise<ActionResult<VoiceQueryResult>> {
  try {
    const response = await callBackend(BACKEND_ROUTES.voiceQuery, {
      method: "POST",
      headers: {
        "content-type": input.mimeType,
        "x-subject-id": input.subjectId,
        "x-thread-id": input.threadId,
        ...(input.subjectName ? { "x-subject-name": input.subjectName } : {})
      },
      body: input.audio
    });

    if (!response.ok) {
      const payload = await response.text().catch(() => "");
      return {
        ok: false,
        status: response.status,
        error: payload || `Voice query failed (${response.status})`
      };
    }

    const buffer = await response.arrayBuffer();
    const mimeType = response.headers.get("content-type") ?? "audio/pcm";
    const transcript = response.headers.get("x-transcript") ?? undefined;

    return {
      ok: true,
      status: response.status,
      data: {
        audioBlob: new Blob([buffer], { type: mimeType }),
        mimeType,
        transcript
      }
    };
  } catch {
    return {
      ok: false,
      status: 500,
      error: "Failed to reach backend."
    };
  }
}

export async function getMeAction(): Promise<ActionResult<MeProfile>> {
  try {
    const response = await callBackend(BACKEND_ROUTES.me, {
      method: "GET"
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      return { ok: false, status: response.status, error: errorMsg };
    }

    const data = (await response.json()) as MeProfile;
    return { ok: true, status: response.status, data };
  } catch {
    return { ok: false, status: 500, error: "Network error" };
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else if (result instanceof ArrayBuffer) {
        const bytes = new Uint8Array(result);
        let binary = "";
        for (const byte of bytes) {
          binary += String.fromCharCode(byte);
        }
        resolve(`data:${file.type};base64,${btoa(binary)}`);
      } else {
        reject(new Error("Failed to read file."));
      }
    };
    reader.readAsDataURL(file);
  });
}
