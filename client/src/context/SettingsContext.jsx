import { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const SettingsContext = createContext();
export const useSettings = () => useContext(SettingsContext);

const OFFICIAL_ABOUT = `Shyam Bhog is a premium digital devotional platform connecting devotees with the divine blessings of Shree Khatu Shyam Ji through trusted Bhog, Arjee, Prasad and spiritual seva services.\n\nBuilt with faith, transparency and authenticity, the platform offers a seamless devotional experience along with real-time crowd updates, hotel assistance, parking support and essential pilgrimage services for devotees worldwide.`;

const OFFICIAL_SERVICE_NATURE = `• Premium Digital Devotional Services
• Online Bhog, Prasad & Arjee Management
• Real-time Darshan & Crowd Intelligence System
• Devotee Assistance & Pilgrimage Support
• Hotel, Stay & Parking Facilitation Services
• Spiritual Experience & Seva Coordination
• Secure, Transparent & Technology-Driven Operations
• Devotional Service Accessibility Across Global Regions
• Modern Faith-Based Digital Infrastructure
• End-to-End Devotee Experience Management`;

const OFFICIAL_TERMS = `• All devotional services are subject to temple protocols and availability.
• Bhog, Arjee, Prasad and seva requests are processed on a best-effort devotional basis.
• Service timings may change during festivals, Ekadashi or high crowd periods.
• Users must provide accurate personal and booking information.
• Shyam Bhog reserves the right to modify, pause or cancel services when required.
• Hotel, parking and third-party assistance services are subject to external provider availability.
• Devotees are responsible for following temple discipline and official guidelines.
• Refunds, cancellations and service adjustments shall follow applicable service policies.
• Unauthorized misuse, fraudulent activity or policy violations may result in service restrictions.
• All digital transactions are processed through secure payment gateways.
• Payments made via Razorpay are additionally governed by Razorpay’s official Terms & Conditions and payment policies.
• Users agree to comply with Razorpay payment authentication, refund and dispute resolution procedures where applicable.
• Shyam Bhog does not store sensitive payment information such as card or banking credentials.
• Certain services may require identity verification for security and operational purposes.
• Platform features, availability and service scope may evolve periodically for operational improvements.
• Continued use of the platform constitutes acceptance of all applicable terms, policies and service guidelines.`;

const OFFICIAL_PRIVACY = `• User privacy and data protection are maintained with strict confidentiality.
• Personal information is used only for devotional services and operational support.
• Sensitive payment data is securely processed through trusted payment gateways.
• Shyam Bhog does not store confidential banking or card credentials.
• User information is never sold, misused or shared without valid operational necessity.
• Security systems and encrypted digital protocols are used to protect platform data.
• Limited data may be shared with verified service providers only for service fulfillment.
• Platform access and data handling follow secure authentication practices.
• Users may request updates or removal of personal information where applicable.
• Continued use of the platform signifies acceptance of applicable privacy and security practices.`;

const OFFICIAL_REFUND = `• All payments made for devotional services are subject to applicable cancellation and refund guidelines.
• Certain devotional offerings and seva bookings may be non-refundable once processed.
• Refund requests are reviewed based on service status, operational processing and payment verification.
• In case of failed transactions, eligible reversals shall be processed through the original payment method.
• Processing timelines for reversals may vary depending on banking and payment gateway procedures.
• Razorpay payment reversals and dispute handling shall follow Razorpay’s official policies and timelines.
• Shyam Bhog reserves the right to approve, decline or adjust reversal requests in accordance with operational and devotional service policies.
• Unauthorized, fraudulent or disputed transactions may undergo additional verification before processing.
• Approved reversals shall only be initiated to the original payer account or verified payment source.
• Continued use of the platform constitutes acceptance of applicable refund, reversal and payment policies.`;

const OFFICIAL_SHIPPING = `• Devotional offerings are managed through structured and verified fulfillment processes.
• Bhog, Prasad and seva requests are processed with operational transparency and devotional care.
• Service execution timelines may vary based on temple schedules, festivals and crowd conditions.
• Partner logistics and delivery services may be utilized where applicable for fulfillment support.
• Digital confirmations and service updates are provided through official platform channels.
• Packaging, handling and dispatch procedures are maintained with cleanliness and devotional respect.
• Certain services may be limited by regional accessibility, operational constraints or temple protocols.
• Fulfillment operations are continuously monitored for service quality and reliability.
• Shyam Bhog reserves the right to optimize fulfillment workflows for operational efficiency and devotee experience.
• Continued use of the platform signifies acceptance of applicable fulfillment, logistics and operational practices.`;

const DEFAULTS = {
  brandName: 'Shyam Bhog',
  footerText: 'Made with श्रद्धा by Shyam Bhog Team',
  copyrightText: '© 2026 Shyam Bhog Inc. All rights reserved.',
  aboutText: OFFICIAL_ABOUT,
  contactEmail: 'Shyambhog.in@gmail.com',
  whatsapp: '6367793601',
  facebookUrl: 'https://youtu.com/AqBbSULT9tE?si=rNC58XBqz-BXF_9G',
  instagramUrl: 'https://www.instagram.com/shyambhog.in/',
  youtubeUrl: 'https://youtu.com/AqBbSULT9tE?si=rNC58XBqz-BXF_9G',
  logoUrl: '/logo.png',
  primaryColor: '#ff974d',
  gstNumber: 'GSTIN2026-SB-SHYAMBHOG',
  companyAddress: 'Village - khatu Shyam ji, SIKAR, Rajasthan-332601 India',
  serviceNature: OFFICIAL_SERVICE_NATURE,
  termsContent: OFFICIAL_TERMS,
  privacyPolicy: OFFICIAL_PRIVACY,
  refundPolicy: OFFICIAL_REFUND,
  shippingPolicy: OFFICIAL_SHIPPING,
  arjeeVideoUrl: 'https://youtu.com/AqBbSULT9tE?si=rNC58XBqz-BXF_9G',
  crowdStatus: 'Medium',
  parkingUrl: 'https://maps.app.goo.gl/E4DF5esfHVSRc52Y7',
  gstEnabled: true,
  taxRate: 18,
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULTS);

  const refreshSettings = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let tenantId = urlParams.get('tenantId') || '';
      
      console.log(`[SettingsContext] Loading settings for tenantId: "${tenantId}"`);
      const res = await API.get(`/settings${tenantId ? `?tenantId=${tenantId}` : ''}`).catch(() => ({ data: {} }));
      
      setSettings({
        ...DEFAULTS,
        ...(res.data || {}),
        brandName: 'Shyam Bhog',
        primaryColor: '#ff974d',
        logoUrl: '/logo.png',
        aboutText: OFFICIAL_ABOUT,
        footerText: 'Made with श्रद्धा by Shyam Bhog Team',
        copyrightText: '© 2026 Shyam Bhog Inc. All rights reserved.',
        contactEmail: 'Shyambhog.in@gmail.com',
        whatsapp: '6367793601',
        companyAddress: 'Village - khatu Shyam ji, SIKAR, Rajasthan-332601 India',
        facebookUrl: 'https://youtu.com/AqBbSULT9tE?si=rNC58XBqz-BXF_9G',
        instagramUrl: 'https://www.instagram.com/shyambhog.in/',
        youtubeUrl: 'https://youtu.com/AqBbSULT9tE?si=rNC58XBqz-BXF_9G',
        arjeeVideoUrl: 'https://youtu.com/AqBbSULT9tE?si=rNC58XBqz-BXF_9G',
        parkingUrl: 'https://maps.app.goo.gl/E4DF5esfHVSRc52Y7',
        serviceNature: OFFICIAL_SERVICE_NATURE,
        termsContent: OFFICIAL_TERMS,
        privacyPolicy: OFFICIAL_PRIVACY,
        refundPolicy: OFFICIAL_REFUND,
        shippingPolicy: OFFICIAL_SHIPPING
      });
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
