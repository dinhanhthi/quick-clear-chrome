import { useState, useEffect } from 'react';
import ManualTab from './components/ManualTab';
import AutoTab from './components/AutoTab';
import SiteDataCleaner from './components/SiteDataCleaner';
import { GitHubIcon } from './components/Icons';
import {
  clearSiteData,
  clearSiteHistoryAndDownloads,
  getCurrentTabUrl,
  type TimeRange,
  type AutoClearSettings,
} from './utils/chrome-api';
import packageJson from '../package.json';

function App() {
  const [activeTab, setActiveTab] = useState<'manual' | 'auto'>('manual');
  const [timeRange, setTimeRange] = useState<TimeRange>('last_hour');

  // Footer state
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [lastRun, setLastRun] = useState<number | null>(null);
  const [nextRun, setNextRun] = useState<number | null>(null);

  type StatusType = 'success' | 'error' | 'info';
  const [status, setStatus] = useState<{
    message: string;
    type: StatusType;
  } | null>(null);

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
    if (!timestamp) return 'Never';
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
    setStatus({ message: 'Getting current site...', type: 'info' });
    const url = await getCurrentTabUrl();
    if (!url) {
      setStatus({ message: 'Could not get current site.', type: 'error' });
      setTimeout(() => setStatus(null), 2000);
      return;
    }

    const hostname = new URL(url).hostname;
    const dataType = onlyHistoryDownload
      ? 'history and downloads'
      : 'all data (cookies, cache, history, etc.)';
    const confirmed = window.confirm(
      `Are you sure you want to clear ${dataType} for "${hostname}"?`
    );

    if (!confirmed) {
      setStatus(null);
      return;
    }

    const actionName = onlyHistoryDownload
      ? `history and downloads for ${hostname}`
      : `site data for ${hostname}`;
    const clearFn = onlyHistoryDownload
      ? () => clearSiteHistoryAndDownloads(url)
      : () => clearSiteData(url);
    await handleAction(actionName, clearFn);
  };

  const handleAction = async (
    actionName: string,
    actionFn: () => Promise<void>
  ) => {
    setStatus({ message: `Cleaning ${actionName}...`, type: 'info' });
    try {
      await actionFn();
      setStatus({
        message: `Successfully cleared ${actionName}!`,
        type: 'success',
      });
      setTimeout(() => setStatus(null), 2000);
    } catch (error) {
      console.error(error);
      setStatus({ message: 'Error occurred.', type: 'error' });
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
        <a
          href="https://github.com/dinhanhthi/quick-clear-chrome"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            color: 'var(--foreground)',
            opacity: 0.6,
            transition: 'opacity 0.2s',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
        >
          <GitHubIcon size={18} />
        </a>
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
            flex: 1,
            padding: '8px',
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
          }}
        >
          Manual
        </button>
        <button
          onClick={() => setActiveTab('auto')}
          style={{
            flex: 1,
            padding: '8px',
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
          }}
        >
          Auto
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
                ? `history and downloads for ${domain}`
                : `site data for ${domain}`;
              const clearFn = onlyHistoryDownload
                ? () => clearSiteHistoryAndDownloads(domain)
                : () => clearSiteData(domain);
              handleAction(actionName, clearFn);
            }}
            onCurrentSite={handleClearCurrentSite}
          />
        </>
      ) : (
        <AutoTab />
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
            }}
          >
            Auto Clean ON
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: 'var(--muted-foreground)',
            }}
          >
            <span>Last: {formatTime(lastRun)}</span>
            <span>
              Next: {nextRun ? formatTime(nextRun) : 'Calculating...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
