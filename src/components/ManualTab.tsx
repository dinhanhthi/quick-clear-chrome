import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  // // Detect OS for keyboard shortcuts
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? 'Cmd' : 'Ctrl';

  const handleClearEverything = () => {
    const confirmed = window.confirm(t('manual.confirmEverything'));

    if (confirmed) {
      onAction(t('manual.everything'), () => clearEverything(timeRange));
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
          title={t('manual.history')}
          description={t('manual.historyDesc')}
          icon={<HistoryIcon size={24} />}
          onClick={() =>
            onAction(t('manual.history'), () => clearBrowserHistory(timeRange))
          }
          variant="primary"
          shortcut={`${modKey}+Shift+6`}
        />

        <ActionButton
          title={t('manual.downloads')}
          description={t('manual.downloadsDesc')}
          icon={<DownloadIcon size={24} />}
          onClick={() =>
            onAction(t('manual.downloads'), () =>
              clearDownloadHistory(timeRange)
            )
          }
          variant="info"
          shortcut={`${modKey}+Shift+7`}
        />

        <ActionButton
          title={t('manual.historyDL')}
          description={t('manual.historyDLDesc')}
          icon={<HistoryDownloadIcon size={24} />}
          onClick={() =>
            onAction(t('manual.historyDL'), () =>
              clearHistoryAndDownloads(timeRange)
            )
          }
          variant="primary"
          shortcut={`${modKey}+Shift+8`}
        />

        <ActionButton
          title={t('manual.everything')}
          description={t('manual.everythingDesc')}
          icon={<TrashIcon size={24} />}
          onClick={handleClearEverything}
          variant="danger"
        />
      </div>
    </div>
  );
};

export default ManualTab;
