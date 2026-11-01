const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=d3d11']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920 });
  const fileUrl = 'file:///' + path.resolve(__dirname, 'studio_engine/karhutla_3d_simulation.html').replace(/\\/g, '/');
  console.log('Navigating to:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: 'C:/Users/draconik/.gemini/antigravity/brain/c8131d81-2b35-4765-87ec-3b55a8005c3e/karhutla_preview_babak1.jpg' });
  console.log('Saved Babak 1 screenshot');

  await page.evaluate(() => {
    timelineTime = 36;
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'C:/Users/draconik/.gemini/antigravity/brain/c8131d81-2b35-4765-87ec-3b55a8005c3e/karhutla_preview_babak4.jpg' });
  console.log('Saved Babak 4 screenshot');

  await browser.close();
  console.log('Done captures!');
})();

