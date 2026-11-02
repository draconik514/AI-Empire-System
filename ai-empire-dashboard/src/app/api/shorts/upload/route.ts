import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "TIDAK ADA TAKDIR YANG SALAH";
    const sourceChannel = (formData.get("source") as string) || "YNTV";

    if (!file) {
      return NextResponse.json({ ok: false, error: "Tidak ada file video yang dikirim" }, { status: 400 });
    }

    const bridgeDir = path.resolve(process.cwd(), "local-agent-bridge");
    const workDir = path.join(bridgeDir, "render_workspace");
    if (!fs.existsSync(workDir)) {
      fs.mkdirSync(workDir, { recursive: true });
    }

    // Simpan video mentah ke input_video.mp4 di workspace lokal
    const inputVideoPath = path.join(workDir, "input_video.mp4");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(inputVideoPath, buffer);

    console.log(`[Upload] File video tersimpan di ${inputVideoPath} (${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`);

    // Catat ke Supabase tabel youtube_shorts_queue agar tampil live di Riwayat & Antrean
    let queueItem = null;
    if (isSupabaseConfigured && supabase) {
      const insertPayload = {
        niche: "Islamic",
        title: title,
        hook_text: "⏳ [10%] Video diterima di Localhost, menyiapkan pipeline Z-Code...",
        full_script: "",
        reference_video_url: "https://www.youtube.com/@islamic-short-513",
        style_preset: `Islamic Z-Code Style (Portrait 9:16 Crop, Subtitle Kuning/Merah, Watermark [YT] ${sourceChannel}, Filter HD 4K)`,
        sfx_and_motion_notes: "Cover Split-Screen 2 Pembicara, Auto Deskripsi + Hashtag AI",
        engine_used: "Z-Code Local Pipeline + Groq Whisper + FFmpeg",
        status: "Rendering (10%)",
        revision_version: 1,
        revision_notes: null,
        telegram_message_url: null,
      };
      const { data, error } = await supabase
        .from("youtube_shorts_queue")
        .insert([insertPayload])
        .select()
        .single();
      if (!error && data) {
        queueItem = data;
      } else if (error) {
        console.error("[Supabase Insert Error]:", error.message);
      }
    }

    // Jalankan pipeline editing Z-Code secara asynchronous di laptop
    const pythonScript = path.join(bridgeDir, "build_zcode_perfect_pipeline.py");
    const queueIdArg = queueItem?.id ? ` --queue-id "${queueItem.id}"` : "";
    const cmd = `python "${pythonScript}" --input "${inputVideoPath}" --title "${title.replace(/"/g, '\\"')}" --source "${sourceChannel}"${queueIdArg}`;

    console.log(`[Z-Code Trigger] Menjalankan: ${cmd}`);
    exec(cmd, { cwd: bridgeDir }, (err, stdout, stderr) => {
      if (err) {
        console.error("[Z-Code Error]:", stderr || err.message);
      } else {
        console.log("[Z-Code Selesai]:", stdout);
      }
    });

    return NextResponse.json({
      ok: true,
      message: "Video mentah berhasil diterima & otomatis diproses di latar belakang!",
      fileName: file.name,
      fileSizeMB: (buffer.length / (1024 * 1024)).toFixed(2),
      item: queueItem,
    });
  } catch (error: any) {
    console.error("[API Error /api/shorts/upload]:", error);
    return NextResponse.json({ ok: false, error: error.message || "Gagal upload video" }, { status: 500 });
  }
}

