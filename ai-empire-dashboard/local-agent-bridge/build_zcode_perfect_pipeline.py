import os
import sys
import json
import time
import math
import asyncio
import argparse
import subprocess
import requests
import cv2
import numpy as np
import edge_tts
from PIL import Image, ImageDraw, ImageFont, ImageFilter

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = r"D:\AI-Empire-System"
DASHBOARD_DIR = os.path.join(BASE_DIR, "ai-empire-dashboard")
BRIDGE_DIR = os.path.join(DASHBOARD_DIR, "local-agent-bridge")
WORK_DIR = os.path.join(BRIDGE_DIR, "render_workspace")
ASSETS_DIR = os.path.join(BRIDGE_DIR, "assets")
DEFAULT_RAW_VIDEO = r"C:\Users\draconik\Videos\Screen Recordings\Screen Recording 2026-11-01 210741.mp4"

TELEGRAM_TOKEN = "9049336740:AAGcKj_MrzyUTvsFD13wRp7y9x7tkhafLlg"
TELEGRAM_CHAT_ID = "7885596077"

EMOJI_KEYWORD_MAP = {
    # Kota / Tempat
    "JAKARTA": "🏙️", "INDONESIA": "🇮🇩", "KOTA": "🏙️", "KANTOR": "🏢", "RUMAH": "🏠", "MASJID": "🕌",
    # Emosi & Hati
    "HATI": "❤️", "JIWA": "🤍", "TENANG": "🕊️", "DAMAI": "🕊️", "SABAR": "🤲", "IKHLAS": "🤲",
    "MARAH": "😡", "EMOSI": "😤", "KESAL": "😤", "SEDIH": "🥺", "MENANGIS": "😭", "LUKA": "💔",
    "SENANG": "😊", "BAHAGIA": "✨", "TERTAWA": "😂",
    # Rezeki & Uang
    "REZEKI": "💰", "UANG": "💵", "HARTA": "💎", "KAYA": "💸", "MISKIN": "🥺",
    # Kematian & Akhirat
    "MATI": "💀", "WAFAT": "🥀", "KUBUR": "🪦", "AKHIRAT": "⏳", "SURGA": "✨", "NERAKA": "🔥",
    "DOSA": "⚠️", "PAHALA": "🤲",
    # Ibadah & Ketuhanan
    "ALLAH": "☝️", "DOA": "🤲", "SHOLAT": "🕌", "SUJUD": "🤲", "BERSYUKUR": "🙏", "ALHAMDULILLAH": "🤲",
    # Waktu & Alam
    "WAKTU": "⏰", "JAM": "⏱️", "MALAM": "🌙", "SIANG": "☀️", "BUMI": "🌍", "DUNIA": "🌍",
    # Peringatan & Lainnya
    "BAHAYA": "⚠️", "INGAT": "🧠", "SALAH": "❌", "BENAR": "✅", "API": "🔥", "BOM": "💣", "VIRAL": "🔥"
}

def get_groq_key() -> str:
    env_file = os.path.join(DASHBOARD_DIR, ".env.local")
    if os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("GROQ_API_KEY="):
                    k = line.strip().split("=", 1)[1].strip().strip('"')
                    if k and not k.startswith("gsk_your_"):
                        return k
    return os.environ.get("GROQ_API_KEY", "")

def update_queue_progress(queue_id: str, status: str, hook_text: str = None, full_script: str = None, telegram_url: str = None):
    """Sinkronisasi status pengerjaan secara real-time ke Dashboard Supabase"""
    if not queue_id:
        return
    supabase_key = ""
    supabase_url = ""
    env_file = os.path.join(DASHBOARD_DIR, ".env.local")
    if os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("NEXT_PUBLIC_SUPABASE_ANON_KEY="):
                    supabase_key = line.strip().split("=", 1)[1].strip().strip('"\'')
                elif line.startswith("NEXT_PUBLIC_SUPABASE_URL="):
                    supabase_url = line.strip().split("=", 1)[1].strip().strip('"\'')
    if not supabase_url:
        supabase_url = "https://nktfkwwrtuwqvtkcrnra.supabase.co"
    if not supabase_key:
        return

    url = f"{supabase_url}/rest/v1/youtube_shorts_queue?id=eq.{queue_id}"
    payload = {"status": status}
    if hook_text is not None:
        payload["hook_text"] = hook_text
    if full_script is not None:
        payload["full_script"] = full_script
    if telegram_url is not None:
        payload["telegram_message_url"] = telegram_url

    try:
        requests.patch(
            url,
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            },
            json=payload,
            timeout=10
        )
    except Exception as e:
        print(f"⚠️ Gagal update progress Supabase: {e}")

def format_ass_time(sec: float) -> str:
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = sec % 60
    return f"{h}:{m:02d}:{s:05.2f}"

def get_contextual_emojis_for_title(title: str) -> str:
    """Memilih emoji yang paling pas di luar shape title cover sesuai konteks bahasan"""
    t = title.lower()
    if any(w in t for w in ["marah", "azab", "dihukum", "bahaya", "takut", "murka", "peringatan"]):
        return "😱  💔  ⚠️"
    if any(w in t for w in ["hati", "tenang", "damai", "ikhlas", "sabar", "sembuh", "syukur"]):
        return "🥺  🤍  🕊️"
    if any(w in t for w in ["rezeki", "uang", "kaya", "harta", "bisnis", "cuan", "sukses"]):
        return "💸  💰  ✨"
    if any(w in t for w in ["mati", "wafat", "akhirat", "kubur", "dosa", "neraka", "kiamat", "ajal"]):
        return "🥀  ⏳  🤲"
    if any(w in t for w in ["sombong", "iri", "dengki", "kecewa", "sedih", "menangis"]):
        return "🫢  💔  🥺"
    if any(w in t for w in ["doa", "sholat", "allah", "hijrah", "islam", "surga"]):
        return "🤲  ✨  ☝️"
    return "😱  💥  👀"

