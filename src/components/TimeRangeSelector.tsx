import React from 'react';

interface TimeRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
}) => {
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
        Time Range
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
          <option value="last_hour">Last Hour</option>
          <option value="last_24h">Last 24 Hours</option>
          <option value="last_7days">Last 7 Days</option>
          <option value="last_4weeks">Last 4 Weeks</option>
          <option value="all_time">All Time</option>
        </select>
        <div
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default TimeRangeSelector;
