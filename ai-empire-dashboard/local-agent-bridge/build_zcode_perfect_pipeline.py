1dddddddddddddddddddddddddddddddddddddddddddddimport os
import sys
import json
import time
import argparse
import subprocess
import requests
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = r"D:\AI-Empire-System"
DASHBOARD_DIR = os.path.join(BASE_DIR, "ai-empire-dashboard")
BRIDGE_DIR = os.path.join(DASHBOARD_DIR, "local-agent-bridge")
WORK_DIR = os.path.join(BRIDGE_DIR, "render_workspace")
DEFAULT_RAW_VIDEO = r"C:\Users\draconik\Videos\Screen Recordings\Screen Recording 2026-11-01 210741.mp4"

TELEGRAM_TOKEN = "9049336740:AAGcKj_MrzyUTvsFD13wRp7y9x7tkhafLlg"
TELEGRAM_CHAT_ID = "7885596077"

def get_groq_key() -> str:
    env_file = os.path.join(DASHBOARD_DIR, ".env.local")
    if os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            for l in f:
                if l.startswith("GROQ_API_KEY="):
                    return l.split("=", 1)[1].strip().strip('"').strip("'")
    return os.environ.get("GROQ_API_KEY", "")

def format_ass_time(sec: float) -> str:
    sec = max(0.0, sec)
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = int(sec % 60)
    cs = int(round((sec - int(sec)) * 100))
    if cs >= 100:
        cs = 99
    return f"{h:01d}:{m:02d}:{s:02d}.{cs:02d}"

