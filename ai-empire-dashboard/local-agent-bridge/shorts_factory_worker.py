"""
===============================================================================
PABRIK YOUTUBE SHORTS 3D + CHARACTER ANIMATION (Divisi 3 - AI Empire System)
Menggabungkan:
  1. HyperFrames (Three.js 3D WebGL + 21 Bundled SFX Audio)
  2. ReelMimic (Anime-Cel Character Rig: Ren & Hina + LipSync + Acting + FX)
  3. OpenMontage (Multi-Scene Storyboard & Callout Choreographer)
  4. FFmpeg-Skill (Word-by-Word Pop Karaoke Subtitles + Multi-Track Audio Mix)
  5. Otak AI: Google Gemini API (GEMINI_API_KEY) + Groq Fallback
===============================================================================
"""

import os
import sys
import json
import time
import asyncio
import subprocess
import urllib.request
import urllib.parse
from datetime import datetime

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = r"D:\AI-Empire-System"
DASHBOARD_DIR = os.path.join(BASE_DIR, "ai-empire-dashboard")
BRIDGE_DIR = os.path.join(DASHBOARD_DIR, "local-agent-bridge")
STUDIO_DIR = os.path.join(BRIDGE_DIR, "studio_engine")
WORK_DIR = os.path.join(BRIDGE_DIR, "render_workspace")
SFX_DIR = os.path.join(BASE_DIR, "repos-video", "hyperframes", "skills", "media-use", "audio", "assets", "sfx")
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
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


def log(msg: str):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


def supabase_get_queued_shorts():
    if not SUPABASE_URL or not SUPABASE_KEY:
        return []
    url = f"{SUPABASE_URL}/rest/v1/youtube_shorts_queue?status=in.(Queued_For_Laptop,Revision_Requested)&order=created_at.desc&limit=1"
    try:
        res = subprocess.run(
            ["curl.exe", "-s", "--max-time", "15", url, "-H", f"apikey: {SUPABASE_KEY}", "-H", f"Authorization: Bearer {SUPABASE_KEY}"],
            capture_output=True,
            text=True,
            check=True,
        )
        return json.loads(res.stdout) if res.stdout.strip() else []
    except Exception as e:
        log(f"⚠️ Gagal ambil antrean Supabase: {e}")
        return []


def supabase_get_latest_short():
    if not SUPABASE_URL or not SUPABASE_KEY:
        return []
    url = f"{SUPABASE_URL}/rest/v1/youtube_shorts_queue?order=created_at.desc&limit=1"
    try:
        res = subprocess.run(
            ["curl.exe", "-s", "--max-time", "15", url, "-H", f"apikey: {SUPABASE_KEY}", "-H", f"Authorization: Bearer {SUPABASE_KEY}"],
            capture_output=True,
            text=True,
            check=True,
        )
        return json.loads(res.stdout) if res.stdout.strip() else []
    except Exception as e:
        log(f"⚠️ Gagal ambil data terbaru Supabase: {e}")
        return []


def supabase_update_status(item_id: str, status: str, tg_msg_url: str = None, extra: dict = None):
    if not SUPABASE_URL or not SUPABASE_KEY:
        return
    url = f"{SUPABASE_URL}/rest/v1/youtube_shorts_queue?id=eq.{urllib.parse.quote(item_id)}"
    payload = {"status": status}
    if tg_msg_url:
        payload["telegram_message_url"] = tg_msg_url
    if extra:
        payload.update(extra)
    try:
        subprocess.run(
            [
                "curl.exe",
                "-s",
                "--max-time",
                "15",
                "-X",
                "PATCH",
                url,
                "-H",
                f"apikey: {SUPABASE_KEY}",
                "-H",
                f"Authorization: Bearer {SUPABASE_KEY}",
                "-H",
                "Content-Type: application/json",
                "-H",
                "Prefer: return=minimal",
                "-d",
                json.dumps(payload),
            ],
            check=True,
        )
    except Exception as e:
        log(f"⚠️ Gagal update status Supabase: {e}")


