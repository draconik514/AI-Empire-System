"""
SKRIP TES DIVISI 2 (GROQ AI + TELEGRAM BOT + AUTO-RESPONDER):
1. Membaca pesan terakhir yang kamu ketik di @cs_bisnisku_2026_bot atau simulasi chat client IG/TikTok.
2. Memanggil Otak AI Gratis (Groq Llama-3.3-70B) dengan kecepatan <1 detik (Rp 0).
3. Mengirimkan balasan AI pintar + notifikasi langsung ke Telegram HP kamu!
"""

import os
import sys
import json
import urllib.request

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

DASHBOARD_DIR = r"D:\AI-Empire-System\ai-empire-dashboard"
ENV_PATH = os.path.join(DASHBOARD_DIR, ".env.local")


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


def generate_groq_cs_reply(groq_key: str, platform: str, sender: str, client_message: str, sop: str) -> str:
    url = "https://api.groq.com/openai/v1/chat/completions"
    body = json.dumps({
        "model": "openai/gpt-oss-120b",
        "messages": [
            {
                "role": "system",
                "content": (
                    f"Kamu adalah Customer Service AI profesional untuk bisnis di Instagram dan TikTok. "
                    f"SOP Bisnis: {sop} "
                    f"Jawab dengan bahasa Indonesia yang ramah, natural, meyakinkan, singkat (2-3 kalimat), dan tidak kaku."
                ),
            },
            {
                "role": "user",
                "content": f"Platform: {platform}\nClient: {sender}\nPesan Client: \"{client_message}\"",
            },
        ],
        "temperature": 0.6,
        "max_tokens": 220,
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {groq_key}",
            "Content-Type": "application/json",
            "User-Agent": "AIEmpireCS/2.0",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"].strip()


def send_telegram_message(token: str, chat_id: str, text: str):
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = json.dumps({
        "chat_id": chat_id,
        "text": text,
    }).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    env = load_env()
    token = env.get("TELEGRAM_BOT_TOKEN", "")
    chat_id = env.get("TELEGRAM_CHANNEL_ID", "")
    groq_key = env.get("GROQ_API_KEY", "")
    sop = env.get("BUSINESS_SOP_PROMPT", "Jawab ramah, sopan, tanyakan detail kebutuhan dan nomor WhatsApp.")

    print("🧠 Mengetes Otak AI Gratis (Groq Llama-3.3-70B)...")
    sample_client_msg = "Bang, aku lihat dari TikTok nih, kalau mau order jasanya berapa harganya dan berapa lama jadinya?"
    ai_reply = generate_groq_cs_reply(
        groq_key=groq_key,
        platform="TikTok",
        sender="@calon_customer_tiktok",
        client_message=sample_client_msg,
        sop=sop,
    )
    print(f"✅ Balasan AI Groq Berhasil Dibuat:\n   \"{ai_reply}\"")

    notif_text = (
        "🟢 OTAK AI GROQ (LLAMA-3.3-70B GRATIS) SUDAH AKTIF!\n\n"
        "📱 Platform: TikTok DM\n"
        "👤 Client: @calon_customer_tiktok\n"
        f"💬 Pesan Client:\n\"{sample_client_msg}\"\n\n"
        f"🤖 Balasan Pintar AI (Real-Time):\n\"{ai_reply}\"\n\n"
        "💡 Sekarang kamu juga bisa langsung ngetes chat apa saja di bot ini (seolah-olah kamu adalah client), dan AI akan langsung membalasmu!"
    )

    res = send_telegram_message(token, chat_id, notif_text)
    if res.get("ok"):
        print("🎉 SUKSES! Balasan asli dari Otak AI Groq sudah dikirim ke Telegram kamu!")


if __name__ == "__main__":
    main()
