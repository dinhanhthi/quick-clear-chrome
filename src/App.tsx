import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ManualTab from './components/ManualTab';
import AutoTab from './components/AutoTab';
import SiteDataCleaner from './components/SiteDataCleaner';
import IgnoreListManager from './components/IgnoreListManager';
import LanguageSelector from './components/LanguageSelector';
import {
  GitHubIcon,
  SunIcon,
  MoonIcon,
  KeyboardIcon,
} from './components/Icons';
import {
  clearSiteData,
  clearSiteHistoryAndDownloads,
  getCurrentTabUrl,
  type TimeRange,
  type AutoClearSettings,
} from './utils/chrome-api';

interface ManualSettings {
  timeRange: TimeRange;
}
import { useTheme } from './utils/useTheme';
import packageJson from '../package.json';

function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'manual' | 'auto' | 'ignore'>(
    'manual'
  );
  const [timeRange, setTimeRange] = useState<TimeRange>('last_hour');
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  // Footer state
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [lastRun, setLastRun] = useState<number | null>(null);
  const [nextRun, setNextRun] = useState<number | null>(null);

  type StatusType = 'success' | 'error' | 'info';
  const [status, setStatus] = useState<{
    message: string;
    type: StatusType;
  } | null>(null);

  // Load saved manual settings on mount
  useEffect(() => {
    if (chrome?.storage?.local) {
      chrome.storage.local.get(['manualSettings'], (result) => {
        if (result.manualSettings) {
          const settings = result.manualSettings as ManualSettings;
          setTimeRange(settings.timeRange);
        }
      });
    }
  }, []);

  // Save manual settings when time range changes
  useEffect(() => {
    if (chrome?.storage?.local) {
      const settings: ManualSettings = { timeRange };
      chrome.storage.local.set({ manualSettings: settings });
    }
  }, [timeRange]);

  useEffect(() => {
    const loadFooterData = () => {
      // Check if Chrome APIs are available
      if (!chrome?.storage?.local) {
        console.warn('Chrome storage API not available yet');
        return;
      }

      // Check settings
      chrome.storage.local.get(
        ['autoClearSettings', 'lastAutoClearTime'],
        (result) => {
          const settings = result.autoClearSettings as AutoClearSettings;
          if (settings) {
            setAutoEnabled(settings.enabled);
          } else {
            setAutoEnabled(false); // Ensure it's false if settings don't exist
          }
          if (result.lastAutoClearTime) {
            setLastRun(result.lastAutoClearTime as number);
          } else {
            setLastRun(null);
          }
        }
      );

      // Check alarm
      if (chrome?.alarms?.get) {
        chrome.alarms.get('auto-clear-alarm', (alarm) => {
          if (alarm) {
            setNextRun(alarm.scheduledTime);
          } else {
            setNextRun(null);
          }
        });
      }
    };

    loadFooterData();

    // Listen for changes to update UI immediately
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area === 'local') {
        if (changes.autoClearSettings || changes.lastAutoClearTime) {
          loadFooterData();
        }
      }
    };

    if (chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    return () => {
      if (chrome?.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, []);

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return t('status.never');
    // If today, show time only, else show date + time
    const date = new Date(timestamp);
    const isToday = new Date().toDateString() === date.toDateString();
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      ...(isToday ? {} : { month: 'numeric', day: 'numeric' }),
    });
  };

  const handleClearCurrentSite = async (onlyHistoryDownload: boolean) => {
    setStatus({ message: t('status.gettingCurrentSite'), type: 'info' });
    const url = await getCurrentTabUrl();
    if (!url) {
      setStatus({ message: t('status.couldNotGetSite'), type: 'error' });
      setTimeout(() => setStatus(null), 2000);
      return;
    }

    const hostname = new URL(url).hostname;
    const dataType = onlyHistoryDownload
      ? t('siteData.dataTypeHistory')
      : t('siteData.dataTypeAll');
    const confirmed = window.confirm(
      t('siteData.confirmClear', { dataType, hostname })
    );

    if (!confirmed) {
      setStatus(null);
      return;
    }

    const actionName = onlyHistoryDownload
      ? `${t('manual.historyDL')} for ${hostname}`
      : `${t('siteData.title')} for ${hostname}`;
    const clearFn = onlyHistoryDownload
      ? () => clearSiteHistoryAndDownloads(url)
      : () => clearSiteData(url);
    await handleAction(actionName, clearFn);
  };

  const handleAction = async (
    actionName: string,
    actionFn: () => Promise<void>
  ) => {
    setStatus({ message: t('status.cleaning', { actionName }), type: 'info' });
    try {
      await actionFn();
      setStatus({
        message: t('status.cleared', { actionName }),
        type: 'success',
      });
      setTimeout(() => setStatus(null), 2000);
    } catch (error) {
      console.error(error);
      setStatus({ message: t('status.error'), type: 'error' });
      setTimeout(() => setStatus(null), 2000);
    }
  };

  return (
    <div
      className="container"
      style={{
        gap: '8px',
        paddingBottom: autoEnabled ? '60px' : '16px',
        position: 'relative',
        minHeight: '400px',
        backgroundColor: 'var(--bg-color)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="/icons/icon-48.png"
            alt="Quick Clear Logo"
            style={{
              width: '24px',
              height: '24px',
            }}
          />
          <h1
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              letterSpacing: '-0.5px',
              whiteSpace: 'nowrap',
            }}
          >
            Quick Clear
          </h1>
          <span
            style={{
              fontSize: '10px',
              backgroundColor: 'var(--muted)',
              color: 'var(--muted-foreground)',
              padding: '2px 6px',
              borderRadius: '999px',
              fontWeight: 500,
            }}
          >
            v{packageJson.version}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              color: 'var(--text-color)',
              opacity: 0.6,
              transition: 'opacity 0.2s',
              cursor: 'pointer',
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
            title={t('header.modifyShortcuts')}
          >
            <KeyboardIcon size={18} />
          </button>
          <LanguageSelector />
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              color: 'var(--text-color)',
              opacity: 0.6,
              transition: 'opacity 0.2s',
              cursor: 'pointer',
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
            title={`Theme: ${theme === 'system' ? `${t('header.themeSystem')} (${resolvedTheme})` : theme}`}
          >
            {resolvedTheme === 'light' ? (
              <MoonIcon size={18} />
            ) : (
              <SunIcon size={18} />
            )}
          </button>
          <a
            href="https://github.com/dinhanhthi/quick-clear-chrome"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-color)',
              opacity: 0.6,
              transition: 'opacity 0.2s',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
          >
            <GitHubIcon size={18} />
          </a>
        </div>
      </header>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '12px',
        }}
      >
        <button
          onClick={() => setActiveTab('manual')}
          style={{
            padding: '8px 16px',
            background: 'none',
            border: 'none',
            borderBottom:
              activeTab === 'manual'
                ? '2px solid var(--primary)'
                : '2px solid transparent',
            color:
              activeTab === 'manual'
                ? 'var(--foreground)'
                : 'var(--muted-foreground)',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {t('tabs.manual')}
        </button>
        <button
          onClick={() => setActiveTab('auto')}
          style={{
            padding: '8px 16px',
            background: 'none',
            border: 'none',
            borderBottom:
              activeTab === 'auto'
                ? '2px solid var(--primary)'
                : '2px solid transparent',
            color:
              activeTab === 'auto'
                ? 'var(--foreground)'
                : 'var(--muted-foreground)',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          {t('tabs.auto')}
          {autoEnabled && (
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#4CAF50',
                display: 'inline-block',
              }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('ignore')}
          style={{
            padding: '8px 16px',
            background: 'none',
            border: 'none',
            borderBottom:
              activeTab === 'ignore'
                ? '2px solid var(--primary)'
                : '2px solid transparent',
            color:
              activeTab === 'ignore'
                ? 'var(--foreground)'
                : 'var(--muted-foreground)',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {t('tabs.ignoreList')}
        </button>
      </div>

      {activeTab === 'manual' ? (
        <>
          <ManualTab
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            onAction={handleAction}
          />
          <SiteDataCleaner
            onClean={(domain, onlyHistoryDownload) => {
              const actionName = onlyHistoryDownload
                ? `${t('manual.historyDL')} for ${domain}`
                : `${t('siteData.title')} for ${domain}`;
              const clearFn = onlyHistoryDownload
                ? () => clearSiteHistoryAndDownloads(domain)
                : () => clearSiteData(domain);
              handleAction(actionName, clearFn);
            }}
            onCurrentSite={handleClearCurrentSite}
          />
        </>
      ) : activeTab === 'auto' ? (
        <AutoTab />
      ) : (
        <IgnoreListManager />
      )}

      {status && (
        <div
          style={{
            fontSize: '12px',
            color:
              status.type === 'error'
                ? 'var(--status-error)'
                : status.type === 'success'
                  ? 'var(--status-text)'
                  : 'var(--muted-foreground)',
            fontWeight: 500,
            textAlign: 'center',
            marginTop: '6px',
            minHeight: '18px',
          }}
        >
          {status.message}
        </div>
      )}

      {autoEnabled && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'var(--card-bg)',
            borderTop: '1px solid var(--border-color)',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            fontSize: '11px',
            zIndex: 50,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'left',
              color: '#4CAF50',
              fontWeight: 600,
            }}
          >
            {t('status.autoCleanOn')}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: 'var(--muted-foreground)',
            }}
          >
            <span>
              {t('status.last')}: {formatTime(lastRun)}
            </span>
            <span>
              {t('status.next')}:{' '}
              {nextRun ? formatTime(nextRun) : t('status.calculating')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
