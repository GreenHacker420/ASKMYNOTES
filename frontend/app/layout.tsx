import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AskMyNotes — Subject-Scoped Study Copilot",
  description:
    "Upload your notes for 3 subjects, ask questions in a chat, and get grounded answers with citations. Study mode with MCQs and short-answer questions included.",
  keywords: [
    "study copilot",
    "notes",
    "Q&A",
    "MCQ",
    "citations",
    "AI study tool",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" style={{ colorScheme: "light" }}>
      <body className={`${inter.variable} antialiased font-sans bg-[#fdfbf7] text-slate-800`}>
        {children}
      </body>
    </html>
  );
}
