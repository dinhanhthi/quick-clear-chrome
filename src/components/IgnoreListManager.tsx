import { useState, useEffect } from 'react';
import {
  loadIgnoreList,
  addToIgnoreList,
  removeFromIgnoreList,
  importIgnoreListFromText,
  type IgnoreListItem,
} from '../utils/chrome-api';
import { TrashIcon } from './Icons';

const IgnoreListManager = () => {
  const [items, setItems] = useState<IgnoreListItem[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Load ignore list on mount
  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    setIsLoading(true);
    try {
      const ignoreList = await loadIgnoreList();
      setItems(ignoreList.items);
    } catch {
      console.error('Failed to load ignore list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    try {
      await addToIgnoreList(newUrl.trim());
      setNewUrl('');
      await loadList();
      showMessage('Added to ignore list', 'success');
    } catch {
      showMessage('Failed to add URL', 'error');
    }
  };

  const handleRemove = async (url: string) => {
    try {
      await removeFromIgnoreList(url);
      await loadList();
      showMessage('Removed from ignore list', 'success');
    } catch {
      showMessage('Failed to remove URL', 'error');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const addedCount = await importIgnoreListFromText(text);
      await loadList();
      showMessage(
        `Imported ${addedCount} URL${addedCount !== 1 ? 's' : ''}`,
        'success'
      );
    } catch {
      showMessage('Failed to import file', 'error');
    }

    // Reset file input
    e.target.value = '';
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '0 4px',
      }}
    >
      <div
        style={{
          padding: '10px',
          backgroundColor: 'var(--muted)',
          borderRadius: 'var(--radius)',
          fontSize: '12px',
          color: 'var(--muted-foreground)',
          lineHeight: 1.5,
        }}
      >
        <strong>How it works:</strong> URLs in this list will be excluded when
        clearing history. Supports exact URLs, domains (e.g.,{' '}
        <code>example.com</code>), or full URLs (e.g.,{' '}
        <code>https://example.com</code>).
      </div>

      {/* Add URL Form */}
      <form
        onSubmit={handleAdd}
        style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
      >
        <input
          type="text"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="example.com or https://example.com"
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--background)',
            color: 'var(--foreground)',
            fontSize: '13px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={!newUrl.trim()}
          style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius)',
            border: 'none',
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: newUrl.trim() ? 'pointer' : 'not-allowed',
            opacity: newUrl.trim() ? 1 : 0.5,
            whiteSpace: 'nowrap',
          }}
        >
          Add
        </button>
      </form>

      {/* Import from file */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <label
          htmlFor="import-file"
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-color)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = 'var(--muted)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = 'var(--card-bg)')
          }
        >
          📄 Import from .txt
        </label>
        <input
          id="import-file"
          type="file"
          accept=".txt"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
        <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
          (one URL per line)
        </span>
      </div>

      {/* Status Message */}
      {message && (
        <div
          style={{
            padding: '8px',
            borderRadius: 'var(--radius)',
            fontSize: '12px',
            fontWeight: 500,
            backgroundColor:
              message.type === 'success'
                ? 'rgba(34, 197, 94, 0.1)'
                : 'rgba(239, 68, 68, 0.1)',
            color:
              message.type === 'success'
                ? 'var(--status-text)'
                : 'var(--status-error)',
            textAlign: 'center',
          }}
        >
          {message.text}
        </div>
      )}

      {/* List of URLs */}
      <div
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          maxHeight: '200px',
          overflowY: 'auto',
        }}
      >
        {isLoading ? (
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              fontSize: '13px',
              color: 'var(--muted-foreground)',
            }}
          >
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              fontSize: '13px',
              color: 'var(--muted-foreground)',
            }}
          >
            No URLs in ignore list
          </div>
        ) : (
          <div>
            {items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderBottom:
                    index < items.length - 1
                      ? '1px solid var(--border-color)'
                      : 'none',
                  backgroundColor: 'var(--card-bg)',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'var(--muted)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'var(--card-bg)')
                }
              >
                <div
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--foreground)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={item.url}
                  >
                    {item.url}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--muted-foreground)',
                      marginTop: '2px',
                    }}
                  >
                    Added {formatDate(item.addedAt)}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(item.url)}
                  style={{
                    marginLeft: '8px',
                    padding: '6px',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'transparent',
                    color: 'var(--muted-foreground)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.color = 'var(--status-error)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--muted-foreground)';
                  }}
                  title="Remove from ignore list"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          fontSize: '11px',
          color: 'var(--muted-foreground)',
          textAlign: 'center',
        }}
      >
        {items.length} URL{items.length !== 1 ? 's' : ''} in ignore list
      </div>
    </div>
  );
};

export default IgnoreListManager;
