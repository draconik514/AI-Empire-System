import os
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

def get_supabase_config():
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    env_file = os.path.join(DASHBOARD_DIR, ".env.local")
    if os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            for l in f:
                if l.startswith("NEXT_PUBLIC_SUPABASE_URL="):
                    url = l.split("=", 1)[1].strip().strip('"').strip("'")
                elif l.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    key = l.split("=", 1)[1].strip().strip('"').strip("'")
                elif l.startswith("NEXT_PUBLIC_SUPABASE_ANON_KEY=") and not key:
                    key = l.split("=", 1)[1].strip().strip('"').strip("'")
    return url, key

def update_queue_progress(queue_id: str, status: str, hook_text: str, full_script: str = None, telegram_url: str = None):
    """Update status & log aktivitas secara live ke tabel youtube_shorts_queue di Supabase"""
    if not queue_id:
        return
    sb_url, sb_key = get_supabase_config()
    if not sb_url or not sb_key:
        return
    payload = {
        "status": status,
        "hook_text": hook_text,
    }
    if full_script is not None:
        payload["full_script"] = full_script
    if telegram_url is not None:
        payload["telegram_message_url"] = telegram_url
    try:
        requests.patch(
            f"{sb_url}/rest/v1/youtube_shorts_queue?id=eq.{queue_id}",
            headers={
                "apikey": sb_key,
                "Authorization": f"Bearer {sb_key}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            },
            json=payload,
            timeout=10
        )
    except Exception as e:
        print("⚠️ Gagal update progress Supabase:", e)

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
    """Mengekstrak 2 pembicara UTAMA yang berbeda dengan MATA TERBUKA & WAJAH UTUH untuk Split-Screen Cover 1080x1920"""
    print("📸 Mengekstrak 2 pembicara berbeda (mata terbuka & wajah utuh) dari video asli untuk cover...")
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")
    cap = cv2.VideoCapture(raw_video)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 1920)
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 1080)

    def get_center_signature(frame):
        crop = frame[int(H * 0.1) : int(H * 0.85), int(W * 0.25) : int(W * 0.75)]
        return cv2.resize(crop, (120, 120)).astype(float)

    def detect_main_face(gray):
        faces = face_cascade.detectMultiScale(gray, 1.1, 5)
        valid = [f for f in faces if f[2] > 160 and f[1] < int(H * 0.55)]
        if valid:
            return sorted(valid, key=lambda f: f[2] * f[3], reverse=True)[0]
        return None

    def evaluate_eye_openness(gray, face):
        if face is None:
            return 0.0
        fx, fy, fw, fh = face
        ey1 = fy + int(fh * 0.20)
        ey2 = fy + int(fh * 0.48)
        ex1 = fx + int(fw * 0.14)
        ex2 = fx + int(fw * 0.86)
        eye_band = gray[ey1:ey2, ex1:ex2]
        if eye_band.size == 0:
            return 0.0
        eyes = eye_cascade.detectMultiScale(eye_band, 1.08, 4, minSize=(22, 16))
        bw = ex2 - ex1
        left_eyes = [e for e in eyes if (e[0] + e[2] / 2) < bw * 0.5]
        right_eyes = [e for e in eyes if (e[0] + e[2] / 2) >= bw * 0.5]
        both_detected = 1.0 if (len(left_eyes) > 0 and len(right_eyes) > 0) else (0.2 if len(eyes) > 0 else 0.0)
        left_half = eye_band[:, : bw // 2]
        right_half = eye_band[:, bw // 2 :]
        c_l = float(np.percentile(left_half, 90) - np.percentile(left_half, 5))
        c_r = float(np.percentile(right_half, 90) - np.percentile(right_half, 5))
        dark_l = 255.0 - float(np.percentile(left_half, 5))
        dark_r = 255.0 - float(np.percentile(right_half, 5))
        return both_detected * 800.0 + (c_l + c_r) * 3.0 + (dark_l + dark_r) * 2.0

    # Sampling menyeluruh mulai dari detik ke-0 (agar hook pembicara pertama di awal video tidak terlewat)
    # Langkah per 1 detik di 15 detik awal, dan per 2 detik setelahnya
    samples = []
    max_scan_sec = min(int(duration) - 1, 135)
    scan_points = list(range(0, min(15, int(duration)))) + list(range(16, max(17, max_scan_sec), 2))
    for sec in scan_points:
        cap.set(cv2.CAP_PROP_POS_MSEC, float(sec) * 1000)
        ret, frame = cap.read()
        if not ret:
            continue
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        face = detect_main_face(gray)
        sig = get_center_signature(frame)
        score = evaluate_eye_openness(gray, face)
        samples.append({"sec": sec, "frame": frame.copy(), "face": face, "sig": sig, "score": score})

    cap.release()

    if not samples:
        raise RuntimeError("Gagal membaca frame dari video input.")

    # Prioritaskan frame closeup pembicara (face is not None)
    face_samples = [s for s in samples if s["face"] is not None]
    if len(face_samples) < 2:
        face_samples = samples

    # Kelompokkan frame berdasarkan kemiripan visual signature (< 35.0)
    clusters = []
    for s in face_samples:
        placed = False
        for c in clusters:
            if np.abs(c[0]["sig"] - s["sig"]).mean() < 35.0:
                c.append(s)
                placed = True
                break
        if not placed:
            clusters.append([s])

    # Urutkan cluster berdasarkan jumlah kemunculan
    clusters.sort(key=lambda c: len(c), reverse=True)

    # Pembicara 1: Ambil frame dengan skor mata terbaik dari cluster pembicara paling dominan
    speaker1 = max(clusters[0], key=lambda s: s["score"])

    # Pembicara 2: WAJIB orang yang BERBEDA secara visual (diff >= 38.0) dari Pembicara 1
    # Ini menjamin tidak akan pernah mengambil orang yang sama dari sudut/baju yang identik
    speaker2 = None
    for c in clusters[1:]:
        cand = max(c, key=lambda s: s["score"])
        diff = float(np.abs(speaker1["sig"] - cand["sig"]).mean())
        if diff >= 38.0:
            speaker2 = cand
            break

    # Fallback jika hanya ada 1 cluster: cari frame dari seluruh face_samples yang paling beda visualnya
    if speaker2 is None:
        diff_samples = [s for s in face_samples if float(np.abs(speaker1["sig"] - s["sig"]).mean()) >= 35.0]
        if diff_samples:
            speaker2 = max(diff_samples, key=lambda s: s["score"])
        elif len(clusters) >= 2:
            speaker2 = max(clusters[1], key=lambda s: s["score"])
        else:
            diff_samples = sorted(samples, key=lambda s: np.abs(speaker1["sig"] - s["sig"]).mean(), reverse=True)[:5]
            speaker2 = max(diff_samples, key=lambda s: s["score"])

    print(f"✅ Pembicara 1 dipilih pada detik ke-{speaker1['sec']}s (Eye Score: {speaker1['score']:.1f})")
    print(f"✅ Pembicara 2 dipilih pada detik ke-{speaker2['sec']}s (Eye Score: {speaker2['score']:.1f})")

    # Crop dengan menjaga tinggi penuh wajah & kepala agar tidak terpotong atas/bawah
    # Potong 4% margin atas/bawah untuk membuang garis hitam tipis screen-recording jika ada
    y_margin = int(H * 0.04)
    crop_h = H - 2 * y_margin
    crop_w = min(W, int(crop_h * (1080 / 960)))

    def crop_speaker_standard(s_item):
        frame = s_item["frame"]
        face = s_item["face"]
        fh, fw = frame.shape[:2]
        if face is not None:
            cx = face[0] + face[2] // 2
        else:
            cx = fw // 2
        rx = max(0, min(fw - crop_w, cx - crop_w // 2))
        ry = y_margin
        sub = frame[ry : ry + crop_h, rx : rx + crop_w]
        return cv2.resize(sub, (1080, 960), interpolation=cv2.INTER_LANCZOS4)

    top_half = crop_speaker_standard(speaker2)  # Pembicara 2 di atas
    bot_half = crop_speaker_standard(speaker1)  # Pembicara 1 di bawah

    canvas = np.vstack([top_half, bot_half])
    cover_pil = Image.fromarray(cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB))

    # Center Yellow Card Banner (Solid Kuning Cerah)
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

    # Bersihkan literal \n dan bagi judul menjadi 2 baris
    clean_title = title.replace("\\n", " ").replace("\n", " ").strip()
    words = clean_title.split()
    if len(words) <= 4:
        mid = max(1, len(words) // 2)
        line1 = " ".join(words[:mid]).upper()
        line2 = " ".join(words[mid:]).upper()
    else:
        mid = len(words) // 2
        line1 = " ".join(words[:mid]).upper()
        line2 = " ".join(words[mid:]).upper()

    # Auto-fit ukuran font agar teks selalu muat rapi di dalam box kuning (card_w - 60)
    font_size = 68
    font = ImageFont.load_default()
    while font_size >= 36:
        try:
            font = ImageFont.truetype("impact.ttf", font_size)
        except:
            font = ImageFont.load_default()
            break
        b1_test = draw.textbbox((0, 0), line1, font=font, stroke_width=7)
        b2_test = draw.textbbox((0, 0), line2, font=font, stroke_width=7)
        if max(b1_test[2] - b1_test[0], b2_test[2] - b2_test[0]) <= (card_w - 60):
            break
        font_size -= 4

    def draw_outlined_text(d, pos, text, font, fill_color, stroke_color, stroke_width):
        d.text(pos, text, font=font, fill=fill_color, stroke_width=stroke_width, stroke_fill=stroke_color)

    b1 = draw.textbbox((0, 0), line1, font=font, stroke_width=7)
    w1 = b1[2] - b1[0]
    h1 = b1[3] - b1[1]
    x1 = (1080 - w1) // 2
    y1 = card_y + (card_h // 2 - h1) // 2 - 6

    b2 = draw.textbbox((0, 0), line2, font=font, stroke_width=7)
    w2 = b2[2] - b2[0]
    h2 = b2[3] - b2[1]
    x2 = (1080 - w2) // 2
    y2 = card_y + (card_h // 2) + (card_h // 2 - h2) // 2 - 6

    draw_outlined_text(draw, (x1, y1), line1, font, (255, 255, 255), (0, 0, 0), stroke_width=7)
    draw_outlined_text(draw, (x2, y2), line2, font, (255, 255, 255), (0, 0, 0), stroke_width=7)

    cover_pil.save(out_cover, quality=98)
    print(f"✅ Cover Split-Screen asli berhasil dibuat: {out_cover}")

def transcribe_with_whisper(raw_video: str, words_json_path: str):
    """Ekstrak audio asli & transkrip per kata via Groq Whisper secara akurat"""
    audio_path = words_json_path.replace(".json", ".mp3")
    print(f"🎙️ Mengekstrak audio asli dari video input: {raw_video}...")
    subprocess.run([
        "ffmpeg", "-y", "-i", raw_video,
        "-vn", "-acodec", "libmp3lame", "-b:a", "128k",
        audio_path
    ], check=True, capture_output=True)

    groq_key = get_groq_key()
    if not groq_key:
        print("⚠️ GROQ_API_KEY tidak ditemukan di .env.local, transkripsi dilewati.")
        return []

    print(f"⚡ Mengirim audio ke Groq Whisper ({os.path.getsize(audio_path)/(1024*1024):.2f} MB)...")
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

    try:
        if os.path.exists(audio_path):
            os.remove(audio_path)
    except:
        pass

    data = resp.json()
    if "words" in data:
        with open(words_json_path, "w", encoding="utf-8") as out:
            json.dump(data, out, ensure_ascii=False, indent=2)
        print(f"✅ Transkripsi selesai: {len(data['words'])} kata tersimpan sinkron.")
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

def generate_youtube_description_and_hashtags(title: str, source_channel: str, words_json_path: str) -> str:
    """Membuat deskripsi YouTube Shorts & Hashtags otomatis dari transkrip suara video menggunakan AI (Groq Llama 3.3)"""
    transcript_text = ""
    if os.path.exists(words_json_path):
        try:
            with open(words_json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            transcript_text = data.get("text", "").strip()
            if not transcript_text and "words" in data:
                transcript_text = " ".join(w.get("word", "").strip() for w in data["words"])
        except Exception as e:
            print("⚠️ Gagal membaca transkrip untuk deskripsi:", e)

    clean_title = title.replace("\n", " ").strip()
    groq_key = get_groq_key()

    fallback_desc = (
        f"{clean_title}\n\n"
        f"Simak renungan dan pembahasan lengkapnya dalam video singkat ini. Semoga bermanfaat dan menjadi pengingat kebaikan untuk kita semua.\n\n"
        f"📺 Source: {source_channel}\n\n"
        f"#shorts #dakwah #islamicshorts #renunganislam #motivasiislam #hijrah #selfreminder #{source_channel.lower().replace(' ', '')}"
    )

    if not groq_key or not transcript_text:
        return fallback_desc

    prompt = (
        f"Kamu adalah pakar SEO YouTube Shorts Islami/Dakwah Indonesia.\n"
        f"Buatkan Deskripsi YouTube Shorts yang menarik, menyentuh hati, dan SEO-friendly beserta Hashtag viral berdasarkan data video berikut:\n"
        f"- Judul Video: {clean_title}\n"
        f"- Source Channel: {source_channel}\n"
        f"- Transkrip Suara Video: \"{transcript_text[:2500]}\"\n\n"
        f"ATURAN OUTPUT (WAJIB DIIKUTI):\n"
        f"1. Langsung berikan teks siap copy-paste untuk kolom Deskripsi YouTube (tanpa kata pengantar seperti 'Berikut adalah deskripsinya:').\n"
        f"2. Paragraf 1: Kalimat hook kuat & ringkasan inti pesan dari transkrip suara di atas (2-3 kalimat).\n"
        f"3. Paragraf 2: Ajakan interaktif singkat (misal tulis pendapat di kolom komentar / bagikan kebaikan ini) & kredit '📺 Source: {source_channel}'.\n"
        f"4. Baris terakhir: 10-15 hashtag relevan dengan huruf kecil semua (wajib ada #shorts #fyp #dakwah #islamicshorts ditambah hashtag tokoh/topik spesifik dari isi transkrip)."
    )

    for model_name in ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]:
        try:
            print(f"🤖 Membuat Deskripsi & Hashtag YouTube otomatis dari transkrip via Groq AI ({model_name})...")
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model_name,
                    "messages": [
                        {"role": "system", "content": "Kamu adalah copywriter YouTube Shorts Islami terbaik di Indonesia. Output hanya teks deskripsi + hashtag siap copy-paste tanpa blok markdown."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.6,
                    "max_tokens": 600
                },
                timeout=30
            )
            res_json = resp.json()
            if "choices" in res_json and res_json["choices"]:
                ai_text = (res_json["choices"][0]["message"].get("content") or "").strip()
                if ai_text:
                    print("✅ Deskripsi & Hashtag AI berhasil dibuat!")
                    return ai_text
        except Exception as e:
            print(f"⚠️ Gagal generate deskripsi via {model_name}:", e)

    return fallback_desc

def render_and_upload(raw_video: str, title: str, source_channel: str, queue_id: str = ""):
    # Buat identifier unik berdasarkan video input saat ini
    file_stat = os.stat(raw_video)
    job_id = f"{int(time.time())}_{file_stat.st_size}"

    cover_img = os.path.join(WORK_DIR, f"cover_{job_id}.jpg")
    badge_img = os.path.join(WORK_DIR, "modern_glass_yt_badge.png")
    words_json = os.path.join(WORK_DIR, f"transcript_{job_id}.json")
    ass_path = os.path.join(WORK_DIR, f"subtitles_{job_id}.ass")
    output_mp4 = os.path.join(WORK_DIR, f"final_short_{job_id}.mp4")

    # 1. Bangun Watermark Glassmorphism & Split Cover Asli (2 Orang Berbeda)
    update_queue_progress(queue_id, "Rendering (20%)", "🎨 [20%] Mengekstrak 2 pembicara (mata terbuka) & menyusun Cover Split-Screen + Glass Watermark...")
    generate_glass_badge(source_channel, badge_img)
    generate_split_cover(raw_video, title, cover_img)

    # 3. Transkripsi Audio BARU dari Video Ini
    update_queue_progress(queue_id, "Rendering (45%)", "🎙️ [45%] Mengekstrak MP3 & mentranskrip suara per kata via Groq Whisper AI...")
    transcribe_with_whisper(raw_video, words_json)

    # 4. Bangun Subtitle ASS dari Transkrip Baru
    update_queue_progress(queue_id, "Rendering (65%)", "📝 [65%] Menyusun Subtitle ASS sinkron suara & merender video Portrait 9:16 HD 4K...")
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
        "-crf", "32",
        "-c:a", "aac",
        "-b:a", "128k",
        "-pix_fmt", "yuv420p",
        output_mp4
    ]

    subprocess.run(cmd, check=True)
    size_mb = os.path.getsize(output_mp4) / (1024 * 1024)
    print(f"🎉 RENDER SUKSES! File: {output_mp4} ({size_mb:.2f} MB)")

    # 6. Buat Deskripsi & Hashtag YouTube Otomatis dari Transkrip
    update_queue_progress(queue_id, "Rendering (85%)", "🤖 [85%] Membuat Deskripsi YouTube + Hashtag otomatis dari transkrip via Groq AI...")
    yt_desc_hashtags = generate_youtube_description_and_hashtags(title, source_channel, words_json)

    # 7. Kirim Video + Deskripsi & Hashtag ke Telegram
    update_queue_progress(queue_id, "Sending_Telegram (95%)", "📤 [95%] Mengirim Video + Deskripsi & Hashtag ke Bot Telegram...")
    print("📤 Mengirim Video & Deskripsi YouTube ke Telegram Bot...")
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendVideo"
    clean_title = title.replace("\n", " ").strip()
    caption_header = (
        f"🎬 HASIL VIDEO YOUTUBE SHORTS (Z-CODE)\n"
        f"📌 Judul: {clean_title}\n"
        f"📺 Source: {source_channel}\n\n"
        f"📝 DESKRIPSI & HASHTAG SIAP POST:\n"
        f"────────────────────\n"
    )
    caption = (caption_header + yt_desc_hashtags)[:1020]

    cmd_curl = [
        "curl.exe", "-s", "--retry", "3", "--max-time", "300",
        "-X", "POST", url,
        "-F", f"chat_id={TELEGRAM_CHAT_ID}",
        "-F", f"video=@{output_mp4}",
        "-F", f"caption={caption}"
    ]
    try:
        res = subprocess.run(cmd_curl, capture_output=True, text=True)
        print("Telegram response:", res.stdout[:200])

        # Kirim juga pesan teks terpisah berisi murni Deskripsi + Hashtag agar mudah di-copy 1x klik di Telegram
        try:
            requests.post(
                f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
                json={
                    "chat_id": TELEGRAM_CHAT_ID,
                    "text": yt_desc_hashtags
                },
                timeout=20
            )
            print("✅ Pesan Deskripsi + Hashtag siap copy-paste terkirim ke Telegram!")
        except Exception as msg_err:
            print("⚠️ Gagal mengirim pesan teks deskripsi terpisah:", msg_err)

        if '"ok":true' in res.stdout.replace(" ", ""):
            tg_link = "https://t.me/cs_bisnisku_2026_bot"
            try:
                resp_data = json.loads(res.stdout)
                msg_id = resp_data.get("result", {}).get("message_id")
                if msg_id:
                    tg_link = f"https://t.me/c/{TELEGRAM_CHAT_ID}/{msg_id}"
            except Exception:
                pass

            update_queue_progress(
                queue_id,
                "Review_in_Telegram",
                f"✅ Selesai! Video ({size_mb:.1f} MB) + Deskripsi & Hashtag AI telah dikirim ke Telegram.",
                full_script=yt_desc_hashtags,
                telegram_url=tg_link
            )

            print("🧹 Membersihkan file aset & hasil render sementara agar penyimpanan laptop tetap lega...")
            cleanup_targets = [cover_img, badge_img, words_json, ass_path, output_mp4]
            # Hapus juga salinan input_video.mp4 di dalam render_workspace (bukan file asli di folder luar)
            if os.path.abspath(raw_video).startswith(os.path.abspath(WORK_DIR)):
                cleanup_targets.append(raw_video)
            for target_file in cleanup_targets:
                try:
                    if os.path.exists(target_file):
                        os.remove(target_file)
                except Exception as clean_err:
                    print(f"⚠️ Gagal menghapus {target_file}: {clean_err}")
            print("✅ Pembersihan selesai! Penyimpanan laptop tetap bersih.")
    except Exception as e:
        print("Gagal upload Telegram:", e)
        update_queue_progress(queue_id, "Error", f"⚠️ Gagal kirim ke Telegram: {e}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="")
    parser.add_argument("--title", default="TIDAK ADA TAKDIR YANG SALAH\nEKSPEKTASI KITA YANG SALAH")
    parser.add_argument("--source", default="YNTV")
    parser.add_argument("--queue-id", default="")
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

    render_and_upload(input_vid, args.title, args.source, args.queue_id)

if __name__ == "__main__":
    main()
