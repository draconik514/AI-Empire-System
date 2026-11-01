"""
===============================================================================
ISLAMIC SHORTS Z-CODE PIPELINE
Menghasilkan video Shorts portrait 9:16 identik dengan channel @islamic-short-513:
1. Cover Box Kuning di awal video (bold black text + outline putih)
2. Subtitle bold kuning / merah / putih dengan border hitam tebal
3. Watermark Bar [🔴 YouTube] {source_channel} tepat di bawah subtitle
4. Filter CapCut 4K HD (contrast + unsharp sharpening)
5. Voiceover ArdiNeural (Edge-TTS) + Word Timings
===============================================================================
"""

import os
import sys
import json
import time
import asyncio
import subprocess
import edge_tts

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = r"D:\AI-Empire-System"
DASHBOARD_DIR = os.path.join(BASE_DIR, "ai-empire-dashboard")
BRIDGE_DIR = os.path.join(DASHBOARD_DIR, "local-agent-bridge")
WORK_DIR = os.path.join(BRIDGE_DIR, "render_workspace")
os.makedirs(WORK_DIR, exist_ok=True)

def format_ass_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    cs = int(round((seconds - int(seconds)) * 100))
    if cs >= 100:
        cs = 99
    return f"{h:01d}:{m:02d}:{s:02d}.{cs:02d}"

async def generate_voice_and_subtitles(script_text: str, audio_path: str, ass_path: str, source_channel: str, title_cover: str):
    print(f"🎙️ Merekam audio via Edge-TTS (id-ID-ArdiNeural)...")
    clean_text = (
        script_text.replace("\u2011", "-")
        .replace("\u2013", "-")
        .replace("\u2014", ", ")
        .replace('"', "")
        .replace("*", "")
        .replace("#", "")
        .strip()
    )
    communicate = edge_tts.Communicate(clean_text, "id-ID-ArdiNeural", rate="+2%", boundary="WordBoundary")
    words = []
    
    with open(audio_path, "wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append({
                    "word": chunk["text"],
                    "start": round(chunk["offset"] / 1e7, 3),
                    "end": round((chunk["offset"] + chunk["duration"]) / 1e7, 3),
                })
                
    # Dapatkan durasi total
    res = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", audio_path],
        capture_output=True, text=True, check=True
    )
    total_duration = float(res.stdout.strip())
    print(f"✅ Durasi audio: {total_duration:.2f} detik, {len(words)} kata.")

    # Susun file ASS Substation Alpha dengan styling identik channel @islamic-short-513
    ass_header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: SubtitleYellow,Impact,74,&H0000E6FF,&H00000000,&H00000000,&H80000000,-1,0,0,0,100,100,2,0,1,7,4,2,60,60,320,1
