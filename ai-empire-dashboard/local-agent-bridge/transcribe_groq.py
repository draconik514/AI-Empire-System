import os
import requests
import json

dashboard_dir = r"D:\AI-Empire-System\ai-empire-dashboard"
groq_key = ""
with open(os.path.join(dashboard_dir, ".env.local"), encoding="utf-8") as f:
    for l in f:
        if l.startswith("GROQ_API_KEY="):
            groq_key = l.split("=", 1)[1].strip().strip('"').strip("'")

audio_file = r"D:\AI-Empire-System\ai-empire-dashboard\local-agent-bridge\render_workspace\felix_audio.mp3"
url = "https://api.groq.com/openai/v1/audio/transcriptions"

print("Uploading to Groq Whisper API for word timestamps...")
with open(audio_file, "rb") as f:
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
print("Status code:", resp.status_code)
if "words" in data:
    print(f"Full words count: {len(data['words'])}")
    print("First 3 words:", data["words"][:3])
    out_path = r"D:\AI-Empire-System\ai-empire-dashboard\local-agent-bridge\render_workspace\felix_words_transcript.json"
    with open(out_path, "w", encoding="utf-8") as out:
        json.dump(data, out, ensure_ascii=False, indent=2)
    print("Transcript with words saved successfully!")
else:
    print("Response keys:", list(data.keys()))


