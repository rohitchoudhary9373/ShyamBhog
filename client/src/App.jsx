import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaHome, FaGripHorizontal, FaWallet, FaUser } from "react-icons/fa";
import API from "./services/api";
import axios from "axios";
import { getBaseURL } from "./utils/url";

// Layout
import Navbar from "./components/Navbar";

// Pages
import Home from "./pages/Home";
import ServiceCatalog from "./pages/ServiceCatalog";
import ServiceDetail from "./pages/ServiceDetail";
import BookingFlow from "./pages/BookingFlow";
import Login from "./pages/Login";
import MyWallet from "./pages/Wallet";
import Profile from "./pages/Profile";
import PolicyPage from "./pages/PolicyPage";
import PremiumInvoicePage from "./pages/PremiumInvoicePage";

// Admin
import AdminLayout from "./pages/Admin/AdminLayout";
import Dashboard from "./pages/Admin/Dashboard";
import Bookings from "./pages/Admin/Bookings";
import ManageServices from "./pages/Admin/ManageServices";
import ManageContent from "./pages/Admin/ManageContent";
import ManageFeedback from "./pages/Admin/ManageFeedback";
import Agents from "./pages/Admin/Agents";
import Refunds from "./pages/Admin/Refunds";
import LoginHistory from "./pages/Admin/LoginHistory";
import Settings from "./pages/Admin/Settings";
import AdminWallet from "./pages/Admin/Wallet";
import ManageDevotees from "./pages/Admin/ManageDevotees";

import ManageArjee from "./pages/Admin/ManageArjee";
import ManageCrowd from "./pages/Admin/ManageCrowd";
import ManageParkingDetailed from "./pages/Admin/ManageParkingDetailed";
import ManageHotelsDetailed from "./pages/Admin/ManageHotelsDetailed";
import WatchArjee from "./pages/WatchArjee";
import HotelStayPage from "./pages/HotelStayPage";
import ParkingGuidePage from "./pages/ParkingGuidePage";
import CrowdStatus from "./pages/CrowdStatus";
import { useSettings } from "./context/SettingsContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Cart from "./pages/Cart";
import { FaWhatsapp, FaInstagram, FaFacebook, FaYoutube, FaEnvelope, FaInfoCircle, FaPhoneAlt, FaMapMarkerAlt, FaGlobe } from "react-icons/fa";

import { AnimatePresence, motion } from "framer-motion";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const NotFound = () => <div className="p-10 text-center text-2xl">404</div>;

// Bottom Navigation Removed as per user request

