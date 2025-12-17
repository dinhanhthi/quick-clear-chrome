import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

const PLAYGROUND_PORT = 5174;
const PLAYGROUND_URL = `http://localhost:${PLAYGROUND_PORT}`;

// Screenshot config
const POPUP_WIDTH = 350;
const POPUP_HEIGHT = 580; // Approximate height of the popup
const DEVICE_SCALE_FACTOR = 2; // 2x for retina/HiDPI quality
const GAP = 80; // Gap between the two screenshots (scaled)
const PADDING = 120; // Padding around the screenshots (scaled)
const BORDER_RADIUS = 24; // Border radius (scaled)

// Gradient colors (matching playground.html)
const GRADIENT_START = '#667eea';
const GRADIENT_END = '#764ba2';

async function waitForServer(
  url: string,
  timeout = 30000
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function startPlaygroundServer(): ChildProcess {
  console.log('🚀 Starting playground server...');
  const server = spawn('npm', ['run', 'playground'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    detached: true,
  });

  server.stdout?.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Local:')) {
      console.log('✅ Server started');
    }
  });

  return server;
}

async function captureScreenshot(
  page: puppeteer.Page,
  tab: 'manual' | 'auto',
  theme: 'light' | 'dark'
): Promise<Buffer> {
  // Set color scheme
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: theme },
  ]);

  // Reload to apply theme properly
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#playground-container');
  await new Promise((r) => setTimeout(r, 300));

  // Click on the appropriate tab
  const tabButton = tab === 'manual' ? 'Manual' : 'Auto';
  await page.evaluate((btnText) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find((b) => b.textContent?.trim() === btnText);
    if (btn) btn.click();
  }, tabButton);

  // Wait for any animations
  await new Promise((r) => setTimeout(r, 300));

  // Capture the popup container
  const container = await page.$('#playground-container');
  if (!container) throw new Error('Popup container not found');

  const screenshot = await container.screenshot({
    type: 'png',
  });

  return screenshot as Buffer;
}

/**
 * Create a diagonal split image with light mode on top-right and dark mode on bottom-left
 * The diagonal line goes from bottom-left to top-right
 */
async function createDiagonalSplitImage(
  lightScreenshot: Buffer,
  darkScreenshot: Buffer
): Promise<Buffer> {
  const lightMeta = await sharp(lightScreenshot).metadata();
  const width = lightMeta.width || POPUP_WIDTH;
  const height = lightMeta.height || POPUP_HEIGHT;

  // Create diagonal mask SVG
  // The polygon covers the top-right portion (where light mode will show)
  // Diagonal from bottom-left (0, height) to top-right (width, 0)
  const diagonalMaskSvg = Buffer.from(`
    <svg width="${width}" height="${height}">
      <polygon points="0,0 ${width},0 ${width},${height}" fill="white"/>
    </svg>
  `);

  // Apply diagonal mask to light screenshot (show top-right portion)
  const maskedLight = await sharp(lightScreenshot)
    .composite([{
      input: diagonalMaskSvg,
      blend: 'dest-in'
    }])
    .png()
    .toBuffer();

  // Combine: dark as base, light overlay with diagonal mask
  const combined = await sharp(darkScreenshot)
    .composite([{
      input: maskedLight,
      blend: 'over'
    }])
    .png()
    .toBuffer();

  return combined;
}

