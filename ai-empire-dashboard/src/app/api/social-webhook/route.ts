import { NextRequest, NextResponse } from "next/server";
import {
  getConversationHistory,
  HUMAN_TAKEOVER_MINUTES,
  isHumanTakeoverActive,
  logChatRow,
  sendInstagramText,
  sendTelegram,
  STATUS_PAUSED_HUMAN,
} from "@/lib/messaging";

type TikTokMessageContent = {
  conversationId?: string;
  messageId?: string;
  sender?: { userType?: string; openId?: string };
  message?: { messageType?: string; text?: { text?: string } };
};

// Dedup sederhana per-instance untuk retry webhook TikTok
const seenTikTokMessageIds = new Set<string>();

const AT_HEART_DIGITAL_CATALOG_SOP = `
Brand: @at_heart.digital (IG: @at_heart.digital | TikTok: @at.heart_digital | Toko: https://lynk.id/at_heart.digital)
Tagline: "Digital gifts, redesigned for your story. Thoughtful. Aesthetic. Timeless."

ATURAN KHUSUS ORDER WEBSITE (BirthdayNest Rp 25.000 & HeartNest Rp 26.000) — WAJIB DIIKUTI:
1. SISTEM ISI GOOGLE FORM DULU, BAYAR SETELAH WEB JADI:
   Kalau ada client yang mau order Website (BirthdayNest atau HeartNest), kasihkan link Google Form sesuai websitenya untuk diisi data & foto terlebih dahulu, dan jelaskan bahwa BAYARNYA NANTI SAJA SETELAH WEBSITENYA JADI/SELESAI!
   - Link Google Form BirthdayNest (Rp 25.000): https://forms.gle/pUBTccHCVPgsDmLA7
   - Link Google Form HeartNest / BirthdayHeartNest (Rp 26.000): https://forms.gle/RCzbiSzdLo2cjnag7
2. APAKAH BISA DIEDIT SENDIRI? TIDAK BISA:
   Jika ada yang tanya apakah websitenya bisa diedit sendiri, jawab TIDAK BISA, karena kami (owner/admin) yang akan mengeditkan websitenya dan menggantikan semua foto-fotonya sampai terima beres! Pembeli cukup isi data & upload foto di Google Form sesuai websitenya.
3. BERAPA LAMA LINK WEBSITE BERTAHAN?
   Jika ditanya berapa lama link websitenya bertahan/aktif, jawab: Bertahan SELAMANYA (permanen) selama project di server Vercel kami tidak dihapus!
4. KALIMAT PENUTUP WAJIB SAAT MEMBERI / SETUJU ISI GOOGLE FORM:
   Selalu katakan: "Kabarin aku ya kak kalau sudah selesai isi form-nya, dan kalau ada yang pengen ditanya, tanya aja ya kak hehe 😊✨"

DAFTAR PRODUK & HARGA PROMO RESMI:
1. WEBSITE HADIAH DIGITAL INTERAKTIF (Terima Beres — Isi Google Form Dulu, Bayar Setelah Web Jadi!):
   - Web BirthdayNest (Siap Pakai 8-9 Halaman, Countdown, Balasan 2 Arah, Kue Ultah 3D Tiup Lilin pakai Mikrofon HP + Lagu Ultah Otomatis, Bunga Permintaan Maaf): Rp 25.000 (Normal Rp 50.000) -> Google Form Order: https://forms.gle/pUBTccHCVPgsDmLA7
   - Web HeartNest / BirthdayHeartNest (Siap Pakai Kejutan Ultah/Anniversary, Timeline Cinta Real-Time, Surat Digital, Galeri Privat, Playlist Spotify, Mini Game Puzzle Cinta): Rp 26.000 (Normal Rp 50.000) -> Google Form Order: https://forms.gle/RCzbiSzdLo2cjnag7
   - Source Code Birthday Cake Virtual (HTML/CSS/JS Kue 3D Tiup Lilin via Mic + Lagu + Confetti): Rp 10.000 (Normal Rp 25.000) -> Link: https://lynk.id/at_heart.digital/xkxm6xx88m9k (Bisa DM jika mau sekalian dibuatkan kue ultahnya untuk pacar!)
   - Source Code Bunga Virtual "Romantic Rose Proposal" (Website Lamaran Mawar 3D, Langit 200+ Bintang, Cincin Berlian, Tombol 'No' Menghindar & 'Yes' Hujan Confetti): Rp 10.000 (Normal Rp 15.000) -> Link: https://lynk.id/at_heart.digital/yyopdqznv6zk
   - Source Code Web1 HeartNest (Full React + Tailwind): Rp 50.000 -> Link: https://lynk.id/at_heart.digital/joy5pvpy8zg4
   - Source Code Web2 BirthdayNest (Full React + Tailwind + Tiup Lilin Mic): Rp 50.000 -> Link: https://lynk.id/at_heart.digital/mr0l53jw20ye
   - Web Portofolio: Rp 50.000 -> Link: https://lynk.id/at_heart.digital/2vpvree5r6w5

2. TEMPLATE SCRAPBOOK DIGITAL CANVA (Bisa Edit dari HP/Laptop):
   - Scrapbook "BORN TO BE LOVE" (12+ hal tema cinta & angkasa, 40+ slot foto, Canva Gratis): Rp 5.000 (Normal Rp 20.000) -> https://lynk.id/at_heart.digital/e0zw5pyd0plk
   - Just For You Scrapbook Ultah (10+ hal, 31+ bingkai foto, Canva Gratis): Rp 5.000 -> https://lynk.id/at_heart.digital/dnozx01gj637
   - Timeless Memories Scrapbook (26+ hal, 86+ bingkai foto, 17 hal spesial): Rp 10.000 -> https://lynk.id/at_heart.digital/2l0rvdznznn8
   - Our Story Scrapbook Pasangan (12+ hal, 46+ foto - Ada elemen Canva Pro, GRATIS jasa edit lewat DM IG jika belum punya Canva Pro!): Rp 10.000 -> https://lynk.id/at_heart.digital/ejo6k81ol6el
   - Sweet Anniversary Scrapbook (12+ hal, 40+ foto - GRATIS jasa edit lewat DM IG jika belum punya Canva Pro!): Rp 10.000 -> https://lynk.id/at_heart.digital/1lpn81dx0j3v
   - Anniversary #1 Scrapbook: Rp 17.500 -> https://lynk.id/at_heart.digital/bqEygv0
   - Template "Memories" Scrapbook Estetik: Rp 2.000 -> https://lynk.id/at_heart.digital/29jwv898rv77
   - Scrapbook Barbie Blue (Rp 1.000), Jake/Sunghoon (Rp 2.000), Retro Smile/Boys & the Gang/Jurnal (Rp 3.000), Creamfun (Rp 4.000), May Dump/April/Scrapbook Digital (Rp 5.000), ASH 02 (Rp 6.000), September (Rp 8.000), August (Rp 9.000).

3. TEMPLATE INSTAGRAM CAROUSEL & STORY (Canva Gratis):
   - Graduation Feed IG Carousel (20+ foto wisuda): Rp 3.000 -> https://lynk.id/at_heart.digital/11n398gyjm9n
   - Aesthetic IG Carousel DUMP / FRIENDSHIP (35+ foto) / HOLIDAY (33+ foto) / PINK: masing-masing Rp 3.000.
   - IG Story Bukber 1 & Ramadan 2: Rp 2.000.
`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken =
    process.env.SOCIAL_WEBHOOK_VERIFY_TOKEN || "verifikasi_cs_ai_2026";

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({
    ok: true,
    brand: "@at_heart.digital",
    service: "Divisi 2 — Omnichannel Social Auto-Responder (IG & TikTok)",
    webhook_verify_token: verifyToken,
    status: "READY_24_7",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let platform: "Instagram" | "TikTok" =
      body.platform === "TikTok" ? "TikTok" : "Instagram";
    let senderHandle: string = body.sender_handle || "@calon_pembeli";
    let senderName: string = body.sender_name || "Kak";
    let incomingMessage: string =
      body.incoming_message || "Kak, mau tanya produk hadiah digitalnya dong.";
    let igSenderPsid: string | null = null;

    if (body.object === "instagram" && body.entry?.[0]?.messaging?.[0]) {
      const messagingEvent = body.entry[0].messaging[0];
      const ownIgId = process.env.INSTAGRAM_ACCOUNT_ID || "17841475454463137";
      // Abaikan echo (pesan yang dikirim oleh akun kita sendiri) agar tidak loop
      if (
        messagingEvent.message?.is_echo ||
        messagingEvent.sender?.id === ownIgId ||
        !messagingEvent.message?.text
      ) {
        return NextResponse.json({ ok: true, skipped: "Echo/non-text event" });
      }
      igSenderPsid = messagingEvent.sender?.id || null;
      senderHandle = `@ig_${igSenderPsid || "user"}`;
      senderName = `Kak (${igSenderPsid || "IG"})`;
      incomingMessage = messagingEvent.message?.text || "";
      platform = "Instagram";
    }

    // TikTok Business Messaging webhook: { event, user_openid, content: "<JSON string>" }
    let tiktokConversationId: string | null = null;
    let tiktokSenderOpenId: string | null = null;
    if (body.client_key && body.event && body.content) {
      let tk: TikTokMessageContent = {};
      try {
        tk =
          typeof body.content === "string"
            ? JSON.parse(body.content)
            : body.content;
      } catch {
        return NextResponse.json({ ok: true, skipped: "Invalid TikTok content" });
      }
      const text = tk.message?.text?.text || "";
      // Abaikan pesan dari akun bisnis sendiri, non-teks, atau duplikat (TikTok kirim "at least once")
      if (
        tk.sender?.userType === "BUSINESS" ||
        !text ||
        (tk.messageId && seenTikTokMessageIds.has(tk.messageId))
      ) {
        return NextResponse.json({ ok: true, skipped: "TikTok echo/non-text/duplicate" });
      }
      if (tk.messageId) {
        seenTikTokMessageIds.add(tk.messageId);
        if (seenTikTokMessageIds.size > 500) seenTikTokMessageIds.clear();
      }
      tiktokConversationId = tk.conversationId || null;
      tiktokSenderOpenId = tk.sender?.openId || body.user_openid || null;
      senderHandle = `@tt_${(tiktokSenderOpenId || "user").slice(-10)}`;
      senderName = "Kak";
      incomingMessage = text;
      platform = "TikTok";
    }

    if (!incomingMessage) {
      return NextResponse.json({ ok: true, skipped: "Empty message" });
    }

    // ID untuk membalas manual dari Telegram (reply ke notifikasi)
    const replyRef = igSenderPsid
      ? `IG:${igSenderPsid}`
      : tiktokSenderOpenId
        ? `TT:${tiktokSenderOpenId}`
        : "";

    // 0. Mode manual: jika admin sedang mengambil alih chat ini, AI diam dan hanya meneruskan ke Telegram
    if (await isHumanTakeoverActive(senderHandle)) {
      const sent = await sendTelegram(
        `🙋 MODE MANUAL (${platform}), AI diam\n` +
          `👤 ${senderHandle}\n💬 "${incomingMessage}"\n\n` +
          `↩️ Reply pesan ini untuk membalas. /ai (reply) untuk aktifkan AI lagi.\n🆔 ${replyRef}`
      );
      await logChatRow({
        platform,
        sender_handle: senderHandle,
        sender_name: senderName,
        incoming_message: incomingMessage,
        ai_auto_reply: "",
        status: STATUS_PAUSED_HUMAN,
        telegram_notified: sent,
      });
      return NextResponse.json({ ok: true, skipped: "Human takeover active" });
    }

    // Riwayat percakapan sebelumnya (memori AI per client)
    const history = await getConversationHistory(senderHandle);

    const customSop: string = body.sop_context
      ? `${AT_HEART_DIGITAL_CATALOG_SOP}\n\nInstruksi Tambahan: ${body.sop_context}`
      : AT_HEART_DIGITAL_CATALOG_SOP;

    // 1. Deteksi Kategori Niat Client (Intent)
    const lower = incomingMessage.toLowerCase();
    let intentCategory:
      | "Tanya_Harga"
      | "Siap_Order"
      | "Konsultasi"
      | "Follow_Up" = "Konsultasi";
    if (
      lower.includes("harga") ||
      lower.includes("berapa") ||
      lower.includes("biaya") ||
      lower.includes("murah")
    ) {
      intentCategory = "Tanya_Harga";
    } else if (
      lower.includes("order") ||
      lower.includes("pesan") ||
      lower.includes("beli") ||
      lower.includes("cara") ||
      lower.includes("link")
    ) {
      intentCategory = "Siap_Order";
    }

    // 2. Buat Balasan Otomatis menggunakan Groq Cloud Free API (openai/gpt-oss-120b)
    let aiReply = `Halo Kak ${senderName}! ✨ Terima kasih sudah menghubungi @at_heart.digital di ${platform}. Untuk koleksi kado digital kami mulai dari Rp 2.000–Rp 10.000 (Template Scrapbook Canva & Source Code Kue/Bunga Virtual) hingga Rp 25.000–Rp 26.000 (Web BirthdayNest Tiup Lilin via Mic & HeartNest Siap Pakai). Bisa langsung cek & order instan di https://lynk.id/at_heart.digital ya Kak! 💖`;

    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && !groqKey.startsWith("gsk_your_")) {
      try {
        const llmRes = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${groqKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-oss-120b",
              messages: [
                {
                  role: "system",
                  content: `Kamu adalah Customer Service AI resmi untuk brand @at_heart.digital di Instagram dan TikTok.\n${customSop}\nJawab dengan ramah, hangat, sopan, sebutkan nama produk, harga promo yang pas, cara order singkat, dan berikan link lynk.id yang sesuai.\nPERHATIKAN RIWAYAT PERCAKAPAN: jangan mengulang penjelasan katalog/link yang sudah pernah diberikan kecuali diminta; lanjutkan obrolan secara natural. Jika client bilang sudah isi form atau sudah bayar, ucapkan terima kasih dan bilang admin akan segera memproses. Jawab singkat (maksimal sekitar 800 karakter), tanpa format markdown seperti ** atau tabel karena DM Instagram tidak mendukungnya.`,
                },
                ...history,
                {
                  role: "user",
                  content: incomingMessage,
                },
              ],
              temperature: 0.5,
              max_tokens: 450,
            }),
          }
        );
        if (llmRes.ok) {
          const llmData = await llmRes.json();
          const generated = llmData?.choices?.[0]?.message?.content?.trim();
          if (generated) aiReply = generated;
        }
      } catch {
        // Fallback reply
      }
    }

    // 3. Kirim Balasan Langsung ke Instagram DM jika pesan dari Instagram
    let igStatus = "";
    if (igSenderPsid) {
      const igRes = await sendInstagramText(igSenderPsid, aiReply);
      igStatus = igRes.ok
        ? "✅ Terkirim ke DM IG"
        : `❌ Gagal kirim IG: ${igRes.error}`;
    }

    // 4. Kirim Balasan Langsung ke TikTok DM (Business Messaging API)
    let ttStatus = "";
    const ttToken = process.env.TIKTOK_ACCESS_TOKEN;
    if (tiktokSenderOpenId && ttToken) {
      try {
        // URL bisa diganti via env jika dokumentasi TikTok di dashboard developer berbeda
        const ttSendUrl =
          process.env.TIKTOK_SEND_MESSAGE_URL ||
          "https://business-api.tiktok.com/open_api/v1.3/business_message/message/send/";
        const ttRes = await fetch(ttSendUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Access-Token": ttToken },
          body: JSON.stringify({
            business_id: process.env.TIKTOK_BUSINESS_ID,
            conversation_id: tiktokConversationId,
            recipient_open_id: tiktokSenderOpenId,
            message_type: "TEXT",
            text: { text: aiReply.slice(0, 1000) },
          }),
        });
        const ttBody = await ttRes.text();
        // TikTok Business API mengembalikan HTTP 200 dengan "code": 0 jika sukses
        ttStatus =
          ttRes.ok && /"code"\s*:\s*0\b/.test(ttBody)
            ? "✅ Terkirim ke DM TikTok"
            : `❌ Gagal kirim TikTok: ${ttBody.slice(0, 300)}`;
      } catch {
        ttStatus = "❌ Gagal kirim TikTok (network error)";
      }
    } else if (tiktokSenderOpenId) {
      ttStatus = "⚠️ TIKTOK_ACCESS_TOKEN belum diisi, balas manual dulu";
    }

    // 5. Kirim Notifikasi Real-Time ke Telegram Bot (@cs_bisnisku_2026_bot)
    const alertText =
      `🔔 CLIENT @at_heart.digital (${platform.toUpperCase()})\n\n` +
      `👤 Akun: ${senderHandle}\n` +
      `🏷️ Kategori: ${intentCategory.replace("_", " ")}` +
      (history.length ? ` · 🧠 ingat ${history.length} pesan sebelumnya` : " · 🆕 chat baru") +
      `\n💬 Pesan Client:\n"${incomingMessage}"\n\n` +
      `🤖 Balasan AI:\n"${aiReply}"` +
      (igStatus ? `\n\n${igStatus}` : "") +
      (ttStatus ? `\n\n${ttStatus}` : "") +
      `\n\n↩️ Reply pesan ini untuk balas manual (AI otomatis jeda ${HUMAN_TAKEOVER_MINUTES} menit)` +
      (replyRef ? `\n🆔 ${replyRef}` : "");
    const telegramSent = await sendTelegram(alertText);

    // 6. Simpan ke Supabase (sekaligus jadi memori percakapan)
    await logChatRow({
      platform,
      sender_handle: senderHandle,
      sender_name: senderName,
      incoming_message: incomingMessage,
      ai_auto_reply: aiReply,
      intent_category: intentCategory,
      status: "Auto_Replied",
      telegram_notified: telegramSent,
    });

    return NextResponse.json({
      version: "v2",
      content: {
        messages: [
          {
            type: "text",
            text: aiReply,
          },
        ],
      },
      ok: true,
      platform,
      sender_handle: senderHandle,
      sender_name: senderName,
      intent_category: intentCategory,
      ai_auto_reply: aiReply,
      telegram_notified: telegramSent,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
