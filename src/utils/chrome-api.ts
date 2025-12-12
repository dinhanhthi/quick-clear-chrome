export type TimeRange =
  | 'last_hour'
  | 'last_24h'
  | 'last_7days'
  | 'last_4weeks'
  | 'all_time';

export interface AutoClearSettings {
  enabled: boolean;
  interval: number; // in minutes
  unit: 'minute' | 'hour' | 'day';
  timeRange: TimeRange;
  clearHistory: boolean;
  clearDownloads: boolean;
  clearEverything: boolean;
}

const getSinceTimestamp = (range: TimeRange): number => {
  const now = Date.now();
  switch (range) {
    case 'last_hour':
      return now - 3600 * 1000;
    case 'last_24h':
      return now - 24 * 3600 * 1000;
    case 'last_7days':
      return now - 7 * 24 * 3600 * 1000;
    case 'last_4weeks':
      return now - 4 * 7 * 24 * 3600 * 1000;
    case 'all_time':
      return 0;
    default:
      return 0;
  }
};

const getOrigin = (input: string): string | null => {
  try {
    let urlStr = input.trim();
    if (!urlStr.match(/^[a-zA-Z]+:\/\//)) {
      urlStr = 'https://' + urlStr;
    }
    const url = new URL(urlStr);
    return url.origin;
  } catch (e) {
    return null;
  }
};

const isDev = !chrome?.browsingData;

export const clearBrowserHistory = async (range: TimeRange): Promise<void> => {
  if (isDev) {
    console.log(`[DEV] Clearing browser history for range: ${range}`);
    return;
  }

  const since = getSinceTimestamp(range);
  // Using browsingData to clear history
  return new Promise((resolve) => {
    chrome.browsingData.removeHistory({ since }, resolve);
  });
};

export const clearDownloadHistory = async (range: TimeRange): Promise<void> => {
  if (isDev) {
    console.log(`[DEV] Clearing download history for range: ${range}`);
    return;
  }

  const since = getSinceTimestamp(range);
  return new Promise((resolve) => {
    chrome.browsingData.removeDownloads({ since }, resolve);
  });
};

export const clearHistoryAndDownloads = async (
  range: TimeRange
): Promise<void> => {
  if (isDev) {
    console.log(`[DEV] Clearing History + Downloads for range: ${range}`);
    return;
  }

  await Promise.all([clearBrowserHistory(range), clearDownloadHistory(range)]);
};

export const clearEverything = async (range: TimeRange): Promise<void> => {
  if (isDev) {
    console.log(`[DEV] Clearing EVERYTHING for range: ${range}`);
    return;
  }

  const since = getSinceTimestamp(range);
  return new Promise((resolve) => {
    chrome.browsingData.remove(
      {
        since,
        originTypes: {
          unprotectedWeb: true, // Normal websites
          protectedWeb: true, // Hosted apps
          extension: true, // Extension data
        },
      },
      {
        appcache: true,
        cache: true,
        cookies: true,
        downloads: true,
        fileSystems: true,
        formData: true,
        history: true,
        indexedDB: true,
        localStorage: true,
        pluginData: true,
        passwords: true,
        serviceWorkers: true,
        webSQL: true,
      },
      resolve
    );
  });
};

export const clearSiteData = async (input: string): Promise<void> => {
  if (isDev) {
    console.log(`[DEV] Clearing data for site input: ${input}`);
    return;
  }

  const origin = getOrigin(input);
  const tasks: Promise<void>[] = [];

  // 1. Clear site data (cookies, storage, etc.) via origins
  if (origin) {
    tasks.push(
      new Promise((resolve) => {
        chrome.browsingData.remove(
          {
            origins: [origin],
          },
          {
            cache: true,
            cookies: true,
            fileSystems: true,
            indexedDB: true,
            localStorage: true,
            serviceWorkers: true,
            webSQL: true,
          },
          () => {
            if (chrome.runtime.lastError) {
              console.error(
                '[QuickClear] Error removing site data:',
                chrome.runtime.lastError
              );
            }
            resolve();
          }
        );
      })
    );
  }

  // 2. Clear History entries individually ensuring we catch sub-paths
  // We search for the text input to catch various url permutations in history
  tasks.push(
    new Promise((resolve) => {
      chrome.history.search(
        { text: input, startTime: 0, maxResults: 10000 },
        (results) => {
          const deletePromises = results.map((item) => {
            if (item.url) {
              return new Promise<void>((res) =>
                chrome.history.deleteUrl({ url: item.url! }, res)
              );
            }
            return Promise.resolve();
          });
          Promise.all(deletePromises).then(() => resolve());
        }
      );
    })
  );

  await Promise.all(tasks);
};

export const getCurrentTabUrl = async (): Promise<string | null> => {
  if (isDev) {
    return 'https://example.com';
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url || null;
};
