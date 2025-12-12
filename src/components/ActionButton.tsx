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
  // Common style for all buttons to look like shadcn cards/items
  const btnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '12px',
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--card-bg)',
    color: 'var(--text-color)',
    border: '1px solid var(--border-color)',
    transition: 'background-color 0.2s',
    marginBottom: '8px',
    textAlign: 'left',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    pointerEvents: disabled ? 'none' : 'auto',
  };

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
    >
      <div
        style={{
          marginRight: '12px',
          display: 'flex',
          color: 'var(--primary)',
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 500, fontSize: '14px' }}>{title}</div>
        {description && (
          <div
            style={{
              fontSize: '12px',
              color: 'var(--muted-foreground)',
              marginTop: '2px',
            }}
          >
            {description}
          </div>
        )}
      </div>
    </button>
  );
};

export default ActionButton;
