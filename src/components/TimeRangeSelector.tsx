import React from 'react';
import { useTranslation } from 'react-i18next';

interface TimeRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();

  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 500,
          marginBottom: '6px',
          color: 'var(--text-color)',
        }}
      >
        {t('timeRange.label')}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-color)',
            fontSize: '14px',
            appearance: 'none',
            outline: 'none',
          }}
        >
          <option value="last_hour">{t('timeRange.lastHour')}</option>
          <option value="last_24h">{t('timeRange.last24h')}</option>
          <option value="last_7days">{t('timeRange.last7days')}</option>
          <option value="last_4weeks">{t('timeRange.last4weeks')}</option>
          <option value="all_time">{t('timeRange.allTime')}</option>
        </select>
      </div>
    </div>
  );
};

export default TimeRangeSelector;
