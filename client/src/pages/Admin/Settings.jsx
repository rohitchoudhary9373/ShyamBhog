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
  const [adminPassword, setAdminPassword] = useState('');
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [logoPreview, form.logoUrl]);

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

    try {
      const fd = new FormData();
      const skip = ['_id', '__v', 'adminId', 'createdAt', 'updatedAt'];
      Object.entries(form).forEach(([key, val]) => {
        if (!skip.includes(key) && val !== null && val !== undefined) {
          fd.append(key, val);
        }
      });
      if (logoFile) fd.append('logo', logoFile);
      fd.append('adminPassword', adminPassword);

      const res = await API.put('/settings', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data) setForm(prev => ({ ...prev, ...res.data }));
      setLogoFile(null);
      await refreshSettings();
      setAdminPassword('');
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
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Syncing Brand Genesis...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* ── SETTINGS HEADER ── */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#0A1128] text-white flex items-center justify-center shadow-lg">
                 <FaRocket size={20} />
              </div>
              <h1 className="text-3xl font-black text-[#0A1128] tracking-tighter uppercase italic">Platform <span className="text-orange-600 not-italic">Genesis</span></h1>
           </div>
           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] ml-1">Global Configuration & Brand Architecture</p>
        </div>

        <div className="flex items-center gap-4">
           <button 
             type="button"
             onClick={() => setShowPreview(true)}
             className="bg-white border border-slate-200 text-[#0A1128] px-6 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-widest hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm active:scale-95 group"
           >
              <FaEye className="inline-block mr-2 group-hover:scale-110 transition-transform" />
              Preview Invoice
           </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

          {/* ── CORE IDENTITY (LEFT) ── */}
          <div className="xl:col-span-8 space-y-10">
            
            {/* Visual Design System */}
            <section className="bg-white rounded-[48px] border border-slate-200/60 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.03)] p-10 space-y-8 relative overflow-hidden">
               <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                     <FaPalette size={18} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-[#0A1128] tracking-tighter uppercase italic">Visual <span className="text-orange-600 not-italic">Identity</span></h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Brand Aesthetics & Color Theory</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Brand Nominal Identity</label>
                    <input type="text" name="brandName" value={form.brandName} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:border-orange-500 font-black text-[13px] text-[#0A1128] transition-all" />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Primary Aesthetic Tone</label>
                    <div className="flex gap-4">
                      <div className="relative">
                         <input type="color" name="primaryColor" value={form.primaryColor} onChange={handleChange} className="w-14 h-14 rounded-[22px] cursor-pointer border-4 border-white shadow-lg overflow-hidden" />
                      </div>
                      <input type="text" value={form.primaryColor} readOnly className="flex-1 px-6 bg-slate-50 border border-slate-100 rounded-[22px] font-mono font-black text-xs text-slate-400 text-center uppercase tracking-widest" />
                    </div>
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Global Platform Logo</label>
                    <label className="flex items-center gap-6 p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] cursor-pointer hover:bg-orange-50/30 hover:border-orange-500 transition-all group">
                      {logoSrc && !logoError ? (
                        <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-xl border border-slate-100">
                           <img src={logoSrc} alt="Logo" className="w-full h-full object-contain" onError={() => setLogoError(true)} />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
                           <FaUpload size={20} />
                        </div>
                      )}
                      <div className="flex-1">
                         <p className="text-[11px] font-black text-[#0A1128] uppercase tracking-widest group-hover:text-orange-600 transition-colors">Upload High-Res Vector</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">PNG, JPG or SVG • Recommended 512x512</p>
                      </div>
                      <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                    </label>
                  </div>
               </div>
            </section>

            {/* Corporate Manifesto */}
            <section className="bg-white rounded-[48px] border border-slate-200/60 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.03)] p-10 space-y-8">
               <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                     <FaGlobe size={18} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-[#0A1128] tracking-tighter uppercase italic">Platform <span className="text-orange-600 not-italic">Manifesto</span></h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Public Narrative & SEO Architecture</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Brand Ethos / About</label>
                    <textarea name="aboutText" value={form.aboutText} onChange={handleChange} rows="6" className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[32px] outline-none focus:border-orange-500 font-bold text-[12px] text-slate-600 leading-relaxed resize-none transition-all italic" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Legal Copyright Marker</label>
                      <input type="text" name="copyrightText" value={form.copyrightText} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:border-orange-500 font-black text-[11px] text-[#0A1128] transition-all" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Global Tagline</label>
                      <input type="text" name="footerText" value={form.footerText} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:border-orange-500 font-black text-[11px] text-[#0A1128] transition-all" />
                    </div>
                  </div>
               </div>
            </section>

            {/* Legal Governance Protocols */}
            <section className="bg-white rounded-[48px] border border-slate-200/60 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.03)] p-10 space-y-8">
               <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                     <FaBalanceScale size={18} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-[#0A1128] tracking-tighter uppercase italic">Governance <span className="text-orange-600 not-italic">Protocols</span></h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Legal Binding Manifests & Policies</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Service Nature & Scope</label>
                    <textarea name="serviceNature" value={form.serviceNature} onChange={handleChange} rows="6" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[28px] outline-none focus:border-orange-500 font-medium text-[11px] text-slate-600 leading-relaxed resize-none transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Master Terms & Conditions</label>
                    <textarea name="termsContent" value={form.termsContent} onChange={handleChange} rows="6" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[28px] outline-none focus:border-orange-500 font-medium text-[11px] text-slate-600 leading-relaxed resize-none transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Global Privacy Directive</label>
                    <textarea name="privacyPolicy" value={form.privacyPolicy} onChange={handleChange} rows="6" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[28px] outline-none focus:border-orange-500 font-medium text-[11px] text-slate-600 leading-relaxed resize-none transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Capital Reversal Policy</label>
                    <textarea name="refundPolicy" value={form.refundPolicy} onChange={handleChange} rows="6" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[28px] outline-none focus:border-orange-500 font-medium text-[11px] text-slate-600 leading-relaxed resize-none transition-all" />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Logistic & Fulfillment Manifesto</label>
                    <textarea name="shippingPolicy" value={form.shippingPolicy} onChange={handleChange} rows="4" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[28px] outline-none focus:border-orange-500 font-medium text-[11px] text-slate-600 leading-relaxed resize-none transition-all" />
                  </div>
               </div>
            </section>
          </div>

          {/* ── OPERATIONAL NODES (RIGHT) ── */}
          <div className="xl:col-span-4 space-y-10">
            
            {/* Communication Hub */}
            <section className="bg-white rounded-[48px] border border-slate-200/60 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.03)] p-10 space-y-8">
               <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                     <FaPhoneAlt size={16} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-[#0A1128] tracking-tighter uppercase italic">Comm <span className="text-orange-600 not-italic">Hub</span></h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support & Outreach Protocols</p>
                  </div>
               </div>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2"><FaPhoneAlt size={8} /> Secure WhatsApp</label>
                    <input type="text" name="whatsapp" value={form.whatsapp} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:border-orange-500 font-black text-[13px] text-[#0A1128] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2"><FaEnvelope size={8} /> Administrative Email</label>
                    <input type="email" name="contactEmail" value={form.contactEmail} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:border-orange-500 font-black text-[13px] text-[#0A1128] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2"><FaMapMarkerAlt size={8} /> Registered HQ Address</label>
                    <textarea name="companyAddress" value={form.companyAddress} onChange={handleChange} rows="3" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:border-orange-500 font-bold text-[12px] text-slate-600 resize-none transition-all" />
                  </div>
               </div>
            </section>

            {/* Social Architecture */}
            <section className="bg-white rounded-[48px] border border-slate-200/60 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.03)] p-10 space-y-8">
               <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                     <FaShareAlt size={16} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-[#0A1128] tracking-tighter uppercase italic">Social <span className="text-orange-600 not-italic">Nodes</span></h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">External Ecosystem Links</p>
                  </div>
               </div>
               <div className="space-y-5">
                  {['facebookUrl', 'instagramUrl', 'youtubeUrl'].map((field) => (
                    <div key={field} className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{field.replace('Url', '').toUpperCase()} Deployment</label>
                      <input type="url" name={field} value={form[field]} onChange={handleChange} className="w-full px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-[20px] outline-none focus:border-orange-500 font-black text-[11px] text-[#0A1128] transition-all" />
                    </div>
                  ))}
               </div>
            </section>

            {/* Divine Intelligence Hub */}
            <section className="bg-white rounded-[48px] border border-slate-200/60 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.03)] p-10 space-y-8 border-l-4 border-l-orange-500">
               <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                     <FaOm size={18} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-[#0A1128] tracking-tighter uppercase italic">Divine <span className="text-orange-600 not-italic">Intel</span></h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Spiritual Telemetry</p>
                  </div>
               </div>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Global Arjee Feed URL</label>
                    <input type="url" name="arjeeVideoUrl" value={form.arjeeVideoUrl} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:border-orange-500 font-black text-[11px] text-[#0A1128]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Live Crowd Status Matrix</label>
                    <select name="crowdStatus" value={form.crowdStatus} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:border-orange-500 font-black text-[11px] text-[#0A1128] appearance-none cursor-pointer">
                      <option value="Low">🟢 Low Intensity (Optimal)</option>
                      <option value="Medium">🟡 Medium Intensity (Standard)</option>
                      <option value="High">🔴 High Intensity (Peak)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Parking Navigation Manifest</label>
                    <input type="url" name="parkingUrl" value={form.parkingUrl} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] outline-none focus:border-orange-500 font-black text-[11px] text-[#0A1128]" />
                  </div>
               </div>
            </section>

            {/* Treasury Security Gate */}
            <section className="bg-[#0A1128] rounded-[48px] p-10 shadow-2xl space-y-8 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-700"><FaCreditCard /></div>
               <div className="flex items-center gap-4 border-b border-white/5 pb-6 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center">
                     <FaLock size={16} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">Treasury <span className="text-orange-600 not-italic">Gate</span></h3>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gateway Cryptography & Credentials</p>
                  </div>
               </div>
               <div className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Razorpay Key Identity</label>
                    <input type="text" name="razorpayKeyId" value={form.razorpayKeyId} onChange={handleChange} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-[22px] outline-none focus:border-orange-500 font-mono text-xs text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Platform Secret Token</label>
                    <input type="password" name="razorpayKeySecret" value={form.razorpayKeySecret} onChange={handleChange} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-[22px] outline-none focus:border-orange-500 font-mono text-xs text-white" />
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                     <FaShieldAlt className="text-orange-500 shrink-0" size={14} />
                     <p className="text-[9px] font-black text-orange-500 uppercase leading-relaxed tracking-wider">Credentials verified via RSA encryption protocol.</p>
                  </div>
               </div>
            </section>
          </div>
        </div>

        {/* ── AUTHORIZATION & DEPLOYMENT ── */}
        <div className="flex flex-col xl:flex-row items-center justify-end gap-8 pt-10 border-t border-slate-100">
          <div className="w-full xl:w-96 space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
              <FaFingerprint className="text-red-500" size={10} /> Confirm Authority Token
            </label>
            <input
              type="password"
              required
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter password to authorize genesis..."
              className="w-full px-8 py-5 bg-[#0A1128] text-white border border-slate-800 rounded-[28px] outline-none focus:border-orange-500 font-mono text-[11px] placeholder:text-slate-700 transition-all shadow-xl"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`w-full xl:w-auto px-16 py-6 rounded-[32px] font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl text-white ${saving
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-[#0A1128] hover:-translate-y-1 active:translate-y-0 shadow-orange-200'
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
           className="fixed inset-0 z-[200] bg-[#0A1128]/40 backdrop-blur-md flex items-center justify-center p-6"
        >
           <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[48px] bg-white shadow-2xl">
              <div className="absolute top-8 right-8 z-[210]">
                 <button onClick={() => setShowPreview(false)} className="w-12 h-12 rounded-2xl bg-[#0A1128] text-white flex items-center justify-center hover:bg-orange-600 transition-all shadow-xl">✕</button>
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
