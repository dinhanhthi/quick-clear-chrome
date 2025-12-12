import type { AutoClearSettings } from './chrome-api';

// Mock storage for chrome.storage.local
const mockStorage: Record<string, any> = {
  autoClearSettings: {
    enabled: true,
    interval: 30,
    unit: 'minute',
    timeRange: 'last_hour',
    clearHistory: true,
    clearDownloads: true,
    clearEverything: false,
  } as AutoClearSettings,
  lastAutoClearTime: Date.now() - 15 * 60 * 1000, // 15 minutes ago
};

// Mock alarms
const mockAlarms: Record<string, chrome.alarms.Alarm> = {
  'auto-clear-alarm': {
    name: 'auto-clear-alarm',
    scheduledTime: Date.now() + 15 * 60 * 1000, // 15 minutes from now
    periodInMinutes: 30,
  },
};

// Storage change listeners
const storageListeners: Array<
  (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => void
> = [];

// Mock chrome.storage.local
export const mockChromeStorageLocal = {
  get: (
    keys: string | string[] | null,
    callback: (items: { [key: string]: any }) => void
  ) => {
    console.log('[MOCK] chrome.storage.local.get', keys);
    const result: { [key: string]: any } = {};
    
    if (keys === null) {
      Object.assign(result, mockStorage);
    } else if (typeof keys === 'string') {
      if (mockStorage[keys] !== undefined) {
        result[keys] = mockStorage[keys];
      }
    } else {
      keys.forEach((key) => {
        if (mockStorage[key] !== undefined) {
          result[key] = mockStorage[key];
        }
      });
    }
    
    setTimeout(() => callback(result), 10);
  },

  set: (items: { [key: string]: any }, callback?: () => void) => {
    console.log('[MOCK] chrome.storage.local.set', items);
    const changes: { [key: string]: chrome.storage.StorageChange } = {};
    
    Object.keys(items).forEach((key) => {
      changes[key] = {
        oldValue: mockStorage[key],
        newValue: items[key],
      };
      mockStorage[key] = items[key];
    });
    
    // Notify listeners
    storageListeners.forEach((listener) => {
      listener(changes, 'local');
    });
    
    if (callback) setTimeout(callback, 10);
  },
};

// Mock chrome.storage
export const mockChromeStorage = {
  local: mockChromeStorageLocal,
  onChanged: {
    addListener: (
      callback: (
        changes: { [key: string]: chrome.storage.StorageChange },
        area: string
      ) => void
    ) => {
      console.log('[MOCK] chrome.storage.onChanged.addListener');
      storageListeners.push(callback);
    },
    removeListener: (
      callback: (
        changes: { [key: string]: chrome.storage.StorageChange },
        area: string
      ) => void
    ) => {
      console.log('[MOCK] chrome.storage.onChanged.removeListener');
      const index = storageListeners.indexOf(callback);
      if (index > -1) {
        storageListeners.splice(index, 1);
      }
    },
  },
};

// Mock chrome.alarms
export const mockChromeAlarms = {
  get: (name: string, callback: (alarm?: chrome.alarms.Alarm) => void) => {
    console.log('[MOCK] chrome.alarms.get', name);
    setTimeout(() => callback(mockAlarms[name]), 10);
  },

  create: (name: string, alarmInfo: chrome.alarms.AlarmCreateInfo) => {
    console.log('[MOCK] chrome.alarms.create', name, alarmInfo);
    mockAlarms[name] = {
      name,
      scheduledTime: alarmInfo.when || Date.now() + (alarmInfo.delayInMinutes || 0) * 60 * 1000,
      periodInMinutes: alarmInfo.periodInMinutes,
    };
  },

  clear: (name: string, callback?: (wasCleared: boolean) => void) => {
    console.log('[MOCK] chrome.alarms.clear', name);
    const existed = !!mockAlarms[name];
    delete mockAlarms[name];
    if (callback) setTimeout(() => callback(existed), 10);
  },
};

// Mock chrome.tabs
export const mockChromeTabs = {
  query: async (
    queryInfo: chrome.tabs.QueryInfo
  ): Promise<chrome.tabs.Tab[]> => {
    console.log('[MOCK] chrome.tabs.query', queryInfo);
    return [
      {
        id: 1,
        url: 'https://example.com',
        title: 'Example Domain',
        active: true,
        windowId: 1,
        index: 0,
        pinned: false,
        highlighted: false,
        incognito: false,
        selected: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1,
        frozen: false,
      },
    ];
  },
};

// Mock chrome.browsingData
export const mockChromeBrowsingData = {
  removeHistory: (options: chrome.browsingData.RemovalOptions, callback?: () => void) => {
    console.log('[MOCK] chrome.browsingData.removeHistory', options);
    if (callback) setTimeout(callback, 100);
  },

  removeDownloads: (options: chrome.browsingData.RemovalOptions, callback?: () => void) => {
    console.log('[MOCK] chrome.browsingData.removeDownloads', options);
    if (callback) setTimeout(callback, 100);
  },

  remove: (
    options: chrome.browsingData.RemovalOptions,
    dataToRemove: chrome.browsingData.DataTypeSet,
    callback?: () => void
  ) => {
    console.log('[MOCK] chrome.browsingData.remove', options, dataToRemove);
    if (callback) setTimeout(callback, 100);
  },
};

// Mock chrome.history
export const mockChromeHistory = {
  search: (
    query: chrome.history.HistoryQuery,
    callback: (results: chrome.history.HistoryItem[]) => void
  ) => {
    console.log('[MOCK] chrome.history.search', query);
    // Return some mock history items
    const mockResults: chrome.history.HistoryItem[] = [
      {
        id: '1',
        url: 'https://example.com/page1',
        title: 'Example Page 1',
        lastVisitTime: Date.now() - 1000 * 60 * 5,
        visitCount: 3,
        typedCount: 1,
      },
      {
        id: '2',
        url: 'https://example.com/page2',
        title: 'Example Page 2',
        lastVisitTime: Date.now() - 1000 * 60 * 10,
        visitCount: 1,
        typedCount: 0,
      },
    ];
    setTimeout(() => callback(mockResults), 50);
  },

  deleteUrl: (details: { url: string }, callback?: () => void) => {
    console.log('[MOCK] chrome.history.deleteUrl', details);
    if (callback) setTimeout(callback, 50);
  },
};

// Mock chrome.runtime
export const mockChromeRuntime = {
  lastError: undefined as chrome.runtime.LastError | undefined,
};

// Install mock Chrome APIs globally
export function installMockChromeAPIs() {
  if (typeof window !== 'undefined') {
    console.log('[MOCK] Installing mock Chrome APIs');
    // Force install mocks even if chrome object exists
    (window as any).chrome = {
      storage: mockChromeStorage,
      alarms: mockChromeAlarms,
      tabs: mockChromeTabs,
      browsingData: mockChromeBrowsingData,
      history: mockChromeHistory,
      runtime: mockChromeRuntime,
    };
  }
}
