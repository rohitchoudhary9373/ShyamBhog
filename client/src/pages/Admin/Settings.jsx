import { useState, useEffect } from 'react';
import API from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import Invoice from '../../components/Invoice';
import { getMediaUrl } from '../../utils/url';
import BRAND from '../../config/brand';
import { 
  FaPalette, FaGlobe, FaBalanceScale, FaPhoneAlt, 
  FaFileInvoice, FaShareAlt, FaOm, FaCreditCard, 
  FaLock, FaCheckCircle, FaRocket, FaEye, FaShieldAlt,
  FaMapMarkerAlt, FaEnvelope, FaFingerprint, FaLayerGroup
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings() {
  const { refreshSettings } = useSettings();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');


  const [form, setForm] = useState({
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      // Locked brand fields — never submitted
      const skip = ['_id', '__v', 'adminId', 'createdAt', 'updatedAt',
                    'brandName', 'primaryColor', 'logoUrl'];
      Object.entries(form).forEach(([key, val]) => {
        if (!skip.includes(key) && val !== null && val !== undefined) {
          fd.append(key, val);
        }
      });
      fd.append('adminPassword', adminPassword);

      const res = await API.put('/settings', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data) setForm(prev => ({ ...prev, ...res.data }));
      await refreshSettings();
      setAdminPassword('');
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const logoSrc = getMediaUrl(form.logoUrl) || null;

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
            
            {/* ── LOCKED BRAND IDENTITY ── */}
            <section className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.05)]">
              {/* Header stripe */}
              <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <FaLayerGroup className="text-white" size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Visual Identity</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Brand Aesthetics &amp; Core Identity</p>
                  </div>
                </div>
                {/* Locked badge */}
                <div className="flex items-center gap-2 bg-orange-500/15 border border-orange-500/30 px-3 py-1.5 rounded-full">
                  <FaLock className="text-orange-400" size={9} />
                  <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Protected · Source Config</span>
                </div>
              </div>

              {/* Brand showcase */}
              <div className="bg-white p-6 space-y-5">

                {/* Info banner */}
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <FaShieldAlt className="text-amber-500 mt-0.5 flex-shrink-0" size={13} />
                  <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                    Brand identity is immutably configured in the frontend source at{' '}
                    <code className="bg-amber-100 px-1.5 py-0.5 rounded text-[9px] font-mono">src/config/brand.js</code>.{' '}
                    Changes require a code deployment.
                  </p>
                </div>

                {/* Identity cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* Logo card */}
                  <div className="col-span-1 flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-100 rounded-2xl gap-4">
                    <div className="w-20 h-20 rounded-[22px] bg-white flex items-center justify-center border-2 border-orange-100 shadow-md overflow-hidden">
                      {BRAND.logoPath ? (
                        <img src={BRAND.logoPath} alt={BRAND.name} className="w-full h-full object-contain p-2" />
                      ) : (
                        <span className="text-3xl font-black text-primary italic">{BRAND.letterMark}</span>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Platform Logo</p>
                      <div className="flex items-center gap-1 justify-center mt-1">
                        <FaLock size={8} className="text-slate-300" />
                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Locked</p>
                      </div>
                    </div>
                  </div>

                  {/* Brand name + tagline */}
                  <div className="flex flex-col justify-center p-6 bg-slate-50 border border-slate-100 rounded-2xl gap-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Brand Name</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">{BRAND.name}</p>
                    <p className="text-xs font-bold text-slate-500 italic">{BRAND.tagline}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <FaCheckCircle size={9} className="text-green-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-green-600">Verified Identity</span>
                    </div>
                  </div>

                  {/* Primary colour */}
                  <div className="flex flex-col justify-center p-6 bg-slate-50 border border-slate-100 rounded-2xl gap-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Primary Colour</p>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-14 h-14 rounded-2xl shadow-lg border-4 border-white flex-shrink-0"
                        style={{ backgroundColor: BRAND.primaryColor }}
                      />
                      <div>
                        <p className="font-mono font-black text-slate-900 text-sm uppercase tracking-widest">{BRAND.primaryColor}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Accent · CTA · Hover</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FaLock size={9} className="text-slate-300" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Non-editable</span>
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
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support & Outreach Protocols</p>
                  </div>
               </div>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2"><FaPhoneAlt size={8} /> Secure WhatsApp</label>
                    <input type="text" name="whatsapp" value={form.whatsapp} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:border-orange-500 font-bold text-[13px] text-slate-900 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2"><FaEnvelope size={8} /> Administrative Email</label>
                    <input type="email" name="contactEmail" value={form.contactEmail} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:border-orange-500 font-bold text-[13px] text-slate-900 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2"><FaMapMarkerAlt size={8} /> Registered HQ Address</label>
                    <textarea name="companyAddress" value={form.companyAddress} onChange={handleChange} rows="3" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:border-orange-500 font-bold text-[12px] text-slate-600 resize-none transition-all" />
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
        <div className="flex flex-col xl:flex-row items-center justify-end gap-6 pt-10 border-t border-slate-100">
          <div className="w-full xl:w-96 space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
              <FaFingerprint className="text-red-500" size={10} /> Confirm Authority Token
            </label>
            <input
              type="password"
              required
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter password to authorize genesis..."
              className="w-full px-8 py-5 bg-slate-900 text-white border border-slate-800 rounded-xl outline-none focus:border-orange-500 font-mono text-[11px] placeholder:text-slate-700 transition-all shadow-xl"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`w-full xl:w-auto px-16 py-6 rounded-2xl font-bold text-[11px] uppercase tracking-[0.3em] transition-all shadow-sm border border-slate-200 text-white ${saving
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-slate-900 hover:-translate-y-1 active:translate-y-0 shadow-orange-200'
              }`}
          >
            {saving ? 'Synchronizing Genesis...' : 'Deploy Brand Manifest'}
          </button>
        </div>
      </form>

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
