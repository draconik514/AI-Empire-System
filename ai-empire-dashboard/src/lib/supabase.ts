import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseAnonKey) &&
  !supabaseUrl.includes("your-project-id");

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface OfficeTask {
  id: string;
  title: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  status: "Todo" | "In Progress" | "Done";
  ai_summary: string;
  obsidian_path: string;
  created_at: string;
}

export interface SocialChatLead {
  id: string;
  platform: "Instagram" | "TikTok";
  sender_handle: string;
  sender_name: string;
  incoming_message: string;
  ai_auto_reply: string;
  intent_category: "Tanya_Harga" | "Siap_Order" | "Konsultasi" | "Follow_Up";
  status: "Auto_Replied" | "Notified_Telegram" | "Manual_Takeover" | "Closed_Won";
  telegram_notified: boolean;
  response_time_sec: number;
  created_at: string;
}

export interface ShortsItem {
  id: string;
  niche: "Islamic" | "Edukasi_CalonSarjana" | "Gaming_Roblox_Minecraft";
  title: string;
  hook_text: string;
  full_script: string;
  reference_video_url: string;
  style_preset: string;
  sfx_and_motion_notes: string;
  engine_used: string;
  status:
    | "Draft_Script"
    | "Cloning_Style"
    | "Rendering"
    | "Review_in_Telegram"
    | "Revision_Requested"
    | "Approved_Ready";
  revision_notes: string | null;
  revision_version: number;
  telegram_message_url: string | null;
  created_at: string;
}

export interface AgentJob {
  id: string;
  agent_type:
    | "Social_CS_Responder"
    | "ReelMimic_Cloner"
    | "Video_Revision_Worker"
    | "Obsidian_Sync";
  command_payload: Record<string, unknown>;
  status: "Pending" | "Running_on_Laptop" | "Completed" | "Failed";
  result_log: string;
  created_at: string;
}

