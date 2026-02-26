"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, BookOpen, LogOut, MessageSquareQuote } from "lucide-react";
import { GraphPaper } from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/GraphPaper";
import { SketchButton } from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/SketchButton";
import { SquiggleFilter } from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/SquiggleFilter";
import { askNotesAction, type AskResponsePayload } from "@/src/lib/actions";
import { authClient } from "@/src/lib/auth-client";

interface QueryForm {
  question: string;
  subjectId: string;
  subjectName: string;
  threadId: string;
}

function createThreadId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `thread-${crypto.randomUUID()}`;
  }
  return `thread-${Date.now()}`;
}



export default function StudyPage(): React.ReactElement {
  const router = useRouter();
  const session = authClient.useSession();
  const [isSignOutPending, setIsSignOutPending] = useState(false);
  const [isAsking, startAsking] = useTransition();
  const [error, setError] = useState<string>("");
  const [answer, setAnswer] = useState<AskResponsePayload | null>(null);
  const [form, setForm] = useState<QueryForm>({
    question: "",
    subjectId: "",
    subjectName: "",
    threadId: createThreadId()
  });

  useEffect(() => {
    if (!session.isPending && !session.data) {
      router.replace("/login");
    }
  }, [session.data, session.isPending, router]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

    if (error) {
      setError("");
    }
  };

  const handleAsk = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const trimmedQuestion = form.question.trim();
    const trimmedSubjectId = form.subjectId.trim();
    const trimmedThreadId = form.threadId.trim();

    if (!trimmedQuestion || !trimmedSubjectId || !trimmedThreadId) {
      setError("question, subjectId, and threadId are required.");
      return;
    }

    startAsking(async () => {
      const result = await askNotesAction({
        question: trimmedQuestion,
        subjectId: trimmedSubjectId,
        subjectName: form.subjectName.trim() || undefined,
        threadId: trimmedThreadId
      });

      if (!result.ok || result.data === undefined) {
        setAnswer(null);
        setError(result.error ?? "Request failed.");
        return;
      }

      setError("");
      setAnswer(result.data);
      setForm((prev) => ({
        ...prev,
        question: ""
      }));
    });
  };

  const handleSignOut = async (): Promise<void> => {
    setIsSignOutPending(true);

    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setIsSignOutPending(false);
    }
  };

  if (session.isPending) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fdfbf7] text-slate-700">
        Loading your session...
      </main>
    );
  }

  if (!session.data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fdfbf7] text-slate-700">
        Redirecting to login...
      </main>
    );
  }

  const userEmail = session.data.user?.email ?? "";

  return (
    <main className="relative min-h-screen w-full text-slate-800 overflow-x-hidden font-sans selection:bg-yellow-300 selection:text-black">
      <SquiggleFilter />
      <GraphPaper />

      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-5 bg-[#fdfbf7] border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tighter hover:scale-105 transition-transform">
          <div className="h-8 w-8 rounded border-2 border-slate-900 bg-slate-800" />
          AskMyNotes.
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-sm font-semibold text-slate-600">{userEmail}</span>
          <SketchButton type="button" disabled={isSignOutPending} onClick={handleSignOut} className="px-4 py-2 text-sm">
            <LogOut size={16} />
            {isSignOutPending ? "Signing out..." : "Sign out"}
          </SketchButton>
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-4 py-8 md:py-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border-2 border-slate-900 bg-white p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]" style={{ filter: "url(#squiggle)" }}>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="text-blue-600" />
            <h1 className="text-2xl font-black tracking-tight">Ask Your Notes</h1>
          </div>

          <form onSubmit={handleAsk} className="space-y-3">
            <label className="block text-sm font-semibold">
              Subject ID
              <input
                name="subjectId"
                value={form.subjectId}
                onChange={handleChange}
                placeholder="example: math-101"
                className="mt-1 w-full rounded-md border-2 border-slate-300 px-3 py-2 outline-none focus:border-slate-700"
              />
            </label>

            <label className="block text-sm font-semibold">
              Subject Name (optional)
              <input
                name="subjectName"
                value={form.subjectName}
                onChange={handleChange}
                placeholder="example: Calculus"
                className="mt-1 w-full rounded-md border-2 border-slate-300 px-3 py-2 outline-none focus:border-slate-700"
              />
            </label>

            <label className="block text-sm font-semibold">
              Thread ID
              <div className="mt-1 flex gap-2">
                <input
                  name="threadId"
                  value={form.threadId}
                  onChange={handleChange}
                  className="w-full rounded-md border-2 border-slate-300 px-3 py-2 outline-none focus:border-slate-700"
                />
                <SketchButton
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, threadId: createThreadId() }))}
                  className="px-3 py-2 text-xs"
                >
                  New
                </SketchButton>
              </div>
            </label>

            <label className="block text-sm font-semibold">
              Question
              <textarea
                name="question"
                value={form.question}
                onChange={handleChange}
                placeholder="Ask a question about this subject's notes"
                className="mt-1 min-h-28 w-full rounded-md border-2 border-slate-300 px-3 py-2 outline-none focus:border-slate-700"
              />
            </label>

            {error ? (
              <div className="flex items-center gap-2 rounded border-2 border-red-400 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                <AlertCircle size={14} />
                {error}
              </div>
            ) : null}

            <SketchButton type="submit" disabled={isAsking} className="w-full py-3 justify-center">
              <MessageSquareQuote size={18} />
              {isAsking ? "Asking..." : "Ask"}
            </SketchButton>
          </form>
        </div>

        <div className="rounded-xl border-2 border-slate-900 bg-white p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]" style={{ filter: "url(#squiggle)" }}>
          <h2 className="text-xl font-black mb-4">Response</h2>

          {!answer ? <p className="text-slate-500">Submit a question to see grounded output.</p> : null}

          {answer && !answer.found ? (
            <div className="rounded border-2 border-amber-300 bg-amber-50 px-3 py-3 text-sm font-semibold text-amber-800">{answer.answer}</div>
          ) : null}

          {answer && answer.found ? (
            <div className="space-y-4">
              <div>
                <div className="mb-1 text-xs uppercase tracking-widest text-slate-500">Answer</div>
                <p className="whitespace-pre-wrap text-sm leading-6">{answer.answer}</p>
              </div>

              <div>
                <div className="mb-1 text-xs uppercase tracking-widest text-slate-500">Confidence</div>
                <div className="inline-flex rounded border-2 border-slate-300 px-2 py-1 text-sm font-semibold">{answer.confidence}</div>
              </div>

              <div>
                <div className="mb-1 text-xs uppercase tracking-widest text-slate-500">Citations</div>
                <ul className="space-y-1 text-sm">
                  {answer.citations.map((citation) => (
                    <li key={`${citation.fileName}-${citation.chunkId}`} className="rounded border border-slate-200 px-2 py-1">
                      {citation.fileName} | page {citation.page ?? "N/A"} | chunk {citation.chunkId}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="mb-1 text-xs uppercase tracking-widest text-slate-500">Evidence</div>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {answer.evidence.map((snippet, index) => (
                    <li key={`${index}-${snippet.slice(0, 10)}`}>{snippet}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
