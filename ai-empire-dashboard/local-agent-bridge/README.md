# 🤖 Local Agent Bridge — Z-Code Pipeline

Jembatan antara **AI Empire Dashboard** (Next.js) dengan pipeline editing video lokal berbasis Python + FFmpeg.

## 📁 Struktur File

```
local-agent-bridge/
├── build_zcode_perfect_pipeline.py   # 🎬 Pipeline utama: crop, subtitle, cover, Telegram
├── shorts_factory_worker.py          # 🏭 Worker antrean Supabase (polling loop)
├── agent_bridge.py                   # 🌉 Bridge API lokal → pipeline
├── telegram_live_cs_bot.py           # 💬 CS Bot Telegram real-time
├── transcribe_groq.py                # 🎙️ Transkripsi audio via Groq Whisper
├── render_workspace/                 # 📂 File sementara (di-gitignore)
└── assets/                           # 🖼️ Font, logo, watermark
```

## 🚀 Cara Jalankan

### 1. Pipeline Manual (single video)
```bash
python build_zcode_perfect_pipeline.py \
  --input path/to/video.mp4 \
  --title "Judul Shorts Kamu" \
  --source "NAMA CHANNEL" \
  --caption-style yellow \
  --cover-style cloud_emerald \
  --source-url "https://youtu.be/xxx"
```

#### Pilihan Style Cover:
- `black_yellow`: Rounded pill glassmorphism hitam + kuning solid
- `cloud_emerald`: Siluet awan organik puffy cloud + aksen hijau emerald/cyan
- `cyber_crimson`: Badge chamfer octagon futuristik + neon crimson red

### 2. Worker Antrean Otomatis (dari Supabase)
```bash
python shorts_factory_worker.py
```
Worker akan polling Supabase setiap 15 detik dan otomatis memproses video yang masuk antrian `Queued_For_Laptop`.

## ⚙️ Environment Variables

Dibaca dari `../ai-empire-dashboard/.env.local`:

| Variable | Keterangan |
|----------|-----------|
| `GROQ_API_KEY` | API key Groq untuk Whisper transkripsi |
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key Supabase |
| `GEMINI_API_KEY` | Gemini API untuk generate deskripsi & hashtag YT |

## 🔧 Dependensi Python

```bash
pip install requests pillow opencv-python edge-tts numpy groq
```
FFmpeg harus tersedia di PATH sistem.

## 📊 Alur Status Video

```
Rendering (10%) → Rendering (25%) → Rendering (50%) → Rendering (75%)
→ Rendering (90%) → Sending_Telegram (95%) → Review_in_Telegram ✅
                                           ↘ Error ❌ (jika gagal)
```
