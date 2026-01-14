import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import vi from './locales/vi.json';
import fr from './locales/fr.json';

// Get saved language from chrome storage or default to 'en'
const getSavedLanguage = async (): Promise<string> => {
  if (chrome?.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['language'], (result) => {
        resolve((result.language as string) || 'en');
      });
    });
  }
  return 'en';
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vi: { translation: vi },
    fr: { translation: fr },
  },
  lng: 'en', // Will be updated after initialization
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

// Load saved language after initialization
getSavedLanguage().then((lng) => {
  if (lng !== 'en') {
    i18n.changeLanguage(lng);
  }
});

export default i18n;
