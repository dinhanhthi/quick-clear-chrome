import React from 'react';

interface ActionButtonProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'warning' | 'info';
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  description,
  icon,
  onClick,
  disabled = false,
}) => {
  const btnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'start',
    gap: '4px',
    flexDirection: 'row',
    width: '100%',
    height: 'auto',
    padding: '10px',
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--card-bg)',
    color: 'var(--text-color)',
    border: '1px solid var(--border-color)',
    transition: 'background-color 0.2s',
    marginBottom: '0',
    textAlign: 'center',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    pointerEvents: disabled ? 'none' : 'auto',
  };

  const iconWithFixedSize = React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<any>, { size: 20 })
    : icon;

  return (
    <button
      onClick={onClick}
      style={btnStyle}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = 'var(--muted)')
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = 'var(--card-bg)')
      }
      className="action-btn"
      title={`${title}${description ? ' - ' + description : ''}`}
    >
      <div
        style={{
          marginRight: '6px',
          marginBottom: '4px',
          display: 'flex',
          color: 'var(--primary)',
        }}
      >
        {iconWithFixedSize}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.2 }}>
        {title.replace('Clear ', '')}
      </div>
    </button>
  );
};

export default ActionButton;