async def synthesize_voice_with_word_timings(text: str, out_mp3: str, voice: str = "id-ID-ArdiNeural"):
    """Rekam suara narator via Edge-TTS sekaligus ekstrak WordBoundary presisi milidetik."""
    import edge_tts

    clean_text = (
        text.replace("\u2011", "-")
        .replace("\u2013", "-")
        .replace("\u2014", ", ")
        .replace('"', "")
        .replace("*", "")
        .strip()
    )
    communicate = edge_tts.Communicate(clean_text, voice, rate="+8%", boundary="WordBoundary")
    words = []
    with open(out_mp3, "wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start_s = round(chunk["offset"] / 1e7, 3)
                end_s = round((chunk["offset"] + chunk["duration"]) / 1e7, 3)
                words.append({"text": chunk["text"], "start": start_s, "end": end_s})
    return words


def get_audio_duration(audio_path: str) -> float:
    try:
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
    except Exception:
        return 45.0


def build_multi_scene_plan(item: dict, duration: float, words: list) -> dict:
    """Bangun 6 Scene Dinamis (3D Three.js + Karakter ReelMimic + Callouts + SFX)."""
    title = item.get("title") or "Fakta Sains Mengejutkan!"
    s1 = round(duration * 0.16, 2)
    s2 = round(duration * 0.35, 2)
    s3 = round(duration * 0.55, 2)
    s4 = round(duration * 0.74, 2)
    s5 = round(duration * 0.90, 2)

    scenes = [
        {
            "start": 0.0,
            "end": s1,
            "mode3d": "jellyfish_ocean",
            "badge": "⚡ HOOK FAKTA SAINS 3D",
            "badgeColor": "#00F5D4",
            "headline": title[:62],
            "char": "both",
            "face": "surprised",
            "faceHina": "shocked",
            "fx": "sparkles",
            "sfx": "whoosh-cinematic.mp3",
            "callouts": [
                {
                    "label": "OBJEK PENELITIAN",
                    "val": "BIOLOGI LAUT 3D",
                    "x": 250,
                    "y": 380,
                    "tx": 520,
                    "ty": 500,
                    "color": "#00F5D4",
                }
            ],
        },
        {
            "start": s1,
            "end": s2,
            "mode3d": "microscope_nematocyst",
            "badge": "🔬 SIMULASI MIKROSKOPIS 3D",
            "badgeColor": "#FF2A85",
            "headline": "Apa yang Terjadi di Tingkat Sel Mikroskopis?",
            "char": "ren",
            "face": "determined",
            "fx": "speedLines",
            "sfx": "impact-bass-1.mp3",
            "callouts": [
                {
                    "label": "KAPSUL SEL",
                    "val": "NEMATOCYST AKTIF",
                    "x": 250,
                    "y": 370,
                    "tx": 500,
                    "ty": 470,
                    "color": "#FF2A85",
                },
                {
                    "label": "KECEPATAN TEMBAK",
                    "val": "5.000.000 G",
                    "x": 820,
                    "y": 480,
                    "tx": 580,
                    "ty": 660,
                    "color": "#FFBE0B",
                },
            ],
        },
        {
            "start": s2,
            "end": s3,
            "mode3d": "myth_explosion",
            "badge": "❌ MITOS vs TEKANAN OSMOTIK!",
            "badgeColor": "#FF1E42",
            "headline": "Awas! Reaksi Tekanan Osmotik Memicu Ledakan Sel!",
            "char": "hina",
            "face": "scared",
            "fx": "focusLines",
            "sfx": "error.mp3",
            "callouts": [
                {
                    "label": "STATUS SEL",
                    "val": "KRITIS / MELEDAK!",
                    "x": 260,
                    "y": 400,
                    "tx": 530,
                    "ty": 560,
                    "color": "#FF1E42",
                }
            ],
        },
        {
            "start": s3,
            "end": s4,
            "mode3d": "fact_vinegar_shield",
            "badge": "✅ FAKTA SAINS & PERTAHANAN SEL",
            "badgeColor": "#06D6A0",
            "headline": "Mekanisme Pelindung Molekuler & Stabilitas Sel",
            "char": "ren",
            "face": "smile",
            "fx": "sparkles",
            "sfx": "chime.mp3",
            "callouts": [
                {
                    "label": "PERISAI MOLEKUL",
                    "val": "STABILISASI 100%",
                    "x": 800,
                    "y": 390,
                    "tx": 540,
                    "ty": 550,
                    "color": "#06D6A0",
                }
            ],
        },
        {
            "start": s4,
            "end": s5,
            "mode3d": "dna_regeneration",
            "badge": "🧬 TRANSDIFERENSIASI DNA 3D",
            "badgeColor": "#72EFDD",
            "headline": "Reprogramming Sel: Memutar Balik Siklus Usia!",
            "char": "both",
            "face": "happy",
            "faceHina": "love",
            "fx": "sparkles",
            "sfx": "sparkle.mp3",
            "callouts": [
                {
                    "label": "HELIKS GANDA",
                    "val": "REGENERASI SEL",
                    "x": 250,
                    "y": 410,
                    "tx": 520,
                    "ty": 560,
                    "color": "#72EFDD",
                }
            ],
        },
        {
            "start": s5,
            "end": round(duration + 0.3, 2),
            "mode3d": "jellyfish_ocean",
            "badge": "💬 TULIS PENDAPATMU DI KOMENTAR!",
            "badgeColor": "#FFBE0B",
            "headline": "Gimana Menurutmu? Tulis di Kolom Komentar ya!",
            "char": "both",
            "face": "laugh",
            "faceHina": "happy",
            "fx": "sparkles",
            "sfx": "notification.mp3",
            "callouts": [],
        },
    ]

    return {
        "duration": round(duration + 0.3, 2),
        "title": title,
        "words": words,
        "scenes": scenes,
    }


def mix_audio_with_sfx_and_bgm(vo_mp3: str, scene_plan: dict, out_mixed_mp3: str):
    """Gabungkan Voiceover + Bundled SFX (HyperFrames) + Ambient Synth BGM via FFmpeg."""
    dur = scene_plan["duration"]
    scenes = scene_plan["scenes"]

    inputs = ["-i", vo_mp3]
    # Buat ambient sci-fi pad BGM lembut via lavfi aevalsrc
    bgm_expr = "0.035*sin(2*PI*110*t)+0.025*sin(2*PI*164.81*t)+0.02*sin(2*PI*220*t)*(0.6+0.4*sin(2*PI*0.25*t))"
    inputs.extend(["-f", "lavfi", "-t", str(dur), "-i", f"aevalsrc='{bgm_expr}':s=44100"])

    filter_parts = [
        "[0:a]volume=1.35[vo]",
        "[1:a]volume=0.55[bgm]",
    ]
    mix_labels = ["[vo]", "[bgm]"]

    input_idx = 2
    for idx, sc in enumerate(scenes):
        sfx_name = sc.get("sfx", "whoosh.mp3")
        sfx_path = os.path.join(SFX_DIR, sfx_name)
        if os.path.isfile(sfx_path):
            delay_ms = max(50, int(sc["start"] * 1000))
            inputs.extend(["-i", sfx_path])
            lbl = f"sfx{idx}"
            filter_parts.append(f"[{input_idx}:a]volume=0.42,adelay={delay_ms}|{delay_ms}[{lbl}]")
            mix_labels.append(f"[{lbl}]")
            input_idx += 1

        # Tambahkan pop.mp3 saat callout muncul (+0.45s setelah scene mulai)
        pop_path = os.path.join(SFX_DIR, "pop.mp3")
        if sc.get("callouts") and os.path.isfile(pop_path):
            pop_ms = int((sc["start"] + 0.45) * 1000)
            inputs.extend(["-i", pop_path])
            lbl_p = f"pop{idx}"
            filter_parts.append(f"[{input_idx}:a]volume=0.35,adelay={pop_ms}|{pop_ms}[{lbl_p}]")
            mix_labels.append(f"[{lbl_p}]")
            input_idx += 1

    n_inputs = len(mix_labels)
    amix_str = "".join(mix_labels) + f"amix=inputs={n_inputs}:duration=first:dropout_transition=0,dynaudnorm[aout]"
    filter_complex = ";".join(filter_parts + [amix_str])

    cmd = [
        "ffmpeg",
        "-y",
        "-loglevel",
        "error",
        *inputs,
        "-filter_complex",
        filter_complex,
        "-map",
        "[aout]",
        "-c:a",
        "libmp3lame",
        "-b:a",
        "192k",
        out_mixed_mp3,
    ]
    try:
        subprocess.run(cmd, check=True)
        log(f"🔊 Master Audio selesai di-mix ({n_inputs} tracks: Voiceover + BGM + {n_inputs - 2} SFX)!")
        return out_mixed_mp3
    except Exception as e:
        log(f"⚠️ Gagal mix SFX ({e}), menggunakan Voiceover murni.")
        return vo_mp3


def render_shorts_video(item: dict) -> str:
    short_id = item.get("id", f"local_{int(time.time())}")
    niche = item.get("niche", "Edukasi_CalonSarjana")
    script_text = item.get("full_script") or item.get("hook_text") or "Fakta unik dunia hari ini."
    version = item.get("revision_version", 1)

    vo_file = os.path.join(WORK_DIR, f"vo_{short_id}.mp3")
    mixed_audio_file = os.path.join(WORK_DIR, f"mixed_{short_id}.mp3")
    output_mp4 = os.path.join(WORK_DIR, f"shorts_3d_{short_id}_v{version}.mp4")

    voice = "id-ID-ArdiNeural" if niche != "Gaming_Roblox_Minecraft" else "id-ID-GadisNeural"
    log(f"🎙️ Merekam suara narator & mengekstrak WordBoundary via Edge-TTS ({voice})...")
    words = asyncio.run(synthesize_voice_with_word_timings(script_text, vo_file, voice=voice))

    duration = get_audio_duration(vo_file)
    log(f"⏱️ Durasi audio: {duration:.1f} detik ({len(words)} kata terdeteksi untuk Karaoke Subtitle)")

    # 2. Bangun Scene Plan 3D + Karakter + Callouts
    scene_plan = build_multi_scene_plan(item, duration, words)
    scene_data_js = os.path.join(STUDIO_DIR, "src", "scene_data.js")
    with open(scene_data_js, "w", encoding="utf-8") as f:
        f.write("window.SCENE_DATA = " + json.dumps(scene_plan, ensure_ascii=False, indent=2) + ";\n")

    # 3. Mix Voiceover + 21 SFX (HyperFrames) + Ambient BGM
    final_audio = mix_audio_with_sfx_and_bgm(vo_file, scene_plan, mixed_audio_file)

    # 4. Render 3D Three.js + ReelMimic Character + Karaoke via Headless Chrome GPU -> FFmpeg
    log("🎬 Merender animasi 3D Three.js + Karakter ReelMimic + Karaoke Subtitle (1080x1920 @ 24fps)...")
    render_script = os.path.join(STUDIO_DIR, "render_short.mjs")
    cmd = [
        "node",
        render_script,
        f"--duration={scene_plan['duration']}",
        "--fps=24",
        f"--audio={final_audio}",
        f"--out={output_mp4}",
    ]
    subprocess.run(cmd, check=True)
    log(f"✅ Video 3D + Karakter berhasil di-render: {output_mp4}")

    # Bersihkan audio sementara
    for tmp_f in (vo_file, mixed_audio_file):
        if os.path.exists(tmp_f):
            try:
                os.remove(tmp_f)
            except Exception:
                pass

    return output_mp4


def send_video_to_telegram(video_path: str, item: dict) -> str:
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHANNEL_ID:
        log("⚠️ TELEGRAM_BOT_TOKEN / CHANNEL_ID belum diset.")
        return ""

    log("📤 Mengirim video Shorts 3D + Animasi Karakter ke bot Telegram...")
    caption = (
        f"🎬 *SHORTS 3D + ANIMASI SIAP REVIEW (v{item.get('revision_version', 1)})*\n\n"
        f"📌 *Niche:* `{item.get('niche')}`\n"
        f"🏷️ *Judul:* {item.get('title')}\n"
        f"🪝 *Hook:* _{item.get('hook_text')}_\n"
        f"🎨 *Engine:* `Three.js 3D + ReelMimic Character + HyperFrames SFX + Karaoke`\n\n"
        f"✅ *Fitur Aktif di Video Ini:*\n"
        f"• Simulasi 3D WebGL (5 Adegan Berbeda)\n"
        f"• Karakter Animasi Berbicara (Lip-Sync & Ekspresi)\n"
        f"• Subtitle Karaoke Pop Per Kata (Kuning/Cyan)\n"
        f"• Multi-Track Sound Effects (Whoosh, Pop, Bass, Chime) + BGM\n\n"
        f"💡 _Silakan tonton langsung di bawah ini!_"
    )

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendVideo"
    cmd = [
        "curl.exe",
        "-s",
        "-X",
        "POST",
        url,
        "-F",
        f"chat_id={TELEGRAM_CHANNEL_ID}",
        "-F",
        f"video=@{video_path}",
        "-F",
        f"caption={caption}",
        "-F",
        "parse_mode=Markdown",
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(res.stdout)
        msg_id = data.get("result", {}).get("message_id")
        tg_url = f"https://t.me/c/{TELEGRAM_CHANNEL_ID}/{msg_id}" if msg_id else "https://t.me/"
        log(f"✅ Video 3D sukses terkirim ke Telegram! (Message ID: {msg_id})")
        return tg_url
    except Exception as e:
        log(f"⚠️ Gagal kirim video ke Telegram: {e}")
        return ""


def process_one_job(force_latest: bool = False):
    log("🔍 Memeriksa antrean video di Supabase...")
    items = supabase_get_queued_shorts()
    if not items and force_latest:
        log("🔄 Mengambil video terakhir untuk di-render ulang dengan Engine 3D + Karakter...")
        items = supabase_get_latest_short()

    if not items:
        log("ℹ️ Tidak ada antrean video di Supabase.")
        return False

    item = items[0]
    log(f"🚀 Memproses Video: [{item.get('niche')}] '{item.get('title')}'")

    video_path = render_shorts_video(item)
    tg_url = send_video_to_telegram(video_path, item)

    supabase_update_status(
        item["id"],
        "Review_in_Telegram",
        tg_msg_url=tg_url,
        extra={"engine_used": "Three.js 3D + ReelMimic Character + HyperFrames SFX + Karaoke"},
    )
    log("🎉 Alur produksi video 3D selesai! Silakan cek Telegram Anda.")
    return True


if __name__ == "__main__":
    log("=" * 65)
    log("🚀 SHORTS FACTORY 3D + CHARACTER WORKER (Divisi 3)")
    log("=" * 65)
    if len(sys.argv) > 1 and sys.argv[1] == "--loop":
        log("🔄 Mode Standby/Daemon aktif. Memantau antrean Supabase setiap 15 detik...")
        while True:
            try:
                processed = process_one_job(force_latest=False)
                time.sleep(10 if processed else 15)
            except KeyboardInterrupt:
                log("🛑 Worker dihentikan oleh user.")
                break
            except Exception as ex:
                log(f"⚠️ Error dalam loop: {ex}")
                time.sleep(15)
    elif len(sys.argv) > 1 and sys.argv[1] == "--rerender":
        process_one_job(force_latest=True)
    else:
        process_one_job(force_latest=True)
