// render_short.mjs: Headless Chrome GPU (Intel Iris Xe D3D11) -> FFmpeg Pipe Renderer
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const idx = a.indexOf('=');
    if (idx === -1) return [a.replace(/^--/, ''), true];
    return [a.slice(0, idx).replace(/^--/, ''), a.slice(idx + 1)];
  })
);

const CHROMES = [
  args.chrome,
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const CHROME = CHROMES.find(p => p && existsSync(p));
if (!CHROME) {
  console.error('ERROR: Chrome/Edge not found');
  process.exit(1);
}

const fps = +(args.fps || 24);
const outFile = args.out || resolve(__dirname, '../render_workspace/output_3d.mp4');
const audioFile = args.audio || '';

console.log(`[StudioRenderer] Launching Headless GPU Browser: ${CHROME}`);
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  protocolTimeout: 120000,
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

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  page.on('console', m => {
    if (['error', 'warn'].includes(m.type())) console.log(`[Browser]`, m.text());
  });
  page.on('pageerror', e => console.error(`[BrowserPageError]`, e.message));

  const htmlUrl = pathToFileURL(resolve(__dirname, 'studio.html')).href + '?render';
  await page.goto(htmlUrl, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction('window.ready === true', { timeout: 60000 });

  const duration = +(args.duration || (await page.evaluate(() => window.SCENE_DATA?.duration || 30)));
  const totalFrames = Math.ceil(duration * fps);
  console.log(`[StudioRenderer] Rendering ${totalFrames} frames (${duration.toFixed(1)}s @ ${fps} FPS)...`);

  const ffArgs = [
    '-y',
    '-loglevel', 'error',
    '-f', 'image2pipe',
    '-framerate', String(fps),
    '-c:v', 'mjpeg',
    '-i', '-',
  ];
  if (audioFile && existsSync(audioFile)) {
    ffArgs.push('-i', audioFile, '-map', '0:v:0', '-map', '1:a:0', '-c:a', 'aac', '-b:a', '192k', '-shortest');
  }
  ffArgs.push(
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '19',
    '-vf', 'scale=out_range=tv',
    '-pix_fmt', 'yuv420p',
    '-color_range', 'tv',
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
      console.log(`[StudioRenderer] Frame ${i + 1}/${totalFrames} (${t.toFixed(1)}s) - ${msPerFrame.toFixed(1)} ms/frame`);
    }
  }

  ff.stdin.end();
  await new Promise((resolvePromise, rejectPromise) => {
    ff.on('close', code => (code === 0 ? resolvePromise() : rejectPromise(new Error(`FFmpeg exited ${code}`))));
  });

  console.log(`[StudioRenderer] SUCCESS -> ${outFile}`);
} finally {
  await Promise.race([browser.close(), new Promise(r => setTimeout(r, 4000))]);
  process.exit(0);
}

