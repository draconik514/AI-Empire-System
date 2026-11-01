import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const niche: "Edukasi_CalonSarjana" | "Islamic" =
      body.niche === "Islamic" ? "Islamic" : "Edukasi_CalonSarjana";
    const customTopic: string = body.custom_topic || "";
    const sourceChannel: string = body.source_channel || "YNTV";
    const durationTarget: string = body.duration_target || "1.5m";
    const referenceUrl: string =
      body.reference_url ||
      (niche === "Edukasi_CalonSarjana"
        ? "https://www.youtube.com/@CalonSarjanaOfficial"
        : "https://www.youtube.com/@islamic-short-513");

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    if ((!geminiKey || geminiKey.startsWith("AIzaSy_your_")) && (!groqKey || groqKey.startsWith("gsk_your_"))) {
      return NextResponse.json(
        { ok: false, error: "GEMINI_API_KEY / GROQ_API_KEY belum dikonfigurasi" },
        { status: 500 }
      );
    }

    let promptSystem = "";
    let promptUser = "";

    if (niche === "Edukasi_CalonSarjana") {
      promptSystem = `Kamu adalah Head Scriptwriter & Video Producer spesialis YouTube Shorts Edukasi & Sains Viral bergaya "Calon Sarjana".
TUGAS UTAMA:
Hasilkan naskah lengkap BESERTA BREAKDOWN 5 SCENE DETAIL yang terstruktur dari detik awal sampai akhir agar video berpotensi viral.
TARGET DURASI: ${durationTarget} (antara 60 hingga 120 detik).

FORMAT JSON OUTPUT WAJIB:
{
  "title": "Judul Shorts yang bombastis dan bikin penasaran (Maks 60 Karakter)",
  "hook_text": "Kalimat pembuka 3 detik pertama",
  "target_duration_seconds": 90,
  "full_script": "Naskah narasi lengkap khusus untuk dibaca narator tanpa keterangan teknis",
  "scenes": [
    {
      "scene_num": 1,
      "time_range": "00:00 - 00:15",
      "visual_direction": "Instruksi visual footage / drone angle / objek pembuka",
      "narration": "Teks naskah yang dibacakan pada scene ini",
      "motion_fx": "Instruksi Remotion / motion text / HUD animasi",
      "sound_fx": "Cinematic whoosh / impact bass / risers"
    },
    {
      "scene_num": 2,
      "time_range": "00:15 - 00:35",
      "visual_direction": "Visual footage / cutaway penampang / objek utama",
      "narration": "Teks narasi poin pertama fakta sains mengejutkan",
      "motion_fx": "Data card / zoom tracking / diagram alur",
      "sound_fx": "Glitch / alert / whoosh"
    },
    {
      "scene_num": 3,
      "time_range": "00:35 - 00:55",
      "visual_direction": "Visual footage / makro shot / perbandingan ekstrem",
      "narration": "Teks narasi poin kedua fakta mencengangkan",
      "motion_fx": "Warning banner / counter angka count-up",
      "sound_fx": "Sub bass drop / dramatic hit"
    },
    {
      "scene_num": 4,
      "time_range": "00:55 - 01:15",
      "visual_direction": "Visual footage solusi / riset ilmiah / aksi pembuktian",
      "narration": "Teks narasi poin ketiga penjelasan ilmiah",
      "motion_fx": "Split screen / spotlight / kinetic text",
      "sound_fx": "Chime / transition wipe"
    },
    {
      "scene_num": 5,
      "time_range": "01:15 - 01:30",
      "visual_direction": "Visual footage penutup / close-up dramatis",
      "narration": "Teks pertanyaan penutup interaktif pemancing komentar",
      "motion_fx": "CTA comment button / subscribe motion pill",
      "sound_fx": "Notification pop / closing riser"
    }
  ],
  "style_preset": "Calon Sarjana Pro (5 Distinct Scenes + Remotion Kinetic Motion)",
  "sfx_and_motion_notes": "Multi-scene cutaway 2.5s, Remotion spring cards, Karaoke subtitle hijau neon/kuning emas"
}`;
      promptUser = customTopic
        ? `Buat 1 naskah Shorts Edukasi Calon Sarjana 5 Scene lengkap dengan topik spesifik: "${customTopic}". Target durasi: ${durationTarget}.`
        : `Tentukan sendiri 1 topik fakta unik/sains/misteri dunia yang paling mencengangkan, langka, dan viral hari ini. Buat naskah Shorts Calon Sarjana 5 Scene lengkap! Target durasi: ${durationTarget}.`;
    } else {
      promptSystem = `Kamu adalah Scriptwriter & Video Editor spesialis YouTube Shorts Islamic untuk channel @islamic-short-513 (Target 400 -> 10.000 Subs).
GAYA KHAS: Format ala Z-Code / CapCut 4K HD:
1. Cover Box Kuning tebal dengan tulisan bold hitam bergaris tepi putih (Contoh judul channel: "Ternyata Ustad Felix Bisa Sombong, Tapi Sombong Nya Kek Gini", "Rezeki itu Ujian - yang Ini Berat").
2. Subtitle tebal per frasa di tengah bawah: kombinasi warna Kuning tebal, Merah tebal, dan Putih tebal dengan outline hitam tegas.
3. Branding Source di bawah subtitle: [🔴 YouTube Logo] + ${sourceChannel}.
4. Filter HD 4K (kontras warm cinematic, penajaman tinggi).

Format JSON Output Wajib:
{
  "title": "Judul Shorts Islami yang menggetarkan hati (Box Kuning)",
  "hook_text": "Kalimat pembuka 3 detik pertama",
  "full_script": "Naskah narasi lengkap penyejuk hati",
  "source_channel": "${sourceChannel}",
  "style_preset": "Islamic Z-Code Style (Portrait 9:16 Crop, Subtitle Kuning/Merah, Watermark [YT] ${sourceChannel}, Filter HD 4K)",
  "sfx_and_motion_notes": "Cover box kuning, subtitle bold kuning/merah, logo YT ${sourceChannel} di bawah subtitle, filter HD cinematic"
}`;
      promptUser = customTopic
        ? `Buat naskah dan metadata Shorts Islami dengan tema: "${customTopic}". Sumber kanal: "${sourceChannel}".`
        : `Tentukan 1 kutipan atau nasehat penyejuk hati tentang ujian hidup, sabar, atau rezeki dari Ustadz Felix Siauw / ustadz terpercaya. Sumber kanal: "${sourceChannel}".`;
    }

    let parsed: Record<string, string> = {};

    // 1. Gunakan Google Gemini API (Terpisah dari Groq CS agar tidak kena limit!)
    if (geminiKey && !geminiKey.startsWith("AIzaSy_your_")) {
      try {
        const gemRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: `${promptSystem}\n\n Tugas: ${promptUser}` }],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json",
              },
            }),
          }
        );
        if (gemRes.ok) {
          const gemData = await gemRes.json();
          const gemText = gemData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (gemText) {
            parsed = JSON.parse(gemText);
          }
        }
      } catch (gemErr) {
        console.warn("Gemini fallback ke Groq:", gemErr);
      }
    }

    // 2. Fallback ke Groq (Model openai/gpt-oss-120b memiliki kuota terpisah dari llama-3.3-70b milik CS)
    if (!parsed.full_script && groqKey) {
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
          { ok: false, error: `AI API Error: ${errText}` },
          { status: 500 }
        );
      }

      const aiData = await aiRes.json();
      const rawContent = aiData?.choices?.[0]?.message?.content?.trim();
      parsed = JSON.parse(rawContent || "{}");
    }

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
        item: { ...(data || item), scenes: parsed.scenes, target_duration_seconds: parsed.target_duration_seconds },
        parsed_data: parsed,
        message: "Naskah & 5 Scene Breakdown berhasil diriset!",
      });
    }

    return NextResponse.json({
      ok: true,
      item: { ...item, scenes: parsed.scenes, target_duration_seconds: parsed.target_duration_seconds },
      parsed_data: parsed,
      message: "Naskah & 5 Scene Breakdown berhasil dibuat (preview mode).",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

