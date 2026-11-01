-- ============================================================================
-- AI EMPIRE COMMAND CENTER - SUPABASE POSTGRESQL SCHEMA (REVISED V2)
-- 100% Free Tier Compatible + 24/7 Keep-Alive Ready
-- ============================================================================

-- 1. TABEL KERJAAN KANTOR & TUGAS HARIAN (Sinkron dengan Obsidian)
CREATE TABLE IF NOT EXISTS office_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Kantor',
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Todo',
    ai_summary TEXT,
    obsidian_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL AUTO-RESPONDER SOSMED (Instagram & TikTok CS + Alert Telegram Bot)
CREATE TABLE IF NOT EXISTS social_chat_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform TEXT NOT NULL,                  -- 'Instagram' | 'TikTok'
    sender_handle TEXT NOT NULL,             -- '@username'
    sender_name TEXT,
    incoming_message TEXT NOT NULL,          -- Pesan masuk dari calon client
    ai_auto_reply TEXT NOT NULL,             -- Balasan otomatis AI berdasarkan SOP Obsidian
    intent_category TEXT DEFAULT 'Tanya_Harga', -- 'Tanya_Harga' | 'Siap_Order' | 'Konsultasi' | 'Follow_Up'
    status TEXT DEFAULT 'Notified_Telegram', -- 'Auto_Replied' | 'Notified_Telegram' | 'Manual_Takeover' | 'Closed_Won'
    telegram_notified BOOLEAN DEFAULT TRUE,
    response_time_sec INTEGER DEFAULT 2,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL PABRIK YOUTUBE SHORTS (Berbasis ReelMimic Reference Cloning + Sistem Revisi)
CREATE TABLE IF NOT EXISTS youtube_shorts_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    niche TEXT NOT NULL,                     -- 'Islamic' | 'Edukasi_CalonSarjana' | 'Gaming_Roblox_Minecraft'
    title TEXT NOT NULL,
    hook_text TEXT,
    full_script TEXT,
    reference_video_url TEXT,                -- Link/file video referensi yang ditiru gaya editannya
    style_preset TEXT,                       -- Detail gaya subtitle, transisi, motion graphics
    sfx_and_motion_notes TEXT,               -- Instruksi sound effect, overlay, BGM
    engine_used TEXT,
    status TEXT DEFAULT 'Draft_Script',      -- 'Draft_Script' | 'Cloning_Style' | 'Rendering' | 'Review_in_Telegram' | 'Revision_Requested' | 'Approved_Ready'
    revision_notes TEXT,                     -- Catatan revisi dari kamu setelah cek di Telegram
    revision_version INTEGER DEFAULT 1,
    telegram_message_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL ANTREAN PERINTAH AI AGENT (Jembatan Cloud Vercel <-> Laptop Lokal)
CREATE TABLE IF NOT EXISTS agent_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_type TEXT NOT NULL,                -- 'Social_CS_Responder' | 'ReelMimic_Cloner' | 'Video_Revision_Worker' | 'Obsidian_Sync'
    command_payload JSONB NOT NULL,
    status TEXT DEFAULT 'Pending',           -- 'Pending' | 'Running_on_Laptop' | 'Completed' | 'Failed'
    result_log TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 5. TABEL SINKRONISASI CATATAN OBSIDIAN (Otak Kedua & SOP CS / Gaya Video)
CREATE TABLE IF NOT EXISTS obsidian_notes_sync (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_path TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content_markdown TEXT,
    tags TEXT[],
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);
