import { useState, useEffect } from 'react';
import type { AutoClearSettings } from '../utils/chrome-api';
import TimeRangeSelector from './TimeRangeSelector';

const AutoTab = () => {
  const [settings, setSettings] = useState<AutoClearSettings>({
    enabled: false,
    interval: 60,
    unit: 'minute',
    timeRange: 'last_hour',
    clearHistory: true,
    clearDownloads: false,
  });

  useEffect(() => {
    // Load settings from storage
    chrome.storage.local.get(['autoClearSettings'], (result) => {
      if (result.autoClearSettings) {
        setSettings(result.autoClearSettings as AutoClearSettings);
      }
    });
  }, []);

  const saveSettings = (newSettings: AutoClearSettings) => {
    setSettings(newSettings);
    chrome.storage.local.set({ autoClearSettings: newSettings }, () => {
      // Notify background script to update alarms?
      // Or just let background script listen to storage changes (if that works reliably for alarms)
      // Usually better to sendMessage or rely on storage.onChanged in background
    });
  };

  const handleUnitChange = (unit: 'minute' | 'hour' | 'day') => {
    saveSettings({ ...settings, unit });
  };

  const handleIntervalChange = (val: number) => {
    saveSettings({ ...settings, interval: val });
  };

  const toggleEnabled = () => {
    saveSettings({ ...settings, enabled: !settings.enabled });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '0 4px',
        color: 'var(--foreground)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontWeight: 600 }}>Enable Auto Clear</span>
        <label className="switch">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={toggleEnabled}
          />
          <span className="slider round"></span>
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: 500 }}>Frequency</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="number"
            min="1"
            value={settings.interval}
            onChange={(e) =>
              handleIntervalChange(parseInt(e.target.value) || 1)
            }
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              width: '60px',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
            }}
            disabled={!settings.enabled}
          />
          <select
            value={settings.unit}
            onChange={(e) => handleUnitChange(e.target.value as any)}
            style={{
              flex: 1,
              padding: '6px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
            }}
            disabled={!settings.enabled}
          >
            <option value="minute">Minute(s)</option>
            <option value="hour">Hour(s)</option>
            <option value="day">Day(s)</option>
          </select>
        </div>
      </div>

      <TimeRangeSelector
        value={settings.timeRange}
        onChange={(v) => saveSettings({ ...settings, timeRange: v as any })}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: 500 }}>
          What to clear?
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
            }}
          >
            <input
              type="checkbox"
              checked={settings.clearHistory}
              onChange={(e) =>
                saveSettings({ ...settings, clearHistory: e.target.checked })
              }
              disabled={!settings.enabled}
            />
            Browser History
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
            }}
          >
            <input
              type="checkbox"
              checked={settings.clearDownloads}
              onChange={(e) =>
                saveSettings({ ...settings, clearDownloads: e.target.checked })
              }
              disabled={!settings.enabled}
            />
            Downloads
          </label>
        </div>
      </div>

      {settings.enabled && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px',
            backgroundColor: 'var(--muted)',
            borderRadius: '6px',
            fontSize: '11px',
            color: 'var(--muted-foreground)',
          }}
        >
          Next cleanup will happen based on the set interval. (Note: Browser
          must be open)
        </div>
      )}

      <style>{`
        .switch {
          position: relative;
          display: inline-block;
          width: 34px;
          height: 20px;
        }
        .switch input { 
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          -webkit-transition: .4s;
          transition: .4s;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          -webkit-transition: .4s;
          transition: .4s;
        }
        input:checked + .slider {
          background-color: #2196F3;
        }
        input:focus + .slider {
          box-shadow: 0 0 1px #2196F3;
        }
        input:checked + .slider:before {
          -webkit-transform: translateX(14px);
          -ms-transform: translateX(14px);
          transform: translateX(14px);
        }
        .slider.round {
          border-radius: 34px;
        }
        .slider.round:before {
          border-radius: 50%;
        }
        @media (prefers-color-scheme: dark) {
            .slider { background-color: #4a4a4a; }
            input:checked + .slider { background-color: #4CAF50; } /* Green for active */
        }
      `}</style>
    </div>
  );
};

export default AutoTab;
