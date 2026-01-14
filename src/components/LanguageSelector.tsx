import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageIcon } from './Icons';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    if (chrome?.storage?.local) {
      chrome.storage.local.set({ language: langCode });
    }
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          color: 'var(--text-color)',
          opacity: 0.6,
          transition: 'opacity 0.2s',
          cursor: 'pointer',
          padding: 0,
          gap: '4px',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
        title={currentLanguage.name}
      >
        <LanguageIcon size={18} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            minWidth: '160px',
            overflow: 'hidden',
          }}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '10px 14px',
                border: 'none',
                backgroundColor:
                  currentLanguage.code === lang.code
                    ? 'var(--muted)'
                    : 'transparent',
                color: 'var(--text-color)',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                textAlign: 'left',
                fontWeight: currentLanguage.code === lang.code ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (currentLanguage.code !== lang.code) {
                  e.currentTarget.style.backgroundColor = 'var(--muted)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentLanguage.code !== lang.code) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{lang.flag}</span>
              <span>{lang.name}</span>
              {currentLanguage.code === lang.code && (
                <span
                  style={{
                    marginLeft: 'auto',
                    color: 'var(--primary)',
                    fontSize: '12px',
                  }}
                >
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
