import ActionButton from './ActionButton';
import TimeRangeSelector from './TimeRangeSelector';
import {
  HistoryIcon,
  DownloadIcon,
  TrashIcon,
  HistoryDownloadIcon,
} from './Icons';
import {
  clearBrowserHistory,
  clearDownloadHistory,
  clearEverything,
  clearHistoryAndDownloads,
  type TimeRange,
} from '../utils/chrome-api';

interface ManualTabProps {
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange) => void;
  onAction: (actionName: string, actionFn: () => Promise<void>) => void;
}

const ManualTab = ({
  timeRange,
  onTimeRangeChange,
  onAction,
}: ManualTabProps) => {
  // // Detect OS for keyboard shortcuts
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? 'Cmd' : 'Ctrl';

  const handleClearEverything = () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear EVERYTHING?\n\n' +
        'This will remove:\n' +
        '• All browsing history\n' +
        "• All cookies (you'll be logged out)\n" +
        '• All cache and stored data\n' +
        '• All saved passwords\n' +
        '• All form data\n\n' +
        'This action cannot be undone!'
    );

    if (confirmed) {
      onAction('everything', () => clearEverything(timeRange));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <TimeRangeSelector
        value={timeRange}
        onChange={(v) => onTimeRangeChange(v as TimeRange)}
      />

      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}
      >
        <ActionButton
          title="History"
          description="Removes visited pages history"
          icon={<HistoryIcon size={24} />}
          onClick={() =>
            onAction('history', () => clearBrowserHistory(timeRange))
          }
          variant="primary"
          shortcut={`${modKey}+Shift+6`}
        />

        <ActionButton
          title="Downloads"
          description="Removes download history"
          icon={<DownloadIcon size={24} />}
          onClick={() =>
            onAction('downloads', () => clearDownloadHistory(timeRange))
          }
          variant="info"
          shortcut={`${modKey}+Shift+7`}
        />

        <ActionButton
          title="History + DL"
          description="Removes history and downloads only"
          icon={<HistoryDownloadIcon size={24} />}
          onClick={() =>
            onAction('history + downloads', () =>
              clearHistoryAndDownloads(timeRange)
            )
          }
          variant="primary"
          shortcut={`${modKey}+Shift+8`}
        />

        <ActionButton
          title="Everything"
          description="Cookies, cache, history, downloads..."
          icon={<TrashIcon size={24} />}
          onClick={handleClearEverything}
          variant="danger"
        />
      </div>
    </div>
  );
};

export default ManualTab;
