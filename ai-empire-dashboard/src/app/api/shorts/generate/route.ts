import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const niche: "Edukasi_CalonSarjana" | "Islamic" | "Gaming_Roblox_Minecraft" =
      body.niche || "Edukasi_CalonSarjana";
    const customTopic: string = body.custom_topic || "";
    const referenceUrl: string =
      body.reference_url ||
      (niche === "Edukasi_CalonSarjana"
        ? "https://www.youtube.com/@CalonSarjanaOfficial"
        : niche === "Islamic"
        ? "local://referensi-islami-400subs-master.mp4"
        : "https://www.youtube.com/shorts/roblox-minecraft-ref");

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey || groqKey.startsWith("gsk_your_")) {
      return NextResponse.json(
        { ok: false, error: "GROQ_API_KEY belum dikonfigurasi di Vercel" },
        { status: 500 }
      );
    }

    let promptSystem = "";
    let promptUser = "";

    if (niche === "Edukasi_CalonSarjana") {
      promptSystem = `Kamu adalah Head Scriptwriter spesialis YouTube Shorts Edukasi & Fakta Unik bergaya "Calon Sarjana".
GAYA KHAS CALON SARJANA:
1. HOOK MEMUKAU (3 Detik Pertama): Pertanyaan mengejutkan atau perbandingan ekstrem yang membuat penonton berhenti scrolling.
2. PACING CEPAT: 3 Poin Fakta gila/misterius yang jarang diketahui orang.
3. VISUAL CUES: Berikan instruksi visual di setiap poin (misal: [Motion Text Angka], [SFX Whoosh], [Zoom Cepat]).
4. DURASI: Sekitar 50-70 detik dibaca santai tapi antusias.
5. PENUTUP INTERAKTIF: Lempar 1 pertanyaan seru di akhir untuk memancing ribuan komentar.

Format JSON Output Wajib:
{
  "title": "Judul Shorts yang bombastis dan bikin penasaran (Maks 60 Karakter)",
  "hook_text": "Kalimat pembuka 3 detik pertama",
  "full_script": "Naskah narasi lengkap tanpa tanda kurung visual (khusus untuk dibaca narator)",
  "visual_script": "Naskah lengkap beserta catatan instruksi visual dan SFX [Whoosh/Pop/Suspense]",
  "style_preset": "Calon Sarjana Pro (Fast Cut 2.5s, Motion Data, SFX Whoosh)",
  "sfx_and_motion_notes": "Transisi whoosh tiap 2.5 detik, teks angka membesar, audio latar misteri/fakta"
}`;
      promptUser = customTopic
        ? `Buat 1 naskah Shorts Edukasi Calon Sarjana dengan topik spesifik: "${customTopic}".`
        : `Tentukan sendiri 1 topik fakta unik/sains/misteri dunia yang paling mencengangkan, langka, dan viral hari ini. Buat naskah Shorts Calon Sarjana lengkap!`;
    } else if (niche === "Islamic") {
      promptSystem = `Kamu adalah Scriptwriter spesialis konten Islami penyejuk hati & doa mustajab (Target 400 -> 1.000 Subs).
GAYA KHAS: Hangat, menyentuh, penuh adab, dalil shahih/hikmah yang menggetarkan hati.
Format JSON Output Wajib:
{
  "title": "Judul Islami penyejuk hati",
  "hook_text": "Kalimat pembuka menyentuh",
  "full_script": "Naskah narasi lengkap",
  "visual_script": "Naskah + petunjuk visual tenang/warm grading",
  "style_preset": "Warm Islamic Gold (Karaoke Subtitle Emas, BGM Ducking)",
  "sfx_and_motion_notes": "Font karaoke emas estetik, transisi lembut, BGM sholawat instrumental auto-ducking"
}`;
      promptUser = customTopic
        ? `Buat naskah Islami dengan tema: "${customTopic}".`
        : `Tentukan 1 amalan ringan atau doa mustajab penyejuk hati yang sangat dibutuhkan umat hari ini.`;
    } else {
      promptSystem = `Kamu adalah Scriptwriter konten anak gaming (Roblox & Minecraft).
GAYA: Ceria, membal, seru, misteri map rahasia.
Format JSON Output Wajib:
{
  "title": "Judul Gaming Anak",
  "hook_text": "Hook seru",
  "full_script": "Naskah narasi",
  "visual_script": "Naskah + petunjuk bouncy visual",
  "style_preset": "Kids Bouncy Pop-Up",
  "sfx_and_motion_notes": "Subtitle membal, zoom shake, SFX meme ramah anak"
}`;
      promptUser = customTopic
        ? `Buat naskah Roblox/Minecraft: "${customTopic}".`
        : `Buat 1 trik/rahasia seru di map Roblox Brookhaven atau Minecraft yang viral hari ini.`;
    }

    const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: promptSystem },
          { role: "user", content: promptUser },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return NextResponse.json(
        { ok: false, error: `Groq API Error: ${errText}` },
        { status: 500 }
      );
    }

    const aiData = await aiRes.json();
    const rawContent = aiData?.choices?.[0]?.message?.content?.trim();
    const parsed = JSON.parse(rawContent || "{}");

    const item = {
      niche,
      title: parsed.title || "Fakta Mengejutkan yang Jarang Diketahui",
      hook_text: parsed.hook_text || "Tunggu, kamu pasti belum tahu fakta ini!",
      full_script: parsed.full_script || "",
      reference_video_url: referenceUrl,
      style_preset: parsed.style_preset || "Calon Sarjana Pro",
      sfx_and_motion_notes:
        parsed.sfx_and_motion_notes ||
        "Motion graphics cepat, SFX whoosh, auto-ducking BGM",
      engine_used: "ReelMimic + Hyperframes + FFmpeg-Skill (Intel Iris Xe)",
      status: "Queued_For_Laptop",
      revision_version: 1,
      revision_notes: null,
      telegram_message_url: null,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("youtube_shorts_queue")
        .insert([item])
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
      }

      await supabase.from("agent_jobs").insert([
        {
          agent_type: "ReelMimic_Cloner",
          command_payload: {
            shorts_id: data?.id || "temp-id",
            niche,
            title: item.title,
            reference_video_url: referenceUrl,
            target_version: 1,
          },
          status: "Pending",
          result_log: `Naskah AI selesai dibuat. Menunggu eksekusi render di laptop...`,
        },
      ]);

      return NextResponse.json({
        ok: true,
        item: data || item,
        message: "Naskah berhasil diriset & dijadwalkan untuk render laptop!",
      });
    }

    return NextResponse.json({
      ok: true,
      item,
      message: "Naskah berhasil dibuat (preview mode).",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
