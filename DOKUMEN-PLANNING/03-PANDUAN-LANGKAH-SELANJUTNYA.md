# 🗺️ PANDUAN LENGKAP & CHECKLIST EKSEKUSI (`D:\AI-Empire-System`)

Dokumen ini merangkum **apa yang sudah selesai dibangun 100%** dan **langkah-langkah berurutan yang perlu kamu lakukan** untuk mengoperasikan sistem 3 Sumber Penghasilan ini sehari-hari.

---

## ✅ BAGIAN 1: Apa Saja yang Sudah Selesai Kita Bangun?

1. **Pemindahan Penuh ke Disk D (`D:\AI-Empire-System`) — Beban Disk C: 0 MB**
   - **`repos-core/` (7 Repositori Infrastruktur AI):**
     `headroom`, `obsidian-local-rest-api`, `everything-claude-code`, `build-ai-agents-free`, `anthropic-cookbook`, `awesome-mcp-servers`, `awesome-claude-code-subagents`.
   - **`repos-video/` (8 Repositori Pabrik Video & UMKM):**
     `ffmpeg-skill`, `reelmimic`, `short-video-generator-AI`, `OpenMontage`, `autoshorts`, `hyperframes`, `WeftCut`, `Recordly`.

2. **Aplikasi Command Center Dashboard (`D:\AI-Empire-System\ai-empire-dashboard`)**
   - Dashboard Next.js + Tailwind CSS + Supabase (`src/app/page.tsx`).
   - Preview Instan 0 MB RAM (`preview-dashboard-instan.html`).
   - Skema SQL 5 Tabel Inti Supabase (`supabase/schema.sql`).
   - Vercel Cron Job Anti-Pause 7 Hari (`src/app/api/cron/daily-briefing/route.ts`).
   - 10 Skill Agen AI yang sudah terpasang di `.agents/skills/`.

3. **Mesin Eksekutor Lokal (`local-agent-bridge/agent_bridge.py`)**
   - Menghubungkan **Supabase $\leftrightarrow$ Telegram Video Cloud $\leftrightarrow$ Obsidian Vault $\leftrightarrow$ FFmpeg-Skill & Generator Web UMKM**.
   - Sudah berhasil menghasilkan 3 Website Klien UMKM siap pakai di folder `umkm-demos/`.

---

## 🚀 BAGIAN 2: Urutan Langkah yang Harus Kita Lakukan Sekarang

### Langkah 1: Aktifkan Otak AI Cloud Gratis (Groq / Gemini — 2 Menit, Rp 0)
Agar laptop MSI Modern 14 (RAM 8GB) tidak pernah hang karena menjalankan AI lokal:
1. Ambil API Key gratis dari **Groq Cloud** (`console.groq.com`) atau **Google AI Studio** (`aistudio.google.com`).
2. Salin file `D:\AI-Empire-System\ai-empire-dashboard\.env.example` menjadi `.env.local`, lalu tempelkan `GROQ_API_KEY` dan/atau `GEMINI_API_KEY`.

### Langkah 2: Aktifkan Penyimpanan Video Gratis Unlimited di Telegram (3 Menit, Rp 0)
Agar SSD laptop tidak pernah penuh oleh video `.mp4`:
1. Buka aplikasi Telegram, cari **`@BotFather`**, ketik `/newbot`, lalu salin `TELEGRAM_BOT_TOKEN`.
2. Buat **Channel Pribadi (Private Channel)** baru di Telegram (misal: *"Gudang Video AI Empire"*), masukkan Bot tadi sebagai **Admin**.
3. Isi `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHANNEL_ID` ke dalam file `.env.local`.

### Langkah 3: Aktifkan Database Gratis Supabase (5 Menit, Rp 0)
Agar data tugas kantor, CRM klien UMKM, dan antrean YouTube Shorts tersimpan di Cloud dan bisa dikontrol dari HP:
1. Buat akun & proyek gratis di `supabase.com`.
2. Buka menu **SQL Editor** di Supabase, salin seluruh isi file `D:\AI-Empire-System\ai-empire-dashboard\supabase\schema.sql`, lalu klik **Run**.
3. Ambil `Project URL` dan `anon public key` dari menu *Project Settings > API*, lalu masukkan ke `.env.local`.

### Langkah 4: Deploy Dashboard ke Vercel Gratis (3 Menit, Rp 0)
Agar kamu bisa membuka Dashboard dari HP saat sedang bekerja di kantor (tanpa perlu menyalakan server lokal di laptop):
1. Upload folder `ai-empire-dashboard` ke GitHub atau jalankan perintah `vercel` dari terminal.
2. Masukkan variabel `.env.local` tadi ke menu *Environment Variables* di Vercel.

### Langkah 5: Hubungkan Aplikasi Obsidian sebagai "Otak Kedua"
1. Buka aplikasi **Obsidian**, klik *Open folder as vault*, lalu pilih folder **`D:\AI-Empire-System\obsidian-vault-backup`**.
2. Seluruh laporan riset kantor, data prospek UMKM, dan naskah YouTube Shorts otomatis tersusun rapi di dalamnya!