async function createCombinedScreenshot(
  manualDiagonal: Buffer,
  autoDiagonal: Buffer,
  outputPath: string
): Promise<void> {
  // Get dimensions of screenshots
  const manualMeta = await sharp(manualDiagonal).metadata();
  const autoMeta = await sharp(autoDiagonal).metadata();

  const screenshotWidth = Math.max(manualMeta.width || POPUP_WIDTH, autoMeta.width || POPUP_WIDTH);
  const screenshotHeight = Math.max(manualMeta.height || POPUP_HEIGHT, autoMeta.height || POPUP_HEIGHT);

  // Calculate final canvas size
  const canvasWidth = screenshotWidth * 2 + GAP + PADDING * 2;
  const canvasHeight = screenshotHeight + PADDING * 2;

  // Create gradient background using SVG
  const gradientSvg = `
    <svg width="${canvasWidth}" height="${canvasHeight}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${GRADIENT_START};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${GRADIENT_END};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>
  `;

  // Add rounded corners to screenshots
  const roundedMask = Buffer.from(`
    <svg width="${screenshotWidth}" height="${screenshotHeight}">
      <rect x="0" y="0" width="${screenshotWidth}" height="${screenshotHeight}" 
            rx="${BORDER_RADIUS}" ry="${BORDER_RADIUS}" fill="white"/>
    </svg>
  `);

  const roundedManual = await sharp(manualDiagonal)
    .resize(screenshotWidth, screenshotHeight)
    .composite([{
      input: roundedMask,
      blend: 'dest-in'
    }])
    .png()
    .toBuffer();

  const roundedAuto = await sharp(autoDiagonal)
    .resize(screenshotWidth, screenshotHeight)
    .composite([{
      input: roundedMask,
      blend: 'dest-in'
    }])
    .png()
    .toBuffer();

  // Create the final composite image
  await sharp(Buffer.from(gradientSvg))
    .png()
    .composite([
      {
        input: roundedManual,
        left: PADDING,
        top: PADDING,
      },
      {
        input: roundedAuto,
        left: PADDING + screenshotWidth + GAP,
        top: PADDING,
      },
    ])
    .toFile(outputPath);

  console.log(`✅ Screenshot saved to: ${outputPath}`);
}

async function main() {
  let server: ChildProcess | null = null;
  let browser: puppeteer.Browser | null = null;

  try {
    // Check if server is already running
    let serverReady = await waitForServer(PLAYGROUND_URL, 1000);

    if (!serverReady) {
      server = startPlaygroundServer();
      serverReady = await waitForServer(PLAYGROUND_URL);
      if (!serverReady) {
        throw new Error('Failed to start playground server');
      }
    } else {
      console.log('✅ Playground server already running');
    }

    console.log('🎭 Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      channel: 'chrome', // Use installed Chrome instead of downloading Chromium
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: 500,
      height: 700,
      deviceScaleFactor: DEVICE_SCALE_FACTOR, // 2x for high quality
    });

    console.log('📸 Navigating to playground...');
    await page.goto(PLAYGROUND_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#playground-container');
    await new Promise((r) => setTimeout(r, 500));

    // Capture all 4 variations
    console.log('📷 Capturing Manual tab (light)...');
    const manualLight = await captureScreenshot(page, 'manual', 'light');

    console.log('📷 Capturing Manual tab (dark)...');
    const manualDark = await captureScreenshot(page, 'manual', 'dark');

    console.log('📷 Capturing Auto tab (light)...');
    const autoLight = await captureScreenshot(page, 'auto', 'light');

    console.log('📷 Capturing Auto tab (dark)...');
    const autoDark = await captureScreenshot(page, 'auto', 'dark');

    // Create diagonal split images
    console.log('🎨 Creating diagonal split for Manual tab...');
    const manualDiagonal = await createDiagonalSplitImage(manualLight, manualDark);

    console.log('🎨 Creating diagonal split for Auto tab...');
    const autoDiagonal = await createDiagonalSplitImage(autoLight, autoDark);

    // Output path
    const outputPath = path.join(process.cwd(), 'public', 'screenshot.png');
    const distOutputPath = path.join(process.cwd(), 'dist', 'screenshot.png');

    console.log('🎨 Creating combined screenshot...');
    await createCombinedScreenshot(manualDiagonal, autoDiagonal, outputPath);

    // Also copy to dist if it exists
    try {
      await sharp(outputPath).toFile(distOutputPath);
      console.log(`✅ Screenshot also copied to: ${distOutputPath}`);
    } catch {
      // dist folder might not exist yet
    }

    console.log('✨ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    if (server) {
      // Kill the server process group
      process.kill(-server.pid!, 'SIGTERM');
    }
  }
}

main();
