import React, { useState } from 'react';
import { SiteIcon } from './Icons';

interface SiteDataCleanerProps {
  onClean: (domain: string, onlyHistoryDownload: boolean) => void;
  onCurrentSite?: (onlyHistoryDownload: boolean) => void;
}

const SiteDataCleaner: React.FC<SiteDataCleanerProps> = ({
  onClean,
  onCurrentSite,
}) => {
  const [domain, setDomain] = useState('');
  const [onlyHistoryDownload, setOnlyHistoryDownload] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (domain.trim()) {
      onClean(domain.trim(), onlyHistoryDownload);
      setDomain('');
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--card-bg)',
        padding: '12px',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius)',
        marginTop: '16px',
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}
      >
        <SiteIcon size={16} />
        <span style={{ fontWeight: 500, fontSize: '13px', marginLeft: '8px' }}>
          Specific Site Cleaner
        </span>
      </div>

      {/* Toggle for history/download only */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '8px',
          margin: '10px 0',
        }}
      >
        <label className="switch">
          <input
            type="checkbox"
            checked={onlyHistoryDownload}
            onChange={(e) => setOnlyHistoryDownload(e.target.checked)}
          />
          <span className="slider round"></span>
        </label>
        <span style={{ fontSize: '12px', color: 'var(--text-color)' }}>
          Only history and download
        </span>
      </div>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
      >
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="example.com"
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-color)',
            fontSize: '14px',
            backgroundColor: 'var(--bg-color)',
            color: 'var(--text-color)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="submit"
            disabled={!domain.trim()}
            style={{
              flex: 1,
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
              padding: '8px 16px',
              borderRadius: 'var(--radius)',
              fontSize: '13px',
              fontWeight: 500,
              opacity: domain.trim() ? 1 : 0.5,
              border: 'none',
              cursor: domain.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Clean
          </button>

          {onCurrentSite && (
            <button
              type="button"
              onClick={() => onCurrentSite(onlyHistoryDownload)}
              style={{
                flex: 1,
                fontSize: '13px',
                padding: '8px 16px',
                backgroundColor: 'var(--muted)',
                color: 'var(--text-color)',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Current Site
            </button>
          )}
        </div>
      </form>

      <style>{`
        .switch {
          position: relative;
          display: inline-block;
          width: 26px;
          height: 14px;
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
          height: 10px;
          width: 10px;
          left: 2px;
          bottom: 2px;
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
          -webkit-transform: translateX(12px);
          -ms-transform: translateX(12px);
          transform: translateX(12px);
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

export default SiteDataCleaner;