export const INITIAL_OFFICE_TASKS: OfficeTask[] = [
  {
    id: "off-1",
    title: "Rangkum Dokumen Rapat Mingguan & Action Items",
    category: "Kantor",
    priority: "High",
    status: "In Progress",
    ai_summary:
      "Kompresi Headroom (62%) selesai. 4 poin keputusan utama disimpan ke Obsidian Vault.",
    obsidian_path: "01-Kantor/Laporan-Mingguan.md",
    created_at: new Date().toISOString(),
  },
  {
    id: "off-2",
    title: "Ekstraksi Poin Penting SOP Proyek Baru",
    category: "Kantor",
    priority: "Medium",
    status: "Todo",
    ai_summary:
      "Siap diproses via Groq Llama-3.3-70B Free API dan disinkronkan ke memori Obsidian.",
    obsidian_path: "01-Kantor/SOP-Proyek.md",
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_SOCIAL_CHATS: SocialChatLead[] = [
  {
    id: "chat-1",
    platform: "Instagram",
    sender_handle: "@putri.alv",
    sender_name: "Putri Alviana",
    incoming_message:
      "Kak, aku mau cari kado ulang tahun digital buat pacarku yang ada tiup lilin pakai mikrofon sama scrapbook Canva yang murah dong, berapa harganya?",
    ai_auto_reply:
      "Halo Kak Putri! ✨ Untuk kado ultah digital yang ada fitur Tiup Lilin lewat Mikrofon HP + Lagu Ultah Otomatis, Kakak bisa pilih Web BirthdayNest Siap Pakai (Rp 25.000, proses maks 2x24 jam): https://lynk.id/at_heart.digital/e7v6xgwd6o7v atau Source Code Birthday Cake Virtual (Rp 10.000): https://lynk.id/at_heart.digital/xkxm6xx88m9k. Sedangkan untuk Scrapbook Canva Ultah mulai Rp 5.000 aja di https://lynk.id/at_heart.digital/dnozx01gj637 💖",
    intent_category: "Tanya_Harga",
    status: "Notified_Telegram",
    telegram_notified: true,
    response_time_sec: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "chat-2",
    platform: "TikTok",
    sender_handle: "@nadia_couple",
    sender_name: "Nadia Putri",
    incoming_message:
      "Kak aku mau beli Our Story Scrapbook yang Rp 10.000 tapi aku ga punya Canva Pro gimana ya?",
    ai_auto_reply:
      "Halo Kak Nadia! Tenang aja Kak, khusus pembelian Our Story Scrapbook (Rp 10.000) atau Sweet Anniversary Scrapbook (Rp 10.000), kalau Kakak tidak punya akun Canva Pro, kami berikan GRATIS jasa bantu edit scrapbooknya lewat DM! Kakak bisa langsung checkout via QRIS/DANA di https://lynk.id/at_heart.digital/ejo6k81ol6el ya ✨",
    intent_category: "Siap_Order",
    status: "Notified_Telegram",
    telegram_notified: true,
    response_time_sec: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "chat-3",
    platform: "Instagram",
    sender_handle: "@angga_prtm",
    sender_name: "Angga Pratama",
    incoming_message:
      "Bang kalau yang bunga mawar 3D buat nembak/lamar pacar yang tombol No nya bisa kabur itu berapa?",
    ai_auto_reply:
      "Halo Kak Angga! Itu produk Source Code Bunga Virtual 'Romantic Rose Proposal' kami, harganya lagi promo cuma Rp 10.000 aja (dari Rp 15.000). Sudah lengkap animasi 3 mawar 3D, langit berbintang, cincin glowing, dan tombol 'No' yang menghindar otomatis. Langsung order instan di sini ya Kak: https://lynk.id/at_heart.digital/yyopdqznv6zk 🌹✨",
    intent_category: "Tanya_Harga",
    status: "Auto_Replied",
    telegram_notified: true,
    response_time_sec: 1,
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_SHORTS_QUEUE: ShortsItem[] = [
  {
    id: "sh-1",
    niche: "Islamic",
    title: "3 Waktu Singkat Saat Doa Tidak Tertolak (Target 400 -> 1K Subs)",
    hook_text:
      "Jangan lewatkan 3 waktu singkat ini, karena pintu langit sedang terbuka lebar...",
    full_script:
      "1. Sepertiga malam terakhir saat tahajud. 2. Saat sujud dalam sholat. 3. Di antara adzan dan iqamah. Yuk amalkan hari ini dan bagikan ke orang yang kamu sayangi.",
    reference_video_url: "local://referensi-islami-400subs-master.mp4",
    style_preset:
      "Clone Editan Asli Channel (Font Karaoke Emas/Putih + Color Grading Hangat + Auto-Ducking BGM Menyentuh)",
    sfx_and_motion_notes:
      "Ikuti pacing potongan video referensi 400 subs + tambah transisi zoom halus & glow subtitle lebih profesional.",
    engine_used: "ReelMimic (analyze.py) + FFmpeg-Skill (h264_qsv)",
    status: "Review_in_Telegram",
    revision_notes: null,
    revision_version: 1,
    telegram_message_url: "https://t.me/c/123456789/201",
    created_at: new Date().toISOString(),
  },
  {
    id: "sh-2",
    niche: "Edukasi_CalonSarjana",
    title: "3 Fakta Gila di Dasar Palung Mariana yang Jarang Diketahui Manusia!",
    hook_text:
      "Kalau Gunung Everest dimasukkan ke jurang laut ini, puncaknya masih tenggelam 2 kilometer!",
    full_script:
      "Inilah Palung Mariana! Di kedalaman 11.000 meter, tekanannya setara dengan 50 pesawat jet menindih tubuhmu. Namun ilmuwan justru menemukan makhluk bercahaya yang hidup tanpa sinar matahari sama sekali!",
    reference_video_url: "https://www.youtube.com/shorts/calon-sarjana-ref-style",
    style_preset:
      "Gaya Calon Sarjana Pro (Motion Graphics Cepat + Overlay Data/Angka + SFX Whoosh/Pop/Suspense + Dynamic Zoom)",
    sfx_and_motion_notes:
      "Wajib ada transisi cepat tiap 2.5 detik, efek suara whoosh saat pergantian gambar, counter angka animasi, dan BGM misteri/fakta.",
    engine_used: "ReelMimic + Hyperframes + FFmpeg-Skill",
    status: "Review_in_Telegram",
    revision_notes:
      "Detik 0:04 efek suara whoosh kurang kencang, dan ukuran teks fakta nomor 2 diperbesar 15%.",
    revision_version: 2,
    telegram_message_url: "https://t.me/c/123456789/205",
    created_at: new Date().toISOString(),
  },
  {
    id: "sh-3",
    niche: "Gaming_Roblox_Minecraft",
    title: "Rahasia Pintu Terlarang di Brookhaven Roblox yang Bikin Kaget!",
    hook_text:
      "Jangan pernah masuk ke ruangan rahasia di Roblox ini kalau kamu belum tahu triknya!",
    full_script:
      "Banyak pemain lewat begitu saja di depan tembok ini. Padahal kalau kamu ambil item obor lalu lompat 3 kali di pojok kanan, pintu rahasia bawah tanah langsung terbuka! Coba tebak apa isi di dalamnya?",
    reference_video_url: "https://www.youtube.com/shorts/roblox-minecraft-ref-viral",
    style_preset:
      "Clone Referensi Gaming Anak (Subtitle Bouncy Pop-Up + Zoom Shake + SFX Meme Ramah Anak + Fast Cut)",
    sfx_and_motion_notes:
      "Tiru persis gaya subtitle, letak zoom, dan ritme SFX dari link referensi Roblox/Minecraft, ganti isi cerita & gameplay baru.",
    engine_used: "ReelMimic (video-clone) + OpenMontage + FFmpeg-Skill",
    status: "Cloning_Style",
    revision_notes: null,
    revision_version: 1,
    telegram_message_url: null,
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_AGENT_JOBS: AgentJob[] = [
  {
    id: "job-1",
    agent_type: "Social_CS_Responder",
    command_payload: {
      platform: "Instagram & TikTok",
      lead: "@nadia_beautycare",
      action: "Auto-Reply 1 detik + Kirim Alert Client Baru ke Telegram Bot",
    },
    status: "Completed",
    result_log:
      "Pesan TikTok dibalas otomatis sesuai SOP Obsidian. Alert prioritas terkirim ke Telegram Bot.",
    created_at: new Date().toISOString(),
  },
  {
    id: "job-2",
    agent_type: "ReelMimic_Cloner",
    command_payload: {
      shorts_id: "sh-1",
      niche: "Islamic",
      reference: "local://referensi-islami-400subs-master.mp4",
      action: "Clone Style Video 400 Subs + Tingkatkan Motion/Audio + Kirim ke Telegram",
    },
    status: "Completed",
    result_log:
      "Video selesai di-render (v1) mengikuti gaya referensi + peningkatan audio ducking. Terkirim ke Telegram.",
    created_at: new Date().toISOString(),
  },
];