Style: SubtitleRed,Impact,74,&H001744FF,&H00000000,&H00000000,&H80000000,-1,0,0,0,100,100,2,0,1,7,4,2,60,60,320,1
Style: SubtitleWhite,Impact,74,&H00FFFFFF,&H00000000,&H00000000,&H80000000,-1,0,0,0,100,100,2,0,1,7,4,2,60,60,320,1
Style: SourceWatermark,Arial Black,42,&H00FFFFFF,&H00000000,&H00000000,&H80000000,-1,0,0,0,100,100,1,0,1,5,3,2,60,60,230,1
Style: CoverBoxTitle,Impact,70,&H00000000,&H00000000,&H00FFFFFF,&H80000000,-1,0,0,0,100,100,2,0,1,4,2,2,80,80,1280,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []

    # 1. Cover Box Kuning (Tampil selama 4.0 detik pertama di bagian atas layar)
    clean_title = title_cover.upper().replace("-", "\\n")
    events.append(
        f"Dialogue: 2,0:00:00.00,0:00:04.20,CoverBoxTitle,,0,0,1280,,{{\\an8\\pos(540,380)\\bord5\\3c&HFFFFFF&\\c&H00000000&}}{clean_title}"
    )

    # 2. Watermark Bar [🔴 YouTube] {source_channel} (Tampil sepanjang video di bawah subtitle)
    wm_channel = source_channel.upper() if source_channel else "YNTV"
    tag_red = "{\\c&H000000FF&}"
    tag_white = "{\\c&H00FFFFFF&}"
    events.append(
        f"Dialogue: 1,0:00:00.00,{format_ass_time(total_duration)},SourceWatermark,,0,0,230,,{tag_red}▶ {tag_white}{wm_channel}"
    )

    # 3. Kelompokkan kata menjadi frasa pop 2 - 3 kata bergantian warna (Kuning, Merah, Putih)
    chunk_size = 3
    tag_yellow = "{\\c&H0000E6FF&}"
    tag_red_sub = "{\\c&H001744FF&}"
    for i in range(0, len(words), chunk_size):
        chunk = words[i:i + chunk_size]
        t_start = format_ass_time(chunk[0]["start"])
        t_end = format_ass_time(chunk[-1]["end"] + 0.15)
        
        # Variasi warna: Kuning, Merah, Putih
        if (i // chunk_size) % 3 == 0:
            words_rest = " ".join([f"{tag_white}{w['word'].upper()}" for w in chunk[1:]])
            txt = f"{tag_yellow}{chunk[0]['word'].upper()} " + words_rest
        elif (i // chunk_size) % 3 == 1:
            words_all = " ".join([w['word'].upper() for w in chunk])
            txt = f"{tag_red_sub}{words_all}"
        else:
            words_rest = " ".join([f"{tag_yellow}{w['word'].upper()}" for w in chunk[1:]])
            txt = f"{tag_white}{chunk[0]['word'].upper()} " + words_rest

        events.append(f"Dialogue: 0,{t_start},{t_end},SubtitleYellow,,0,0,320,,{txt.strip()}")

    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(ass_header + "\n".join(events) + "\n")
    
    print(f"✅ File Subtitle ASS dibuat: {ass_path} ({len(events)} events)")
    return total_duration

def render_islamic_video(audio_path: str, ass_path: str, output_path: str, total_duration: float, title_cover: str):
    print(f"🎬 Merender video Shorts 9:16 portrait dengan filter CapCut HD 4K...")
    # Escape path untuk filter subtitles FFmpeg di Windows
    escaped_ass = ass_path.replace("\\", "/").replace(":", "\\:")
    
    # Filter graph FFmpeg:
    # 1. Background dinamis 1080x1920 portrait dengan gradient warm cinematic & subtle zoom
    # 2. Box Kuning Cover di awal video (0-4.2s)
    # 3. Subtitles burn-in via libass
    # 4. Filter CapCut 4K HD (unsharp contrast boost)
    
    vf = (
        f"color=c=0x111625:s=1080x1920:d={total_duration}[bg];"
        f"color=c=0xFFCC00:s=920x220:d=4.2[yellow_box];"
        f"[bg][yellow_box]overlay=x=(W-w)/2:y=320:enable='between(t,0,4.2)'[comp1];"
        f"[comp1]subtitles=filename='{escaped_ass}',"
        f"unsharp=5:5:1.2:5:5:0.0,eq=contrast=1.12:brightness=0.02:saturation=1.20[v]"
    )

    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", f"color=c=0x111625:s=1080x1920:d={total_duration}",
        "-i", audio_path,
        "-filter_complex", vf,
        "-map", "[v]",
        "-map", "1:a",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        output_path
    ]
    
    subprocess.run(cmd, check=True)
    print(f"✅ Video berhasil dirender: {output_path} ({os.path.getsize(output_path)} bytes)")

def send_to_telegram(video_path: str, title: str, source_channel: str, caption_extra: str = ""):
    token = "8409393322:AAF56X5Q18VjP7_wD611q9l2V0eK2R0-xXw"
    chat_id = "7885596077"
    
    # Ambil dari env jika ada
    env_path = os.path.join(DASHBOARD_DIR, ".env.local")
    if os.path.isfile(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for l in f:
                if l.startswith("TELEGRAM_BOT_TOKEN="):
                    token = l.split("=")[1].strip().strip('"').strip("'")
                elif l.startswith("TELEGRAM_CHANNEL_ID="):
                    chat_id = l.split("=")[1].strip().strip('"').strip("'")

    print(f"🚀 Mengirim video ke bot Telegram (@cs_bisnisku_2026_bot)...")
    url = f"https://api.telegram.org/bot{token}/sendVideo"
    
    caption = (
        f"🎬 HASIL VIDEO SHORTS ISLAMIC (ALA Z-CODE)\n\n"
        f"📌 Judul: {title}\n"
        f"📺 Source: {source_channel or 'YNTV'}\n"
        f"🎨 Template: Channel @islamic-short-513 (465 Subs)\n"
        f"⚡ Fitur Otomatis:\n"
        f"  - Cover Box Kuning (Title Bold Hitam di awal)\n"
        f"  - Subtitle Kuning / Merah / Putih Outline Hitam\n"
        f"  - Watermark [▶ {source_channel or 'YNTV'}] di bawah subtitle\n"
        f"  - Filter CapCut 4K HD Sharpness\n\n"
        f"Silakan ditonton langsung bang!"
    )
    
    import requests
    with open(video_path, "rb") as vf:
        resp = requests.post(
            url,
            data={"chat_id": chat_id, "caption": caption},
            files={"video": (os.path.basename(video_path), vf, "video/mp4")},
            timeout=120
        )
        data = resp.json()
        if data.get("ok"):
            msg_id = data["result"]["message_id"]
            print(f"🎉 SUKSES TERKIRIM KE TELEGRAM! Message ID: {msg_id}")
            return f"https://t.me/c/{chat_id}/{msg_id}"
        else:
            print(f"⚠️ Gagal kirim Telegram: {data}")
            return None

def main():
    title = "2 Cara Atasi Masalah Hidup! - Solusi Islami"
    source = "RaymondChin"
    script = (
        "Assalamu'alaikum sahabat! Dalam video singkat ini, ada 2 cara Islami mengatasi masalah hidup. "
        "Pertama: Tawakal dengan Doa. Setelah kita berusaha sekuat tenaga, serahkan semua hasilnya kepada Allah SWT. "
        "Kedua: Dzikir dan Shalawat. Dzikir menenangkan hati dan menjernihkan pikiran di saat kita merasa tertekan. "
        "Dengan tawakal dan dzikir, setiap ujian insyaAllah ada jalan keluarnya. "
        "Jangan lupa like dan share video ini jika bermanfaat. Wassalamu'alaikum!"
    )
    
    tag = f"islamic_zcode_{int(time.time())}"
    audio_path = os.path.join(WORK_DIR, f"{tag}.mp3")
    ass_path = os.path.join(WORK_DIR, f"{tag}.ass")
    output_mp4 = os.path.join(WORK_DIR, f"{tag}.mp4")
    
    dur = asyncio.run(generate_voice_and_subtitles(script, audio_path, ass_path, source, title))
    render_islamic_video(audio_path, ass_path, output_mp4, dur, title)
    send_to_telegram(output_mp4, title, source)

if __name__ == "__main__":
    main()