def generate_channel_watermark(out_path: str):
    """Menghasilkan watermark logo Al-Qur'an dan nama 'short-islamic' di kiri atas video (hanya muncul setelah cover)"""
    logo_file = os.path.join(ASSETS_DIR, "quran_logo.png")
    badge_w = 200
    badge_h = 160
    badge = Image.new("RGBA", (badge_w, badge_h), (0, 0, 0, 0))

    if os.path.exists(logo_file):
        logo = Image.open(logo_file).convert("RGBA")
        logo_resized = logo.resize((84, 84), Image.Resampling.LANCZOS)
        logo_x = (badge_w - 84) // 2
        logo_y = 10

        shadow = Image.new("RGBA", (badge_w, badge_h), (0, 0, 0, 0))
        s_draw = ImageDraw.Draw(shadow)
        s_draw.ellipse((logo_x - 3, logo_y - 1, logo_x + 87, logo_y + 89), fill=(0, 0, 0, 160))
        shadow = shadow.filter(ImageFilter.GaussianBlur(6))
        badge.paste(shadow, (0, 0), shadow)
        badge.paste(logo_resized, (logo_x, logo_y), logo_resized)

    draw = ImageDraw.Draw(badge)
    font_size = 22
    try:
        font = ImageFont.truetype("arialbd.ttf", font_size)
    except:
        font = ImageFont.load_default()

    text = "short-islamic"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (badge_w - tw) // 2
    ty = 84 + 10 + 10

    draw.rounded_rectangle([tx - 10, ty - 4, tx + tw + 10, ty + th + 6], radius=10, fill=(0, 0, 0, 150))
    draw.text((tx, ty), text, font=font, fill=(255, 255, 255, 255), stroke_width=2, stroke_fill=(0, 0, 0, 220))

    badge.save(out_path)
    print(f"✅ Watermark YouTube Channel disimpan: {out_path}")

