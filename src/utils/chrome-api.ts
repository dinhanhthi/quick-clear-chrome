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

export interface IgnoreListItem {
  url: string;
  addedAt: number; // timestamp
}

export interface IgnoreListSettings {
  items: IgnoreListItem[];
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
  } catch {
    return null;
  }
};

const isDev = () => !chrome?.browsingData;

// Check if a URL matches any pattern in the ignore list
const isUrlIgnored = (url: string, ignoreList: IgnoreListItem[]): boolean => {
  if (!ignoreList || ignoreList.length === 0) return false;

  try {
    const urlObj = new URL(url);
    const urlHost = urlObj.hostname;

    return ignoreList.some((item) => {
      const pattern = item.url.trim();
      if (!pattern) return false;

      // Exact URL match
      if (url === pattern || url.startsWith(pattern)) return true;

      // Domain/hostname match
      try {
        // Try parsing as URL
        const patternUrl = new URL(
          pattern.match(/^[a-zA-Z]+:\/\//) ? pattern : `https://${pattern}`
        );
        const patternHost = patternUrl.hostname;

        // Match exact hostname or subdomain
        return urlHost === patternHost || urlHost.endsWith(`.${patternHost}`);
      } catch {
        // If not a valid URL, treat as domain pattern
        return urlHost === pattern || urlHost.endsWith(`.${pattern}`);
      }
    });
  } catch {
    return false;
  }
};

export const clearBrowserHistory = async (range: TimeRange): Promise<void> => {
  if (isDev()) {
    console.log(`[DEV] Clearing browser history for range: ${range}`);
    return;
  }

  // Load ignore list
  const ignoreList = await loadIgnoreList();

  if (ignoreList.items.length === 0) {
    // No ignore list - use fast bulk delete
    const since = getSinceTimestamp(range);
    return new Promise((resolve) => {
      chrome.browsingData.removeHistory({ since }, resolve);
    });
  }

  // With ignore list - fetch and filter individually
  const since = getSinceTimestamp(range);
  return new Promise((resolve) => {
    chrome.history.search(
      { text: '', startTime: since, maxResults: 100000 },
      (results) => {
        const deletePromises = results
          .filter(
            (item) => item.url && !isUrlIgnored(item.url, ignoreList.items)
          )
          .map((item) => {
            return new Promise<void>((res) =>
              chrome.history.deleteUrl({ url: item.url! }, res)
            );
          });
        Promise.all(deletePromises).then(() => resolve());
      }
    );
  });
};

export const clearDownloadHistory = async (range: TimeRange): Promise<void> => {
  if (isDev()) {
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
  if (isDev()) {
    console.log(`[DEV] Clearing History + Downloads for range: ${range}`);
    return;
  }

  // clearBrowserHistory already respects ignore list
  // Downloads API doesn't support exclusions, so we clear everything
  await Promise.all([clearBrowserHistory(range), clearDownloadHistory(range)]);
};

export const clearEverything = async (range: TimeRange): Promise<void> => {
  if (isDev()) {
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
  if (isDev()) {
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

export const clearSiteHistoryAndDownloads = async (
  input: string
): Promise<void> => {
  if (isDev()) {
    console.log(
      `[DEV] Clearing history and downloads for site input: ${input}`
    );
    return;
  }

  // Load ignore list
  const ignoreList = await loadIgnoreList();

  // Clear History entries for this site
  return new Promise((resolve) => {
    chrome.history.search(
      { text: input, startTime: 0, maxResults: 10000 },
      (results) => {
        const deletePromises = results
          .filter(
            (item) => item.url && !isUrlIgnored(item.url, ignoreList.items)
          )
          .map((item) => {
            return new Promise<void>((res) =>
              chrome.history.deleteUrl({ url: item.url! }, res)
            );
          });
        Promise.all(deletePromises).then(() => resolve());
      }
    );
  });
};

export const getCurrentTabUrl = async (): Promise<string | null> => {
  if (isDev()) {
    return 'https://example.com';
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url || null;
};

// Extend Window interface for mock data
interface WindowWithMocks extends Window {
  __mockIgnoreList?: IgnoreListSettings;
}

// Ignore List Management
export const loadIgnoreList = async (): Promise<IgnoreListSettings> => {
  if (isDev()) {
    // Return mock data in dev mode
    const mockData = (window as WindowWithMocks).__mockIgnoreList;
    if (mockData) return mockData;
    return { items: [] };
  }

  return new Promise((resolve) => {
    chrome.storage.local.get(['ignoreList'], (result) => {
      const ignoreList = result.ignoreList as IgnoreListSettings | undefined;
      resolve(ignoreList || { items: [] });
    });
  });
};

export const saveIgnoreList = async (
  ignoreList: IgnoreListSettings
): Promise<void> => {
  if (isDev()) {
    console.log('[DEV] Saving ignore list:', ignoreList);
    (window as WindowWithMocks).__mockIgnoreList = ignoreList;
    return;
  }

  return new Promise((resolve) => {
    chrome.storage.local.set({ ignoreList }, resolve);
  });
};

export const addToIgnoreList = async (url: string): Promise<void> => {
  const ignoreList = await loadIgnoreList();
  const normalizedUrl = url.trim();

  // Check if already exists
  if (ignoreList.items.some((item) => item.url === normalizedUrl)) {
    return; // Already in list
  }

  ignoreList.items.push({
    url: normalizedUrl,
    addedAt: Date.now(),
  });

  await saveIgnoreList(ignoreList);
};

export const removeFromIgnoreList = async (url: string): Promise<void> => {
  const ignoreList = await loadIgnoreList();
  ignoreList.items = ignoreList.items.filter((item) => item.url !== url);
  await saveIgnoreList(ignoreList);
};

export const importIgnoreListFromText = async (
  text: string
): Promise<number> => {
  const ignoreList = await loadIgnoreList();
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let addedCount = 0;
  for (const line of lines) {
    // Skip if already exists
    if (!ignoreList.items.some((item) => item.url === line)) {
      ignoreList.items.push({
        url: line,
        addedAt: Date.now(),
      });
      addedCount++;
    }
  }

  await saveIgnoreList(ignoreList);
  return addedCount;
};
