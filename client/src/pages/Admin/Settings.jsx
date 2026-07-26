import { useState, useEffect } from 'react';
import API from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import Invoice from '../../components/Invoice';
import { getMediaUrl } from '../../utils/url';
import { 
  FaPalette, FaGlobe, FaBalanceScale, FaPhoneAlt, 
  FaFileInvoice, FaShareAlt, FaOm, FaCreditCard, 
  FaLock, FaCheckCircle, FaRocket, FaEye, FaUpload,
  FaMapMarkerAlt, FaEnvelope, FaFingerprint, FaShieldAlt
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings() {
  const { refreshSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [form, setForm] = useState({
    brandName: '',
    primaryColor: '#f97316',
    footerText: '',
    copyrightText: '',
    aboutText: '',
    contactEmail: '',
    whatsapp: '',
    facebookUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    razorpayKeyId: '',
    razorpayKeySecret: '',
    logoUrl: '',
    gstNumber: '',
    companyAddress: '',
    termsContent: '',
    privacyPolicy: '',
    refundPolicy: '',
    shippingPolicy: '',
    serviceNature: '',
    arjeeVideoUrl: '',
    crowdStatus: 'Low',
    parkingUrl: '',
    gstEnabled: true,
    taxRate: 18,
  });

  useEffect(() => {
    setLogoError(false);
  }, [logoPreview, form.logoUrl]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/settings');
        if (res.data) setForm(prev => ({ ...prev, ...res.data }));
      } catch (err) {
        console.error('Failed to load settings:', err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const fd = new FormData();
      const skip = ['_id', '__v', 'adminId', 'createdAt', 'updatedAt'];
      Object.entries(form).forEach(([key, val]) => {
        if (!skip.includes(key) && val !== null && val !== undefined) {
          fd.append(key, val);
        }
      });
      if (logoFile) fd.append('logo', logoFile);

      const res = await API.put('/settings', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data) setForm(prev => ({ ...prev, ...res.data }));
      setLogoFile(null);
      await refreshSettings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const logoSrc = logoPreview || getMediaUrl(form.logoUrl) || null;

  if (loading) return (
    <div className="py-40 text-center flex flex-col items-center justify-center gap-4">
       <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
       <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest animate-pulse">Syncing Brand Genesis...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* ── SETTINGS HEADER ── */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                 <FaRocket size={20} />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Platform <span className="text-orange-600 not-italic">Genesis</span></h1>
           </div>
           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] ml-1">Global Configuration & Brand Architecture</p>
        </div>

        <div className="flex items-center gap-4">
           <button 
             type="button"
             onClick={() => setShowPreview(true)}
             className="bg-white border border-slate-200 text-slate-900 px-6 py-3.5 rounded-[22px] text-[10px] font-bold uppercase tracking-widest hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm active:scale-95 group"
           >
              <FaEye className="inline-block mr-2 group-hover:scale-110 transition-transform" />
              Preview Invoice
           </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* ── CORE IDENTITY (LEFT) ── */}
          <div className="xl:col-span-8 space-y-10">
            
            {/* Visual Design System */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.03)] p-6 space-y-8 relative overflow-hidden">
               <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                     <FaPalette size={18} />
                  </div>
                  <div>
                     <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Visual <span className="text-orange-600 not-italic">Identity</span></h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Brand Aesthetics & Color Theory</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Brand Nominal Identity</label>
                    <input type="text" name="brandName" value={form.brandName} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:border-orange-500 font-bold text-[13px] text-slate-900 transition-all" />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Primary Aesthetic Tone</label>
                    <div className="flex gap-4">
                      <div className="relative">
                         <input type="color" name="primaryColor" value={form.primaryColor} onChange={handleChange} className="w-14 h-14 rounded-[22px] cursor-pointer border-4 border-white shadow-lg overflow-hidden" />
                      </div>
                      <input type="text" value={form.primaryColor} readOnly className="flex-1 px-6 bg-slate-50 border border-slate-100 rounded-[22px] font-mono font-bold text-xs text-slate-400 text-center uppercase tracking-widest" />
                    </div>
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Official Brand Emblem (Fixed & Protected)</label>
                    <div className="flex items-center gap-6 p-6 bg-orange-50/40 border border-orange-100/80 rounded-2xl">
                       <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-md border border-orange-100 flex items-center justify-center shrink-0">
                          <img src="/logo.png" alt="Shyam Bhog Logo" className="w-full h-full object-contain" />
                       </div>
                       <div className="flex-1">
                          <div className="flex items-center gap-2">
                             <FaLock className="text-orange-600" size={12} />
                             <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Official Gold Emblem Locked</p>
                          </div>
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Permanent Shyam Bhog logo active across all web pages & invoices.</p>
                       </div>
                    </div>
                  </div>
               </div>
            </section>

            {/* Corporate Manifesto */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.03)] p-6 space-y-8">
               <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                     <FaGlobe size={18} />
                  </div>
                  <div>
                     <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Platform <span className="text-orange-600 not-italic">Manifesto</span></h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Public Narrative & SEO Architecture</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Brand Ethos / About</label>
                    <textarea name="aboutText" value={form.aboutText} onChange={handleChange} rows="6" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold text-[12px] text-slate-600 leading-relaxed resize-none transition-all italic" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Legal Copyright Marker</label>
                      <input type="text" name="copyrightText" value={form.copyrightText} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:border-orange-500 font-bold text-[11px] text-slate-900 transition-all" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Global Tagline</label>
                      <input type="text" name="footerText" value={form.footerText} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:border-orange-500 font-bold text-[11px] text-slate-900 transition-all" />
                    </div>
                  </div>
               </div>
            </section>

            {/* Legal Governance Protocols */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.03)] p-6 space-y-8">
               <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                     <FaBalanceScale size={18} />
                  </div>
                  <div>
                     <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Governance <span className="text-orange-600 not-italic">Protocols</span></h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Legal Binding Manifests & Policies</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Service Nature & Scope</label>
                    <textarea name="serviceNature" value={form.serviceNature} onChange={handleChange} rows="6" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-orange-500 font-medium text-[11px] text-slate-600 leading-relaxed resize-none transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Master Terms & Conditions</label>
                    <textarea name="termsContent" value={form.termsContent} onChange={handleChange} rows="6" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-orange-500 font-medium text-[11px] text-slate-600 leading-relaxed resize-none transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Global Privacy Directive</label>
                    <textarea name="privacyPolicy" value={form.privacyPolicy} onChange={handleChange} rows="6" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-orange-500 font-medium text-[11px] text-slate-600 leading-relaxed resize-none transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Capital Reversal Policy</label>
                    <textarea name="refundPolicy" value={form.refundPolicy} onChange={handleChange} rows="6" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-orange-500 font-medium text-[11px] text-slate-600 leading-relaxed resize-none transition-all" />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Logistic & Fulfillment Manifesto</label>
                    <textarea name="shippingPolicy" value={form.shippingPolicy} onChange={handleChange} rows="4" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-orange-500 font-medium text-[11px] text-slate-600 leading-relaxed resize-none transition-all" />
                  </div>
               </div>
            </section>
          </div>

          {/* ── OPERATIONAL NODES (RIGHT) ── */}
          <div className="xl:col-span-4 space-y-10">
            
            {/* Communication Hub */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.03)] p-6 space-y-8">
               <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                     <FaPhoneAlt size={16} />
                  </div>
                  <div>
                     <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Comm <span className="text-orange-600 not-italic">Hub</span></h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support & Outreach Protocols (Locked)</p>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><FaPhoneAlt size={10} className="text-emerald-600" /> Secure WhatsApp</span>
                     <p className="text-sm font-black text-slate-900">+91 6367793601</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><FaEnvelope size={10} className="text-blue-600" /> Administrative Email</span>
                     <p className="text-sm font-black text-slate-900">Shyambhog.in@gmail.com</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><FaMapMarkerAlt size={10} className="text-orange-600" /> Registered HQ Address</span>
                     <p className="text-xs font-bold text-slate-700 leading-relaxed">Village - khatu Shyam ji, SIKAR, Rajasthan-332601 India</p>
                  </div>
               </div>
            </section>

            {/* Social Architecture */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.03)] p-6 space-y-8">
               <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                     <FaShareAlt size={16} />
                  </div>
                  <div>
                     <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Social <span className="text-orange-600 not-italic">Nodes</span></h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">External Ecosystem Links</p>
                  </div>
               </div>
               <div className="space-y-5">
                  {['facebookUrl', 'instagramUrl', 'youtubeUrl'].map((field) => (
                    <div key={field} className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">{field.replace('Url', '').toUpperCase()} Deployment</label>
                      <input type="url" name={field} value={form[field]} onChange={handleChange} className="w-full px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-orange-500 font-bold text-[11px] text-slate-900 transition-all" />
                    </div>
                  ))}
               </div>
            </section>

            {/* Divine Intelligence Hub */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.03)] p-6 space-y-8 border-l-4 border-l-orange-500">
               <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                     <FaOm size={18} />
                  </div>
                  <div>
                     <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Divine <span className="text-orange-600 not-italic">Intel</span></h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Spiritual Telemetry</p>
                  </div>
               </div>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Global Arjee Feed URL</label>
                    <input type="url" name="arjeeVideoUrl" value={form.arjeeVideoUrl} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:border-orange-500 font-bold text-[11px] text-slate-900" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Live Crowd Status Matrix</label>
                    <select name="crowdStatus" value={form.crowdStatus} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:border-orange-500 font-bold text-[11px] text-slate-900 appearance-none cursor-pointer">
                      <option value="Low">🟢 Low Intensity (Optimal)</option>
                      <option value="Medium">🟡 Medium Intensity (Standard)</option>
                      <option value="High">🔴 High Intensity (Peak)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Parking Navigation Manifest</label>
                    <input type="url" name="parkingUrl" value={form.parkingUrl} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:border-orange-500 font-bold text-[11px] text-slate-900" />
                  </div>
               </div>
            </section>

            {/* Treasury Security Gate */}
            <section className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 space-y-8 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-10 text-8xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-700"><FaCreditCard /></div>
               <div className="flex items-center gap-4 border-b border-white/5 pb-6 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center">
                     <FaLock size={16} />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-white tracking-tighter uppercase italic">Treasury <span className="text-orange-600 not-italic">Gate</span></h3>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gateway Cryptography & Credentials</p>
                  </div>
               </div>
               <div className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Razorpay Key Identity</label>
                    <input type="text" name="razorpayKeyId" value={form.razorpayKeyId} onChange={handleChange} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-[22px] outline-none focus:border-orange-500 font-mono text-xs text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Platform Secret Token</label>
                    <input type="password" name="razorpayKeySecret" value={form.razorpayKeySecret} onChange={handleChange} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-[22px] outline-none focus:border-orange-500 font-mono text-xs text-white" />
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                     <FaShieldAlt className="text-orange-500 shrink-0" size={14} />
                     <p className="text-[9px] font-bold text-orange-500 uppercase leading-relaxed tracking-wider">Credentials verified via RSA encryption protocol.</p>
                  </div>
               </div>
            </section>
          </div>
        </div>

        {/* ── AUTHORIZATION & DEPLOYMENT ── */}
        <div className="flex flex-col xl:flex-row items-center justify-between gap-6 pt-10 border-t border-slate-100">
          <div>
            {saveSuccess && (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 px-5 py-3 rounded-xl">
                <FaCheckCircle size={16} />
                <span className="text-[11px] font-black uppercase tracking-widest">Brand Manifest Deployed Successfully! 🎉</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-xl ${
              saving 
              ? 'bg-slate-400 cursor-not-allowed' 
              : 'bg-orange-600 hover:bg-slate-900 hover:-translate-y-0.5 active:translate-y-0 shadow-orange-200'
              }`}
          >
            {saving ? 'Synchronizing Genesis...' : 'Deploy Brand Manifest'}
          </button>
        </div>
      </form>

      {/* ── RESET TEST DATA & REVENUE ── */}
      <div className="bg-red-50/50 rounded-[32px] p-8 border border-red-100/60 mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-left">
          <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide">Danger Zone: Reset System Metrics & Orders</h3>
          <p className="text-[11px] text-red-600 font-medium">Clear all test orders, test transactions, and test accounts. Reset total revenue and active orders to ₹0.</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            if (window.confirm("ARE YOU SURE? This will clear all test orders, test transactions, and non-admin test users, resetting Total Revenue and Orders to 0.")) {
              try {
                setSaving(true);
                const res = await API.post('/settings/reset-test-data');
                alert(res.data.message || "Database test data cleared cleanly!");
                window.location.reload();
              } catch (err) {
                alert(err.response?.data?.message || "Error clearing data");
              } finally {
                setSaving(false);
              }
            }
          }}
          className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shrink-0"
        >
          Clear Test Data & Reset Revenue
        </button>
      </div>

      {/* Invoice Format Preview */}
      <AnimatePresence>
      {showPreview && (
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6"
        >
           <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
              <div className="absolute top-6 right-8 z-[210]">
                 <button onClick={() => setShowPreview(false)} className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-orange-600 transition-all shadow-xl">✕</button>
              </div>
              <div className="h-full overflow-y-auto custom-scrollbar p-0">
                 <Invoice
                   order={{
                     _id: 'PREVIEW_ID_001',
                     invoiceNumber: 'SB-INV-PREVIEW-001',
                     name: 'Sample Devotee',
                     whatsapp: '+91 99999 99999',
                     serviceType: 'Chhappan Bhog',
                     createdAt: new Date().toISOString(),
                     totalPrice: 110 + (form.gstEnabled ? (110 * (Number(form.taxRate) || 18) / 100) : 0),
                     taxAmount: form.gstEnabled ? (110 * (Number(form.taxRate) || 18) / 100) : 0,
                     payableAmount: 110 + (form.gstEnabled ? (110 * (Number(form.taxRate) || 18) / 100) : 0),
                     walletDeduction: 0,
                     items: [{ title: 'Chhappan Bhog Seva', price: 110, quantity: 1 }],
                     message: 'Jai Shree Shyam! This is a preview of your prayer message.'
                   }}
                 />
              </div>
           </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
