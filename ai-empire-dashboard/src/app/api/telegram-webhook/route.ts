import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_MARKER,
  HUMAN_TAKEOVER_MINUTES,
  logChatRow,
  sendInstagramText,
  sendTelegram,
  STATUS_AI_RESUMED,
  STATUS_HUMAN_TAKEOVER,
} from "@/lib/messaging";

/**
 * Webhook bot Telegram (@cs_bisnisku_2026_bot) untuk admin:
 * - Reply ke notifikasi chat  -> teks dikirim ke DM client & AI dijeda
 * - /stop (reply)             -> jeda AI untuk client itu tanpa mengirim pesan
 * - /ai   (reply)             -> aktifkan AI lagi untuk client itu
 * - /help                     -> bantuan
 */
const HELP_TEXT =
  `🤖 Perintah Admin CS @at_heart.digital\n\n` +
  `↩️ Reply notifikasi chat + ketik pesan → terkirim ke DM client, AI jeda ${HUMAN_TAKEOVER_MINUTES} menit\n` +
  `⏸️ Reply notifikasi + /stop → jeda AI tanpa kirim pesan\n` +
  `▶️ Reply notifikasi + /ai → aktifkan AI lagi untuk client itu\n` +
  `❓ /help → bantuan ini`;

export async function POST(req: NextRequest) {
  // Verifikasi request benar-benar dari Telegram (secret_token saat setWebhook)
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await req.json().catch(() => null);
  const msg = update?.message;
  // Selalu balas 200 agar Telegram tidak mengulang update
  if (!msg?.text) return NextResponse.json({ ok: true });

  // Hanya admin (chat id pemilik) yang boleh memberi perintah
  if (String(msg.chat?.id) !== String(process.env.TELEGRAM_CHANNEL_ID)) {
    return NextResponse.json({ ok: true });
  }

  const text: string = msg.text.trim();
  const command = text.split(/\s|@/)[0].toLowerCase();

  if (command === "/help" || command === "/start") {
    await sendTelegram(HELP_TEXT, msg.message_id);
    return NextResponse.json({ ok: true });
  }

  const refText: string = msg.reply_to_message?.text || "";
  const ref = refText.match(/🆔 (IG|TT):(\S+)/);
  if (!ref) {
    await sendTelegram(
      "⚠️ Reply (balas) dulu notifikasi chat client yang ada 🆔-nya, baru ketik pesan/perintah.\n\n" +
        HELP_TEXT,
      msg.message_id
    );
    return NextResponse.json({ ok: true });
  }

  const [, kind, id] = ref;
  const platform = kind === "IG" ? "Instagram" : "TikTok";
  const senderHandle = kind === "IG" ? `@ig_${id}` : `@tt_${id.slice(-10)}`;

  if (command === "/ai") {
    await logChatRow({
      platform,
      sender_handle: senderHandle,
      incoming_message: `${ADMIN_MARKER} /ai`,
      ai_auto_reply: "",
      status: STATUS_AI_RESUMED,
    });
    await sendTelegram(`▶️ AI aktif lagi untuk ${senderHandle}`, msg.message_id);
    return NextResponse.json({ ok: true });
  }

  if (command === "/stop") {
    await logChatRow({
      platform,
      sender_handle: senderHandle,
      incoming_message: `${ADMIN_MARKER} /stop`,
      ai_auto_reply: "",
      status: STATUS_HUMAN_TAKEOVER,
    });
    await sendTelegram(
      `⏸️ AI dijeda ${HUMAN_TAKEOVER_MINUTES} menit untuk ${senderHandle}`,
      msg.message_id
    );
    return NextResponse.json({ ok: true });
  }

  // Pesan biasa -> kirim manual ke client
  if (kind !== "IG") {
    await sendTelegram(
      "⚠️ Balas manual dari Telegram untuk TikTok belum aktif (menunggu TikTok API). Balas langsung dari aplikasi TikTok ya.",
      msg.message_id
    );
    return NextResponse.json({ ok: true });
  }

  const res = await sendInstagramText(id, text);
  if (res.ok) {
    await logChatRow({
      platform,
      sender_handle: senderHandle,
      incoming_message: `${ADMIN_MARKER} manual reply`,
      ai_auto_reply: text, // disimpan sebagai balasan supaya AI ingat apa yang admin katakan
      status: STATUS_HUMAN_TAKEOVER,
    });
    await sendTelegram(
      `✅ Terkirim ke DM IG. AI dijeda ${HUMAN_TAKEOVER_MINUTES} menit untuk chat ini (reply /ai untuk aktifkan lagi).`,
      msg.message_id
    );
  } else {
    await sendTelegram(`❌ Gagal kirim ke IG: ${res.error}`, msg.message_id);
  }
  return NextResponse.json({ ok: true });
}

