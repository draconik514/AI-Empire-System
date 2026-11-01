const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function main() {
  const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const outFile = path.resolve(__dirname, 'render_workspace/shorts_karhutla_full3d_cinematic.mp4');
  const fps = 24;
  const duration = 52.0;
  const totalFrames = Math.ceil(duration * fps);

  console.log(`[Full3DRenderer] Generating Karhutla 3D Video (${duration}s, ${totalFrames} frames @ ${fps}fps)...`);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
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

  const htmlUrl = 'file:///' + path.resolve(__dirname, 'studio_engine/karhutla_3d_simulation.html').replace(/\\/g, '/');
  console.log('[Full3DRenderer] Loading HTML:', htmlUrl);
  await page.goto(htmlUrl, { waitUntil: 'networkidle0' });

  // Ensure 1080x1920 portrait framing
  await page.evaluate(() => {
    window.timelineTime = 0;
    window.isPlaying = false; // deterministic step
  });

  const audioFile = path.resolve(__dirname, 'render_workspace/vo_karhutla_52s.mp3');

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
    '-crf', '23',
    '-vf', 'scale=out_range=tv',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outFile
  );

  const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
  const tStart = Date.now();

  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;
    await page.evaluate((time) => {
      window.timelineTime = time;
    }, t);

    // Grab frame buffer
    const buf = await page.screenshot({ type: 'jpeg', quality: 90 });
    if (!ff.stdin.write(buf)) {
      await new Promise(r => ff.stdin.once('drain', r));
    }

    if (i % 48 === 0 || i === totalFrames - 1) {
      const elapsed = (Date.now() - tStart) / 1000;
      const msPerFrame = (elapsed * 1000) / (i + 1);
      console.log(`[Full3DRenderer] Frame ${i + 1}/${totalFrames} (${t.toFixed(1)}s) - ${msPerFrame.toFixed(1)} ms/frame`);
    }
  }

  ff.stdin.end();
  await new Promise((resolve, reject) => {
    ff.on('close', code => (code === 0 ? resolve() : reject(new Error(`FFmpeg exited code ${code}`))));
  });

  await browser.close();
  console.log(`[Full3DRenderer] Video SUCCESS -> ${outFile}`);
}

main().catch(console.error);

