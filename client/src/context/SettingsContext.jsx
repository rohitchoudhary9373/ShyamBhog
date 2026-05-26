import { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const SettingsContext = createContext();
export const useSettings = () => useContext(SettingsContext);

const DEFAULTS = {
  brandName: 'Shyam Bhog',
  footerText: 'Made with श्रद्धा by Shyam Bhog Team',
  copyrightText: '© 2026 Shyam Bhog Inc. All rights reserved.',
  aboutText: '',
  contactEmail: '',
  whatsapp: '',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  logoUrl: '',
  primaryColor: '#f97316',
  gstNumber: '',
  companyAddress: '',
  termsContent: '',
  privacyPolicy: '',
  refundPolicy: '',
  arjeeVideoUrl: '',
  crowdStatus: 'Low',
  parkingUrl: '',
  gstEnabled: false,
  taxRate: 18,
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULTS);

  const refreshSettings = async () => {
    try {
      const res = await API.get('/settings');
      if (res.data && typeof res.data === 'object') {
        setSettings({ ...DEFAULTS, ...res.data });
      }
    } catch (err) {
      console.warn('Could not load settings, using defaults.', err.message);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  useEffect(() => {
    if (settings?.primaryColor) {
      document.documentElement.style.setProperty('--primary', settings.primaryColor);
    }
  }, [settings?.primaryColor]);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
