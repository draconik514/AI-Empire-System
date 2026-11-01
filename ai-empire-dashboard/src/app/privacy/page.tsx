export const metadata = { title: "Privacy Policy — At Heart Digital" };

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 20px", lineHeight: 1.7, fontFamily: "system-ui, sans-serif" }}>
      <h1>Privacy Policy — At Heart Digital</h1>
      <p><em>Last updated: November 1, 2026</em></p>

      <p>
        At Heart Digital (Instagram @at_heart.digital / @at.heart_digital, TikTok @at.heart_digital,
        store https://lynk.id/at_heart.digital) operates an automated customer-service assistant that
        replies to direct messages sent to our own business accounts. This policy explains what data we
        process and why.
      </p>

      <h2>1. Data we collect</h2>
      <ul>
        <li>The platform-scoped user ID (e.g. Instagram PSID, TikTok open ID) of people who message us.</li>
        <li>The text content of messages you send to our business accounts.</li>
        <li>Our automated replies and the timestamp of the conversation.</li>
      </ul>
      <p>We do not collect passwords, payment card data, contacts, or any data from people who have not messaged us.</p>

      <h2>2. How we use data</h2>
      <ul>
        <li>To answer your questions about our digital gift products and process your orders.</li>
        <li>To notify our admin so a human can follow up when needed.</li>
      </ul>
      <p>We never sell your data and never use it for advertising or profiling.</p>

      <h2>3. Processors</h2>
      <p>
        Message text is processed by an AI language model provider to generate replies, and conversation
        records are stored in a secured database and sent as private notifications to our admin. These
        providers act only on our instructions.
      </p>

      <h2>4. Retention</h2>
      <p>Conversation records are kept for up to 12 months for customer-service purposes and then deleted.</p>

      <h2>5. Your rights &amp; data deletion</h2>
      <p>
        You can request access to or deletion of your data at any time by sending &quot;HAPUS DATA&quot; /
        &quot;DELETE MY DATA&quot; via direct message to @at_heart.digital on Instagram or TikTok. We will delete
        your records within 7 days.
      </p>

      <h2>6. Contact</h2>
      <p>Direct message @at_heart.digital on Instagram or TikTok.</p>
    </main>
  );
}

