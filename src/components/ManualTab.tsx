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
        />

        <ActionButton
          title="Downloads"
          description="Removes download history"
          icon={<DownloadIcon size={24} />}
          onClick={() =>
            onAction('downloads', () => clearDownloadHistory(timeRange))
          }
          variant="info"
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
        />

        <ActionButton
          title="Everything"
          description="Cookies, cache, history, downloads..."
          icon={<TrashIcon size={24} />}
          onClick={() =>
            onAction('everything', () => clearEverything(timeRange))
          }
          variant="danger"
        />
      </div>
    </div>
  );
};

export default ManualTab;
