"""
===============================================================================
PABRIK YOUTUBE SHORTS LOKAL (MSI Modern 14 - Intel Iris Xe Hardware Accelerated)
Mengeksekusi Naskah AI -> Voiceover Edge-TTS -> Render FFmpeg -> Kirim ke Telegram
===============================================================================
"""

import os
import sys
import json
import time
import subprocess
import urllib.request
import urllib.parse
from datetime import datetime

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = r"D:\AI-Empire-System"
DASHBOARD_DIR = os.path.join(BASE_DIR, "ai-empire-dashboard")
WORK_DIR = os.path.join(DASHBOARD_DIR, "local-agent-bridge", "render_workspace")
os.makedirs(WORK_DIR, exist_ok=True)


def load_env():
    for f in (".env.local", ".env"):
        p = os.path.join(DASHBOARD_DIR, f)
        if os.path.isfile(p):
            with open(p, "r", encoding="utf-8") as env_file:
                for line in env_file:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k, v = k.strip(), v.strip().strip('"').strip("'")
                        if k and k not in os.environ:
                            os.environ[k] = v


load_env()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""))
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHANNEL_ID = os.getenv("TELEGRAM_CHANNEL_ID", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


def log(msg: str):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def supabase_get_queued_shorts():
    if not SUPABASE_URL or not SUPABASE_KEY:
        return []
    url = f"{SUPABASE_URL}/rest/v1/youtube_shorts_queue?status=in.(Queued_For_Laptop,Revision_Requested)&order=created_at.asc&limit=1"
    req = urllib.request.Request(
        url,
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        log(f"Supabase GET error: {e}")
        return []


def supabase_update_status(item_id: str, new_status: str, tg_msg_url: str = ""):
    if not SUPABASE_URL or not SUPABASE_KEY:
        return
    url = f"{SUPABASE_URL}/rest/v1/youtube_shorts_queue?id=eq.{item_id}"
    payload = {"status": new_status}
    if tg_msg_url:
        payload["telegram_message_url"] = tg_msg_url

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        method="PATCH",
    )
    try:
        with urllib.request.urlopen(req):
            pass
    except Exception as e:
        log(f"Supabase PATCH error: {e}")


def generate_voiceover(text: str, output_audio_path: str, voice: str = "id-ID-ArdiNeural"):
    log(f"🎙️ Merekam suara narator via Edge-TTS ({voice})...")
    clean_text = text.replace('"', "").replace("'", "")
    cmd = [
        "edge-tts",
        "--voice",
        voice,
        "--text",
        clean_text,
        "--write-media",
        output_audio_path,
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return os.path.exists(output_audio_path)


def get_audio_duration(audio_path: str) -> float:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        audio_path,
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return float(res.stdout.strip())


def render_shorts_video(item: dict) -> str:
    item_id = item.get("id", f"temp-{int(time.time())}")
    niche = item.get("niche", "Edukasi_CalonSarjana")
    title = item.get("title", "Fakta Mengejutkan")
    hook = item.get("hook_text", "")
    full_script = item.get("full_script", "")
    version = item.get("revision_version", 1)

    audio_file = os.path.join(WORK_DIR, f"audio_{item_id}.mp3")
    video_out = os.path.join(WORK_DIR, f"shorts_{item_id}_v{version}.mp4")

    # 1. Generate Voiceover
    # Untuk Calon Sarjana pakai suara Ardi yang enerjik
    voice = "id-ID-ArdiNeural" if niche == "Edukasi_CalonSarjana" else "id-ID-GadisNeural"
    voice_script = f"{hook}. {full_script}" if hook and hook not in full_script else full_script
    generate_voiceover(voice_script, audio_file, voice=voice)

    duration = get_audio_duration(audio_file)
    log(f"⏱️ Durasi audio narasi: {duration:.1f} detik")

    # 2. Setup Warna & Tema Niche
    if niche == "Edukasi_CalonSarjana":
        bg_color1 = "#0c1017"
        bg_color2 = "#1a2332"
        badge_text = "CALON SARJANA STYLE · FAKTA UNIK"
        theme_color = "yellow"
    elif niche == "Islamic":
        bg_color1 = "#0d1814"
        bg_color2 = "#142d24"
        badge_text = "HIKMAH & DOA MUSTAJAB"
        theme_color = "gold"
    else:
        bg_color1 = "#1a0f2b"
        bg_color2 = "#35155d"
        badge_text = "GAMING ANAK · ROBLOX"
        theme_color = "cyan"

    log("🎬 Merender video 9:16 (1080x1920) dengan akselerasi Intel Iris Xe...")

    # Filter visual FFmpeg: Gradien bergerak + Header Kategori + Teks Judul + Hook Pembuka
    # Memakai format font standar sistem Windows (Arial/Segoe UI)
    safe_title = title.replace(":", " -").replace("'", "").replace('"', "")[:50]
    safe_badge = badge_text.replace(":", " -")
    safe_hook = hook.replace(":", " -").replace("'", "")[:80]

    filter_complex = (
        f"color=c={bg_color1}:s=1080x1920:d={duration}[bg];"
        f"[bg]drawbox=y=0:color={bg_color2}@0.85:width=1080:height=1920:t=fill,"
        f"drawbox=y=140:color=white@0.12:width=1000:height=90:t=fill:x=40,"
        f"drawtext=text='{safe_badge}':font=Arial:fontsize=34:fontcolor={theme_color}:x=(w-text_w)/2:y=168,"
        f"drawtext=text='{safe_title}':font=Arial:fontsize=52:fontcolor=white:x=(w-text_w)/2:y=280:box=1:boxcolor=black@0.6:boxborderw=20,"
        f"drawbox=y=700:color=black@0.75:width=1000:height=520:t=fill:x=40,"
        f"drawtext=text='HOOK UTAMA\\:':font=Arial:fontsize=36:fontcolor={theme_color}:x=80:y=740,"
        f"drawtext=text='{safe_hook}':font=Arial:fontsize=46:fontcolor=white:x=80:y=810:fix_bounds=true,"
        f"drawtext=text='👉 Dengerin sampai akhir!':font=Arial:fontsize=40:fontcolor=yellow:x=(w-text_w)/2:y=1120,"
        f"drawtext=text='AI-Empire-System 2026':font=Arial:fontsize=28:fontcolor=gray:x=(w-text_w)/2:y=1820[v]"
    )

    # Coba encode via hardware Intel Iris Xe (h264_qsv), jika gagal fallback ke libx264
    cmd = [
        "ffmpeg",
        "-y",
        "-filter_complex",
        filter_complex,
        "-map",
        "[v]",
        "-i",
        audio_file,
        "-map",
        "1:a",
        "-c:v",
        "h264_qsv",
        "-b:v",
        "4M",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-shortest",
        video_out,
    ]

    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        log("⚠️ QSV hardware encoder sedang sibuk, fallback ke CPU x264...")
        cmd[11] = "libx264"
        cmd[12] = "-preset"
        cmd[13] = "veryfast"
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    log(f"✅ Video berhasil di-render: {video_out}")
    return video_out


def send_video_to_telegram(video_path: str, item: dict) -> str:
    log("📤 Mengirim video Shorts ke bot Telegram...")
    title = item.get("title", "Shorts Video")
    niche = item.get("niche", "Edukasi")
    hook = item.get("hook_text", "")
    version = item.get("revision_version", 1)

    caption = (
        f"🎬 *PREVIEW YOUTUBE SHORTS (v{version})*\n\n"
        f"🏷️ *Niche:* {niche.replace('_', ' ')}\n"
        f"📌 *Judul:* {title}\n"
        f"🪝 *Hook:* \"{hook}\"\n\n"
        f"📱 *Review:* Tonton video ini langsung di HP kamu. "
        f"Jika ada yang kurang pas, kamu bisa balas pesan ini untuk meminta revisi!"
    )

    # Kirim multipart video via curl / requests
    # Gunakan powershell curl multipart yang andal di Windows
    ps_cmd = (
        f"$uri = 'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendVideo';"
        f"$form = @{{"
        f"  chat_id = '{TELEGRAM_CHANNEL_ID}';"
        f"  caption = @'\n{caption}\n'@;"
        f"  parse_mode = 'Markdown';"
        f"  video = Get-Item -Path '{video_path}';"
        f"}};"
        f"$res = Invoke-RestMethod -Uri $uri -Method Post -Form $form;"
        f"Write-Output (ConvertTo-Json $res)"
    )

    try:
        res = subprocess.run(["powershell", "-Command", ps_cmd], capture_output=True, text=True, check=True)
        data = json.loads(res.stdout)
        msg_id = data.get("result", {}).get("message_id")
        tg_url = f"https://t.me/c/{TELEGRAM_CHANNEL_ID}/{msg_id}" if msg_id else "https://t.me/"
        log(f"✅ Video sukses terkirim ke Telegram! (Message ID: {msg_id})")
        return tg_url
    except Exception as e:
        log(f"Gagal kirim video ke Telegram: {e}")
        return ""


def process_one_job():
    log("🔍 Memeriksa antrean video di Supabase...")
    items = supabase_get_queued_shorts()
    if not items:
        log("ℹ️ Tidak ada antrean video baru di Supabase.")
        return False

    item = items[0]
    log(f"🚀 Memproses Antrean: [{item.get('niche')}] '{item.get('title')}'")

    video_path = render_shorts_video(item)
    tg_url = send_video_to_telegram(video_path, item)

    supabase_update_status(item["id"], "Review_in_Telegram", tg_msg_url=tg_url)
    log("🎉 Alur produksi video selesai! Status di dashboard diperbarui ke 'Review_in_Telegram'.")

    # Bersihkan file audio mentahan agar SSD lega
    audio_file = os.path.join(WORK_DIR, f"audio_{item['id']}.mp3")
    if os.path.exists(audio_file):
        os.remove(audio_file)

    return True


if __name__ == "__main__":
    log("=" * 60)
    log("🚀 SHORTS FACTORY WORKER (Divisi 3)")
    log("=" * 60)
    if len(sys.argv) > 1 and sys.argv[1] == "--once":
        process_one_job()
    else:
        log("Menjalankan 1 pemrosesan job antrean...")
        process_one_job()
