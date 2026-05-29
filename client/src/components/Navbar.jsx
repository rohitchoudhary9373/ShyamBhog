import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { isLoggedIn, getUser, logout } from "../utils/auth";
import API from "../services/api";
import { FaUserCircle, FaRegUserCircle, FaShoppingCart, FaWallet, FaGlobe } from 'react-icons/fa';
import { useSettings } from "../context/SettingsContext";
import { useCart } from "../context/CartContext";
import { useTranslation } from "react-i18next";
import { getFullUrl } from "../utils/url";
import { AnimatePresence, motion } from "framer-motion";
import AboutUsModal from "./AboutUsModal";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [logoError, setLogoError] = useState(false);
  const { settings } = useSettings();
  const { totalItems } = useCart();

  const user = getUser();

  useEffect(() => {
    const fetchBalance = async () => {
      if (isLoggedIn()) {
        try {
          const res = await API.get('/wallet/my-wallet');
          setWalletBalance(res.data.balance || 0);
        } catch (e) { console.error(e); }
      }
    };
    fetchBalance();

    window.addEventListener('walletUpdate', fetchBalance);
    return () => window.removeEventListener('walletUpdate', fetchBalance);
  }, [location.pathname]);

  useEffect(() => {
    setOpen(false);
    setLangOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
    { code: 'as', name: 'অসমীया' }
  ];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLangOpen(false);
  };

  const isImpersonating = !!sessionStorage.getItem('adminToken');

  return (
    <>
      <nav 
        className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100"
        style={isImpersonating ? { top: '44px' } : {}}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-between items-center">

          {/* ── LOGO ── */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center overflow-hidden border border-orange-100/50 shadow-inner">
              {settings?.logoUrl && !logoError ? (
                <img
                  src={getFullUrl(settings?.logoUrl)}
                  alt={settings?.brandName}
                  className="w-full h-full object-contain transition-transform group-hover:scale-110"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="text-primary font-black text-xl italic">{settings?.brandName?.charAt(0) || 'S'}</span>
              )}
            </div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter group-hover:text-primary transition-colors">
              {settings?.brandName || 'Shyam Bhog'}
            </span>
          </Link>

          {/* ── DESKTOP MENU ── */}
          <div className="hidden md:flex items-center gap-8 font-black text-slate-500 uppercase tracking-widest text-[10px]">
            <Link to="/" className="hover:text-primary transition-all relative group">{t('nav.home')}</Link>
            <button onClick={() => { document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="hover:text-primary transition-all relative group uppercase">{t('nav.about_us')}</button>
            <a href="/#feedback" className="hover:text-primary transition-all relative group">{t('nav.feedback')}</a>
          </div>

          {/* ── ACTIONS ── */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Language Selector (Desktop) */}
            <div className="relative hidden sm:block">
               <button onClick={() => setLangOpen(!langOpen)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white transition-all shadow-sm">
                  <FaGlobe className={langOpen ? 'rotate-180 transition-transform' : ''} size={14} />
               </button>
               <AnimatePresence>
                  {langOpen && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.9 }} className="absolute top-full mt-4 right-0 w-48 bg-white border border-slate-100 rounded-3xl shadow-2xl py-3 z-50 max-h-[350px] overflow-y-auto custom-scrollbar ring-8 ring-slate-50/50">
                       {languages.map(lang => (
                          <button key={lang.code} onClick={() => changeLanguage(lang.code)} className={`w-full text-left px-5 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-between ${i18n.language === lang.code ? 'text-primary' : 'text-slate-500'}`}>
                             {lang.name}
                             {i18n.language === lang.code && <div className="w-1 h-1 rounded-full bg-primary animate-pulse"></div>}
                          </button>
                       ))}
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>

            {isLoggedIn() ? (
              <>
                <Link to="/wallet" className="flex items-center gap-2 bg-slate-900 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-white shadow-lg hover:bg-primary transition-all group border border-slate-800">
                  <FaWallet size={12} className="text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest mr-1">₹{walletBalance.toLocaleString()}</span>
                </Link>
                <Link to="/profile" className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-slate-600 transition-all border border-slate-100 shadow-sm">
                  <FaUserCircle size={18} />
                  <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest">{t('nav.profile')}</span>
                </Link>
                {['admin', 'agent'].includes(user?.role) && (
                  <Link to="/admin" className="hidden sm:flex items-center gap-2 bg-primary/10 text-primary px-4 py-2.5 rounded-2xl border border-primary/20 hover:bg-primary hover:text-white transition-all">
                     <span className="text-[10px] font-black uppercase tracking-widest">{t('nav.admin_panel')}</span>
                  </Link>
                )}
              </>
            ) : (
              <Link 
                to="/login" 
                className="w-9 h-9 sm:w-10 sm:h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-900 transition-all border border-primary/20 group relative overflow-hidden"
                title={t('nav.login_join')}
              >
                <FaRegUserCircle size={20} className="relative z-10 group-hover:scale-110 transition-transform" />
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </Link>
            )}

            <Link to="/cart" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:text-primary transition-all shadow-sm relative">
              <FaShoppingCart size={16} />
              {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">{totalItems}</span>}
            </Link>

            {/* Mobile Hamburger */}
            <button onClick={() => setOpen(!open)} className="md:hidden w-9 h-9 flex items-center justify-center text-slate-900 text-lg bg-slate-50 rounded-full ml-1">
              {open ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] md:hidden" 
            onClick={() => setOpen(false)} 
          />
        )}
      </AnimatePresence>

      <div className={`fixed top-0 right-0 h-full w-80 bg-white z-[70] shadow-2xl transform transition-transform duration-500 ease-in-out md:hidden ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex justify-between items-center mb-10">
             <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{t('nav.menu')}</h2>
             <button onClick={() => setOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">✕</button>
          </div>
          <div className="flex flex-col gap-6 font-black text-slate-400 uppercase tracking-[0.2em] text-xs">
            <Link to="/" onClick={() => setOpen(false)}>{t('nav.home')}</Link>
            <button onClick={() => { setOpen(false); document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="text-left uppercase">{t('nav.about_us')}</button>
            <a href="/#feedback" onClick={() => setOpen(false)}>{t('nav.feedback')}</a>
            <div className="pt-4 border-t border-slate-50">
               <p className="text-[10px] text-slate-300 mb-4 tracking-widest">{t('nav.select_lang')}</p>
               <div className="grid grid-cols-2 gap-2">
                  {languages.slice(0, 4).map(lang => (
                     <button key={lang.code} onClick={() => changeLanguage(lang.code)} className={`px-4 py-2 rounded-xl text-[10px] border transition-all ${i18n.language === lang.code ? 'bg-primary border-primary text-white' : 'border-slate-100 text-slate-500'}`}>{lang.name}</button>
                  ))}
               </div>
            </div>
            {isLoggedIn() && <Link to="/profile" onClick={() => setOpen(false)}>{t('nav.my_account')}</Link>}
            {isLoggedIn() && <Link to="/wallet" onClick={() => setOpen(false)}>{t('nav.my_wallet')}</Link>}
            {user?.role === "admin" && <Link to="/admin" className="text-primary">{t('nav.admin_control')}</Link>}
          </div>
          <div className="mt-auto">
            {isLoggedIn() ? (
              <button onClick={handleLogout} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl hover:bg-red-500 transition-all">{t('nav.logout')}</button>
            ) : (
              <Link to="/login" className="block text-center bg-primary text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl">{t('nav.login')}</Link>
            )}
          </div>
        </div>
      </div>
      <AboutUsModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </>
  );
}