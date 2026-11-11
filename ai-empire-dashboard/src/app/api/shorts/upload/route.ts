import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "TIDAK ADA TAKDIR YANG SALAH";
    const sourceChannel = (formData.get("source") as string) || "YNTV";
    const captionStyle = (formData.get("caption_style") as string) || "yellow";
    const sourceUrl = (formData.get("source_url") as string) || "";

    if (!file) {
      return NextResponse.json({ ok: false, error: "Tidak ada file video yang dikirim" }, { status: 400 });
    }

    // Validasi tipe file — hanya video yang diizinkan
    const allowedTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp4|mov|avi|webm|mkv)$/i)) {
      return NextResponse.json({ ok: false, error: `Tipe file tidak didukung: ${file.type}. Gunakan MP4/MOV/AVI/WEBM.` }, { status: 400 });
    }

    // Validasi ukuran file — maks 500 MB untuk mencegah overload RAM
    const MAX_SIZE_BYTES = 500 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ ok: false, error: `File terlalu besar (${(file.size / (1024*1024)).toFixed(0)} MB). Maks 500 MB.` }, { status: 413 });
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
        reference_video_url: sourceUrl || "https://www.youtube.com/@islamic-short-513",
        style_preset: `Islamic Z-Code Style (Gaya: ${captionStyle}, Watermark [YT] ${sourceChannel}, Filter HD 4K)`,
        sfx_and_motion_notes: `Cover Split-Screen 2 Pembicara + Hook AI VO, Caption: ${captionStyle}`,
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

    // Jalankan pipeline editing Z-Code secara asynchronous di laptop menggunakan spawn
    const pythonScript = path.join(bridgeDir, "build_zcode_perfect_pipeline.py");
    const args = [
      pythonScript,
      "--input", inputVideoPath,
      "--title", title,
      "--source", sourceChannel,
      "--caption-style", captionStyle,
      "--source-url", sourceUrl,
    ];
    if (queueItem?.id) {
      args.push("--queue-id", queueItem.id);
    }

    console.log(`[Z-Code Trigger] Menjalankan python ${args.join(" ")}`);
    const child = spawn("python", args, {
      cwd: bridgeDir,
      detached: true,
      stdio: "ignore",
    });
    child.unref();

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

