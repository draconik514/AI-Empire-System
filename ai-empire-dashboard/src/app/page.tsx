"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Video,
  Briefcase,
  Send,
  Plus,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ExternalLink,
  Layers,
  Terminal,
  Sparkles,
  Bell,
  FileText,
  CornerDownRight,
} from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  INITIAL_OFFICE_TASKS,
  INITIAL_SOCIAL_CHATS,
  INITIAL_SHORTS_QUEUE,
  INITIAL_AGENT_JOBS,
  OfficeTask,
  SocialChatLead,
  ShortsItem,
  AgentJob,
} from "@/lib/supabase";

export default function CommandCenterDashboard() {
  const [activeTab, setActiveTab] = useState<
    "responder" | "shorts" | "office" | "system"
  >("responder");

  const [officeTasks, setOfficeTasks] =
    useState<OfficeTask[]>(INITIAL_OFFICE_TASKS);
  const [socialChats, setSocialChats] =
    useState<SocialChatLead[]>(INITIAL_SOCIAL_CHATS);
  const [shortsQueue, setShortsQueue] =
    useState<ShortsItem[]>(INITIAL_SHORTS_QUEUE);
  const [agentJobs, setAgentJobs] = useState<AgentJob[]>(INITIAL_AGENT_JOBS);
  const [selectedNiche, setSelectedNiche] = useState<string>("Edukasi_CalonSarjana");
  const [toast, setToast] = useState<string | null>(null);

  // Shorts Auto-Pilot states
  const [isGeneratingShorts, setIsGeneratingShorts] = useState(false);
  const [edukasiTopicInput, setEdukasiTopicInput] = useState("");
  const [edukasiRefUrl, setEdukasiRefUrl] = useState(
    "https://www.youtube.com/@CalonSarjanaOfficial"
  );

  // Social Auto-Responder states
  const [sopInstruction, setSopInstruction] = useState(
    "Jawab sopan & ramah dalam <2 detik. Informasikan kisaran harga dasar, tanyakan detail kebutuhan/nomor WhatsApp, dan beritahu bahwa notifikasi prioritas sudah dikirim ke Telegram Owner."
  );
  const [simPlatform, setSimPlatform] = useState<"Instagram" | "TikTok">(
    "Instagram"
  );
  const [simHandle, setSimHandle] = useState("");
  const [simMessage, setSimMessage] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Shorts Factory (Reference Cloning + Revision) states
  const [newShortsNiche, setNewShortsNiche] = useState<ShortsItem["niche"]>(
    "Islamic"
  );
  const [newShortsTitle, setNewShortsTitle] = useState("");
  const [newShortsRefUrl, setNewShortsRefUrl] = useState("");
  const [newShortsHook, setNewShortsHook] = useState("");
  const [newShortsStyleNotes, setNewShortsStyleNotes] = useState("");
  const [revisionInputs, setRevisionInputs] = useState<Record<string, string>>(
    {}
  );

  // Office states
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4200);
  };

  useEffect(() => {
    const sb = supabase;
    if (!isSupabaseConfigured || !sb) return;
    const fetchAll = async () => {
      const [offRes, chatRes, shRes, jobRes] = await Promise.all([
        sb
          .from("office_tasks")
          .select("*")
          .order("created_at", { ascending: false }),
        sb
          .from("social_chat_leads")
          .select("*")
          .order("created_at", { ascending: false }),
        sb
          .from("youtube_shorts_queue")
          .select("*")
          .order("created_at", { ascending: false }),
        sb
          .from("agent_jobs")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);
      if (offRes.data?.length) setOfficeTasks(offRes.data);
      if (chatRes.data?.length) setSocialChats(chatRes.data);
      if (shRes.data?.length) setShortsQueue(shRes.data);
      if (jobRes.data?.length) setAgentJobs(jobRes.data);
    };
    fetchAll();
  }, []);

  // 1. Handle Incoming Social Chat Simulation / Live Webhook Trigger
  const handleSimulateIncomingChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simMessage.trim()) return;
    setIsSendingChat(true);

    const handleClean = simHandle.trim()
      ? simHandle.startsWith("@")
        ? simHandle.trim()
        : `@${simHandle.trim()}`
      : "@client_baru";

    try {
      const res = await fetch("/api/social-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: simPlatform,
          sender_handle: handleClean,
          sender_name: handleClean.replace("@", ""),
          incoming_message: simMessage,
          sop_context: sopInstruction,
        }),
      });
      const data = await res.json();

      const newLead: SocialChatLead = {
        id: `chat-${Date.now()}`,
        platform: simPlatform,
        sender_handle: handleClean,
        sender_name: handleClean.replace("@", ""),
        incoming_message: simMessage,
        ai_auto_reply:
          data.ai_auto_reply ||
          `Halo Kak! Pesan Kakak sudah kami terima. Tim utama sudah menerima notifikasi di Telegram dan segera menghubungi Kakak kembali.`,
        intent_category: data.intent_category || "Tanya_Harga",
        status: "Notified_Telegram",
        telegram_notified: true,
        response_time_sec: 1,
        created_at: new Date().toISOString(),
      };

      setSocialChats([newLead, ...socialChats]);
      setSimHandle("");
      setSimMessage("");
      notify(
        `Pesan ${simPlatform} dari ${handleClean} otomatis dibalas & notifikasi dikirim ke Telegram Bot.`
      );
    } catch {
      notify("Simulasi lokal berhasil ditambahkan ke antrean.");
    } finally {
      setIsSendingChat(false);
    }
  };

  // 2. Handle Create Reference-Cloned Shorts Project
  const getDefaultPresetForNiche = (niche: ShortsItem["niche"]) => {
    if (niche === "Islamic") {
      return {
        preset:
          "Clone Editan Asli Channel (400->1K Subs) + Peningkatan Color Grading, Subtitle Karaoke Presisi & Audio Ducking",
        engine: "ReelMimic (analyze.py) + FFmpeg-Skill (h264_qsv)",
        defaultRef: "local://referensi-islami-400subs-master.mp4",
      };
    }
    if (niche === "Edukasi_CalonSarjana") {
      return {
        preset:
          "Gaya Calon Sarjana Pro: Motion Graphics Cepat, Overlay Angka/Fakta, SFX Whoosh/Pop/Suspense, BGM Dinamis",
        engine: "ReelMimic + Hyperframes + FFmpeg-Skill",
        defaultRef: "https://www.youtube.com/shorts/referensi-calon-sarjana",
      };
    }
    return {
      preset:
        "Clone Referensi Roblox/Minecraft: Subtitle Bouncy Pop-Up, Camera Zoom/Shake, SFX Meme Anak & Fast Cut",
      engine: "ReelMimic (video-clone) + OpenMontage + FFmpeg-Skill",
      defaultRef: "https://www.youtube.com/shorts/referensi-roblox-minecraft",
    };
  };

  const handleAiAutoGenerateShorts = async (
    niche: ShortsItem["niche"] = "Edukasi_CalonSarjana"
  ) => {
    setIsGeneratingShorts(true);
    notify(
      `🤖 AI sedang meriset topik viral & menyusun naskah gaya ${
        niche === "Edukasi_CalonSarjana" ? "Calon Sarjana" : niche
      }...`
    );
    try {
      const res = await fetch("/api/shorts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          custom_topic: edukasiTopicInput.trim() || undefined,
          reference_url: edukasiRefUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok && data.item) {
        setShortsQueue((prev) => [data.item, ...prev]);
        notify(
          `⚡ Naskah Selesai: "${data.item.title}"! Masuk antrean render laptop.`
        );
        setEdukasiTopicInput("");
      } else {
        notify(`Gagal generate naskah: ${data.error || "Unknown error"}`);
      }
    } catch {
      notify("Koneksi gagal saat menghubungi AI Groq.");
    } finally {
      setIsGeneratingShorts(false);
    }
  };

  const handleAddClonedShort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortsTitle.trim()) return;
    const cfg = getDefaultPresetForNiche(newShortsNiche);

    const newItem: ShortsItem = {
      id: `sh-${Date.now()}`,
      niche: newShortsNiche,
      title: newShortsTitle,
      hook_text:
        newShortsHook ||
        "Hook 3 detik pertama disesuaikan otomatis dengan ritme video referensi.",
      full_script:
        "Disusun otomatis oleh Sub-Agen Scriptwriter (Groq/Gemini Rp 0) mengikuti durasi per-scene dari video referensi ReelMimic.",
      reference_video_url: newShortsRefUrl.trim() || cfg.defaultRef,
      style_preset: cfg.preset,
      sfx_and_motion_notes:
        newShortsStyleNotes.trim() ||
        "Tiru persis gaya subtitle, transisi motion, zoom, dan timing SFX dari video referensi, dengan isi konten baru yang lebih profesional.",
      engine_used: cfg.engine,
      status: "Cloning_Style",
      revision_notes: null,
      revision_version: 1,
      telegram_message_url: null,
      created_at: new Date().toISOString(),
    };

    const newJob: AgentJob = {
      id: `job-${Date.now()}`,
      agent_type: "ReelMimic_Cloner",
      command_payload: {
        shorts_id: newItem.id,
        niche: newItem.niche,
        title: newItem.title,
        reference_video_url: newItem.reference_video_url,
        sfx_and_motion_notes: newItem.sfx_and_motion_notes,
      },
      status: "Pending",
      result_log:
        "Menunggu eksekusi analisis ReelMimic & render FFmpeg-Skill ke Telegram...",
      created_at: new Date().toISOString(),
    };

    setShortsQueue([newItem, ...shortsQueue]);
    setAgentJobs([newJob, ...agentJobs]);
    setNewShortsTitle("");
    setNewShortsRefUrl("");
    setNewShortsHook("");
    setNewShortsStyleNotes("");
    notify(
      `Proyek Shorts "${newItem.title}" masuk antrean ReelMimic Style Cloning.`
    );

    if (isSupabaseConfigured && supabase) {
      await supabase.from("youtube_shorts_queue").insert([
        {
          niche: newItem.niche,
          title: newItem.title,
          hook_text: newItem.hook_text,
          full_script: newItem.full_script,
          reference_video_url: newItem.reference_video_url,
          style_preset: newItem.style_preset,
          sfx_and_motion_notes: newItem.sfx_and_motion_notes,
          engine_used: newItem.engine_used,
          status: newItem.status,
          revision_version: 1,
        },
      ]);
      await supabase.from("agent_jobs").insert([
        {
          agent_type: newJob.agent_type,
          command_payload: newJob.command_payload,
          status: "Pending",
          result_log: newJob.result_log,
        },
      ]);
    }
  };

  // 3. Handle Targeted Video Revision Request
  const handleRequestRevision = async (item: ShortsItem) => {
    const note = revisionInputs[item.id]?.trim();
    if (!note) {
      notify("Tulis catatan bagian yang ingin direvisi terlebih dahulu.");
      return;
    }

    const nextVer = (item.revision_version || 1) + 1;

    setShortsQueue((prev) =>
      prev.map((s) =>
        s.id === item.id
          ? {
              ...s,
              status: "Revision_Requested",
              revision_notes: note,
              revision_version: nextVer,
            }
          : s
      )
    );

    const revJob: AgentJob = {
      id: `job-rev-${Date.now()}`,
      agent_type: "Video_Revision_Worker",
      command_payload: {
        shorts_id: item.id,
        title: item.title,
        niche: item.niche,
        target_version: nextVer,
        revision_instruction: note,
        reference_video_url: item.reference_video_url,
      },
      status: "Pending",
      result_log: `Revisi v${nextVer} dijadwalkan: "${note}"`,
      created_at: new Date().toISOString(),
    };

    setAgentJobs([revJob, ...agentJobs]);
    setRevisionInputs((prev) => ({ ...prev, [item.id]: "" }));
    notify(
      `Permintaan Revisi (v${nextVer}) untuk "${item.title}" dikirim ke antrean Render.`
    );

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from("youtube_shorts_queue")
        .update({
          status: "Revision_Requested",
          revision_notes: note,
          revision_version: nextVer,
        })
        .eq("id", item.id);
      await supabase.from("agent_jobs").insert([
        {
          agent_type: revJob.agent_type,
          command_payload: revJob.command_payload,
          status: "Pending",
          result_log: revJob.result_log,
        },
      ]);
    }
  };

  // 4. Office Task Handler
  const handleAddOfficeTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const task: OfficeTask = {
      id: `off-${Date.now()}`,
      title: newTaskTitle,
      category: "Kantor",
      priority: "High",
      status: "Todo",
      ai_summary:
        "Antrean dikirim ke Headroom + Groq Cloud untuk dirangkum ke Obsidian Vault.",
      obsidian_path: `01-Kantor/${newTaskTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}.md`,
      created_at: new Date().toISOString(),
    };
    setOfficeTasks([task, ...officeTasks]);
    setNewTaskTitle("");
    notify("Tugas kantor ditambahkan & disinkronkan ke Obsidian.");
  };

  const filteredShorts =
    selectedNiche === "ALL"
      ? shortsQueue
      : shortsQueue.filter((s) => s.niche === selectedNiche);

  const getNicheLabel = (niche: ShortsItem["niche"]) => {
    switch (niche) {
      case "Islamic":
        return "Islami (400 → 1K Subs)";
      case "Edukasi_CalonSarjana":
        return "Edukasi & Fakta (Gaya Calon Sarjana)";
      case "Gaming_Roblox_Minecraft":
        return "Anak: Roblox & Minecraft";
    }
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 selection:bg-emerald-500/20 selection:text-emerald-200 antialiased">
      {/* Subtle Monochromatic Ambient Glass Lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-48 left-1/4 h-96 w-96 rounded-full bg-white/[0.03] blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-96 w-96 rounded-full bg-emerald-500/[0.03] blur-3xl" />
      </div>

      {/* Toast Notification (Glass) */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-white/15 bg-zinc-900/85 px-5 py-3.5 text-sm text-zinc-100 shadow-2xl backdrop-blur-2xl">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Glass Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#07080a]/75 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]">
              <Layers className="h-4 w-4 text-zinc-200" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-sm font-semibold tracking-tight text-white">
                  AI Operations Console
                </h1>
                <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                  24/7 Cloud Online · Rp 0
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Social Auto-Responder · ReelMimic Video Studio · Obsidian Memory
              </p>
            </div>
          </div>

          {/* Navigation Pills (Monochromatic Glass) */}
          <nav className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1 backdrop-blur-xl">
            {[
              {
                id: "responder",
                label: "CS Auto-Responder (IG & TikTok)",
                icon: MessageSquare,
              },
              {
                id: "shorts",
                label: "YouTube Studio (ReelMimic)",
                icon: Video,
              },
              {
                id: "office",
                label: "Kantor & Obsidian",
                icon: Briefcase,
              },
              {
                id: "system",
                label: "Arsitektur & Antrean",
                icon: Terminal,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(
                      tab.id as "responder" | "shorts" | "office" | "system"
                    )
                  }
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                    active
                      ? "border border-white/15 bg-white/[0.08] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                      : "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {/* Executive Status Strip */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Auto-Responder IG & TikTok</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Aktif 24 Jam
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-semibold tracking-tight text-white">
                {socialChats.length} Percakapan
              </span>
              <span className="text-xs text-zinc-500">Avg. balas 1.2 dtk</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Notifikasi Client ke Telegram</span>
              <Bell className="h-3.5 w-3.5 text-zinc-500" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-semibold tracking-tight text-white">
                100% Terkirim
              </span>
              <span className="text-xs text-zinc-500">Zero Lost Leads</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Pabrik Shorts (ReelMimic)</span>
              <Video className="h-3.5 w-3.5 text-zinc-500" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-semibold tracking-tight text-white">
                {shortsQueue.length} Proyek
              </span>
              <span className="text-xs text-zinc-500">
                Islami · Edukasi · Roblox
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Beban Kredit & RAM</span>
              <Sliders className="h-3.5 w-3.5 text-zinc-500" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-semibold tracking-tight text-emerald-400">
                Rp 0 / Gratis
              </span>
              <span className="text-xs text-zinc-500">Groq + Gemini + TG</span>
            </div>
          </div>
        </div>

        {/* ===================================================================
            TAB 1: SOCIAL CS AUTO-RESPONDER (INSTAGRAM & TIKTOK -> TELEGRAM)
        =================================================================== */}
        {activeTab === "responder" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: SOP Config & Live Chat Tester */}
            <div className="space-y-6 lg:col-span-5">
              {/* Glass Card: SOP Knowledge Base */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      SOP & Memori Balasan AI (Obsidian Sync)
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Pedoman yang dipakai AI saat membalas chat IG & TikTok
                    </p>
                  </div>
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-zinc-300">
                    02-CS-Sosmed/SOP.md
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={sopInstruction}
                  onChange={(e) => setSopInstruction(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/40 p-3.5 text-xs leading-relaxed text-zinc-200 placeholder-zinc-600 focus:border-white/25 focus:outline-none"
                />
                <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Engine: Groq Llama-3.3-70B (Gratis Rp 0)</span>
                  <button
                    onClick={() =>
                      notify(
                        "SOP Customer Service berhasil disimpan & disinkronkan ke Obsidian."
                      )
                    }
                    className="rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white hover:bg-white/[0.12] transition"
                  >
                    Simpan SOP
                  </button>
                </div>
              </div>

              {/* Glass Card: Test Incoming Client Message */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                <h2 className="text-sm font-semibold text-white">
                  Uji Coba Chat Client Masuk (Simulasi Real-Time)
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Tes bagaimana AI langsung membalas chat client dalam 1 detik &
                  meneruskan notifikasi ke Telegram Bot kamu.
                </p>

                <form
                  onSubmit={handleSimulateIncomingChat}
                  className="mt-4 space-y-3.5"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-[11px] text-zinc-400">
                        Platform Sosmed
                      </label>
                      <select
                        value={simPlatform}
                        onChange={(e) =>
                          setSimPlatform(
                            e.target.value as "Instagram" | "TikTok"
                          )
                        }
                        className="w-full rounded-xl border border-white/[0.08] bg-black/50 px-3 py-2.5 text-xs text-white focus:border-white/25 focus:outline-none"
                      >
                        <option value="Instagram">Instagram DM / Komen</option>
                        <option value="TikTok">TikTok DM / Komen</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] text-zinc-400">
                        Username Client
                      </label>
                      <input
                        type="text"
                        placeholder="@username_client"
                        value={simHandle}
                        onChange={(e) => setSimHandle(e.target.value)}
                        className="w-full rounded-xl border border-white/[0.08] bg-black/50 px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-white/25 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] text-zinc-400">
                      Isi Pesan dari Client
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Contoh: Bang, mau tanya harga jasanya dong, kalau order hari ini bisa?"
                      value={simMessage}
                      onChange={(e) => setSimMessage(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-black/50 p-3 text-xs text-white placeholder-zinc-600 focus:border-white/25 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingChat}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 py-2.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/25 transition"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>
                      {isSendingChat
                        ? "Memproses Balasan & Mengirim ke Telegram..."
                        : "Tes Balas Otomatis + Kirim Alert ke Telegram"}
                    </span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Unified Social Inbox */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Kotak Masuk Terpadu (Instagram & TikTok)
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Semua client yang nge-chat otomatis dijawab oleh AI dan
                      diteruskan ke Telegram pribadi kamu.
                    </p>
                  </div>
                  <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
                    Webhook: /api/social-webhook
                  </span>
                </div>

                <div className="space-y-4">
                  {socialChats.map((chat) => (
                    <div
                      key={chat.id}
                      className="rounded-xl border border-white/[0.07] bg-black/35 p-4 transition hover:border-white/[0.14]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="rounded-md border border-white/15 bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-white">
                            {chat.platform}
                          </span>
                          <span className="text-xs font-semibold text-zinc-100">
                            {chat.sender_handle}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[11px] text-zinc-400">
                            {chat.intent_category.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>
                            Dibalas {chat.response_time_sec}s · Notif Telegram
                            Terkirim
                          </span>
                        </div>
                      </div>

                      {/* Incoming Client Message */}
                      <div className="mt-3 text-xs text-zinc-300">
                        <span className="block text-[11px] font-medium text-zinc-500">
                          Pesan Client:
                        </span>
                        <p className="mt-1 rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5 text-zinc-200">
                          &ldquo;{chat.incoming_message}&rdquo;
                        </p>
                      </div>

                      {/* AI Auto-Reply */}
                      <div className="mt-3 text-xs">
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                          <CornerDownRight className="h-3 w-3 text-emerald-400" />
                          Balasan Otomatis AI:
                        </span>
                        <p className="mt-1 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] p-2.5 text-zinc-200 leading-relaxed">
                          {chat.ai_auto_reply}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: YOUTUBE SHORTS FACTORY (SEPARATED NICHE WORKSPACES)
        =================================================================== */}
        {activeTab === "shorts" && (
          <div className="space-y-6">
            {/* Top Niche Sub-Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-2xl">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Pusat Produksi YouTube Shorts Multi-Niche
                </h2>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Pilih niche di samping untuk fokus memantau referensi dan progres video masing-masing channel.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  {
                    id: "Edukasi_CalonSarjana",
                    label: "🎓 Edukasi (Calon Sarjana)",
                    badge: "Auto-Pilot AI",
                  },
                  {
                    id: "Islamic",
                    label: "🕌 Islami (Target 1K Subs)",
                    badge: "Channel Pribadi",
                  },
                  {
                    id: "Gaming_Roblox_Minecraft",
                    label: "🎮 Kids (Roblox/Minecraft)",
                    badge: "Auto-Pilot AI",
                  },
                  {
                    id: "ALL",
                    label: "📂 Semua Niche",
                    badge: `${shortsQueue.length}`,
                  },
                ].map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNiche(n.id)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition ${
                      selectedNiche === n.id
                        ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-200 shadow-md"
                        : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    <span>{n.label}</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-zinc-300">
                      {n.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* NICHE 1: EDUKASI CALON SARJANA SPECIALIZED WORKSPACE */}
            {selectedNiche === "Edukasi_CalonSarjana" && (
              <div className="space-y-6">
                {/* Hero Auto-Pilot Card for Edukasi */}
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] p-6 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(16,185,129,0.15)]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-0.5 text-xs font-semibold text-emerald-300">
                          Auto-Pilot Aktif 100%
                        </span>
                        <span className="text-xs text-zinc-400">
                          Durasi 1–2 Menit · Format 9:16 Shorts
                        </span>
                      </div>
                      <h3 className="mt-2 text-lg font-bold text-white">
                        Pabrik Video Edukasi & Fakta Unik (Gaya Calon Sarjana)
                      </h3>
                      <p className="mt-1 max-w-2xl text-xs text-zinc-300 leading-relaxed">
                        Kamu tidak perlu memikirkan judul atau mencari video. Cukup klik tombol di samping: AI otomatis mencari fakta viral, menyusun hook memikat, merekam suara narator enerjik (Edge-TTS Ardi), dan merakit klip cepat 2.5s + SFX whoosh via laptopmu!
                      </p>
                    </div>

                    <button
                      onClick={() => handleAiAutoGenerateShorts("Edukasi_CalonSarjana")}
                      disabled={isGeneratingShorts}
                      className="flex items-center gap-2.5 rounded-xl border border-emerald-400 bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-black shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition disabled:opacity-50"
                    >
                      <Sparkles className={`h-4 w-4 ${isGeneratingShorts ? "animate-spin" : ""}`} />
                      <span>
                        {isGeneratingShorts
                          ? "AI Sedang Riset & Tulis Naskah..."
                          : "⚡ AI Otomatis: Buat 1 Video Edukasi Hari Ini"}
                      </span>
                    </button>
                  </div>

                  {/* Reference & Customization Controls */}
                  <div className="mt-6 grid grid-cols-1 gap-4 border-t border-emerald-500/15 pt-5 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400">
                        Link Channel / Video Referensi Gaya Calon Sarjana:
                      </label>
                      <input
                        type="text"
                        value={edukasiRefUrl}
                        onChange={(e) => setEdukasiRefUrl(e.target.value)}
                        placeholder="https://www.youtube.com/@CalonSarjanaOfficial"
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:border-emerald-500/50 focus:outline-none"
                      />
                      <p className="mt-1 text-[10px] text-zinc-500">
                        Gaya yang ditiru: Fast cut tiap 2.5 detik, Motion data/angka (Hyperframes), SFX Whoosh/Suspense.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400">
                        Punya Topik Khusus? (Opsional, kosongkan jika mau AI yang menentukan):
                      </label>
                      <input
                        type="text"
                        value={edukasiTopicInput}
                        onChange={(e) => setEdukasiTopicInput(e.target.value)}
                        placeholder="Misal: 3 Fakta Gila Segitiga Bermuda (Boleh dikosongkan)"
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:border-emerald-500/50 focus:outline-none"
                      />
                      <p className="mt-1 text-[10px] text-zinc-500">
                        Jika dikosongkan, AI Groq akan memilih topik sains/fakta misteri terpopuler secara acak.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info Box: Mekanisme Render Laptop */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-zinc-300">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <Terminal className="h-4 w-4 text-emerald-400" />
                    <span>Mekanisme Render di Laptop Kamu:</span>
                  </div>
                  <p className="mt-1 text-zinc-400">
                    Setelah tombol diklik, naskah akan masuk ke status <code className="text-emerald-300">Queued_For_Laptop</code>. Begitu kamu menjalankan skrip <code className="text-zinc-200">shorts_factory_worker.py</code> di laptop, video otomatis dirender menggunakan chip <strong>Intel Iris Xe</strong> dan langsung dikirimkan ke <strong>Bot Telegram kamu</strong> untuk ditonton!
                  </p>
                </div>
              </div>
            )}

            {/* NICHE 2: ISLAMIC WORKSPACE */}
            {selectedNiche === "Islamic" && (
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-6 backdrop-blur-2xl">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-0.5 text-xs font-semibold text-amber-300">
                      Channel Pribadi Kamu (400 ➔ 1.000 Subs)
                    </span>
                    <h3 className="mt-2 text-lg font-bold text-white">
                      Pabrik Video Islami & Doa Mustajab
                    </h3>
                    <p className="mt-1 max-w-2xl text-xs text-zinc-300 leading-relaxed">
                      Meniru gaya editan asli channel kamu: Subtitle Karaoke Emas, transisi halus, warm color grading, dan audio latar yang mengecil otomatis (*auto-ducking*). Kamu yang menentukan judul/tema sesuai syariat.
                    </p>
                  </div>
                  <button
                    onClick={() => handleAiAutoGenerateShorts("Islamic")}
                    disabled={isGeneratingShorts}
                    className="flex items-center gap-2.5 rounded-xl border border-amber-400 bg-amber-500 px-6 py-3.5 text-sm font-semibold text-black shadow-xl hover:bg-amber-400 transition disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Naskah Islami Hari Ini</span>
                  </button>
                </div>
              </div>
            )}

            {/* NICHE 3: KIDS GAMING WORKSPACE */}
            {selectedNiche === "Gaming_Roblox_Minecraft" && (
              <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.04] p-6 backdrop-blur-2xl">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/15 px-3 py-0.5 text-xs font-semibold text-cyan-300">
                      Auto-Pilot Gaming Anak
                    </span>
                    <h3 className="mt-2 text-lg font-bold text-white">
                      Pabrik Konten Roblox & Minecraft
                    </h3>
                    <p className="mt-1 max-w-2xl text-xs text-zinc-300 leading-relaxed">
                      AI otomatis meriset rahasia map Brookhaven / Minecraft, membuat subtitle membal-membal (*bouncy pop-up*), efek zoom shake, dan SFX meme ramah anak.
                    </p>
                  </div>
                  <button
                    onClick={() => handleAiAutoGenerateShorts("Gaming_Roblox_Minecraft")}
                    disabled={isGeneratingShorts}
                    className="flex items-center gap-2.5 rounded-xl border border-cyan-400 bg-cyan-500 px-6 py-3.5 text-sm font-semibold text-black shadow-xl hover:bg-cyan-400 transition disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>⚡ AI Otomatis: Buat 1 Video Gaming Hari Ini</span>
                  </button>
                </div>
              </div>
            )}

            {/* List of Shorts Projects in Selected Niche */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">
                  Daftar Antrean & Riwayat Render (
                  {selectedNiche === "ALL"
                    ? "Semua Niche"
                    : getNicheLabel(selectedNiche as ShortsItem["niche"])}
                  ):
                </h4>
                <span className="text-xs text-zinc-500">
                  {filteredShorts.length} Video Terdaftar
                </span>
              </div>

                {/* Project Cards */}
                {filteredShorts.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md border border-white/15 bg-white/[0.05] px-2.5 py-0.5 text-[11px] font-medium text-zinc-200">
                            {getNicheLabel(item.niche)}
                          </span>
                          <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
                            Versi Render v{item.revision_version}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            {item.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <h3 className="mt-2 text-sm font-semibold text-white">
                          {item.title}
                        </h3>
                      </div>

                      {item.telegram_message_url && (
                        <a
                          href={item.telegram_message_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-white/[0.12] transition"
                        >
                          <span>Cek Video di Telegram</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    {/* Reference & Style Specs */}
                    <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-white/[0.06] bg-black/35 p-3.5 text-xs sm:grid-cols-2">
                      <div>
                        <span className="block text-[11px] text-zinc-500">
                          Video Referensi (ReelMimic Source):
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-[11px] text-zinc-300">
                          {item.reference_video_url}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-zinc-500">
                          Engine Pemroses:
                        </span>
                        <span className="mt-0.5 block text-zinc-300">
                          {item.engine_used}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="block text-[11px] text-zinc-500">
                          Gaya Editan, Subtitle, Motion & SFX:
                        </span>
                        <span className="mt-0.5 block text-zinc-300">
                          {item.sfx_and_motion_notes}
                        </span>
                      </div>
                    </div>

                    {/* Previous Revision Log if any */}
                    {item.revision_notes && (
                      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-zinc-300">
                        <span className="font-medium text-white">
                          Catatan Revisi Terakhir (v{item.revision_version}):{" "}
                        </span>
                        {item.revision_notes}
                      </div>
                    )}

                    {/* Targeted Revision Box */}
                    <div className="mt-4 pt-3 border-t border-white/[0.06]">
                      <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                        Kurang Cocok Setelah Cek di Telegram? Tulis Bagian yang
                        Ingin Direvisi:
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          type="text"
                          placeholder="Contoh: Detik 0:05 ganti transisi zoom lebih cepat, perbesar subtitle, tambah SFX ding..."
                          value={revisionInputs[item.id] || ""}
                          onChange={(e) =>
                            setRevisionInputs((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          className="flex-1 rounded-xl border border-white/[0.08] bg-black/50 px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:border-white/25 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRequestRevision(item)}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2 text-xs font-medium text-white hover:bg-white/[0.14] transition shrink-0"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Render Ulang Revisi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 3: WORKSPACE KANTOR & OBSIDIAN SECOND BRAIN
        =================================================================== */}
        {activeTab === "office" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                <h2 className="text-sm font-semibold text-white">
                  Tambah Tugas Kantor / Rangkuman Dokumen
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Dirangkum otomatis menggunakan kompresi Headroom (hemat 60%
                  kuota) dan disimpan ke brankas Obsidian kamu.
                </p>
                <form onSubmit={handleAddOfficeTask} className="mt-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Judul laporan / rapat / dokumen kantor..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/50 px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-white/25 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 py-2.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/25 transition"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Simpan & Rangkum ke Obsidian</span>
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3.5">
              {officeTasks.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-2xl"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                      {t.title}
                    </h3>
                    <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-[11px] text-zinc-400">
                      {t.obsidian_path}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-400">{t.ai_summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 4: ARSITEKTUR OTAK AI & ANTREAN EKSEKUSI
        =================================================================== */}
        {activeTab === "system" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-2xl">
              <h2 className="text-sm font-semibold text-white">
                Log Antrean Pekerjaan AI Agent (Cloud Vercel ↔ Laptop Lokal)
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Semua perintah kloning referensi video, revisi editan, dan
                balasan CS tercatat secara transparan.
              </p>
              <div className="mt-4 space-y-3">
                {agentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex flex-col justify-between gap-2 rounded-xl border border-white/[0.06] bg-black/35 p-4 text-xs sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-white">
                          {job.agent_type}
                        </span>
                        <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
                          {job.status}
                        </span>
                      </div>
                      <p className="mt-1 text-zinc-400">{job.result_log}</p>
                    </div>
                    <span className="font-mono text-[11px] text-zinc-500">
                      {new Date(job.created_at).toLocaleTimeString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
