const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function main() {
  const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const outFile = path.resolve(__dirname, 'render_workspace/shorts_master_5scenes_karhutla.mp4');
  const audioFile = path.resolve(__dirname, 'render_workspace/vo_master_5scenes_60s.mp3');
  const fps = 24;
  const duration = 60.0;
  const totalFrames = Math.ceil(duration * fps);

  console.log(`[Master5Scenes] Rendering 5 Connected Scenes (${duration}s, ${totalFrames} frames @ ${fps}fps)...`);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    protocolTimeout: 0,
    args: [
      '--allow-file-access-from-files',
      '--disable-web-security',
      '--ignore-gpu-blocklist',
      '--use-angle=d3d11',
      '--enable-gpu-rasterization',
      '--window-size=1080,1920',
      '--disable-renderer-backgrounding',
      '--disable-background-timer-throttling',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });

  const htmlUrl = 'file:///' + path.resolve(__dirname, 'studio_engine/master_5scenes_karhutla.html').replace(/\\/g, '/');
  console.log('[Master5Scenes] Loading HTML:', htmlUrl);
  await page.goto(htmlUrl, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction('window.ready === true', { timeout: 30000 });

  const ffArgs = [
    '-y',
    '-loglevel', 'error',
    '-f', 'image2pipe',
    '-framerate', String(fps),
    '-c:v', 'mjpeg',
    '-i', '-',
  ];

  if (fs.existsSync(audioFile)) {
    ffArgs.push('-i', audioFile, '-map', '0:v:0', '-map', '1:a:0', '-c:a', 'aac', '-b:a', '192k', '-shortest');
  }

  ffArgs.push(
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '22',
    '-vf', 'scale=out_range=tv',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outFile
  );

  const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
  const tStart = Date.now();

  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;
    const dataUrl = await page.evaluate((time) => window.renderAt(time, 'image/jpeg', 0.90), t);
    const buf = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');

    if (!ff.stdin.write(buf)) {
      await new Promise(r => ff.stdin.once('drain', r));
    }

    if (i % 48 === 0 || i === totalFrames - 1) {
      const elapsed = (Date.now() - tStart) / 1000;
      const msPerFrame = (elapsed * 1000) / (i + 1);
      console.log(`[Master5Scenes] Frame ${i + 1}/${totalFrames} (${t.toFixed(1)}s) - ${msPerFrame.toFixed(1)} ms/frame`);
    }
  }

  ff.stdin.end();
  await new Promise((resolve, reject) => {
    ff.on('close', code => (code === 0 ? resolve() : reject(new Error(`FFmpeg exited code ${code}`))));
  });

  await browser.close();
  console.log(`[Master5Scenes] Video SUCCESS -> ${outFile}`);

  // Auto Upload directly to Telegram Bot (Native Node 24 Fetch)
  console.log('[Master5Scenes] Uploading to Telegram...');
  const form = new FormData();
  form.append('chat_id', '7885596077');
  form.append('caption', `🎬 MASTER 5-SCENE 3D SHORTS (60s)
(5 Scene Sinematik Saling Terhubung Sesuai Permintaan)

🛰️ Scene 1: Drone Canopy Kalimantan + HUD GPS (0-12s)
🔬 Scene 2: Penampang Bawah Tanah 4m & Bara 900°C (12-24s)
🌫️ Scene 3: Langit Merah Darah, Hujan Abu, ISPU 603 (24-36s)
💧 Scene 4: Helikopter Water Bombing & Sekat Kanal (36-48s)
🌱 Scene 5: Tunas Hijau Baru & Pertanyaan Diskusi (48-60s)

✨ 100% 3D Three.js + Remotion UI + Multi-Scene Camera!`);

  const fileBytes = fs.readFileSync(outFile);
  const blob = new Blob([fileBytes], { type: 'video/mp4' });
  form.append('video', blob, 'master_5scenes_karhutla.mp4');

  const tgRes = await fetch('https://api.telegram.org/bot9049336740:AAGcKj_MrzyUTvsFD13wRp7y9x7tkhafLlg/sendVideo', {
    method: 'POST',
    body: form,
  });
  const tgData = await tgRes.json();
  console.log('[Master5Scenes] Telegram Upload Result:', tgData?.ok, 'Message ID:', tgData?.result?.message_id);
}

main().catch(console.error);