def generate_glass_badge(source_channel: str, out_path: str):
    """Menghasilkan watermark badge YouTube Kapsul Hitam (Pill Shape) presisi tinggi sesuai referensi resmi (media_1793689636013_ef8f29cd.png)"""
    text = source_channel.strip().upper()
    
    # 4x supersampling untuk render ikon & kurva kapsul yang tajam dan mulus
    scale = 4
    pill_h = 56 * scale
    radius = pill_h // 2
    
    font_size = int(32 * scale)
    font_names = ["arialbd.ttf", "ariblk.ttf", "segoeuib.ttf", "calibrib.ttf"]
    font = None
    for fn in font_names:
        try:
            font = ImageFont.truetype(fn, font_size)
            break
        except:
            continue
    if font is None:
        font = ImageFont.load_default()

    dummy_draw = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    bbox = dummy_draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]

    icon_diam = int(36 * scale)
    pad_left = int(12 * scale)
    spacing = int(14 * scale)
    # Right padding minimal sama dengan radius agar teks tidak pernah menyentuh lengkungan kapsul
    pad_right = int(24 * scale)

    W = pad_left + icon_diam + spacing + tw + pad_right
    H = pill_h

    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Dark background pill body (#0d0e12) dengan border tipis tajam (#373a46)
    border_w = max(2, int(1.5 * scale))
    draw.rounded_rectangle(
        [border_w // 2, border_w // 2, W - border_w // 2 - 1, H - border_w // 2 - 1],
        radius=radius,
        fill=(13, 14, 18, 240),
        outline=(55, 58, 70, 255),
        width=border_w
    )

    # Red YouTube circle
    cy = H // 2
    cx = pad_left + icon_diam // 2
    r = icon_diam // 2
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(235, 32, 32, 255))

    # White play triangle (segitiga sama sisi mengarah ke kanan tepat di tengah lingkaran merah)
    tri_h = int(icon_diam * 0.44)
    tri_w = int(tri_h * 0.88)
    t_cx = cx + int(1.5 * scale)
    tri_pts = [
        (t_cx - tri_w // 2, cy - tri_h // 2),
        (t_cx - tri_w // 2, cy + tri_h // 2),
        (t_cx + tri_w // 2, cy)
    ]
    draw.polygon(tri_pts, fill=(255, 255, 255, 255))

    # Channel text: teks putih bold yang sejajar sempurna secara vertikal
    tx = pad_left + icon_diam + spacing
    ty = cy - th // 2 - bbox[1] - int(1 * scale)
    draw.text((tx, ty), text, font=font, fill=(255, 255, 255, 255))

    target_w = W // scale
    target_h = H // scale
    badge = img.resize((target_w, target_h), Image.Resampling.LANCZOS)
    badge.save(out_path)
    print(f"✅ Watermark Glass Badge Kapsul disimpan: {out_path} ({target_w}x{target_h}px)")

def generate_split_cover(raw_video: str, title: str, out_cover: str):
    """Mengekstrak 2 pembicara UTAMA yang BERBEDA untuk Split-Screen Cover 1080x1920 dengan emoji luar shape.
    Mengembalikan (top_half, bot_half) berupa gambar numpy BGR 1080x960."""
    print("📸 Mengekstrak 2 pembicara berbeda (mata terbuka & wajah utuh) dari video asli untuk cover...")
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")
    cap = cv2.VideoCapture(raw_video)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 1920)
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 1080)

    def get_clothing_hist(frame, face):
        fx, fy, fw, fh = face
        fh_img, fw_img = frame.shape[:2]
        y1 = min(fh_img - 10, fy + int(fh * 1.05))
        y2 = min(fh_img, fy + int(fh * 2.3))
        x1 = max(0, fx + int(fw * 0.15))
        x2 = min(fw_img, fx + int(fw * 0.85))
        patch = frame[y1:y2, x1:x2]
        if patch.size == 0:
            return np.zeros((8, 8, 8))
        hsv = cv2.cvtColor(patch, cv2.COLOR_BGR2HSV)
        hist = cv2.calcHist([hsv], [0, 1, 2], None, [8, 8, 8], [0, 180, 0, 256, 0, 256])
        cv2.normalize(hist, hist)
        return hist

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
        eyes = eye_cascade.detectMultiScale(eye_band, 1.08, 4, minSize=(20, 14))
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

    closeup_samples = []
    two_shot_frames = []

    # Pindai detik demi detik (1s, 2s, 3s, ... s/d 60s) untuk mendeteksi perubahan scene & pembicara
    max_scan_sec = min(int(duration) - 1, 60)
    scan_points = list(range(1, max_scan_sec + 1))

    for sec in scan_points:
        cap.set(cv2.CAP_PROP_POS_MSEC, float(sec) * 1000)
        ret, frame = cap.read()
        if not ret:
            continue
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.15, 4, minSize=(40, 40))

        # 1. Deteksi Scene Wide / Dua Orang Bersama (Studio Two-Shot)
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        green_mask = cv2.inRange(hsv, (35, 40, 40), (85, 255, 255))
        green_pct = (cv2.countNonZero(green_mask) / (W * H)) * 100

        left_faces = [f for f in faces if (f[0] + f[2] // 2) < W * 0.45]
        right_faces = [f for f in faces if (f[0] + f[2] // 2) > W * 0.55]

        if (len(left_faces) > 0 and len(right_faces) > 0) or (len(faces) >= 2 and green_pct > 25) or (green_pct > 35 and len(faces) >= 1 and faces[0][2] < 120):
            sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
            two_shot_frames.append({
                "sec": sec,
                "frame": frame.copy(),
                "sharpness": sharpness
            })

        # 2. Deteksi Scene Close-up (Satu orang dominan)
        big_faces = [f for f in faces if f[2] >= 150 and 70 <= f[1] <= int(H * 0.48)]
        if big_faces and len(faces) <= 2:
            bf = sorted(big_faces, key=lambda f: f[2] * f[3], reverse=True)[0]
            fx, fy, fw, fh = bf
            face_crop = cv2.resize(gray[fy : fy + fh, fx : fx + fw], (100, 100))
            torso_h = get_clothing_hist(frame, bf)
            eye_score = evaluate_eye_openness(gray, bf)
            closeup_samples.append({
                "sec": sec,
                "frame": frame.copy(),
                "face": bf,
                "face_crop": face_crop,
                "torso_hist": torso_h,
                "score": eye_score
            })

    cap.release()

    if not closeup_samples:
        raise RuntimeError("Gagal menemukan wajah pembicara dari video input.")

    # Pembicara 1: Close-up dengan ketajaman & keterbukaan mata terbaik
    speaker1 = max(closeup_samples, key=lambda s: s["score"])
    print(f"✅ Pembicara 1 (Guest/Closeup) dipilih pada detik ke-{speaker1['sec']}s (Eye Score: {speaker1['score']:.1f})")

    # Pembicara 2: Deteksi perpindahan scene ke pembicara lain yang GENUINE berbeda
    speaker2_img = None
    distinct_closeups = []
    for c in closeup_samples:
        if c["sec"] == speaker1["sec"]:
            continue
        corr = cv2.matchTemplate(speaker1["face_crop"], c["face_crop"], cv2.TM_CCOEFF_NORMED)[0][0]
        torso_sim = cv2.compareHist(speaker1["torso_hist"], c["torso_hist"], cv2.HISTCMP_CORREL) if (speaker1["torso_hist"] is not None and c["torso_hist"] is not None) else 0.0

        # Pembicara lain yang berbeda WAJIB memiliki fitur wajah berbeda (corr < 0.35) DAN pakaian berbeda (torso_sim < 0.65)
        if corr < 0.35 and torso_sim < 0.65:
            distinct_closeups.append((c, corr, torso_sim))

    if distinct_closeups:
        best_cand = max(distinct_closeups, key=lambda x: x[0]["score"])[0]
        print(f"✅ Ditemukan closeup pembicara 2 yang BERBEDA pada detik ke-{best_cand['sec']}s (Score: {best_cand['score']:.1f})")
        
        y_margin = int(H * 0.04)
        crop_h = H - 2 * y_margin
        crop_w = min(W, int(crop_h * (1080 / 960)))
        face = best_cand["face"]
        cx = face[0] + face[2] // 2
        rx = max(0, min(W - crop_w, cx - crop_w // 2))
        sub = best_cand["frame"][y_margin : y_margin + crop_h, rx : rx + crop_w]
        speaker2_img = cv2.resize(sub, (1080, 960), interpolation=cv2.INTER_LANCZOS4)
    elif two_shot_frames:
        best_wide = max(two_shot_frames, key=lambda t: t["sharpness"])
        print(f"🎬 Mengekstrak Pembicara 2 (Host/Wendi) dari Wide Shot Studio pada detik ke-{best_wide['sec']}s (Sharpness: {best_wide['sharpness']:.1f})...")
        w_frame = best_wide["frame"]
        crop_h = int(H * 0.75)
        crop_w = int(crop_h * (1080 / 960))
        ry = int(H * 0.16)
        rx = int(W - crop_w - 40)
        sub = w_frame[ry : ry + crop_h, rx : rx + crop_w]
        speaker2_img = cv2.resize(sub, (1080, 960), interpolation=cv2.INTER_LANCZOS4)
        print("✅ Berhasil mengekstrak pembicara 2 dari sofa studio!")
    else:
        print("ℹ️ Menggunakan koordinat studio sofa fallback...")
        cap2 = cv2.VideoCapture(raw_video)
        cap2.set(cv2.CAP_PROP_POS_MSEC, 20000)
        _, f_couch = cap2.read()
        cap2.release()
        crop_h = int(H * 0.75)
        crop_w = int(crop_h * (1080 / 960))
        ry = int(H * 0.16)
        rx = int(W - crop_w - 40)
        sub = f_couch[ry : ry + crop_h, rx : rx + crop_w]
        speaker2_img = cv2.resize(sub, (1080, 960), interpolation=cv2.INTER_LANCZOS4)

    # Crop Pembicara 1 (Closeup Speaker 1)
    y_margin = int(H * 0.04)
    crop_h = H - 2 * y_margin
    crop_w = min(W, int(crop_h * (1080 / 960)))
    cx1 = speaker1["face"][0] + speaker1["face"][2] // 2
    rx1 = max(0, min(W - crop_w, cx1 - crop_w // 2))
    sub1 = speaker1["frame"][y_margin : y_margin + crop_h, rx1 : rx1 + crop_w]
    speaker1_img = cv2.resize(sub1, (1080, 960), interpolation=cv2.INTER_LANCZOS4)

    # Gabungkan: Pembicara 2 di Atas, Pembicara 1 di Bawah
    top_half = speaker2_img
    bot_half = speaker1_img
    canvas = np.vstack([top_half, bot_half])
    cover_pil = Image.fromarray(cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB))

    # Center Black Glass + Yellow Card Banner (Sesuai Referensi Dua Warna)
    card_w = 940
    card_h = 240
    card_x = (1080 - card_w) // 2
    card_y = 960 - (card_h // 2)
    y_mid = card_y + (card_h // 2)
    radius = 42

    shadow_layer = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    s_draw.rounded_rectangle([card_x, card_y + 8, card_x + card_w, card_y + card_h + 8], radius=radius, fill=(0, 0, 0, 180))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(18))
    cover_pil.paste(shadow_layer, (0, 0), shadow_layer)

    card_layer = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(card_layer)
    # 1. Paruh Atas: Hitam Glassmorphism Transparan (Tembus pandang melihat latar belakang video)
    c_draw.rounded_rectangle([card_x, card_y, card_x + card_w, y_mid], radius=radius, corners=(True, True, False, False), fill=(10, 12, 16, 145))
    c_draw.rounded_rectangle([card_x + 4, card_y + 3, card_x + card_w - 4, card_y + 32], radius=radius - 4, corners=(True, True, False, False), fill=(255, 255, 255, 30))
    # 2. Paruh Bawah: Kuning Terang Solid
    c_draw.rounded_rectangle([card_x, y_mid, card_x + card_w, card_y + card_h], radius=radius, corners=(False, False, True, True), fill=(255, 222, 0, 255))
    # 3. Garis Tepi & Pemisah Hitam Pekat
    c_draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + card_h], radius=radius, outline=(0, 0, 0, 255), width=5)
    c_draw.line([(card_x, y_mid), (card_x + card_w, y_mid)], fill=(0, 0, 0, 255), width=5)
    cover_pil.paste(card_layer, (0, 0), card_layer)

    draw = ImageDraw.Draw(cover_pil)
    clean_title = title.replace("\\n", " ").replace("\n", " ").strip()
    words = clean_title.split()
    mid = len(words) // 2
    line1 = " ".join(words[:mid]).upper()
    line2 = " ".join(words[mid:]).upper()

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
    w1, h1 = b1[2] - b1[0], b1[3] - b1[1]
    x1 = (1080 - w1) // 2
    y1 = card_y + (card_h // 2 - h1) // 2 - 6

    b2 = draw.textbbox((0, 0), line2, font=font, stroke_width=7)
    w2, h2 = b2[2] - b2[0], b2[3] - b2[1]
    x2 = (1080 - w2) // 2
    y2 = card_y + (card_h // 2) + (card_h // 2 - h2) // 2 - 6

    draw_outlined_text(draw, (x1, y1), line1, font, (255, 255, 255), (0, 0, 0), stroke_width=7)
    draw_outlined_text(draw, (x2, y2), line2, font, (255, 255, 255), (0, 0, 0), stroke_width=7)

    cover_pil.save(out_cover, quality=98)
    print(f"✅ Cover Split-Screen asli berhasil dibuat: {out_cover}")
    return top_half, bot_half

def generate_ai_voice_hook(title: str, out_mp3: str) -> float:
    """Membuat rekaman suara AI Hook (Edge-TTS) membacakan judul cover & mengembalikan durasinya"""
    clean_title = title.replace("\n", " ").replace(":", ", ").replace("-", " ").strip()
    hook_text = clean_title

    async def _tts():
        comm = edge_tts.Communicate(hook_text, "id-ID-ArdiNeural", rate="+6%")
        await comm.save(out_mp3)

    asyncio.run(_tts())

    cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", out_mp3]
    dur = float(subprocess.check_output(cmd).decode().strip())
    print(f"🎙️ AI Voice-Over Hook selesai dibuat: {dur:.2f} detik")
    return dur

def generate_animated_cover_segment(top_half, bot_half, title: str, hook_audio_path: str, duration_sec: float, out_clip_path: str):
    """Merender video intro cover dengan durasi tepat sesuai audio AI VO Hook dan motion spring pada rectangle title"""
    fps = 30.0
    total_frames = max(15, int(duration_sec * fps))

    base_split = np.vstack([top_half, bot_half])
    base_pil = Image.fromarray(cv2.cvtColor(base_split, cv2.COLOR_BGR2RGB))

    clean_title = title.replace("\\n", " ").replace("\n", " ").strip()
    words = clean_title.split()
    mid = len(words) // 2
    line1 = " ".join(words[:mid]).upper()
    line2 = " ".join(words[mid:]).upper()

    # Pre-render Banner Asset (Shadow + Yellow Card + Specular Highlight + Text) ONCE
    card_w, card_h = 940, 240
    margin = 40
    asset_w, asset_h = card_w + margin * 2, card_h + margin * 2
    card_asset = Image.new("RGBA", (asset_w, asset_h), (0, 0, 0, 0))

    # Shadow (blurred once on small card_asset, NOT 1080x1920 120 times!)
    s_layer = Image.new("RGBA", (asset_w, asset_h), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(s_layer)
    s_draw.rounded_rectangle([margin, margin + 8, margin + card_w, margin + card_h + 8], radius=42, fill=(0, 0, 0, 180))
    s_layer = s_layer.filter(ImageFilter.GaussianBlur(16))
    card_asset.paste(s_layer, (0, 0), s_layer)

    # Black Transparent Glass + Yellow Card Body (Tembus pandang melihat latar belakang video)
    c_draw = ImageDraw.Draw(card_asset)
    y_mid_asset = margin + card_h // 2
    # 1. Paruh Atas: Hitam Glassmorphism Transparan (Tembus pandang melihat latar belakang video)
    c_draw.rounded_rectangle([margin, margin, margin + card_w, y_mid_asset], radius=42, corners=(True, True, False, False), fill=(10, 12, 16, 145))
    c_draw.rounded_rectangle([margin + 4, margin + 3, margin + card_w - 4, margin + 32], radius=38, corners=(True, True, False, False), fill=(255, 255, 255, 30))
    # 2. Paruh Bawah: Kuning Terang Solid
    c_draw.rounded_rectangle([margin, y_mid_asset, margin + card_w, margin + card_h], radius=42, corners=(False, False, True, True), fill=(255, 222, 0, 255))
    # 3. Garis Tepi & Pemisah Hitam Pekat
    c_draw.rounded_rectangle([margin, margin, margin + card_w, margin + card_h], radius=42, outline=(0, 0, 0, 255), width=5)
    c_draw.line([(margin, y_mid_asset), (margin + card_w, y_mid_asset)], fill=(0, 0, 0, 255), width=5)

    # Text on Card (Keduanya teks putih dengan stroke hitam pekat)
    font_size = 68
    try:
        font = ImageFont.truetype("impact.ttf", font_size)
    except:
        font = ImageFont.load_default()

    b1 = c_draw.textbbox((0, 0), line1, font=font, stroke_width=7)
    w1, h1 = b1[2] - b1[0], b1[3] - b1[1]
    x1 = margin + (card_w - w1) // 2
    y1 = margin + (card_h // 2 - h1) // 2 - 6

    b2 = c_draw.textbbox((0, 0), line2, font=font, stroke_width=7)
    w2, h2 = b2[2] - b2[0], b2[3] - b2[1]
    x2 = margin + (card_w - w2) // 2
    y2 = margin + (card_h // 2) + (card_h // 2 - h2) // 2 - 6

    c_draw.text((x1, y1), line1, font=font, fill=(255, 255, 255), stroke_width=7, stroke_fill=(0, 0, 0))
    c_draw.text((x2, y2), line2, font=font, fill=(255, 255, 255), stroke_width=7, stroke_fill=(0, 0, 0))

    temp_video = out_clip_path.replace(".mp4", "_temp_raw.mp4")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(temp_video, fourcc, fps, (1080, 1920))

    for f_idx in range(total_frames):
        t = f_idx / fps
        # Motion animation: Spring pop-in pada 0.5s awal lalu gentle breathing pulse
        if t < 0.5:
            scale = 1.0 - 0.30 * math.exp(-6.0 * t) * math.cos(12.0 * t)
        else:
            scale = 1.0 + 0.012 * math.sin(3.5 * (t - 0.5))

        cw = int(asset_w * scale)
        ch = int(asset_h * scale)
        scaled_card = card_asset.resize((cw, ch), Image.Resampling.BILINEAR)
        px = 540 - (cw // 2)
        py = 960 - (ch // 2)

        frame_pil = base_pil.copy()
        frame_pil.paste(scaled_card, (px, py), scaled_card)

        frame_bgr = cv2.cvtColor(np.array(frame_pil), cv2.COLOR_RGB2BGR)
        writer.write(frame_bgr)

    writer.release()

    # Mux dengan audio hook AI (standar 30fps & AAC 44100Hz stereo agar instan concat)
    cmd_mux = [
        "ffmpeg", "-y",
        "-i", temp_video,
        "-i", hook_audio_path,
        "-c:v", "libx264", "-preset", "fast",
        "-crf", "18", "-maxrate", "8500k", "-bufsize", "16000k",
        "-r", "30",
        "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "2",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-shortest",
        out_clip_path
    ]
    subprocess.run(cmd_mux, check=True)
    if os.path.exists(temp_video):
        try: os.remove(temp_video)
        except: pass
    print(f"✅ Video intro cover motion berhasil dibuat: {out_clip_path}")

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

    print(f"⚡ Mengirim audio ke Groq Whisper via curl.exe ({os.path.getsize(audio_path)/(1024*1024):.2f} MB)...")
    cmd_whisper = [
        "curl.exe", "-sS", "--retry", "3", "--max-time", "120",
        "-X", "POST", "https://api.groq.com/openai/v1/audio/transcriptions",
        "-H", f"Authorization: Bearer {groq_key}",
        "-F", f"file=@{audio_path}",
        "-F", "model=whisper-large-v3",
        "-F", "response_format=verbose_json",
        "-F", "timestamp_granularities[]=word",
        "-F", "timestamp_granularities[]=segment",
        "-F", "language=id"
    ]
    res = subprocess.run(cmd_whisper, capture_output=True, text=True)

    try:
        if os.path.exists(audio_path):
            os.remove(audio_path)
    except:
        pass

    try:
        data = json.loads(res.stdout)
    except Exception as e:
        print("⚠️ Gagal parse JSON Whisper:", e, res.stdout[:200])
        data = {}
    if "words" in data:
        with open(words_json_path, "w", encoding="utf-8") as out:
            json.dump(data, out, ensure_ascii=False, indent=2)
        print(f"✅ Transkripsi selesai: {len(data['words'])} kata tersimpan sinkron.")
        return data["words"]
    else:
        print("⚠️ Response Whisper tanpa words:", data.get("error", data))
        return []

def build_subtitles(words_json_path: str, ass_path: str, caption_style: str = "yellow"):
    """Membuat file subtitle ASS sinkron suara dengan 3 pilihan gaya:
    1. 'yellow': Kuning Punch Z-Code
    2. 'green_emoji': Hijau Neon + Emoji Kontekstual otomatis di atas kata penting
    3. 'monochrome': Putih Bersih Minimalis"""
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
Style: EmojiStyle,Segoe UI Emoji,64,&H00FFFFFF,&H00000000,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,2,80,80,460,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []
    chunk_size = 3

    # Tag warna ASS (&HBBGGRR&)
    tag_yellow = "{\\c&H0000E6FF&}"
    tag_neon_green = "{\\c&H0014FF39&}"
    tag_white = "{\\c&H00FFFFFF&}"

    i = 0
    while i < len(words):
        chunk = words[i : i + chunk_size]
        i += chunk_size
        st = chunk[0]["start"]
        en = chunk[-1]["end"]

        if en - st < 0.35:
            en = st + 0.35

        word_texts = [w["word"].strip().upper() for w in chunk if w["word"].strip()]
        if not word_texts:
            continue

        # Format teks sesuai caption_style
        if caption_style == "green_emoji":
            # Gaya 2: Hijau Neon + Emoji
            if len(word_texts) == 1:
                styled = f"{tag_neon_green}{word_texts[0]}"
            elif len(word_texts) == 2:
                styled = f"{tag_neon_green}{word_texts[0]} {tag_white}{word_texts[1]}"
            else:
                styled = f"{tag_neon_green}{word_texts[0]} {tag_white}{' '.join(word_texts[1:])}"

            # Cek apakah ada kata yang cocok untuk emoji kontekstual
            found_emoji = None
            for w in word_texts:
                clean_w = "".join(c for c in w if c.isalnum())
                if clean_w in EMOJI_KEYWORD_MAP:
                    found_emoji = EMOJI_KEYWORD_MAP[clean_w]
                    break

            if found_emoji:
                events.append(f"Dialogue: 0,{format_ass_time(st)},{format_ass_time(en)},EmojiStyle,,0,0,460,,{found_emoji}")
            events.append(f"Dialogue: 1,{format_ass_time(st)},{format_ass_time(en)},SubtitleStyle,,0,0,360,,{styled}")

        elif caption_style == "monochrome":
            # Gaya 3: Hitam Putih Elegan Minimalis
            styled = f"{tag_white}{' '.join(word_texts)}"
            events.append(f"Dialogue: 0,{format_ass_time(st)},{format_ass_time(en)},SubtitleStyle,,0,0,360,,{styled}")

        else:
            # Gaya 1: Kuning Punch Z-Code (Default)
            if len(word_texts) == 1:
                styled = f"{tag_yellow}{word_texts[0]}"
            elif len(word_texts) == 2:
                styled = f"{tag_yellow}{word_texts[0]} {tag_white}{word_texts[1]}"
            else:
                styled = f"{tag_yellow}{word_texts[0]} {tag_white}{' '.join(word_texts[1:])}"
            events.append(f"Dialogue: 0,{format_ass_time(st)},{format_ass_time(en)},SubtitleStyle,,0,0,360,,{styled}")

    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(ass_header + "\n".join(events) + "\n")
    print(f"✅ Subtitle ASS selesai disusun (Gaya: {caption_style}): {len(events)} events.")

def generate_youtube_description_and_hashtags(title: str, source_channel: str, words_json_path: str, source_url: str = "") -> str:
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

    source_line = f"📺 Source: {source_channel}"
    if source_url:
        source_line += f"\n🔗 Link Asli: {source_url}"

    fallback_desc = (
        f"{clean_title}\n\n"
        f"Simak renungan dan pembahasan lengkapnya dalam video singkat ini. Semoga bermanfaat dan menjadi pengingat kebaikan untuk kita semua.\n\n"
        f"{source_line}\n\n"
        f"#shorts #dakwah #islamicshorts #renunganislam #motivasiislam #hijrah #selfreminder #{source_channel.lower().replace(' ', '')}"
    )

    if not groq_key or not transcript_text:
        return fallback_desc

    prompt = (
        f"Kamu adalah pakar SEO YouTube Shorts Islami/Dakwah Indonesia.\n"
        f"Buatkan Deskripsi YouTube Shorts yang menarik, menyentuh hati, dan SEO-friendly beserta Hashtag viral berdasarkan data video berikut:\n"
        f"- Judul Video: {clean_title}\n"
        f"- Source Channel: {source_channel}\n"
        f"- Source URL: {source_url}\n"
        f"- Transkrip Suara Video: \"{transcript_text[:2500]}\"\n\n"
        f"ATURAN OUTPUT (WAJIB DIIKUTI):\n"
        f"1. Langsung berikan teks siap copy-paste untuk kolom Deskripsi YouTube (tanpa kata pengantar seperti 'Berikut adalah deskripsinya:').\n"
        f"2. Paragraf 1: Kalimat hook kuat & ringkasan inti pesan dari transkrip suara di atas (2-3 kalimat).\n"
        f"3. Paragraf 2: Ajakan interaktif singkat (misal tulis pendapat di kolom komentar / bagikan kebaikan ini) & kredit:\n"
        f"{source_line}\n"
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

def calculate_smart_crop_timeline(video_path: str, crop_w: int = 606, crop_h: int = 1078):
    """Mendeteksi perpindahan kamera secara dinamis (Smart Auto-Reframe).
    Saat ada 1 pembicara: kamera fokus ke pembicara itu.
    Saat ada 2 orang dalam 1 scene: menganalisis pergerakan mulut (mouth variance) untuk fokus ke orang yang SEDANG BICARA.
    Jika keduanya bicara atau hening: mempertahankan framing stabil tanpa memotong tubuh orang di tengah (seam).
    Menghasilkan ekspresi FFmpeg crop dinamis x='if(lt(t,...),...)'."""
    print("🎯 Menganalisis Smart Auto-Reframe (Pelacakan Pembicara Aktif & Antarmuka Multi-Kamera)...")
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 1920)
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 1080)

    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    default_x = max(0, min(W - crop_w, (W - crop_w) // 2))

    # Pindai setiap 0.75 detik untuk mendeteksi siapa yang aktif berbicara
    time_points = np.arange(0, duration, 0.75)
    raw_positions = []
    prev_active_cx = W // 2

    for t in time_points:
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
        ret1, f1 = cap.read()
        ret2, f2 = cap.read()
        if not (ret1 and ret2):
            raw_positions.append((t, prev_active_cx))
            continue

        gray1 = cv2.cvtColor(f1, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(f2, cv2.COLOR_BGR2GRAY)

        faces = face_cascade.detectMultiScale(gray1, 1.15, 4, minSize=(60, 60))
        valid_faces = [f for f in faces if f[2] >= 75 and f[1] < H * 0.65]

        if len(valid_faces) == 0:
            raw_positions.append((t, prev_active_cx))
        elif len(valid_faces) == 1:
            cx = valid_faces[0][0] + valid_faces[0][2] // 2
            prev_active_cx = cx
            raw_positions.append((t, cx))
        else:
            # Multi-person / Two-shot: Analisis gerakan bibir (mouth motion)
            best_face = None
            max_motion = -1.0
            for f in valid_faces:
                fx, fy, fw, fh = f
                my1 = fy + int(fh * 0.65)
                my2 = fy + int(fh * 0.95)
                mx1 = fx + int(fw * 0.25)
                mx2 = fx + int(fw * 0.75)
                m1 = gray1[my1:my2, mx1:mx2]
                m2 = gray2[my1:my2, mx1:mx2]
                if m1.size == 0 or m2.size == 0:
                    continue
                motion = float(np.mean(np.abs(m1.astype(float) - m2.astype(float))))
                if motion > max_motion:
                    max_motion = motion
                    best_face = f

            # Jika gerakan mulut > 1.8: orang ini sedang bicara -> ganti kamera ke dia
            if best_face is not None and max_motion > 1.8:
                cx = best_face[0] + best_face[2] // 2
                prev_active_cx = cx
                raw_positions.append((t, cx))
            else:
                # Jika hening dan prev masih default di tengah: fokuskan ke orang pertama agar tidak memotong di tengah
                if prev_active_cx == W // 2 and valid_faces:
                    prev_active_cx = valid_faces[0][0] + valid_faces[0][2] // 2
                raw_positions.append((t, prev_active_cx))

    cap.release()

    if not raw_positions:
        return str(default_x)

    # Filter Stabilitas: Gabungkan perpindahan yang durasinya < 2.0s agar transisi kamera mulus layaknya editor podcast profesional
    segments = []
    current_x = max(0, min(W - crop_w, raw_positions[0][1] - crop_w // 2))
    seg_start = 0.0

    for i in range(1, len(raw_positions)):
        t, cx = raw_positions[i]
        target_x = max(0, min(W - crop_w, cx - crop_w // 2))

        if abs(target_x - current_x) > 160 and (t - seg_start) >= 2.0:
            segments.append((seg_start, t, current_x))
            current_x = target_x
            seg_start = t

    segments.append((seg_start, duration, current_x))
    print(f"🎬 Terdeteksi {len(segments)} segmen perpindahan fokus kamera cerdas:")
    for s in segments:
        print(f"   ⏱️ {s[0]:5.1f}s -> {s[1]:5.1f}s: X = {s[2]}")

    # Susun ekspresi bertingkat FFmpeg: if(lt(t, t1), X1, if(lt(t, t2), X2, ...))
    expr = str(segments[-1][2])
    for s in reversed(segments[:-1]):
        expr = f"if(lt(t,{s[1]:.2f}),{s[2]},{expr})"

    return expr

def render_and_upload(raw_video: str, title: str, source_channel: str, queue_id: str = "", caption_style: str = "yellow", source_url: str = ""):
    file_stat = os.stat(raw_video)
    job_id = f"{int(time.time())}_{file_stat.st_size}"

    cover_img = os.path.join(WORK_DIR, f"cover_{job_id}.jpg")
    hook_mp3 = os.path.join(WORK_DIR, f"hook_{job_id}.mp3")
    cover_segment_mp4 = os.path.join(WORK_DIR, f"cover_seg_{job_id}.mp4")
    main_segment_mp4 = os.path.join(WORK_DIR, f"main_seg_{job_id}.mp4")
    badge_img = os.path.join(WORK_DIR, "modern_glass_yt_badge.png")
    channel_badge_img = os.path.join(WORK_DIR, "channel_watermark.png")
    words_json = os.path.join(WORK_DIR, f"transcript_{job_id}.json")
    ass_path = os.path.join(WORK_DIR, f"subtitles_{job_id}.ass")
    output_mp4 = os.path.join(WORK_DIR, f"final_short_{job_id}.mp4")

    # 1. Bangun Watermark Glassmorphism & YouTube Channel Badge (Top-Left)
    update_queue_progress(queue_id, "Rendering (15%)", "🎨 [15%] Menyiapkan Watermark Channel & Glass Source Badge...")
    generate_glass_badge(source_channel, badge_img)
    generate_channel_watermark(channel_badge_img)

    # 2. Ekstrak 2 Pembicara Berbeda & Gambar Cover Statis
    update_queue_progress(queue_id, "Rendering (25%)", "📸 [25%] Mengekstrak 2 pembicara berbeda & emoji cover...")
    top_half, bot_half = generate_split_cover(raw_video, title, cover_img)

    # 3. AI Voice-Over Hook dari Judul Cover & Animated Motion Cover Segment
    update_queue_progress(queue_id, "Rendering (35%)", "🎙️ [35%] Memproduksi AI Voice-Over Hook & Animasi Motion Cover...")
    dur_hook = generate_ai_voice_hook(title, hook_mp3)
    generate_animated_cover_segment(top_half, bot_half, title, hook_mp3, dur_hook, cover_segment_mp4)

    # 4. Transkripsi Audio BARU dari Video Ini via Whisper
    update_queue_progress(queue_id, "Rendering (50%)", "🎙️ [50%] Mentranskrip suara video asli per kata via Groq Whisper AI...")
    transcribe_with_whisper(raw_video, words_json)

    # 5. Bangun Subtitle ASS sesuai gaya yang dipilih (Kuning / Hijau Emoji / Hitam Putih)
    update_queue_progress(queue_id, "Rendering (65%)", f"📝 [65%] Menyusun Subtitle ASS (Gaya: {caption_style})...")
    build_subtitles(words_json, ass_path, caption_style=caption_style)

    # 6. Analisis Pelacakan Kamera Cerdas (Smart Speaker Tracking) & Render Segmen Utama
    update_queue_progress(queue_id, "Rendering (70%)", "🎯 [70%] Menghitung Pelacakan Kamera Cerdas (Smart Speaker Tracking)...")
    crop_expr = calculate_smart_crop_timeline(raw_video, crop_w=606, crop_h=1078)

    update_queue_progress(queue_id, "Rendering (75%)", "🎬 [75%] Merender Segmen Video Asli Portrait 9:16 Ultra HD...")
    print("🎬 Merender Segmen Utama Video Asli dengan Pelacakan Kamera Cerdas...")
    escaped_ass = ass_path.replace("\\", "/").replace(":", "\\:")

    main_filter = (
        f"[0:v]crop=w=606:h=1078:x='{crop_expr}':y=0,scale=1080:1920:flags=lanczos[vmain];"
        "[vmain]unsharp=5:5:0.8:5:5:0.0[vsharp];"
        "[vsharp][1:v]overlay=45:55[vwithchannel];"
        f"[vwithchannel][2:v]overlay=(main_w-overlay_w)/2:1685[vwithbadge];"
        f"[vwithbadge]subtitles=filename='{escaped_ass}'[vwithsub];"
        "[vwithsub]eq=contrast=1.06:brightness=0.01:saturation=1.12[vout]"
    )

    cmd_main = [
        "ffmpeg", "-y",
        "-i", raw_video,
        "-i", channel_badge_img,
        "-i", badge_img,
        "-filter_complex", main_filter,
        "-map", "[vout]",
        "-map", "0:a",
        "-af", "volume=1.35,highpass=f=80,lowpass=f=12000",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-maxrate", "8500k",
        "-bufsize", "16000k",
        "-r", "30",
        "-c:a", "aac",
        "-b:a", "160k",
        "-ar", "44100",
        "-ac", "2",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        main_segment_mp4
    ]
    subprocess.run(cmd_main, check=True)

    # 7. Gabungkan: Cover Animasi (dengan AI Hook Voice) + Segmen Video Asli (dengan Suara Aslinya)
    update_queue_progress(queue_id, "Rendering (85%)", "🔗 [85%] Menggabungkan Cover Hook AI + Video Asli...")
    print("🔗 Menggabungkan Intro Cover Hook AI + Video Asli (Stream-Copy Concat)...")
    concat_list = os.path.join(WORK_DIR, f"concat_{job_id}.txt")
    with open(concat_list, "w", encoding="utf-8") as f:
        f.write(f"file '{cover_segment_mp4.replace(chr(92), '/')}'\n")
        f.write(f"file '{main_segment_mp4.replace(chr(92), '/')}'\n")

    cmd_concat = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list,
        "-c", "copy",
        "-movflags", "+faststart",
        output_mp4
    ]
    try:
        subprocess.run(cmd_concat, check=True)
    except Exception as concat_err:
        print("⚠️ Concat stream-copy gagal, fallback ke re-encode filter:", concat_err)
        cmd_concat_fallback = [
            "ffmpeg", "-y",
            "-i", cover_segment_mp4,
            "-i", main_segment_mp4,
            "-filter_complex", (
                "[0:v]scale=1080:1920,setsar=1[v0];"
                "[1:v]scale=1080:1920,setsar=1[v1];"
                "[0:a]aformat=sample_rates=44100:channel_layouts=stereo[a0];"
                "[1:a]aformat=sample_rates=44100:channel_layouts=stereo[a1];"
                "[v0][a0][v1][a1]concat=n=2:v=1:a=1[vcat][acat]"
            ),
            "-map", "[vcat]",
            "-map", "[acat]",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "18",
            "-c:a", "aac",
            "-b:a", "160k",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            output_mp4
        ]
        subprocess.run(cmd_concat_fallback, check=True)
    size_mb = os.path.getsize(output_mp4) / (1024 * 1024)
    print(f"🎉 RENDER SUKSES! File: {output_mp4} ({size_mb:.2f} MB)")

    # Pastikan file < 25.0 MB untuk upload cepat, lancar tanpa timeout ke Telegram Bot API
    if size_mb > 25.0:
        print(f"⚠️ Ukuran file ({size_mb:.2f} MB) melebihi batas optimal upload cepat Telegram. Mengoptimalkan ukuran secara presisi...")
        cap_meta = cv2.VideoCapture(output_mp4)
        dur_s = cap_meta.get(cv2.CAP_PROP_FRAME_COUNT) / (cap_meta.get(cv2.CAP_PROP_FPS) or 30.0)
        cap_meta.release()

        # Target 23.0 MB total size agar upload super cepat & lancar
        target_total_kbits = 23.0 * 8192
        audio_kbits = 128 * dur_s
        video_kbits = max(350 * dur_s, target_total_kbits - audio_kbits)
        calc_bitrate_k = int(video_kbits / max(1.0, dur_s))
        print(f"🎯 Menghitung bitrate optimal untuk durasi {dur_s:.1f}s: {calc_bitrate_k} kbps...")

        compressed_mp4 = output_mp4.replace(".mp4", "_compressed.mp4")
        cmd_comp = [
            "ffmpeg", "-y", "-i", output_mp4,
            "-c:v", "libx264", "-preset", "fast",
            "-b:v", f"{calc_bitrate_k}k",
            "-maxrate", f"{int(calc_bitrate_k * 1.2)}k",
            "-bufsize", f"{calc_bitrate_k * 2}k",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart", compressed_mp4
        ]
        subprocess.run(cmd_comp, check=True)
        if os.path.exists(compressed_mp4):
            os.replace(compressed_mp4, output_mp4)
            size_mb = os.path.getsize(output_mp4) / (1024 * 1024)
            print(f"✅ Video berhasil dioptimalkan presisi: {size_mb:.2f} MB (< 25 MB)")

    # 8. Buat Deskripsi & Hashtag YouTube Otomatis (Termasuk Link Sumber)
    update_queue_progress(queue_id, "Rendering (90%)", "🤖 [90%] Menyusun Deskripsi & Hashtag AI...")
    yt_desc_hashtags = generate_youtube_description_and_hashtags(title, source_channel, words_json, source_url=source_url)

    # 9. Kirim Video + Deskripsi & Hashtag ke Telegram
    update_queue_progress(queue_id, "Sending_Telegram (95%)", "📤 [95%] Mengirim Video + Deskripsi & Hashtag ke Bot Telegram...")
    print("📤 Mengirim Video & Deskripsi YouTube ke Telegram Bot...")
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendVideo"
    clean_title = title.replace("\n", " ").strip()
    caption_header = (
        f"🎬 HASIL VIDEO YOUTUBE SHORTS (Z-CODE)\n"
        f"📌 Judul: {clean_title}\n"
        f"🎨 Gaya Caption: {caption_style.upper()}\n"
        f"📺 Source: {source_channel}\n"
    )
    if source_url:
        caption_header += f"🔗 Link: {source_url}\n"
    caption_header += "\n📝 DESKRIPSI & HASHTAG SIAP POST:\n────────────────────\n"
    caption = (caption_header + yt_desc_hashtags)[:1020]

    tg_sent_ok = False
    tg_response_text = ""

    # Pastikan file video ada sebelum upload
    if not os.path.exists(output_mp4):
        print(f"❌ File video tidak ditemukan: {output_mp4}")
        update_queue_progress(queue_id, "Error", f"⚠️ File video tidak ditemukan: {output_mp4}")
        return

    cmd_curl = [
        "curl.exe", "-sS", "--retry", "3", "--retry-delay", "5", "--max-time", "360",
        "-X", "POST", url,
        "-F", f"chat_id={TELEGRAM_CHAT_ID}",
        "-F", f"video=@{output_mp4}",
        "-F", f"caption={caption}",
        "-F", "supports_streaming=true"
    ]
    try:
        print(f"📤 Mengupload video {os.path.getsize(output_mp4)/(1024*1024):.1f} MB ke Telegram...")
        res = subprocess.run(cmd_curl, capture_output=True, text=True, timeout=380)
        tg_response_text = res.stdout
        tg_stderr = res.stderr
        print(f"Telegram curl returncode: {res.returncode}")
        print(f"Telegram response (curl): {tg_response_text[:300]}")
        if tg_stderr:
            print(f"Telegram curl stderr: {tg_stderr[:200]}")
        if res.returncode != 0:
            # curl gagal (DNS error, timeout, dsb)
            tg_response_text = tg_response_text or f"curl error code {res.returncode}: {tg_stderr[:200]}"
        elif '"ok":true' in tg_response_text.replace(" ", ""):
            tg_sent_ok = True
    except subprocess.TimeoutExpired:
        print("⚠️ curl.exe timeout setelah 380 detik")
        tg_response_text = "curl timeout setelah 380 detik"
    except Exception as curl_err:
        print("⚠️ curl.exe exception:", curl_err)
        tg_response_text = str(curl_err)

    try:
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

        if tg_sent_ok or '"ok":true' in tg_response_text.replace(" ", ""):
            tg_link = "https://t.me/cs_bisnisku_2026_bot"
            try:
                resp_data = json.loads(tg_response_text)
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

            # 10. Hapus File Sementara untuk Menjaga Laptop Tetap Lega
            print("🧹 Membersihkan file aset sementara agar penyimpanan laptop tetap lega...")
            cleanup_targets = [
                cover_img, hook_mp3, cover_segment_mp4, main_segment_mp4, concat_list,
                badge_img, channel_badge_img, words_json, ass_path, output_mp4
            ]
            if os.path.abspath(raw_video).startswith(os.path.abspath(WORK_DIR)):
                cleanup_targets.append(raw_video)
            for target_file in cleanup_targets:
                try:
                    if os.path.exists(target_file):
                        os.remove(target_file)
                except Exception as clean_err:
                    print(f"⚠️ Gagal menghapus {target_file}: {clean_err}")
            print("✅ Pembersihan selesai! Penyimpanan laptop tetap bersih.")
        else:
            # ❌ FIX: Jika video gagal terkirim, update status ke Error agar tidak stuck di 95%
            err_detail = tg_response_text[:300] if tg_response_text else "Tidak ada response dari Telegram API"
            print(f"❌ Video GAGAL dikirim ke Telegram! Response: {err_detail}")
            update_queue_progress(
                queue_id,
                "Error",
                f"⚠️ Gagal upload video ke Telegram. Response: {err_detail[:200]}"
            )
    except Exception as e:
        print("Gagal upload Telegram:", e)
        update_queue_progress(queue_id, "Error", f"⚠️ Gagal kirim ke Telegram: {e}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="")
    parser.add_argument("--title", default="TIDAK ADA TAKDIR YANG SALAH\nEKSPEKTASI KITA YANG SALAH")
    parser.add_argument("--source", default="YNTV")
    parser.add_argument("--queue-id", default="")
    parser.add_argument("--caption-style", default="yellow", choices=["yellow", "green_emoji", "monochrome"])
    parser.add_argument("--source-url", default="")
    args = parser.parse_args()

    input_vid = args.input
    if not input_vid or not os.path.exists(input_vid):
        candidate = os.path.join(WORK_DIR, "input_video.mp4")
        if os.path.exists(candidate):
            input_vid = candidate
        else:
            import glob
            rec_files = glob.glob(r"C:\Users\draconik\Videos\Screen Recordings\*.mp4")
            if rec_files:
                input_vid = max(rec_files, key=os.path.getmtime)
                print(f"📹 Mengambil video rekaman layar TERBARU: {input_vid}")
            else:
                input_vid = DEFAULT_RAW_VIDEO

    print(f"▶️ Memulai proses dengan video: {input_vid}")
    print(f"🏷️ Title Cover: {args.title}")
    print(f"📺 Source Watermark: {args.source}")
    print(f"🎨 Caption Style: {args.caption_style}")
    print(f"🔗 Source URL: {args.source_url}")

    render_and_upload(
        input_vid,
        args.title,
        args.source,
        args.queue_id,
        caption_style=args.caption_style,
        source_url=args.source_url
    )

if __name__ == "__main__":
    main()
