import {
  clearBrowserHistory,
  clearDownloadHistory,
  clearEverything,
  type AutoClearSettings,
} from './utils/chrome-api';

const ALARM_NAME = 'auto-clear-alarm';

// Update badge to show auto clean status
const updateBadge = (settings: AutoClearSettings) => {
  if (settings.enabled) {
    // Show green dot when auto clean is ON (using space for smallest badge)
    chrome.action.setBadgeText({ text: '★' });
    chrome.action.setBadgeTextColor({ color: '#ffffff' });
    chrome.action.setBadgeBackgroundColor({ color: '#22c55e' }); // Green color
    chrome.action.setTitle({ title: 'Quick Clear - Auto Clean ON' });
  } else {
    // Remove badge when auto clean is OFF
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setTitle({ title: 'Quick Clear' });
  }
};

// Initialize or update alarm based on settings
const updateAlarm = (settings: AutoClearSettings) => {
  if (settings.enabled && settings.interval > 0) {
    let periodInMinutes = settings.interval;
    if (settings.unit === 'hour') {
      periodInMinutes = settings.interval * 60;
    } else if (settings.unit === 'day') {
      periodInMinutes = settings.interval * 60 * 24;
    }

    console.log(
      `[QuickClear] Creating alarm for every ${periodInMinutes} minutes.`
    );
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: periodInMinutes,
    });
  } else {
    console.log('[QuickClear] Clearing alarm.');
    chrome.alarms.clear(ALARM_NAME);
  }
};

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.autoClearSettings) {
    const newSettings = changes.autoClearSettings.newValue as AutoClearSettings;
    console.log('[QuickClear] Settings changed:', newSettings);
    updateAlarm(newSettings);
    updateBadge(newSettings);
  }
});

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log('[QuickClear] Alarm triggered! Cleaning...');
    chrome.storage.local.get(['autoClearSettings'], (result) => {
      const settings = result.autoClearSettings as AutoClearSettings;
      if (settings && settings.enabled) {
        const timeRange = settings.timeRange || 'all_time';
        console.log(`[QuickClear] Auto-cleaning with range: ${timeRange}`);

        const tasks: Promise<void>[] = [];
        
        if (settings.clearEverything) {
          // Clear everything takes precedence
          tasks.push(clearEverything(timeRange));
        } else {
          // Clear individual items based on settings
          if (settings.clearHistory) {
            tasks.push(clearBrowserHistory(timeRange));
          }
          if (settings.clearDownloads) {
            tasks.push(clearDownloadHistory(timeRange));
          }
        }
        
        Promise.all(tasks).then(() => {
          console.log('[QuickClear] Auto-clear finished.');
          chrome.storage.local.set({ lastAutoClearTime: Date.now() });
        });
      }
    });
  }
});

// Initial check on load (e.g. browser restart)
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['autoClearSettings'], (result) => {
        if (result.autoClearSettings) {
           const settings = result.autoClearSettings as AutoClearSettings;
           updateAlarm(settings);
           updateBadge(settings);
        }
    });
});

chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(['autoClearSettings'], (result) => {
        if (result.autoClearSettings) {
           const settings = result.autoClearSettings as AutoClearSettings;
           updateAlarm(settings);
           updateBadge(settings);
        }
    });
});
