"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Video,
  Moon,
  GraduationCap,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Layers,
  Terminal,
  Bell,
  CheckCircle2,
  Clock,
  UploadCloud,
  FileVideo,
  Search,
  Filter,
  Sliders,
  Play,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Send,
  Zap,
} from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  INITIAL_SOCIAL_CHATS,
  INITIAL_SHORTS_QUEUE,
  SocialChatLead,
  ShortsItem,
} from "@/lib/supabase";

export default function AIEmpireDashboard() {
  const [activeTab, setActiveTab] = useState<
    "islamic" | "edukasi" | "responder" | "settings"
  >("islamic");

  const [socialChats, setSocialChats] =
    useState<SocialChatLead[]>(INITIAL_SOCIAL_CHATS);
  const [shortsQueue, setShortsQueue] =
    useState<ShortsItem[]>(INITIAL_SHORTS_QUEUE);
  const [toast, setToast] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // TAB 1: SHORTS ISLAMIC (Z-CODE AUTOMATED EDITOR)
  // ---------------------------------------------------------------------------
  const [islamicTitle, setIslamicTitle] = useState(
    "Ternyata Ustad Felix Bisa Sombong, Tapi Sombong Nya Kek Gini"
  );
  const [islamicSourceYt, setIslamicSourceYt] = useState("YNTV");
  const [islamicVideoFile, setIslamicVideoFile] = useState<File | null>(null);
  const [isProcessingIslamic, setIsProcessingIslamic] = useState(false);
  const [optSmartCrop, setOptSmartCrop] = useState(true);
  const [optCapcutHd, setOptCapcutHd] = useState(true);
  const [optBoldSubtitle, setOptBoldSubtitle] = useState(true);

  // ---------------------------------------------------------------------------
  // TAB 2: SHORTS EDUKASI (AI SCRIPT & 5-SCENE BREAKDOWN GENERATOR)
  // ---------------------------------------------------------------------------
  const [edukasiTopic, setEdukasiTopic] = useState("");
  const [edukasiDuration, setEdukasiDuration] = useState<"1m" | "1.5m" | "2m">("1.5m");
  const [isGeneratingEdukasi, setIsGeneratingEdukasi] = useState(false);
  const [generatedScriptData, setGeneratedScriptData] = useState<{
    title?: string;
    hook_text?: string;
    full_script?: string;
    target_duration_seconds?: number;
    scenes?: Array<{
      scene_num: number;
      time_range: string;
      visual_direction: string;
      narration: string;
      motion_fx: string;
      sound_fx: string;
    }>;
  } | null>(null);
  const [edukasiFootageFile, setEdukasiFootageFile] = useState<File | null>(null);
  const [isRenderingEdukasi, setIsRenderingEdukasi] = useState(false);

  // ---------------------------------------------------------------------------
  // TAB 3: CS AUTO RESPONDER (INSTAGRAM DM LIVE CHAT HISTORY ONLY)
  // ---------------------------------------------------------------------------
  const [searchHandle, setSearchHandle] = useState("");
  const [chatFilter, setChatFilter] = useState<"all" | "replied" | "pending">("all");

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Sync data with Supabase on mount & poll live progress every 3 seconds
  useEffect(() => {
    const sb = supabase;
    if (!isSupabaseConfigured || !sb) return;
    const fetchAll = async () => {
      const [chatRes, shRes] = await Promise.all([
        sb.from("social_chat_leads").select("*").order("created_at", { ascending: false }),
        sb.from("youtube_shorts_queue").select("*").order("created_at", { ascending: false }),
      ]);
      if (chatRes.data?.length) setSocialChats(chatRes.data);
      if (shRes.data?.length) setShortsQueue(shRes.data);
    };
    fetchAll();
    const interval = setInterval(fetchAll, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handler: Process Islamic Short ala Z-Code
  const handleProcessIslamicShort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!islamicVideoFile) {
      notify("⚠️ Mohon Drag & Drop atau Pilih file video mentah terlebih dahulu!");
      return;
    }
    if (!islamicTitle.trim()) {
      notify("⚠️ Mohon isi Title Box Kuning untuk Cover terlebih dahulu!");
      return;
    }
    setIsProcessingIslamic(true);

    try {
      const formData = new FormData();
      formData.append("file", islamicVideoFile);
      formData.append("title", islamicTitle);
      formData.append("source", islamicSourceYt || "YNTV");

      const res = await fetch("/api/shorts/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.ok) {
        if (data.item) {
          setShortsQueue((prev) => [data.item, ...prev]);
        }
        notify("🎉 Video mentah diterima! Sedang diedit otomatis ala Z-Code di laptop lokal & langsung dikirim ke Telegram!");
      } else {
        notify("Gagal memproses: " + (data.error || "Unknown error"));
      }
    } catch (err: unknown) {
      notify("Error: " + (err instanceof Error ? err.message : "Network error"));
    } finally {
      setIsProcessingIslamic(false);
    }
  };

  // Handler: Generate Edukasi Script & 5-Scene Breakdown
  const handleGenerateEdukasiScript = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingEdukasi(true);
    setGeneratedScriptData(null);

    try {
      const res = await fetch("/api/shorts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: "Edukasi_CalonSarjana",
          custom_topic: edukasiTopic,
          duration_target: edukasiDuration,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        const payload = data.parsed_data || data.item;
        setGeneratedScriptData(payload);
        if (data.item) {
          setShortsQueue((prev) => [data.item, ...prev]);
        }
        notify("✨ Naskah & 5 Scene Breakdown edukasi berhasil digenerate!");
      } else {
        notify("Gagal generate: " + (data.error || "Unknown error"));
      }
    } catch (err: unknown) {
      notify("Error: " + (err instanceof Error ? err.message : "Network error"));
    } finally {
      setIsGeneratingEdukasi(false);
    }
  };

  // Filtered Instagram chats
  const filteredChats = socialChats.filter((c) => {
    const matchHandle =
      c.sender_handle.toLowerCase().includes(searchHandle.toLowerCase()) ||
      c.incoming_message.toLowerCase().includes(searchHandle.toLowerCase());
    if (chatFilter === "replied") return matchHandle && c.ai_auto_reply;
    if (chatFilter === "pending") return matchHandle && !c.ai_auto_reply;
    return matchHandle;
  });

  return (
    <div className="flex h-screen bg-[#07090e] text-slate-100 font-sans overflow-hidden">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-5 py-3 rounded-xl shadow-2xl border border-emerald-400/30 text-sm font-semibold animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{toast}</span>
        </div>
      )}

      {/* =====================================================================
          SIDEBAR NAVIGATION (GAYA SIDEBAR KIRI)
          ===================================================================== */}
      <aside className="w-72 bg-[#0c101c] border-r border-slate-800/80 flex flex-col justify-between p-5 select-none shrink-0">
        <div>
          {/* Logo & Brand Header */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 font-black text-xl text-white">
              AI
            </div>
            <div>
              <div className="text-base font-black tracking-wider text-white flex items-center gap-2">
                AI EMPIRE
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <div className="text-[11px] font-semibold text-slate-400">
                Command Center 2026
              </div>
            </div>
          </div>

          {/* Navigation Menu List */}
          <nav className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
              Divisi Konten & Bisnis
            </div>

            {/* Menu 1: Shorts Islamic */}
            <button
              onClick={() => setActiveTab("islamic")}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-bold text-sm transition-all text-left ${
                activeTab === "islamic"
                  ? "bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 border border-amber-500/40 shadow-lg shadow-amber-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Moon className="w-5 h-5 text-amber-400" />
              <div className="flex-1">
                <div className="leading-tight">Shorts Islamic</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                  Editor Z-Code @islamic-short
                </div>
              </div>
              {activeTab === "islamic" && (
                <div className="w-1.5 h-4 bg-amber-400 rounded-full"></div>
              )}
            </button>

            {/* Menu 2: Shorts Edukasi */}
            <button
              onClick={() => setActiveTab("edukasi")}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-bold text-sm transition-all text-left ${
                activeTab === "edukasi"
                  ? "bg-gradient-to-r from-teal-500/20 to-cyan-500/10 text-teal-300 border border-teal-500/40 shadow-lg shadow-teal-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <GraduationCap className="w-5 h-5 text-teal-400" />
              <div className="flex-1">
                <div className="leading-tight">Shorts Edukasi</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                  AI Script & 5-Scene Breakdown
                </div>
              </div>
              {activeTab === "edukasi" && (
                <div className="w-1.5 h-4 bg-teal-400 rounded-full"></div>
              )}
            </button>

            {/* Menu 3: CS Auto Responder */}
            <button
              onClick={() => setActiveTab("responder")}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-bold text-sm transition-all text-left ${
                activeTab === "responder"
                  ? "bg-gradient-to-r from-pink-500/20 to-rose-500/10 text-pink-400 border border-pink-500/40 shadow-lg shadow-pink-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <MessageSquare className="w-5 h-5 text-pink-400" />
              <div className="flex-1">
                <div className="leading-tight">CS Instagram DM</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                  Riwayat Chat Client Real-Time
                </div>
              </div>
              {socialChats.length > 0 && (
                <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {socialChats.length}
                </span>
              )}
            </button>

            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 pt-6 mb-2">
              Infrastruktur
            </div>

            {/* Menu 4: Status & Settings */}
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-bold text-sm transition-all text-left ${
                activeTab === "settings"
                  ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/10 text-blue-400 border border-blue-500/40 shadow-lg shadow-blue-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Sliders className="w-5 h-5 text-blue-400" />
              <div className="flex-1">
                <div className="leading-tight">Sistem & Status</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                  Local Bridge & Telegram
                </div>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Stats */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
              <span>Channel Islamic:</span>
              <span className="text-amber-400 font-bold">465 Subs</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              @islamic-short-513 (52 Video)
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-400 px-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Laptop Local Bridge Ready</span>
          </div>
        </div>
      </aside>

      {/* =====================================================================
          MAIN CONTENT AREA
          ===================================================================== */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-gradient-to-b from-[#0a0d16] to-[#06080e] p-8">
        {/* ===================================================================
            TAB 1: SHORTS ISLAMIC (Z-CODE AUTOMATED EDITOR)
            =================================================================== */}
        {activeTab === "islamic" && (
          <div className="max-w-6xl mx-auto w-full space-y-8 animate-fadeIn">
            {/* Header Islamic */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <Moon className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-white tracking-wide">
                      Editor Shorts Islamic (Sistem Z-Code)
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Fokus Channel YouTube{" "}
                      <span className="text-amber-400 font-bold">
                        @islamic-short-513
                      </span>{" "}
                      · Drag & Drop Clip Video Mentah ➔ AI Edit Otomatis
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold px-3 py-1.5 rounded-lg">
                  Target: 465 ➔ 10.000 Subs
                </span>
              </div>
            </div>

            {/* Layout: Z-Code Upload & Style Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form Upload & Z-Code Config (7 Cols) */}
              <div className="lg:col-span-7 bg-[#0f1424] border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-amber-400" />
                    Drag & Drop Video Mentah / Clip Podcast
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Masukkan video landscape (misal rekaman 1–2 menit Ustadz Felix Siauw), AI akan memotong otomatis ke portrait 9:16.
                  </p>
                </div>

                <form onSubmit={handleProcessIslamicShort} className="space-y-5">
                  {/* Drag and Drop Zone */}
                  <label
                    htmlFor="islamicFile"
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group ${
                      islamicVideoFile
                        ? "border-emerald-500/60 bg-emerald-500/10 hover:bg-emerald-500/15"
                        : "border-amber-500/30 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/10"
                    }`}
                  >
                    <FileVideo
                      className={`w-12 h-12 mb-3 transition-transform group-hover:scale-110 ${
                        islamicVideoFile ? "text-emerald-400" : "text-amber-400"
                      }`}
                    />
                    {islamicVideoFile ? (
                      <div className="text-center">
                        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold mb-2">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Video Siap Diproses</span>
                        </div>
                        <div className="text-sm font-bold text-white break-all max-w-md">
                          {islamicVideoFile.name}
                        </div>
                        <div className="text-xs text-emerald-300/80 mt-1">
                          Ukuran: {(islamicVideoFile.size / (1024 * 1024)).toFixed(2)} MB · Klik untuk ganti video
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-sm font-bold text-white">
                          Klik atau Drag & Drop Video Mentah ke Sini
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Format: MP4, MOV, atau MKV (Maks 250 MB)
                        </div>
                      </div>
                    )}
                    <input
                      id="islamicFile"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setIslamicVideoFile(e.target.files[0]);
                      }}
                    />
                  </label>

                  {/* Title Cover Box Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Title Box Kuning di Cover Depan
                    </label>
                    <input
                      type="text"
                      value={islamicTitle}
                      onChange={(e) => setIslamicTitle(e.target.value)}
                      placeholder="Contoh: Ternyata Ustad Felix Bisa Sombong, Tapi..."
                      className="w-full bg-[#161c30] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      *Akan ditampilkan dalam box kuning tebal bergaris tepi putih khas channel Anda.
                    </p>
                  </div>

                  {/* Source YouTube Watermark Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Nama Source YouTube yang Di-Clip
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="bg-red-600 text-white font-bold text-xs px-3 py-3 rounded-xl flex items-center gap-1.5 shrink-0">
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>YouTube</span>
                      </div>
                      <input
                        type="text"
                        value={islamicSourceYt}
                        onChange={(e) => setIslamicSourceYt(e.target.value)}
                        placeholder="Contoh: YNTV, Al-Fatih Press, Felix Siauw"
                        className="w-full bg-[#161c30] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      *Ditampilkan persis di bawah subtitle: [🔴 YT Logo] + {islamicSourceYt || "YNTV"}
                    </p>
                  </div>

                  {/* Checkbox Options ala Z-Code */}
                  <div className="bg-[#14192b] border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Otomatisasi Editing Z-Code (Aktif):
                    </div>
                    <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={optSmartCrop}
                        onChange={(e) => setOptSmartCrop(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span>Auto-Crop Portrait 9:16 Wajah Pembicara dari Landscape</span>
                    </label>
                    <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={optBoldSubtitle}
                        onChange={(e) => setOptBoldSubtitle(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span>Subtitle Bold Kuning/Merah/Putih dengan Outline Hitam</span>
                    </label>
                    <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={optCapcutHd}
                        onChange={(e) => setOptCapcutHd(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span>Filter CapCut 4K HD Sharpness & Contrast Boost</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isProcessingIslamic}
                    className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black py-4 rounded-xl shadow-xl shadow-orange-500/20 text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isProcessingIslamic ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Sedang Memproses di Laptop Lokal...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 fill-slate-950" />
                        <span>Proses Video Otomatis ala Z-Code (Kirim ke Telegram)</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Live Preview Template Style (5 Cols) */}
              <div className="lg:col-span-5 bg-[#0f1424] border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col items-center">
                <div className="w-full text-left mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Preview Layout Template Asli Channel Anda
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Sesuai referensi video podcast & cover @islamic-short-513:
                  </p>
                </div>

                {/* 9:16 Mockup Frame */}
                <div className="w-[280px] h-[500px] bg-gradient-to-b from-slate-900 to-slate-950 border-4 border-slate-700/80 rounded-[32px] overflow-hidden relative shadow-2xl flex flex-col justify-between p-4">
                  {/* Mockup Video Image / Podcaster */}
                  <div className="absolute inset-0 bg-cover bg-center opacity-60 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/40 via-slate-900 to-black"></div>

                  {/* Top Yellow Cover Box Title Preview */}
                  <div className="relative z-10 mt-6 px-2">
                    <div className="bg-[#FFE600] text-black font-black text-xs px-3 py-2 rounded-xl text-center leading-tight shadow-lg border-2 border-white uppercase tracking-tight">
                      {islamicTitle || "TITLE BOX KUNING DI SINI"}
                    </div>
                  </div>

                  {/* Center Speaker Simulation */}
                  <div className="relative z-10 text-center my-auto">
                    <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-amber-400/50 mx-auto flex items-center justify-center shadow-lg">
                      <Play className="w-8 h-8 text-amber-400 fill-amber-400" />
                    </div>
                  </div>

                  {/* Bottom Subtitle & Source Watermark */}
                  <div className="relative z-10 mb-4 text-center space-y-2">
                    {/* Bold Subtitle (Kuning & Merah) */}
                    <div className="text-center font-black tracking-wider drop-shadow-[0_4px_8px_rgba(0,0,0,1)]">
                      <span className="text-[#FFE600] text-lg block stroke-black">
                        SEANDAINYA
                      </span>
                      <span className="text-white text-base block font-black">
                        KARENA AKU
                      </span>
                    </div>

                    {/* YouTube Source Badge Under Subtitle */}
                    <div className="inline-flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                      <div className="w-3.5 h-3.5 bg-red-600 rounded-full flex items-center justify-center">
                        <Play className="w-2 h-2 text-white fill-white" />
                      </div>
                      <span className="text-white font-black text-[11px] tracking-wider uppercase">
                        {islamicSourceYt || "YNTV"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 mt-4 text-center">
                  💡 Format identik dengan 52 video Shorts yang sudah viral di channel Anda.
                </div>
              </div>
            </div>

            {/* Riwayat Shorts Islamic Table */}
            <div className="bg-[#0f1424] border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  Riwayat & Antrean Shorts Islamic
                </h3>
                <span className="text-xs text-slate-400">
                  Total: {shortsQueue.filter((s) => s.niche === "Islamic").length} Video
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#141a2e] text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Judul & Cover</th>
                      <th className="py-3 px-4">Style & Source</th>
                      <th className="py-3 px-4">Status Render</th>
                      <th className="py-3 px-4">Tinjau di Telegram</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {shortsQueue
                      .filter((s) => s.niche === "Islamic")
                      .map((item) => {
                        const pctMatch = (item.status || "").match(/(\d+)%/);
                        const progressPct = pctMatch
                          ? parseInt(pctMatch[1], 10)
                          : item.status === "Review_in_Telegram"
                          ? 100
                          : 0;
                        const isLiveRunning =
                          item.status?.includes("Rendering") ||
                          item.status?.includes("Sending") ||
                          item.status?.includes("Processing");

                        return (
                          <tr key={item.id} className="hover:bg-slate-800/30">
                            <td className="py-3.5 px-4 max-w-md">
                              <div className="font-bold text-white">{item.title}</div>
                              <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1.5">
                                {isLiveRunning && (
                                  <RefreshCw className="w-3 h-3 text-amber-400 animate-spin shrink-0" />
                                )}
                                <span>{item.hook_text}</span>
                              </div>
                              {isLiveRunning && progressPct > 0 && (
                                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-amber-400 to-emerald-400 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${progressPct}%` }}
                                  ></div>
                                </div>
                              )}
                              {item.full_script && item.status === "Review_in_Telegram" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.full_script);
                                    notify("📋 Deskripsi & Hashtag YouTube berhasil disalin!");
                                  }}
                                  className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-all"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>Copy Deskripsi & Hashtag AI</span>
                                </button>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="bg-amber-500/10 text-amber-400 font-semibold px-2 py-0.5 rounded border border-amber-500/20">
                                {item.style_preset || "Z-Code Style"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  item.status === "Review_in_Telegram"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : isLiveRunning
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                }`}
                              >
                                {isLiveRunning && (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                )}
                                {item.status === "Review_in_Telegram"
                                  ? "✅ Selesai (Terkirim)"
                                  : item.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {item.telegram_message_url ? (
                                <a
                                  href={item.telegram_message_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
                                >
                                  <span>Buka Video</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              ) : isLiveRunning ? (
                                <span className="text-amber-400/80 text-[11px] font-semibold">
                                  Sedang Diproses...
                                </span>
                              ) : (
                                <span className="text-slate-400">Terkirim ke Bot</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    {shortsQueue.filter((s) => s.niche === "Islamic").length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">
                          Belum ada antrean Shorts Islamic. Drag & drop video di atas untuk memulai!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: SHORTS EDUKASI (AI SCRIPT & 5-SCENE BREAKDOWN GENERATOR)
            =================================================================== */}
        {activeTab === "edukasi" && (
          <div className="max-w-6xl mx-auto w-full space-y-8 animate-fadeIn">
            {/* Header Edukasi */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-teal-500/10 border border-teal-500/30 rounded-xl">
                    <GraduationCap className="w-6 h-6 text-teal-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-white tracking-wide">
                      AI Script & 5-Scene Generator (Shorts Edukasi)
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Riset Otomatis Topik Sains/Misteri Viral ➔ Naskah Lengkap ➔ Breakdown Scene-by-Scene untuk Remotion
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Generator Form */}
            <div className="bg-[#0f1424] border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-6">
              <form onSubmit={handleGenerateEdukasiScript} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  <div className="md:col-span-8">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Topik atau Ide Edukasi (Kosongkan jika ingin AI yang memilih topik viral)
                    </label>
                    <input
                      type="text"
                      value={edukasiTopic}
                      onChange={(e) => setEdukasiTopic(e.target.value)}
                      placeholder="Contoh: Misteri Lubang Hitam, Segitiga Bermuda, Rahasia Otak Manusia..."
                      className="w-full bg-[#161c30] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Target Durasi Video
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["1m", "1.5m", "2m"] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setEdukasiDuration(d)}
                          className={`py-3 text-xs font-black rounded-xl border transition-all ${
                            edukasiDuration === d
                              ? "bg-teal-500/20 text-teal-300 border-teal-400 shadow-md shadow-teal-500/20"
                              : "bg-[#161c30] text-slate-400 border-slate-700/80 hover:text-white"
                          }`}
                        >
                          {d === "1m" ? "1 Menit" : d === "1.5m" ? "1.5 Menit" : "2 Menit"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Topic Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-400">Rekomendasi Cepat:</span>
                  {[
                    "Misteri Lubang Hitam (Black Hole)",
                    "Tardigrade: Hewan Paling Mustahil Mati",
                    "Rahasia Palung Mariana Terdalam",
                    "Kenapa Kebakaran Gambut Tak Bisa Padam?",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setEdukasiTopic(chip)}
                      className="text-[11px] bg-slate-800/80 hover:bg-slate-700 text-teal-300 px-3 py-1 rounded-full border border-teal-500/20 transition-all"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Generate Button */}
                <button
                  type="submit"
                  disabled={isGeneratingEdukasi}
                  className="w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-black py-4 rounded-xl shadow-xl shadow-teal-500/20 text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isGeneratingEdukasi ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Sedang Meriset & Menulis 5 Scene Breakdown...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 fill-slate-950" />
                      <span>Generate Naskah Lengkap & 5 Scene Breakdown</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Generated Script & 5 Scene Breakdown Display */}
            {generatedScriptData && (
              <div className="bg-[#0f1424] border border-teal-500/40 rounded-2xl p-6 shadow-2xl space-y-6 animate-fadeIn">
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="bg-teal-500/10 text-teal-400 font-bold text-xs px-3 py-1 rounded-full border border-teal-500/30 uppercase tracking-wider">
                      Hasil Riset AI · Siap Produksi
                    </span>
                    <h2 className="text-xl font-black text-white mt-2">
                      {generatedScriptData.title}
                    </h2>
                    <p className="text-xs text-amber-400 font-semibold mt-1">
                      🪝 Hook: "{generatedScriptData.hook_text}"
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-slate-400">
                      Est. Durasi: {generatedScriptData.target_duration_seconds || 90} Detik
                    </span>
                  </div>
                </div>

                {/* Full Narration Accordion */}
                <div className="bg-[#141a2e] border border-slate-800 rounded-xl p-4">
                  <div className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-2">
                    Naskah Narasi Lengkap (Untuk Voiceover):
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line font-serif">
                    {generatedScriptData.full_script}
                  </p>
                </div>

                {/* 5 Scene Breakdown Cards */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-400" />
                    Breakdown 5 Scene Terstruktur (Shot & Motion Direction):
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {generatedScriptData.scenes?.map((sc) => (
                      <div
                        key={sc.scene_num}
                        className="bg-[#14192b] border border-slate-800 hover:border-teal-500/50 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs font-black mb-2">
                            <span className="bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded text-[10px]">
                              SCENE {sc.scene_num}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {sc.time_range}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-white mb-1">
                            {sc.visual_direction}
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-4 leading-relaxed">
                            "{sc.narration}"
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 space-y-1">
                          <div className="text-[10px] text-amber-300 font-mono">
                            ⚡ {sc.motion_fx}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            🔊 {sc.sound_fx}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Drag and Drop Footage Mentah User untuk di-Remotion */}
                <div className="pt-4 border-t border-slate-800">
                  <div className="bg-gradient-to-r from-teal-950/40 to-slate-900 border border-teal-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 text-teal-400" />
                        Punya Footage Mentah (Google Flow AI / Gemini Pro)?
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Drop video rekaman Anda ke sini, AI laptop lokal akan menambahkan animasi Remotion, kinetic subtitle, dan audio mixing otomatis!
                      </p>
                    </div>

                    <label className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-black px-5 py-3 rounded-xl cursor-pointer text-xs shrink-0 flex items-center gap-2 shadow-lg">
                      <FileVideo className="w-4 h-4 fill-slate-950" />
                      <span>{edukasiFootageFile ? edukasiFootageFile.name : "Drop / Pilih Footage"}</span>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setEdukasiFootageFile(e.target.files[0]);
                            notify("Footage dipilih! Klik 'Rakit Video' untuk eksekusi.");
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            TAB 3: CS AUTO RESPONDER (INSTAGRAM DM LIVE CHAT HISTORY ONLY)
            =================================================================== */}
        {activeTab === "responder" && (
          <div className="max-w-6xl mx-auto w-full space-y-8 animate-fadeIn">
            {/* Header CS */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-white tracking-wide">
                      Riwayat Chat Masuk Instagram DM (CS Automation)
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Koneksi Aktif:{" "}
                      <span className="text-pink-400 font-bold">@at.heart_digital</span> &{" "}
                      <span className="text-slate-300 font-bold">BelajarCeriaAnak.id</span> · Balas Otomatis AI & Alert Telegram
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-400">Webhook Live</span>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0f1424] border border-slate-800/90 rounded-2xl p-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Total DM Masuk
                </div>
                <div className="text-2xl font-black text-white mt-1">
                  {socialChats.length} Pesan
                </div>
              </div>
              <div className="bg-[#0f1424] border border-slate-800/90 rounded-2xl p-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Respon Otomatis AI
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  100% Terbalas
                </div>
              </div>
              <div className="bg-[#0f1424] border border-slate-800/90 rounded-2xl p-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Kecepatan Balas
                </div>
                <div className="text-2xl font-black text-pink-400 mt-1">
                  &lt; 2.0 Detik
                </div>
              </div>
              <div className="bg-[#0f1424] border border-slate-800/90 rounded-2xl p-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Telegram Owner Alert
                </div>
                <div className="text-2xl font-black text-teal-400 mt-1">
                  Aktif 24/7
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-[#0f1424] border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchHandle}
                  onChange={(e) => setSearchHandle(e.target.value)}
                  placeholder="Cari Username @instagram..."
                  className="w-full bg-[#161c30] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-400"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setChatFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    chatFilter === "all"
                      ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Semua ({socialChats.length})
                </button>
                <button
                  onClick={() => setChatFilter("replied")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    chatFilter === "replied"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Terbalas AI
                </button>
              </div>
            </div>

            {/* Live Chat Cards List */}
            <div className="space-y-4">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className="bg-[#0f1424] border border-slate-800/90 hover:border-pink-500/30 rounded-2xl p-5 shadow-lg space-y-4 transition-all"
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-amber-500 p-0.5">
                        <div className="w-full h-full bg-[#0f1424] rounded-full flex items-center justify-center font-bold text-xs text-pink-400">
                          {chat.sender_name.slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-black text-white flex items-center gap-2">
                          <span>{chat.sender_handle}</span>
                          <span className="bg-pink-500/10 text-pink-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-pink-500/20">
                            Instagram DM
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Nama: {chat.sender_name} · Real Client
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Terkirim ke Telegram</span>
                      </span>
                    </div>
                  </div>

                  {/* Messages Exchange */}
                  <div className="space-y-3 bg-[#141a2e] border border-slate-800 rounded-xl p-4">
                    {/* Client Message */}
                    <div className="flex items-start gap-3">
                      <div className="bg-slate-700 text-slate-300 font-bold text-[10px] px-2 py-1 rounded shrink-0">
                        CLIENT
                      </div>
                      <p className="text-xs text-white leading-relaxed font-medium">
                        "{chat.incoming_message}"
                      </p>
                    </div>

                    {/* AI Auto-Reply */}
                    {chat.ai_auto_reply && (
                      <div className="flex items-start gap-3 pt-2 border-t border-slate-800">
                        <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-[10px] px-2 py-1 rounded shrink-0 flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-white" />
                          <span>AI CS</span>
                        </div>
                        <p className="text-xs text-pink-200 leading-relaxed font-medium">
                          "{chat.ai_auto_reply}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredChats.length === 0 && (
                <div className="bg-[#0f1424] border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                  Tidak ada riwayat chat yang cocok dengan pencarian Anda.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 4: STATUS SISTEM & INTEGRASI
            =================================================================== */}
        {activeTab === "settings" && (
          <div className="max-w-6xl mx-auto w-full space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <Sliders className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white tracking-wide">
                    Status Sistem & Integrasi Real-Time
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Koneksi Vercel Production, Supabase Cloud, Local Laptop Bridge, dan Telegram Bot
                  </p>
                </div>
              </div>
            </div>

            {/* Connection Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Telegram Bot */}
              <div className="bg-[#0f1424] border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400">
                      TG
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">Telegram Bot Notifikasi</div>
                      <div className="text-xs text-slate-400 font-mono">@cs_bisnisku_2026_bot</div>
                    </div>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                    Online (ID: 7885596077)
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Semua video shorts hasil render (Islamic & Edukasi) dan alert chat client masuk otomatis dikirim langsung ke bot ini.
                </p>
              </div>

              {/* Local Laptop Bridge */}
              <div className="bg-[#0f1424] border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400">
                      GPU
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">Local Laptop Worker</div>
                      <div className="text-xs text-slate-400 font-mono">MSI Modern 14 (Intel Iris Xe)</div>
                    </div>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                    Daemon Standby
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Eksekusi render video 24fps 1080x1920 (Three.js WebGL, Remotion, FFmpeg, Edge-TTS) berjalan 100% lokal di laptop Anda.
                </p>
              </div>

              {/* Google Gemini API */}
              <div className="bg-[#0f1424] border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center font-bold text-teal-400">
                      AI
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">Google Gemini AI Key</div>
                      <div className="text-xs text-slate-400 font-mono">AQ.Ab8RN6... (Terkonfigurasi)</div>
                    </div>
                  </div>
                  <span className="bg-teal-500/20 text-teal-300 text-xs font-bold px-3 py-1 rounded-full border border-teal-500/30">
                    Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Digunakan untuk meriset topik viral, naskah narasi, dan breakdown 5 scene pada Shorts Edukasi.
                </p>
              </div>

              {/* Instagram Meta Business */}
              <div className="bg-[#0f1424] border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center font-bold text-pink-400">
                      IG
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">Instagram Meta API</div>
                      <div className="text-xs text-slate-400 font-mono">@at.heart_digital</div>
                    </div>
                  </div>
                  <span className="bg-pink-500/20 text-pink-300 text-xs font-bold px-3 py-1 rounded-full border border-pink-500/30">
                    Tersambung
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Izin Meta Business sudah disetujui untuk auto-reply DM dan monitoring pesan masuk real-time.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