// 🌐 Public Layout
function StorefrontLayout() {
  const { settings } = useSettings();
  const { t, i18n } = useTranslation();
  const [activeModal, setActiveModal] = useState(null);
  const [showLang, setShowLang] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'mr', name: 'मराठी' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'ur', name: 'اردو' },
    { code: 'gu', name: 'ગુજરાતી' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'മലയാളം' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ' },
    { code: 'or', name: 'ଓଡ଼ିଆ' },
    { code: 'as', name: 'অসমীয়া' }
  ];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setShowLang(false);
  };

  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [activeModal]);

  const getModalContent = () => {
    if (activeModal === 'terms') return { title: t('footer.terms_conditions'), content: settings?.termsContent };
    if (activeModal === 'privacy') return { title: t('footer.privacy_policy'), content: settings?.privacyPolicy };
    if (activeModal === 'refund') return { title: t('footer.refund_policy'), content: settings?.refundPolicy };
    if (activeModal === 'shipping') return { title: t('footer.shipping_policy'), content: settings?.shippingPolicy };
    if (activeModal === 'nature') return { title: t('footer.service_nature'), content: settings?.serviceNature };

    if (activeModal === 'contact') return {
      title: t('footer.contact_us'),
      isContact: true,
      details: [
        { icon: <FaWhatsapp className="text-green-500" />, label: 'WhatsApp', value: settings?.whatsapp, link: `https://wa.me/${settings?.whatsapp?.replace(/\D/g, '')}` },
        { icon: <FaEnvelope className="text-blue-500" />, label: 'Email', value: settings?.contactEmail, link: `mailto:${settings?.contactEmail}` },
        { icon: <FaMapMarkerAlt className="text-red-500" />, label: 'Address', value: 'Khatu Shyam Ji, Rajasthan', link: settings?.parkingUrl || '#' },
      ]
    };
    return null;
  };

  const modal = getModalContent();
  const isImpersonating = !!sessionStorage.getItem('adminToken');
  const switchedUser = JSON.parse(localStorage.getItem('userInfo') || '{}');

  const handleReturnToAdmin = async () => {
    const adminUser = sessionStorage.getItem('adminUser');
    const adminToken = sessionStorage.getItem('adminToken');
    const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');

    if (adminUser && adminToken) {
      try {
        await axios.post(`${getBaseURL()}/api/auth/impersonate/return`, 
          { targetUserId: currentUser._id },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
      } catch (err) {
        console.error("Failed to log return event:", err);
      }

      localStorage.setItem('userInfo', adminUser);
      localStorage.setItem('token', adminToken);
      
      sessionStorage.removeItem('adminUser');
      sessionStorage.removeItem('adminToken');

      alert('Instantly restored administrator session context.');
      window.location.href = '/admin/bookings';
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-[#FDFCFB]" style={isImpersonating ? { paddingTop: '44px' } : {}}>
      <ScrollToTop />
      {isImpersonating && (
        <div className="fixed top-0 left-0 w-full bg-slate-950 text-white h-[44px] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-wider z-[100] border-b border-orange-500/30">
          <span className="flex items-center gap-1.5 text-orange-400">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            Impersonation Mode:
          </span>
          <span>Viewing as <strong className="text-white normal-case font-black">{switchedUser.name}</strong></span>
          <button 
            onClick={handleReturnToAdmin}
            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ml-2 shadow-lg border border-orange-500"
          >
            Return to Admin
          </button>
        </div>
      )}
      <Navbar />

      <main className="flex-grow pt-14">
        <Outlet />
      </main>

      {/* 💬 Global Floating WhatsApp */}
      <a
        href={`https://wa.me/${settings?.whatsapp?.replace(/\D/g, '')}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-24 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-white text-green-500 rounded-full shadow-2xl flex items-center justify-center text-2xl z-[90] border border-slate-100 hover:scale-110 transition-all active:scale-95 animate-bounce-slow print-hidden"
      >
        <FaWhatsapp />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
      </a>

      {/* 📜 Dynamic Modal (Policies & Contact) */}
      <AnimatePresence>
        {activeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="fixed bottom-0 left-0 right-0 md:bottom-12 md:left-auto md:right-12 md:w-[500px] max-h-[90vh] bg-white rounded-t-[40px] md:rounded-[40px] shadow-2xl z-[101] overflow-hidden flex flex-col border border-slate-200"
            >
              <header className="p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-orange-600/20 to-transparent pointer-events-none"></div>
                <div className="relative z-10">
                  <h3 className="font-black tracking-tight text-2xl leading-none">{modal?.title}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{modal?.isContact ? t('footer.contact_subtitle') : t('footer.official_docs', { brand: settings?.brandName })}</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-xl relative z-10">✕</button>
              </header>

              <div className="p-8 md:p-10 overflow-y-auto custom-scrollbar bg-white flex-grow">
                {modal?.isContact ? (
                  <div className="space-y-6">
                    <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
                      {t('footer.contact_desc')}
                    </p>
                    <div className="space-y-3">
                      {modal.details.map((item, i) => (
                        <a
                          key={i}
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-3xl hover:border-primary hover:bg-white transition-all group"
                        >
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">
                            {item.icon}
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{item.label}</h4>
                            <p className="font-black text-slate-900 tracking-tight">{item.value || 'Not Configured'}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                    <div className="mt-10 p-6 bg-orange-50 rounded-3xl border border-orange-100 text-center mb-10 md:mb-0">
                      <h4 className="text-orange-600 font-black text-xs uppercase tracking-widest mb-1">{t('footer.response_time')}</h4>
                      <p className="text-[11px] text-orange-800 font-bold italic">"{t('footer.reply_notice')}"</p>
                    </div>
                  </div>
                ) : modal?.content ? (
                  <div className="text-slate-600 text-sm leading-relaxed space-y-4 font-medium mb-10 md:mb-0">
                    {modal.content.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <FaInfoCircle className="text-slate-100 text-6xl mb-4" />
                    <p className="text-slate-400 italic font-bold uppercase tracking-widest text-[10px]">{t('footer.docs_updating')}</p>
                  </div>
                )}
              </div>

              <footer className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-none">{settings?.brandName} {t('footer.support')}</p>
                <button onClick={() => setActiveModal(null)} className="bg-slate-900 text-white px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all">{t('common.close')}</button>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer id="about-section" className="bg-white border-t border-slate-100 mt-auto">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 md:py-16">

          {/* 📱 MOBILE FOOTER (Ultra-Compact Redesign) */}
          <div className="flex flex-col md:hidden text-center gap-8">
            {/* Brand & Mission */}
            <div className="space-y-3">
              <div>
                <h3 className="text-2xl font-black tracking-tighter text-slate-900 leading-none">{settings?.brandName}</h3>
                <p className="text-primary font-black text-[7px] uppercase tracking-[0.3em] mt-1.5">{t('footer.digital_platform')}</p>
              </div>
              <p className="text-slate-400 text-[10px] font-medium leading-relaxed px-6 opacity-70">
                {t('footer.about_desc')}
              </p>
              
              {/* Language & Socials Row */}
              <div className="flex flex-col items-center gap-4 pt-1">
                {/* 🌍 Language Picker */}
                <div className="relative inline-block">
                  <button
                    onClick={() => setShowLang(!showLang)}
                    className="flex items-center gap-2 px-5 py-2 bg-[#0A1128] text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-md active:scale-95"
                  >
                    <FaGlobe size={10} className="text-orange-500 animate-spin-slow" />
                    <span>{languages.find(l => l.code === i18n.language)?.name || 'Select Language'}</span>
                    <span className="text-[6px] opacity-40">▼</span>
                  </button>
                  <AnimatePresence>
                    {showLang && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 bg-white border border-slate-100 rounded-[24px] shadow-2xl z-50 p-2.5 grid grid-cols-2 gap-1 ring-4 ring-slate-50/50 max-h-52 overflow-y-auto"
                      >
                        {languages.map(lang => (
                          <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-orange-50 rounded-xl transition-all flex items-center justify-between ${i18n.language === lang.code ? 'text-primary bg-orange-50/50' : 'text-slate-500'}`}
                          >
                            <span className="truncate">{lang.name}</span>
                            {i18n.language === lang.code && <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0"></div>}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Social Icons */}
                <div className="flex justify-center gap-2.5">
                  {settings?.whatsapp && (
                    <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                      <FaWhatsapp size={14} />
                    </a>
                  )}
                  {settings?.instagramUrl && settings.instagramUrl !== '#' && (
                    <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                      <FaInstagram size={14} />
                    </a>
                  )}
                  {settings?.contactEmail && (
                    <a href={`mailto:${settings.contactEmail}`} className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                      <FaEnvelope size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Structured Links Grid */}
            <div className="grid grid-cols-2 gap-4 px-2 border-y border-slate-50 py-6">
              <div className="space-y-3">
                <h4 className="text-[8px] font-black text-slate-900 uppercase tracking-widest opacity-30">{t('footer.important_links')}</h4>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setActiveModal('nature')} className="text-[10px] font-bold text-slate-500 active:text-primary transition-colors">{t('footer.service_nature')}</button>
                  <button onClick={() => setActiveModal('terms')} className="text-[10px] font-bold text-slate-500 active:text-primary transition-colors">{t('footer.terms_conditions')}</button>
                  <button onClick={() => setActiveModal('shipping')} className="text-[10px] font-bold text-slate-500 active:text-primary transition-colors">{t('footer.shipping_policy')}</button>
                </div>
              </div>
              <div className="space-y-3 border-l border-slate-50">
                <h4 className="text-[8px] font-black text-slate-900 uppercase tracking-widest opacity-30">{t('footer.support_trust')}</h4>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setActiveModal('refund')} className="text-[10px] font-bold text-slate-500 active:text-primary transition-colors">{t('footer.refund_policy')}</button>
                  <button onClick={() => setActiveModal('privacy')} className="text-[10px] font-bold text-slate-500 active:text-primary transition-colors">{t('footer.privacy_policy')}</button>
                  <button onClick={() => setActiveModal('contact')} className="text-[10px] font-bold text-slate-500 active:text-primary transition-colors">{t('footer.contact_us')}</button>
                </div>
              </div>
            </div>

            {/* Bottom Trust Badge */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100/50">
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[7px] font-black text-emerald-700 uppercase tracking-[0.2em]">{t('footer.secure_systems')}</span>
              </div>
              <p className="text-slate-300 text-[7px] font-black uppercase tracking-widest opacity-80">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
            </div>
          </div>

          {/* 💻 DESKTOP FOOTER (Untouched) */}
          <div className="hidden md:grid grid-cols-4 gap-12 mb-12">
            <div className="col-span-2 space-y-6">
              <div>
                <h3 className="text-3xl font-black tracking-tighter text-slate-900">{settings?.brandName}</h3>
                <p className="text-primary font-black text-[10px] uppercase tracking-[0.3em] mt-1">{t('footer.digital_platform')}</p>
              </div>
              <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-md">
                {t('footer.about_desc')}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex gap-2">
                  {settings?.whatsapp && (
                    <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-green-500 hover:text-white transition-all shadow-sm">
                      <FaWhatsapp size={18} />
                    </a>
                  )}
                  {settings?.instagramUrl && settings.instagramUrl !== '#' && (
                    <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-pink-500 hover:text-white transition-all shadow-sm">
                      <FaInstagram size={18} />
                    </a>
                  )}
                  {settings?.contactEmail && (
                    <a href={`mailto:${settings.contactEmail}`} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-500 hover:text-white transition-all shadow-sm">
                      <FaEnvelope size={16} />
                    </a>
                  )}
                </div>

                <div className="relative group/lang">
                  <button
                    onClick={() => setShowLang(!showLang)}
                    className="flex items-center gap-3 px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-slate-100"
                  >
                    <FaGlobe className="animate-spin-slow" />
                    <span>{languages.find(l => l.code === i18n.language)?.name || 'Select Language'}</span>
                    <span className="text-[8px] opacity-50">▼</span>
                  </button>
                  <AnimatePresence>
                    {showLang && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute bottom-full mb-4 left-0 w-80 bg-white border border-slate-100 rounded-[32px] shadow-2xl z-50 p-4 grid grid-cols-2 gap-1 ring-8 ring-slate-50/50 max-h-60 overflow-y-auto"
                      >
                        {languages.map(lang => (
                          <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 rounded-2xl transition-all flex items-center justify-between group ${i18n.language === lang.code ? 'text-primary bg-orange-50/50' : 'text-slate-500'}`}
                          >
                            <span className="truncate">{lang.name}</span>
                            {i18n.language === lang.code && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0"></div>}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{t('footer.important_links')}</h4>
              <div className="flex flex-col gap-4">
                <button onClick={() => setActiveModal('nature')} className="text-left text-sm font-bold text-slate-400 hover:text-primary transition-all">{t('footer.service_nature')}</button>
                <button onClick={() => setActiveModal('terms')} className="text-left text-sm font-bold text-slate-400 hover:text-primary transition-all">{t('footer.terms_conditions')}</button>
                <button onClick={() => setActiveModal('shipping')} className="text-left text-sm font-bold text-slate-400 hover:text-primary transition-all">{t('footer.shipping_policy')}</button>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{t('footer.support_trust')}</h4>
              <div className="flex flex-col gap-4">
                <button onClick={() => setActiveModal('refund')} className="text-left text-sm font-bold text-slate-400 hover:text-primary transition-all">{t('footer.refund_policy')}</button>
                <button onClick={() => setActiveModal('privacy')} className="text-left text-sm font-bold text-slate-400 hover:text-primary transition-all">{t('footer.privacy_policy')}</button>
                <button onClick={() => setActiveModal('contact')} className="text-left text-sm font-bold text-slate-400 hover:text-primary transition-all">{t('footer.contact_us')}</button>
              </div>
            </div>
          </div>

          {/* Desktop Bottom Bar */}
          <div className="hidden md:flex pt-8 border-t border-slate-50 justify-between items-center">
            <div>
              <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('footer.secure_systems')}</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}

// 🚀 APP
function App() {
  return (
    <Router>
      <Routes>

        {/* 🌐 PUBLIC ROUTES */}
        <Route path="/" element={<StorefrontLayout />}>
          <Route index element={<Home />} />
          <Route path="/watch-arjee" element={<WatchArjee />} />
          <Route path="/services/:category" element={<ServiceCatalog />} />
          <Route path="/services/detail/:serviceId" element={<ServiceDetail />} />
          <Route path="/book/:serviceId" element={<BookingFlow />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/wallet" element={<MyWallet />} />
          <Route path="/hotel-stay" element={<HotelStayPage />} />
          <Route path="/parking-guide" element={<ParkingGuidePage />} />
          <Route path="/crowd-status" element={<CrowdStatus />} />
          <Route path="/policy/:type" element={<PolicyPage />} />

          {/* 🔐 USER PROTECTED (Inside Website Layout) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/premium-invoice/:orderId" element={<PremiumInvoicePage />} />
          </Route>
        </Route>


        {/* 🧑‍💼 ADMIN PROTECTED */}
        <Route element={<ProtectedRoute allowedRoles={["admin", "admin", "agent"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="services" element={<ManageServices />} />
            <Route path="content" element={<ManageContent />} />
            <Route path="feedback" element={<ManageFeedback />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="agents" element={<Agents />} />
            <Route path="refunds" element={<Refunds />} />
            <Route path="security" element={<LoginHistory />} />
            <Route path="settings" element={<Settings />} />
            <Route path="manage-arjee" element={<ManageArjee />} />
            <Route path="manage-crowd" element={<ManageCrowd />} />
            <Route path="manage-parking" element={<ManageParkingDetailed />} />
            <Route path="manage-hotels" element={<ManageHotelsDetailed />} />
            <Route path="devotees" element={<ManageDevotees />} />
            <Route path="wallet" element={<AdminWallet />} />
          </Route>
        </Route>

        {/* ❌ 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Router>
  );
}

export default App;