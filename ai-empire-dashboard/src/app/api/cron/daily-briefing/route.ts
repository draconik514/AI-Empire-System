import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * VERCEL CRON JOB: Berjalan otomatis setiap pagi (07:00 WIB / 23:00 UTC).
 * Fungsi Ganda:
 * 1. Mencegah Supabase Free Tier terkena "Auto-Pause 7 Hari Pasif" (Selalu Aktif 24/7 Selamanya).
 * 2. Menambahkan tugas pemeriksaan pagi untuk AI Agent (Daily Briefing & Ide Shorts Harian).
 */
export async function GET() {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({
        ok: true,
        mode: "demo-fallback",
        message:
          "Heartbeat aktif! Hubungkan NEXT_PUBLIC_SUPABASE_URL di Vercel untuk sinkronisasi database otomatis.",
        timestamp: new Date().toISOString(),
      });
    }

    // 1. Ping tabel office_tasks agar Supabase mencatat aktivitas harian (Anti Auto-Pause)
    const { count, error: pingError } = await supabase
      .from("office_tasks")
      .select("*", { count: "exact", head: true });

    if (pingError) {
      throw pingError;
    }

    // 2. Masukkan jadwal otomatis ke agent_jobs untuk meriset ide Shorts pagi ini
    await supabase.from("agent_jobs").insert([
      {
        agent_type: "Researcher",
        command_payload: {
          task: "Generate 3 Morning YouTube Shorts Scripts (Islamic, Edukasi, Anak) via Free Cloud AI + Headroom",
          triggered_by: "vercel_cron_keepalive",
        },
        status: "Pending",
        result_log: "Menunggu dieksekusi oleh Agent Bridge atau Cloud Worker.",
      },
    ]);

    return NextResponse.json({
      ok: true,
      supabase_keepalive: "SUCCESS",
      active_office_tasks_count: count ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

