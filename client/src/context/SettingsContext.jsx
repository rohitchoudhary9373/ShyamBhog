import { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const SettingsContext = createContext();
export const useSettings = () => useContext(SettingsContext);

const OFFICIAL_ABOUT = `Shyam Bhog is a premium digital devotional platform connecting devotees with the divine blessings of Shree Khatu Shyam Ji through trusted Bhog, Arjee, Prasad and spiritual seva services.\n\nBuilt with faith, transparency and authenticity, the platform offers a seamless devotional experience along with real-time crowd updates, hotel assistance, parking support and essential pilgrimage services for devotees worldwide.`;

const DEFAULTS = {
  brandName: 'Shyam Bhog',
  footerText: 'Made with श्रद्धा by Shyam Bhog Team',
  copyrightText: '© 2026 Shyam Bhog Inc. All rights reserved.',
  aboutText: OFFICIAL_ABOUT,
  contactEmail: 'Shyambhog.in@gmail.com',
  whatsapp: '6367793601',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  logoUrl: '/logo.png',
  primaryColor: '#f97316',
  gstNumber: '',
  companyAddress: 'Village - khatu Shyam ji, SIKAR, Rajasthan-332601 India',
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
      const urlParams = new URLSearchParams(window.location.search);
      let tenantId = urlParams.get('tenantId') || '';
      
      console.log(`[SettingsContext] Loading settings for tenantId: "${tenantId}"`);
      const res = await API.get(`/settings${tenantId ? `?tenantId=${tenantId}` : ''}`);
      if (res.data && typeof res.data === 'object') {
        console.log('[SettingsContext] Loaded settings successfully:', res.data);
        setSettings({
          ...DEFAULTS,
          ...res.data,
          aboutText: res.data?.aboutText || OFFICIAL_ABOUT,
          footerText: 'Made with श्रद्धा by Shyam Bhog Team',
          copyrightText: '© 2026 Shyam Bhog Inc. All rights reserved.',
          contactEmail: 'Shyambhog.in@gmail.com',
          whatsapp: '6367793601',
          companyAddress: 'Village - khatu Shyam ji, SIKAR, Rajasthan-332601 India'
        });
      }
    } catch (err) {
      console.warn('Could not load settings, using defaults.', err.message);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const primaryColor = settings?.primaryColor;
  useEffect(() => {
    if (primaryColor) {
      document.documentElement.style.setProperty('--primary', primaryColor);
    }
  }, [primaryColor]);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
