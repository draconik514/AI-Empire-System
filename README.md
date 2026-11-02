# 👑 MASTER ARCHIVE & DOKUMENTASI LENGKAP: AI EMPIRE SYSTEM (2026)

> **Catatan Pengembang:** Dokumen ini adalah cetak biru (*blueprint*) dan panduan teknis langkah-demi-langkah dari awal sampai akhir pembangunan **AI Empire System** milik **@draconik514**. Dibuat sangat detail agar dapat direkonstruksi kapan saja secara mandiri dari nol tanpa kehilangan satu pun konfigurasi.

---

## 📑 DAFTAR ISI
1. [Arsitektur & Spesifikasi Sistem](#1-arsitektur--spesifikasi-sistem)
2. [Ekosistem Kunci & Konfigurasi Lingkungan (.env.local)](#2-ekosistem-kunci--konfigurasi-lingkungan-envlocal)
3. [Divisi CS Client Auto-Responder (Instagram DM & Telegram)](#3-divisi-cs-client-auto-responder-instagram-dm--telegram)
4. [Divisi Pabrik YouTube Shorts Islamic (Z-Code Auto-Editor)](#4-divisi-pabrik-youtube-shorts-islamic-z-code-auto-editor)
5. [Infrastruktur Dashboard & Localhost Bridge](#5-infrastruktur-dashboard--localhost-bridge)
6. [Riwayat Masalah Kritis & Solusi Teknis (Troubleshooting)](#6-riwayat-masalah-kritis--solusi-teknis-troubleshooting)
7. [Panduan Operasional Sehari-hari (Standard Operating Procedure)](#7-panduan-operasional-sehari-hari-standard-operating-procedure)

---

## 1. ARSITEKTUR & SPESIFIKASI SISTEM

### A. Konsep Dasar & Prinsip Desain
- **Modal Rp 0 Cloud GPU:** Rendering video berat dan ekstraksi audio tidak mengandalkan GPU Cloud berbayar, melainkan memanfaatkan akselerasi prosesor lokal laptop **MSI Modern 14 (Intel Iris Xe)**.
- **Dua Portal Terpadu:**
  - **Online Dashboard (Vercel Serverless):** Mengelola database cloud Supabase, monitoring CS leads, serta Webhook Meta 24 jam nonstop.
  - **Localhost Command Center (`http://localhost:3000`):** Menjalankan pipeline video upload besar (tanpa batasan payload 4.5 MB Vercel), auto-crop 9:16, FFmpeg hardware render, transkrip Whisper, hingga auto-cleanup storage.

---

## 2. EKOSISTEM KUNCI & KONFIGURASI LINGKUNGAN (.env.local)

File konfigurasi utama terletak di: `d:\AI-Empire-System\ai-empire-dashboard\.env.local`

### Parameter Konfigurasi Inti (Template):
```ini
# ============================================================================
# 1. TELEGRAM BOT (Notifikasi & Pengiriman Video Hasil Render)
# ============================================================================
TELEGRAM_BOT_TOKEN="<TELEGRAM_BOT_TOKEN_RAHASIA>"
TELEGRAM_CHANNEL_ID="<TELEGRAM_CHAT_ID>"

# ============================================================================
# 2. OTAK AI GRATIS RP 0 (CS Chat & Transkripsi Audio Whisper)
# ============================================================================
GROQ_API_KEY="<GROQ_API_KEY_RAHASIA>"
GEMINI_API_KEY="<GEMINI_API_KEY_RAHASIA>"

# ============================================================================
# 3. SUPABASE CLOUD DATABASE (Tabel Antrean Video & Riwayat CS Leads)
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL="https://nktfkwwrtuwqvtkcrnra.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<SUPABASE_ANON_KEY>"
SUPABASE_SERVICE_ROLE_KEY="<SUPABASE_SERVICE_ROLE_KEY>"

# ============================================================================
# 4. INSTAGRAM DM & META DEVELOPER GRAPH API (@at_heart.digital)
# ============================================================================
SOCIAL_WEBHOOK_VERIFY_TOKEN="verifikasi_cs_ai_2026"
INSTAGRAM_ACCESS_TOKEN="<INSTAGRAM_GRAPH_API_TOKEN>"
BUSINESS_SOP_PROMPT="Jawab dengan ramah, sopan, dan cepat sesuai katalog @at_heart.digital. Untuk pemesanan Website BirthdayNest atau HeartNest, arahkan isi Google Form dulu dan bayar setelah website jadi."

# ============================================================================
# 5. INTEGRASI OBSIDIAN LOCAL & CRON
# ============================================================================
OBSIDIAN_API_URL="http://127.0.0.1:27123"
OBSIDIAN_API_KEY="your_obsidian_local_rest_api_key"
CRON_SECRET="rahasia_cron_morning_briefing_2026"
```

---

## 3. DIVISI CS CLIENT AUTO-RESPONDER (INSTAGRAM DM & TELEGRAM)

### A. Alur Kerja Meta Developer & Webhook
1. **Penerimaan Pesan:** Calon pembeli mengirim DM ke Instagram `@at_heart.digital`.
2. **Meta Graph Webhook:** Server Meta mengirim notifikasi instan ke endpoint:
   `https://ai-empire-dashboard.vercel.app/api/social-webhook`
3. **Penyaringan Intent & SOP:**
   - AI membaca pertanyaan (misal tanya produk *BirthdayNest*, *Romantic Rose*, atau *Scrapbook Canva*).
   - Menghasilkan jawaban otomatis sopan dengan link checkout Lynk.id terkait.
   - Aturan khusus: Pemesanan custom website diarahkan mengisi formulir Google Form, dengan sistem pembayaran **setelah website jadi**.
4. **Notifikasi ke HP:** Setiap kali ada chat masuk, bot Telegram `@cs_bisnisku_2026_bot` otomatis memberi tahu pemilik akun secara *real-time*.

---

## 4. DIVISI PABRIK YOUTUBE SHORTS ISLAMIC (Z-CODE AUTO-EDITOR)

Fitur ini fokus untuk mendongkrak channel **@islamic-short-513** (Target: 465 ➔ 10.000 Subs). Seluruh logika master berada di:
`D:\AI-Empire-System\ai-empire-dashboard\local-agent-bridge\build_zcode_perfect_pipeline.py`

### Komponen Teknis Pipeline:
1. **Auto-Framing 9:16 (Smart Face Tracking):**
   - Mendeteksi rasio video landscape (16:9), memotong bagian tengah pembicara secara proporsional (`crop=606:1078:650:0`) lalu di-scale menjadi `1080x1920` (Lanczos filter).
2. **Cover Split-Screen 2 Pembicara Asli (Mata Terbuka & Wajah Utuh):**
   - Algoritma men-sampling video setiap interval beberapa detik.
   - Mengelompokkan frame berdasarkan kemunculan pembicara (`clustering`).
   - Deteksi mata terbuka (`haarcascade_eye.xml`) dan kalkulasi kontras pupil hitam untuk **mencegah hasil tangkapan cover saat pembicara sedang berkedip/merem**.
   - *Framing Full Vertical* menjaga seluruh kepala, rambut, dan wajah agar tidak terpotong tepi atas/bawah.
   - Title Box Kuning khas Z-Code di tengah dengan aksen *dark glass shape* pada baris atas.
3. **Audio Extraction & Whisper Fresh Transcription:**
   - Audio diekstrak murni dari video yang diunggah ke format MP3.
   - Dikirim ke **Groq Whisper API (`whisper-large-v3`)** dengan ketelitian kata-per-kata (`word-level timestamps`).
   - Disusun menjadi subtitle `.ass` bergaya karaoke (warna kuning, putih tebal ber-outline hitam pekat).
4. **Watermark YouTube Glassmorphism Kapsul (Pill Shape):**
   - Menghasilkan badge modern `[🔴 YT] <Nama Channel>` dengan efek *frosted glass* di bawah subtitle.
5. **CapCut 4K HD Visual Enhancer:**
   - Filter `unsharp=5:5:1.1:5:5:0.0` dan penyesuaian kontras `eq=contrast=1.12:brightness=0.01:saturation=1.18` untuk menghasilkan visual jernih tanpa beban render lama.
6. **AI YouTube Description & Hashtags Generator:**
   - Membaca transkrip kata asli yang diucapkan pembicara.
   - Groq AI (`openai/gpt-oss-120b`) menyusun deskripsi video SEO-friendly lengkap dengan 10–15 hashtag relevan (`#shorts #dakwah #islamicshorts #fyp`).
7. **Pengiriman Telegram & Auto-Cleanup Aman:**
   - Video final dikirim melalui `curl` ke Telegram Bot (`sendVideo`).
   - Deskripsi teks terpisah dikirimkan via `sendMessage` agar pengguna tinggal **1x klik copy**.
   - Setelah respons Telegram berstatus `"ok": true`, seluruh file sementara (MP3, video mentah di workspace, frame cover, ASS subtitle, dan MP4 hasil render) **dihapus otomatis**, sehingga kapasitas harddisk laptop MSI Modern 14 tidak penuh.

---

## 5. INFRASTRUKTUR DASHBOARD & LOCALHOST BRIDGE

### A. File Peluncur Otomatis: `JALANKAN_AI_EMPIRE.bat`
Berada di root `D:\AI-Empire-System\JALANKAN_AI_EMPIRE.bat`. Script ini berfungsi untuk:
1. Memeriksa ketersediaan Node.js, Python, FFmpeg, dan dependensi lokal.
2. Membuka server Next.js di port 3000 (`http://localhost:3000`).
3. Menjalankan *browser* secara otomatis menuju halaman Command Center.

### B. Live Progress Polling di Dashboard
- Komponen Next.js (`src/app/page.tsx`) memantau status tabel `youtube_shorts_queue` di Supabase setiap 3 detik.
- Menampilkan indikator progress bertahap:
  - `[10%]` Video diterima & pipeline disiapkan
  - `[20%]` Ekstraksi 2 pembicara mata terbuka & pembuatan cover
  - `[45%]` Transkripsi Whisper kata-per-kata
  - `[65%]` Komposisi subtitle & render MP4 portrait
  - `[85%]` Pembuatan deskripsi & hashtag AI
  - `[95%]` Pengiriman ke bot Telegram
  - `✅ Selesai (Terkirim)`: Muncul tombol **Buka Video** dan **Copy Deskripsi & Hashtag AI**.

---

## 6. RIWAYAT MASALAH KRITIS & SOLUSI TEKNIS (TROUBLESHOOTING)

1. **Error 413 Payload Too Large di Vercel:**
   - *Penyebab:* Batas bawaan serverless Vercel untuk request body adalah 4.5 MB, sedangkan file video mentah berukuran 50–200 MB.
   - *Solusi:* Seluruh proses upload dan render dialihkan ke server localhost Next.js (`http://localhost:3000`) yang berjalan di mesin lokal tanpa limitasi ukuran file.
2. **Subtitle Video Berulang (Cache Lama):**
   - *Penyebab:* Script sebelumnya mengecek keberadaan file statis `felix_words_transcript.json`.
   - *Solusi:* Diterapkan sistem `job_id` unik berbasis timestamp dan ukuran file (`f"{int(time.time())}_{file_stat.st_size}"`), sehingga setiap video baru selalu memicu transkripsi MP3 baru.
3. **Kedua Pembicara Merem / Terpotong di Cover:**
   - *Penyebab:* Frame diambil acak pada detik awal saat pembicara sedang berkedip, serta crop vertikal terlalu sempit.
   - *Solusi:* Ditambahkan scoring `evaluate_eye_openness()` dengan deteksi Haar Cascade mata + analisis kecerahan pupil, serta *framing full vertical* 92% tinggi layar.
4. **Git Push Denied (403 Forbidden ke GitHub):**
   - *Penyebab:* Windows Credential Manager menyimpan kredensial akun GitHub lama (`magangpade`).
   - *Solusi:* Menghapus token usang dengan `cmdkey /delete:git:https://github.com`, kemudian login ulang ke akun utama `@draconik514`.

---

## 7. PANDUAN OPERASIONAL SEHARI-HARI (SOP)

1. **Menyalakan Laptop & Membuka Dashboard:**
   - Cukup klik 2x file `JALANKAN_AI_EMPIRE.bat` di desktop / folder project.
   - Tunggu sampai browser otomatis membuka `http://localhost:3000`.
2. **Membuat Shorts Islamic Baru:**
   - Buka menu **Shorts Islamic**.
   - Drag & drop file video rekaman mentah (podcast / kajian).
   - Masukkan judul box kuning di kolom Title.
   - Masukkan nama channel YouTube referensi (misal: `YNTV`, `Al-Fatih Press`).
   - Klik **Proses Video Otomatis ala Z-Code**.
   - Pantau progress di tabel riwayat bawah.
3. **Mempublikasikan ke YouTube:**
   - Buka aplikasi Telegram di HP/Laptop.
   - Download video yang dikirim oleh `@cs_bisnisku_2026_bot`.
   - Salin pesan teks deskripsi & hashtag yang sudah dibuatkan AI.
   - Upload ke YouTube Shorts dan tempel deskripsi tersebut. Selesai!

---
*Dokumentasi ini dipelihara secara otomatis di repositori GitHub `draconik514/AI-Empire-System`.*
