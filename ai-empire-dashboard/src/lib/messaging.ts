import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/** Status khusus di tabel social_chat_leads untuk kontrol mode manual */
export const STATUS_HUMAN_TAKEOVER = "Manual_Takeover"; // admin membalas / menjeda AI
export const STATUS_AI_RESUMED = "AI_Resumed"; // admin mengaktifkan AI lagi
export const STATUS_PAUSED_HUMAN = "Paused_Human"; // pesan masuk saat mode manual (AI diam)
export const ADMIN_MARKER = "[ADMIN]"; // penanda baris yang dibuat admin (bukan pesan client)

/** Berapa lama AI diam setelah admin membalas manual (default 60 menit) */
export const HUMAN_TAKEOVER_MINUTES = Number(
  process.env.HUMAN_TAKEOVER_MINUTES || 60
);

export type ChatTurn = { role: "user" | "assistant"; content: string };

export async function sendInstagramText(
  recipientPsid: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return { ok: false, error: "INSTAGRAM_ACCESS_TOKEN belum diisi" };
  const igAccountId = process.env.INSTAGRAM_ACCOUNT_ID || "17841475454463137";
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${igAccountId}/messages?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: recipientPsid },
          // Instagram membatasi teks DM maksimal 1000 karakter
          message: { text: text.slice(0, 1000) },
        }),
      }
    );
    if (res.ok) return { ok: true };
    return { ok: false, error: (await res.text()).slice(0, 300) };
  } catch {
    return { ok: false, error: "network error" };
  }
}

export async function sendTelegram(
  text: string,
  replyToMessageId?: number
): Promise<boolean> {
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_CHANNEL_ID;
  if (!tgToken || !tgChatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: tgChatId,
        text: text.slice(0, 4000),
        ...(replyToMessageId ? { reply_to_message_id: replyToMessageId } : {}),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Ambil riwayat percakapan terakhir dengan seorang client (urut lama -> baru) */
export async function getConversationHistory(
  senderHandle: string,
  limit = 8
): Promise<ChatTurn[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("social_chat_leads")
    .select("incoming_message, ai_auto_reply, created_at")
    .eq("sender_handle", senderHandle)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  const turns: ChatTurn[] = [];
  for (const row of data.reverse()) {
    if (row.incoming_message && !row.incoming_message.startsWith(ADMIN_MARKER)) {
      turns.push({ role: "user", content: row.incoming_message });
    }
    if (row.ai_auto_reply) {
      turns.push({ role: "assistant", content: row.ai_auto_reply });
    }
  }
  return turns;
}

/** True jika admin sedang mengambil alih chat ini (dan belum lewat batas waktu) */
export async function isHumanTakeoverActive(senderHandle: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { data, error } = await supabase
    .from("social_chat_leads")
    .select("status, created_at")
    .eq("sender_handle", senderHandle)
    .in("status", [STATUS_HUMAN_TAKEOVER, STATUS_AI_RESUMED])
    .order("created_at", { ascending: false })
    .limit(1);
  if (error || !data?.length) return false;
  const last = data[0];
  if (last.status !== STATUS_HUMAN_TAKEOVER) return false;
  const ageMin = (Date.now() - new Date(last.created_at).getTime()) / 60000;
  return ageMin < HUMAN_TAKEOVER_MINUTES;
}

export async function logChatRow(row: {
  platform: string;
  sender_handle: string;
  sender_name?: string;
  incoming_message: string;
  ai_auto_reply: string;
  intent_category?: string;
  status: string;
  telegram_notified?: boolean;
}): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from("social_chat_leads").insert([
    { response_time_sec: 1, telegram_notified: false, ...row },
  ]);
}

