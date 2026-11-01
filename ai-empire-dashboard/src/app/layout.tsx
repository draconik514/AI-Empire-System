import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Empire Command Center | 3 Sumber Penghasilan & 16 AI Repos",
  description:
    "Single Command Center Dashboard untuk Kerja Kantoran, Agensi Web UMKM, dan Pabrik Ternak YouTube Shorts (Islami, Edukasi, Anak) berbasis Supabase Gratis, Telegram Cloud, dan Obsidian.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