def generate_glass_badge(source_channel: str, out_path: str):
    """Menghasilkan badge YouTube glassmorphism 100% kapsul (pill shape)"""
    W, H = 1440, 360
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    m_x, m_y = 40, 30
    pill_w = W - 2 * m_x
    pill_h = H - 2 * m_y
    radius = pill_h // 2

    # Drop shadow
    shadow_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_img)
    s_draw.rounded_rectangle([m_x, m_y + 12, m_x + pill_w, m_y + pill_h + 12], radius=radius, fill=(0, 0, 0, 160))
    shadow_img = shadow_img.filter(ImageFilter.GaussianBlur(16))
    img = Image.alpha_composite(img, shadow_img)

    # Dark glass body
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([m_x, m_y, m_x + pill_w, m_y + pill_h], radius=radius, fill=(18, 20, 26, 220))

    # Top highlight
    glass_shine = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glass_shine)
    g_draw.rounded_rectangle([m_x + 4, m_y + 4, m_x + pill_w - 4, m_y + pill_h // 2], radius=radius, fill=(255, 255, 255, 28))
    glass_shine = glass_shine.filter(ImageFilter.GaussianBlur(4))
    img = Image.alpha_composite(img, glass_shine)
    draw = ImageDraw.Draw(img)

    # Glass border
    draw.rounded_rectangle([m_x, m_y, m_x + pill_w, m_y + pill_h], radius=radius, outline=(255, 255, 255, 65), width=6)

    # Red YouTube circular icon
    icon_r = 90
    cx = m_x + radius + 15
    cy = m_y + pill_h // 2
    draw.ellipse([cx - icon_r, cy - icon_r, cx + icon_r, cy + icon_r], fill=(235, 20, 35, 255))

    tri_size = 42
    points = [
        (cx - tri_size // 2 + 6, cy - tri_size),
        (cx - tri_size // 2 + 6, cy + tri_size),
        (cx + tri_size + 6, cy)
    ]
    draw.polygon(points, fill=(255, 255, 255, 255))

    # Text Source
    try:
        font = ImageFont.truetype("impact.ttf", 150)
    except:
        try:
            font = ImageFont.truetype("arialbd.ttf", 140)
        except:
            font = ImageFont.load_default()

    text = source_channel.upper()
    text_x = cx + icon_r + 50
    bbox = draw.textbbox((text_x, 0), text, font=font)
    text_h = bbox[3] - bbox[1]
    text_y = cy - text_h // 2 - 12
    draw.text((text_x, text_y), text, fill=(255, 255, 255, 255), font=font)

    badge_360 = img.resize((360, 90), Image.Resampling.LANCZOS)
    badge_360.save(out_path)
    print(f"✅ Glassmorphism watermark disimpan: {out_path}")

def generate_split_cover(raw_video: str, title: str, out_cover: str):
    """Mengekstrak 2 pembicara dari video mentah dan menyusun Split-Screen Cover 1080x1920"""
    print("📸 Mengekstrak frame pembicara dari video asli untuk cover...")
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    cap = cv2.VideoCapture(raw_video)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps

    # Sample video at strategic timestamps to quickly find 2 distinct speaker frames
    best_speaker1 = None
    best_speaker2 = None
    max_sharp1 = 0
    max_sharp2 = 0

    sample_times = [4.0, 8.0, 12.0, 18.0, 24.0, 82.0, 85.0, 88.0, 125.0, 135.0]
    for sec in sample_times:
        if sec > duration:
            continue
        cap.set(cv2.CAP_PROP_POS_MSEC, sec * 1000)
        ret, frame = cap.read()
        if not ret:
            continue
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        for (x, y, w, h) in faces:
            if w > 180:
                roi = gray[y : y + h, x : x + w]
                sharp = cv2.Laplacian(roi, cv2.CV_64F).var()
                chest_y = min(frame.shape[0] - 10, y + h + 80)
                chest_color = frame[y + h : chest_y, x : x + w].mean()
                if chest_color > 110: # Lighter shirt (Speaker 1)
                    if sharp > max_sharp1:
                        max_sharp1 = sharp
                        best_speaker1 = (frame.copy(), (x, y, w, h))
                else: # Darker shirt (Speaker 2)
                    if sharp > max_sharp2:
                        max_sharp2 = sharp
                        best_speaker2 = (frame.copy(), (x, y, w, h))

    cap.release()

    # Fallback jika hanya 1 pembicara yang terdeteksi
    if best_speaker1 is None and best_speaker2 is not None:
        best_speaker1 = best_speaker2
    elif best_speaker2 is None and best_speaker1 is not None:
        best_speaker2 = best_speaker1
    elif best_speaker1 is None and best_speaker2 is None:
        # Fallback baca frame 0
        cap = cv2.VideoCapture(raw_video)
        ret, frame = cap.read()
        cap.release()
        best_speaker1 = (frame, (600, 200, 400, 400))
        best_speaker2 = (frame, (600, 200, 400, 400))

    # Crop and scale to 1080x960 each
    crop_w = 1180
    crop_h = int(crop_w * (960 / 1080))

    f1, box1 = best_speaker1
    f2, box2 = best_speaker2

    cx1, cy1 = box1[0] + box1[2] // 2, box1[1] + box1[3] // 2
    cx2, cy2 = box2[0] + box2[2] // 2, box2[1] + box2[3] // 2

    rx1 = max(0, min(f2.shape[1] - crop_w, cx2 - crop_w // 2))
    ry1 = max(0, min(f2.shape[0] - crop_h, cy2 - crop_h // 2 - 30))
    top_half = cv2.resize(f2[ry1 : ry1 + crop_h, rx1 : rx1 + crop_w], (1080, 960), interpolation=cv2.INTER_LANCZOS4)

    fx1 = max(0, min(f1.shape[1] - crop_w, cx1 - crop_w // 2))
    fy1 = max(0, min(f1.shape[0] - crop_h, cy1 - crop_h // 2 - 30))
    bot_half = cv2.resize(f1[fy1 : fy1 + crop_h, fx1 : fx1 + crop_w], (1080, 960), interpolation=cv2.INTER_LANCZOS4)

    canvas = np.vstack([top_half, bot_half])
    cover_pil = Image.fromarray(cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB))

    # Center Yellow Card Banner
    card_w = 940
    card_h = 240
    card_x = (1080 - card_w) // 2
    card_y = 960 - (card_h // 2)
    radius = 42

    shadow_layer = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    s_draw.rounded_rectangle([card_x, card_y + 8, card_x + card_w, card_y + card_h + 8], radius=radius, fill=(0, 0, 0, 180))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(18))
    cover_pil.paste(shadow_layer, (0, 0), shadow_layer)

    card_layer = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(card_layer)
    c_draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + card_h], radius=radius, fill=(255, 230, 0, 255), outline=(0, 0, 0, 255), width=5)
    c_draw.rounded_rectangle([card_x + 5, card_y + 5, card_x + card_w - 5, card_y + card_h // 2], radius=radius, fill=(255, 255, 255, 45))
    cover_pil.paste(card_layer, (0, 0), card_layer)

    draw = ImageDraw.Draw(cover_pil)
    try:
        font = ImageFont.truetype("impact.ttf", 68)
    except:
        font = ImageFont.load_default()

    # Split title into 2 lines
    words = title.strip().split()
    if len(words) <= 4:
        mid = len(words) // 2
        line1 = " ".join(words[:mid]).upper() or words[0].upper()
        line2 = " ".join(words[mid:]).upper()
    else:
        mid = len(words) // 2
        line1 = " ".join(words[:mid]).upper()
        line2 = " ".join(words[mid:]).upper()

    def draw_outlined_text(d, pos, text, font, fill_color, stroke_color, stroke_width):
        d.text(pos, text, font=font, fill=fill_color, stroke_width=stroke_width, stroke_fill=stroke_color)

    b1 = draw.textbbox((0, 0), line1, font=font, stroke_width=7)
    w1 = b1[2] - b1[0]
    x1 = (1080 - w1) // 2
    y1 = card_y + 35

    b2 = draw.textbbox((0, 0), line2, font=font, stroke_width=7)
    w2 = b2[2] - b2[0]
    x2 = (1080 - w2) // 2
    y2 = card_y + 125

    draw_outlined_text(draw, (x1, y1), line1, font, (255, 255, 255), (0, 0, 0), stroke_width=7)
    draw_outlined_text(draw, (x2, y2), line2, font, (255, 255, 255), (0, 0, 0), stroke_width=7)

    cover_pil.save(out_cover, quality=98)
    print(f"✅ Cover Split-Screen asli berhasil dibuat: {out_cover}")

def transcribe_with_whisper(raw_video: str, words_json_path: str):
    """Ekstrak audio & transkrip per kata via Groq Whisper"""
    audio_path = os.path.join(WORK_DIR, "temp_voice.mp3")
    print("🎙️ Mengekstrak audio asli dari video...")
    subprocess.run(["ffmpeg", "-y", "-i", raw_video, "-vn", "-acodec", "libmp3lame", "-b:a", "128k", audio_path], check=True, capture_output=True)

    groq_key = get_groq_key()
    if not groq_key:
        print("⚠️ GROQ_API_KEY tidak ditemukan di .env.local, transkripsi dilewati.")
        return []

    print("⚡ Mengirim audio ke Groq Whisper untuk timestamps per kata...")
    url = "https://api.groq.com/openai/v1/audio/transcriptions"
    with open(audio_path, "rb") as f:
        resp = requests.post(
            url,
            headers={"Authorization": f"Bearer {groq_key}"},
            files={"file": ("audio.mp3", f, "audio/mpeg")},
            data=[
                ("model", "whisper-large-v3"),
                ("response_format", "verbose_json"),
                ("timestamp_granularities[]", "word"),
                ("timestamp_granularities[]", "segment"),
                ("language", "id")
            ],
            timeout=120
        )

    data = resp.json()
    if "words" in data:
        with open(words_json_path, "w", encoding="utf-8") as out:
            json.dump(data, out, ensure_ascii=False, indent=2)
        print(f"✅ Transkripsi selesai: {len(data['words'])} kata tersimpan.")
        return data["words"]
    else:
        print("⚠️ Response Whisper tanpa words:", data.get("error", data))
        return []

def build_subtitles(words_json_path: str, ass_path: str):
    """Membuat file subtitle ASS sinkron per kata"""
    if not os.path.exists(words_json_path):
        print("⚠️ File transkrip kata tidak ditemukan.")
        return

    with open(words_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    words = data.get("words", [])
    ass_header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: SubtitleStyle,Impact,78,&H00FFFFFF,&H00000000,&H00000000,&H80000000,-1,0,0,0,100,100,2,0,1,8,4,2,80,80,360,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []
    chunk_size = 3
    tag_yellow = "{\\c&H0000E6FF&}"
    tag_white = "{\\c&H00FFFFFF&}"

    i = 0
    while i < len(words):
        chunk = words[i : i + chunk_size]
        i += chunk_size
        st = chunk[0]["start"]
        en = chunk[-1]["end"]

        if en < 1.30:
            continue
        if st < 1.30:
            st = 1.30
        if en - st < 0.4:
            en = st + 0.4

        word_texts = [w["word"].strip().upper() for w in chunk if w["word"].strip()]
        if not word_texts:
            continue

        if len(word_texts) == 1:
            styled = f"{tag_yellow}{word_texts[0]}"
        elif len(word_texts) == 2:
            styled = f"{tag_yellow}{word_texts[0]} {tag_white}{word_texts[1]}"
        else:
            styled = f"{tag_yellow}{word_texts[0]} {tag_white}{' '.join(word_texts[1:])}"

        events.append(f"Dialogue: 0,{format_ass_time(st)},{format_ass_time(en)},SubtitleStyle,,0,0,360,,{styled}")

    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(ass_header + "\n".join(events) + "\n")
    print(f"✅ Subtitle ASS selesai disusun: {len(events)} events.")

def render_and_upload(raw_video: str, title: str, source_channel: str):
    cover_img = os.path.join(WORK_DIR, "real_video_split_cover.jpg")
    badge_img = os.path.join(WORK_DIR, "modern_glass_yt_badge.png")
    words_json = os.path.join(WORK_DIR, "felix_words_transcript.json")
    ass_path = os.path.join(WORK_DIR, "felix_perfect_subtitles.ass")
    output_mp4 = os.path.join(WORK_DIR, "felix_islamic_short_final_rendered.mp4")

    # 1. Bangun Watermark Glassmorphism
    generate_glass_badge(source_channel, badge_img)

    # 2. Bangun Split Cover Asli
    generate_split_cover(raw_video, title, cover_img)

    # 3. Transkripsi jika file transkrip belum ada
    if not os.path.exists(words_json):
        transcribe_with_whisper(raw_video, words_json)

    # 4. Bangun Subtitle ASS
    build_subtitles(words_json, ass_path)

    # 5. Render FFmpeg
    print("🎬 Merender Video Shorts Portrait 9:16...")
    escaped_ass = ass_path.replace("\\", "/").replace(":", "\\:")

    filter_complex = (
        "[0:v]crop=606:1078:650:0,scale=1080:1920:flags=lanczos[vmain];"
        "[1:v]scale=1080:1920[vcover];"
        "[vmain][vcover]overlay=0:0:enable='between(t,0,1.30)'[vwithcover];"
        f"[vwithcover][2:v]overlay=360:1730:enable='gte(t,1.30)'[vwithbadge];"
        f"[vwithbadge]subtitles=filename='{escaped_ass}'[vwithsub];"
        "[vwithsub]unsharp=5:5:1.1:5:5:0.0,eq=contrast=1.12:brightness=0.01:saturation=1.18[vout]"
    )

    cmd = [
        "ffmpeg", "-y",
        "-threads", "0",
        "-i", raw_video,
        "-loop", "1", "-t", "1.30", "-i", cover_img,
        "-i", badge_img,
        "-filter_complex", filter_complex,
        "-map", "[vout]",
        "-map", "0:a",
        "-af", "volume=1.35,highpass=f=80,lowpass=f=12000",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "30",
        "-c:a", "aac",
        "-b:a", "128k",
        "-pix_fmt", "yuv420p",
        output_mp4
    ]

    subprocess.run(cmd, check=True)
    size_mb = os.path.getsize(output_mp4) / (1024 * 1024)
    print(f"🎉 RENDER SUKSES! File: {output_mp4} ({size_mb:.2f} MB)")

    # 6. Kirim ke Telegram
    print("📤 Mengirim ke Telegram Bot...")
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendVideo"
    caption = (
        f"🎬 HASIL VIDEO YOUTUBE SHORTS (Z-CODE)\n\n"
        f"📌 Judul: {title}\n"
        f"📺 Source: {source_channel}\n"
        f"✨ Fitur:\n"
        f"  • Cover Split-Screen 2 Pembicara ASLI (1.30s)\n"
        f"  • Watermark Kapsul Glassmorphism Modern [{source_channel}]\n"
        f"  • Subtitle Presisi Word-Level (Kuning/Putih)\n"
        f"  • Filter CapCut 4K HD Sharpness & Contrast\n"
        f"  • 100% Suara Asli + Vocal Boost\n\n"
        f"Video siap upload ke YouTube Shorts channel Anda! 🚀"
    )

    cmd_curl = [
        "curl.exe", "--http1.1",
        "-F", f"chat_id={TELEGRAM_CHAT_ID}",
        "-F", f"caption={caption}",
        "-F", f"video=@{output_mp4}",
        url
    ]
    res = subprocess.run(cmd_curl, capture_output=True, text=True, encoding="utf-8", errors="replace")
    print("Telegram response:", res.stdout[:200])

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="")
    parser.add_argument("--title", default="TIDAK ADA TAKDIR YANG SALAH\nEKSPEKTASI KITA YANG SALAH")
    parser.add_argument("--source", default="YNTV")
    args = parser.parse_args()

    input_vid = args.input
    if not input_vid or not os.path.exists(input_vid):
        # Fallback input_video.mp4 or default raw video
        candidate = os.path.join(WORK_DIR, "input_video.mp4")
        if os.path.exists(candidate):
            input_vid = candidate
        else:
            input_vid = DEFAULT_RAW_VIDEO

    print(f"▶️ Memulai proses dengan video: {input_vid}")
    print(f"🏷️ Title Cover: {args.title}")
    print(f"📺 Source Watermark: {args.source}")

    render_and_upload(input_vid, args.title, args.source)

if __name__ == "__main__":
    main()
