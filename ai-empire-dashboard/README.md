# 🏛️ AI Empire Command Center (`ai-empire-dashboard`)

Sistem kendali terpusat (**1 Dashboard untuk 3 Sumber Penghasilan**) yang dirancang khusus untuk:
1. **🏢 Pekerjaan Kantoran** (Manajemen tugas harian, rangkuman dokumen via `Headroom` + AI Gratis, sinkronisasi otomatis ke **Obsidian**).
2. **🌐 Agensi Freelance Web UMKM** (CRM prospek Instagram, generator demo website UMKM kilat, dan integrasi video demo **Recordly**).
3. **🎬 Pabrik Ternak YouTube Shorts Multi-Niche** (Niche **Islami**, **Edukasi**, serta **Anak <7 Tahun & >7 Tahun** menggunakan kombinasi 9 repositori video open-source + penyimpanan video gratis tak terbatas di **Telegram Cloud**).

---

## 📂 Struktur Folder Proyek

- `src/app/page.tsx` — Aplikasi utama **Command Center Dashboard** (Siap di-deploy gratis ke **Vercel**).
- `src/app/api/cron/daily-briefing/route.ts` — **Vercel Cron Job** otomatis setiap pagi agar database **Supabase Free Tier** menyala 24/7 selamanya (Anti Auto-Pause 7 Hari) & menyiapkan ide konten harian.
- `supabase/schema.sql` — Skema SQL 5 tabel inti + data awal (*seed data*) siap pakai untuk **Supabase SQL Editor**.
- `local-agent-bridge/agent_bridge.py` & `start-agent-bridge.bat` — Jembatan eksekutor lokal di laptop MSI Modern 14 (RAM 8GB Safe Mode) yang menghubungkan **Supabase $\leftrightarrow$ Telegram Bot $\leftrightarrow$ Obsidian REST API $\leftrightarrow$ FFmpeg Intel QuickSync (`h264_qsv`)**.
- `agents/` — Profil Sub-Agen spesialis berstandar `ECC` & `awesome-claude-code-subagents`.

---

## 🚀 Cara Menjalankan & Deploy (Langkah Demi Langkah)

### 1. Uji Coba Langsung Jembatan Agen Lokal (Beban RAM < 30 MB)
Klik 2x file `local-agent-bridge\start-agent-bridge.bat` atau jalankan lewat terminal:
```powershell
python local-agent-bridge/agent_bridge.py
```

### 2. Setup Database Gratis di Supabase (5 Menit)
1. Buat akun & proyek gratis di [supabase.com](https://supabase.com).
2. Buka menu **SQL Editor**, salin seluruh isi file `supabase/schema.sql`, lalu klik **Run**.
3. Salin `Project URL` dan `anon public key` dari menu *Project Settings > API* ke dalam file `.env.local` (gunakan `.env.example` sebagai contoh).

### 3. Setup Penyimpanan Video Gratis Unlimited di Telegram (3 Menit)
1. Buka aplikasi Telegram, cari `@BotFather`, ketik `/newbot` untuk mendapatkan `TELEGRAM_BOT_TOKEN`.
2. Buat **Channel Pribadi (Private Channel)** di Telegram, masukkan Bot kamu sebagai **Admin**, lalu isi `TELEGRAM_CHANNEL_ID` di `.env.local`.

### 4. Deploy Dashboard ke Vercel (Agar Beban Server di Laptop = 0 MB!)
Upload folder ini ke GitHub dan *import* ke **Vercel**, atau gunakan Vercel CLI. Setelah online di Vercel, kamu bisa mengontrol seluruh bisnis dan menyetujui naskah Shorts langsung dari **HP saat sedang di kantor**!

