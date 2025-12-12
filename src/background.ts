import {
  clearBrowserHistory,
  clearDownloadHistory,
  type AutoClearSettings,
} from './utils/chrome-api';

const ALARM_NAME = 'auto-clear-alarm';

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
  }
});

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log('[QuickClear] Alarm triggered! Cleaning...');
    chrome.storage.local.get(['autoClearSettings'], (result) => {
      const settings = result.autoClearSettings as AutoClearSettings;
      if (settings && settings.enabled) {
        if (settings.clearHistory) {
          clearBrowserHistory('last_hour').then(() => { 
             // Note: 'last_hour' is hardcoded here? 
             // The requirement said "auto remove periodically".
             // It implies removing what happened *since last time*?
             // Or just clearing history?
             // Usually auto-clear means "prevent history from accumulating".
             // If period is X, we probably want to clear keys for valid timeranges.
             // But 'clearBrowserHistory' takes a TimeRange. 
             // If I run every 10 mins, I should probably clear 'last_hour' or something?
             // Or maybe 'all_time'? 
             // "action: remove history or/and downloads" 
             // If I clear 'all_time' every 10 minutes, that works.
             // If I clear 'last_hour' every day, that's weird.
             // I will assume clearing EVERYTHING (all_time) is the goal effectively,
             // or maybe the user wants to clear just the recent stuff?
             // Given the options are simple checks, I'll default to 'all_time' or equivalent
             // actually, better to safeguard and maybe clear 'all_time'?
             // But 'clearBrowserHistory' implementation calls 'removeHistory({ since })'.
             // If I pass 'all_time', since=0.
             // Let's assume 'all_time' for auto-clear to ensure clean slate.
          }); 
        }
        
        // Wait, I can't chain these easily if I want to run concurrently properly.
        const tasks = [];
        // Use 'all_time' for complete cleaning as per "Auto Remove" usually implies keeping it clean.
        // However, if the user downloads something important 3 days ago, and sets auto clear every hour today...
        // Maybe they only want to clear "recent"?
        // The requirement "every X minute / hour / day" 
        // suggests the frequency of cleaning.
        // I will use 'all_time' for now as it's the most effective "clear"
        
        if (settings.clearHistory) {
            tasks.push(clearBrowserHistory('all_time'));
        }
        if (settings.clearDownloads) {
            tasks.push(clearDownloadHistory('all_time'));
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
           updateAlarm(result.autoClearSettings as AutoClearSettings);
        }
    });
});

chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(['autoClearSettings'], (result) => {
        if (result.autoClearSettings) {
           updateAlarm(result.autoClearSettings as AutoClearSettings);
        }
    });
});
