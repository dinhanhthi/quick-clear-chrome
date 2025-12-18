# Quick Clear - Chrome Extension

A modern, fast extension to clear browser history, downloads, and site-specific data (cookies, storage).

⏬ Download the latest version [here](https://github.com/dinhanhthi/quick-clear-chrome/releases/download/v1.2.2/quick-clear-chrome-v1.2.2.zip).

## Features

- **Manual Clear**: Clear history, downloads, or everything with customizable time ranges (last hour, 24 hours, 7 days, 4 weeks, all time)
- **Auto Clear**: Schedule automatic cleaning at set intervals (minutes/hours/days)
- **Site-Specific Cleaner**: Clear data for specific domains or the current active site
- **Visual Indicator**: Green dot on extension icon when auto-clean is active
- **Dark Mode Support**: Seamless light/dark theme switching
- **Playground** (dev only): A simple UI to test the extension in development.

<img src="./public/screenshot.png" alt="Quick Clear Screenshot" width="500" />

## Development

```bash
npm install
npm run dev   # UI development
npm run build # Build extension to dist/
npm run version 1.1.0 # Update version in package.json and manifest.json
npm run zip   # Create a .zip file for Chrome Web Store upload
npm run prettier # Format code
```

## Installation

1. If you just want to use [the latest version](https://github.com/dinhanhthi/quick-clear-chrome/releases/download/v1.2.2/quick-clear-chrome-v1.2.2.zip), extract the zip file from `zip/` folder and load it in Chrome.
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the `dist/` folder
