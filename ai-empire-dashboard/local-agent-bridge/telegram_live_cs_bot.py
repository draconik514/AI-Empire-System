"""
LIVE 2-WAY TELEGRAM CS BOT & INSTAGRAM/TIKTOK SIMULATOR (@cs_bisnisku_2026_bot)
Khusus untuk Brand: @at_heart.digital (IG: @at_heart.digital | TikTok: @at.heart_digital)
Terhubung Penuh ke:
1. Otak AI Gratis (Groq openai/gpt-oss-120b)
2. Memori Katalog Obsidian (`02-CS-Sosmed/SOP-Balas-Chat.md`)
3. Database Live Supabase (`https://nktfkwwrtuwqvtkcrnra.supabase.co`)
"""

import os
import sys
import time
import json
import urllib.request

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

DASHBOARD_DIR = r"D:\AI-Empire-System\ai-empire-dashboard"
ENV_PATH = os.path.join(DASHBOARD_DIR, ".env.local")
SOP_MD_PATH = r"D:\AI-Empire-System\obsidian-vault-backup\02-CS-Sosmed\SOP-Balas-Chat.md"


def load_env():
    env = {}
    if os.path.isfile(ENV_PATH):
        with open(ENV_PATH, "r", encoding="utf-8") as f:
            for line in f:
                s = line.strip()
                if s and not s.startswith("#") and "=" in s:
                    k, v = s.split("=", 1)
                    env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def load_sop_from_obsidian(default_sop: str) -> str:
    if os.path.isfile(SOP_MD_PATH):
        try:
            with open(SOP_MD_PATH, "r", encoding="utf-8") as f:
                return f.read().strip()
        except Exception:
            pass
    return default_sop


def save_chat_to_supabase(sb_url: str, sb_key: str, platform: str, handle: str, name: str, msg: str, reply: str):
    if not sb_url or not sb_key or "your-project" in sb_url:
        return
    url = f"{sb_url.rstrip('/')}/rest/v1/social_chat_leads"
    lower = msg.lower()
    intent = "Siap_Order" if ("pesan" in lower or "order" in lower or "beli" in lower or "form" in lower) else "Tanya_Harga"
    payload = json.dumps({
        "platform": platform,
        "sender_handle": handle,
        "sender_name": name,
        "incoming_message": msg,
        "ai_auto_reply": reply,
        "intent_category": intent,
        "status": "Notified_Telegram",
        "telegram_notified": True,
        "response_time_sec": 1,
    }).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "apikey": sb_key,
            "Authorization": f"Bearer {sb_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        method="POST",
    )
    try:
        urllib.request.urlopen(req, timeout=10)
    except Exception as exc:
        print(f"⚠️ Supabase log error: {exc}", flush=True)


def ask_groq_ai(groq_key: str, user_name: str, text: str, sop: str) -> str:
    url = "https://api.groq.com/openai/v1/chat/completions"
    body = json.dumps({
        "model": "openai/gpt-oss-120b",
        "messages": [
            {
                "role": "system",
                "content": (
                    f"Kamu adalah Customer Service AI resmi untuk brand hadiah digital '@at_heart.digital' "
                    f"(Instagram: @at_heart.digital, TikTok: @at.heart_digital, Toko: https://lynk.id/at_heart.digital).\n\n"
                    f"BERIKUT ADALAH KATALOG LENGKAP, HARGA PROMO, FITUR, & ATURAN WAJIB DARI OBSIDIAN:\n{sop}\n\n"
                    f"ATURAN MENJAWAB (WAJIB DIIKUTI 100%):\n"
                    f"1. Jawab dengan ramah, hangat, santai, sopan, dan panggil 'Kak'. JANGAN gunakan tabel markdown (pakai poin bullet biasa agar rapi di HP).\n"
                    f"2. KHUSUS PEMESANAN WEBSITE (BirthdayNest Rp 25.000 atau HeartNest Rp 26.000):\n"
                    f"   - Berikan link Google Form sesuai websitenya untuk diisi data & foto terlebih dahulu, dan jelaskan bahwa BAYARNYA NANTI SAJA SETELAH WEBSITENYA JADI!\n"
                    f"   - Link Google Form BirthdayNest: https://forms.gle/pUBTccHCVPgsDmLA7\n"
                    f"   - Link Google Form HeartNest / BirthdayHeartNest: https://forms.gle/RCzbiSzdLo2cjnag7\n"
                    f"3. JIKA DITANYA APAKAH WEBSITE BISA DIEDIT SENDIRI: Jawab TIDAK BISA, karena kami yang akan mengeditkan websitenya dan menggantikan semua foto-fotonya sampai terima beres (tinggal isi Google Form saja).\n"
                    f"4. JIKA DITANYA BERAPA LAMA LINK WEBSITE BERTAHAN: Jawab bertahan SELAMANYA sampai project di server Vercel kami dihapus.\n"
                    f"5. JIKA MEREKA SETUJU ISI FORM / SAAT MEMBERIKAN LINK GOOGLE FORM: Wajib tutup dengan kalimat: 'Kabarin aku ya kak kalau sudah selesai isi form-nya, dan kalau ada yang pengen ditanya, tanya aja ya kak hehe 😊✨'"
                ),
            },
            {
                "role": "user",
                "content": f"Nama Client: {user_name}\nPesan Client: {text}",
            },
        ],
        "temperature": 0.5,
        "max_tokens": 900,
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {groq_key}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"].strip()


def send_tg(token: str, chat_id: str, text: str):
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = json.dumps({"chat_id": chat_id, "text": text}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    env = load_env()
    token = env.get("TELEGRAM_BOT_TOKEN", "")
    groq_key = env.get("GROQ_API_KEY", "")
    sb_url = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    sb_key = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    default_sop = "Brand @at_heart.digital: Toko kado digital https://lynk.id/at_heart.digital"

    print("🟢 Live Telegram CS Bot + Supabase Sync Aktif Mendengarkan Pesan...", flush=True)
    last_update_id = 0

    try:
        init_url = f"https://api.telegram.org/bot{token}/getUpdates"
        with urllib.request.urlopen(init_url, timeout=10) as r:
            updates = json.loads(r.read().decode("utf-8")).get("result", [])
            if updates:
                last_update_id = updates[-1]["update_id"]
    except Exception:
        pass

    while True:
        try:
            poll_url = f"https://api.telegram.org/bot{token}/getUpdates?offset={last_update_id + 1}&timeout=20"
            with urllib.request.urlopen(poll_url, timeout=25) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                for item in data.get("result", []):
                    last_update_id = item["update_id"]
                    msg = item.get("message") or {}
                    text = msg.get("text", "").strip()
                    if not text:
                        continue
                    chat_id = str(msg["chat"]["id"])
                    sender_name = msg.get("from", {}).get("first_name", "Kak")
                    sender_username = msg.get("from", {}).get("username") or sender_name.lower()
                    print(f"💬 Pesan masuk dari {sender_name}: {text}", flush=True)

                    sop_latest = load_sop_from_obsidian(default_sop)
                    reply = ask_groq_ai(groq_key, sender_name, text, sop_latest)
                    send_tg(token, chat_id, reply)
                    save_chat_to_supabase(
                        sb_url,
                        sb_key,
                        "Instagram/TikTok",
                        f"@{sender_username}",
                        sender_name,
                        text,
                        reply,
                    )
                    print(f"✅ Dibalas otomatis & tersimpan ke Supabase ({sender_name})", flush=True)
        except Exception:
            time.sleep(2)


if __name__ == "__main__":
    main()
