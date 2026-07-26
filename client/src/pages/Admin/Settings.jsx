import { useState } from 'react';
import API from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { 
  FaPalette, FaGlobe, FaBalanceScale, FaPhoneAlt, 
  FaLock, FaCheckCircle, FaRocket, FaUpload,
  FaMapMarkerAlt, FaEnvelope, FaShieldAlt, FaYoutube, FaInstagram, FaFacebook
} from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function Settings() {
  const { settings } = useSettings();
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* ── SETTINGS HEADER ── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                 <FaRocket size={18} />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Platform <span className="text-orange-600">Genesis</span></h1>
           </div>
           <p className="text-slate-400 font-semibold text-[11px] uppercase tracking-widest">Global Brand Manifest & Governance System (Protected & Locked)</p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-black uppercase tracking-wider">
           <FaLock size={12} /> Brand Manifest Protected
        </div>
      </header>

      {/* ── CORE BRAND MANIFEST (GRID) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Visual & Contact Identity */}
        <div className="lg:col-span-6 space-y-6">
           
           {/* Visual Identity Box */}
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                 <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                    <FaPalette size={16} />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Visual Identity</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Brand Aesthetics</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Brand Name</span>
                    <span className="text-base font-black text-slate-900">{settings?.brandName || 'Shyam Bhog'}</span>
                 </div>

                 <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Primary Color</span>
                    <div className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: settings?.primaryColor || '#ff974d' }}></div>
                       <span className="text-xs font-mono font-bold text-slate-700">{settings?.primaryColor || '#ff974d'}</span>
                    </div>
                 </div>

                 <div className="flex items-center gap-4 p-4 bg-orange-50/50 border border-orange-100 rounded-2xl">
                    <div className="w-14 h-14 bg-white p-1.5 rounded-2xl border border-orange-100 shadow-sm flex items-center justify-center shrink-0">
                       <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                       <p className="text-xs font-black text-slate-900 uppercase tracking-wide">Official Gold Emblem</p>
                       <p className="text-[10px] font-bold text-slate-500 mt-0.5">Permanently linked across website & PDF receipts.</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Communication Hub */}
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                 <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                    <FaPhoneAlt size={16} />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Communication Hub</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Support Credentials</p>
                 </div>
              </div>

              <div className="space-y-3">
                 <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><FaPhoneAlt size={10} className="text-emerald-600" /> Secure WhatsApp</span>
                    <p className="text-sm font-black text-slate-900">+91 6367793601</p>
                 </div>
                 <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><FaEnvelope size={10} className="text-blue-600" /> Administrative Email</span>
                    <p className="text-sm font-black text-slate-900">Shyambhog.in@gmail.com</p>
                 </div>
                 <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><FaMapMarkerAlt size={10} className="text-orange-600" /> Registered HQ Address</span>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed">Village - khatu Shyam ji, SIKAR, Rajasthan-332601 India</p>
                 </div>
              </div>
           </div>

           {/* Social Ecosystem */}
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                 <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                    <FaGlobe size={16} />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Social Nodes</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Ecosystem Links</p>
                 </div>
              </div>

              <div className="space-y-3 text-xs font-bold text-slate-700">
                 <div className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                    <span className="flex items-center gap-2"><FaInstagram className="text-pink-600" /> Instagram</span>
                    <a href="https://www.instagram.com/shyambhog.in/" target="_blank" rel="noreferrer" className="text-orange-600 hover:underline font-mono text-[11px] truncate max-w-[200px]">shyambhog.in</a>
                 </div>
                 <div className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                    <span className="flex items-center gap-2"><FaYoutube className="text-slate-400" /> YouTube</span>
                    <span className="text-slate-400 font-medium text-[11px]">Not Configured</span>
                 </div>
                 <div className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                    <span className="flex items-center gap-2"><FaFacebook className="text-slate-400" /> Facebook</span>
                    <span className="text-slate-400 font-medium text-[11px]">Not Configured</span>
                 </div>
              </div>
           </div>

        </div>

        {/* RIGHT COLUMN: Brand Ethos & Legal Governance */}
        <div className="lg:col-span-6 space-y-6">
           
           {/* Brand Ethos */}
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                 <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    <FaShieldAlt size={16} />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Brand Ethos / About</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Public Narrative Manifesto</p>
                 </div>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 leading-relaxed italic whitespace-pre-line">
                 {settings?.aboutText}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                 <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Copyright Marker</span>
                    <span className="text-xs font-bold text-slate-900">© 2026 Shyam Bhog Inc.</span>
                 </div>
                 <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Global Tagline</span>
                    <span className="text-xs font-bold text-slate-900">Made with श्रद्धा by Shyam Bhog Team</span>
                 </div>
              </div>
           </div>

           {/* Legal Governance Summary */}
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                 <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                    <FaBalanceScale size={16} />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Legal Governance Protocols</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master Terms, Privacy & Reversals</p>
                 </div>
              </div>

              <div className="space-y-3">
                 <details className="bg-slate-50 border border-slate-100 rounded-2xl p-4 cursor-pointer group">
                    <summary className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex justify-between items-center">
                       <span>Service Nature & Scope</span>
                       <span className="text-orange-600 font-bold text-base group-open:rotate-180 transition-transform">▾</span>
                    </summary>
                    <div className="mt-3 text-[11px] font-semibold text-slate-600 whitespace-pre-line leading-relaxed border-t border-slate-200/60 pt-3">
                       {settings?.serviceNature}
                    </div>
                 </details>

                 <details className="bg-slate-50 border border-slate-100 rounded-2xl p-4 cursor-pointer group">
                    <summary className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex justify-between items-center">
                       <span>Master Terms & Conditions</span>
                       <span className="text-orange-600 font-bold text-base group-open:rotate-180 transition-transform">▾</span>
                    </summary>
                    <div className="mt-3 text-[11px] font-semibold text-slate-600 whitespace-pre-line leading-relaxed border-t border-slate-200/60 pt-3">
                       {settings?.termsContent}
                    </div>
                 </details>

                 <details className="bg-slate-50 border border-slate-100 rounded-2xl p-4 cursor-pointer group">
                    <summary className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex justify-between items-center">
                       <span>Global Privacy Directive</span>
                       <span className="text-orange-600 font-bold text-base group-open:rotate-180 transition-transform">▾</span>
                    </summary>
                    <div className="mt-3 text-[11px] font-semibold text-slate-600 whitespace-pre-line leading-relaxed border-t border-slate-200/60 pt-3">
                       {settings?.privacyPolicy}
                    </div>
                 </details>

                 <details className="bg-slate-50 border border-slate-100 rounded-2xl p-4 cursor-pointer group">
                    <summary className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex justify-between items-center">
                       <span>Capital Reversal Policy</span>
                       <span className="text-orange-600 font-bold text-base group-open:rotate-180 transition-transform">▾</span>
                    </summary>
                    <div className="mt-3 text-[11px] font-semibold text-slate-600 whitespace-pre-line leading-relaxed border-t border-slate-200/60 pt-3">
                       {settings?.refundPolicy}
                    </div>
                 </details>
              </div>
           </div>

        </div>

      </div>

      {/* ── DANGER ZONE (SYSTEM RESET) ── */}
      <div className="bg-red-50 rounded-3xl p-6 md:p-8 border border-red-200 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-left">
          <h3 className="text-base font-black text-red-900 uppercase tracking-tight">Danger Zone: Reset System Metrics & Orders</h3>
          <p className="text-xs text-red-700 font-medium">Clear all test orders, test transactions, and test accounts. Reset total revenue and active orders to ₹0.</p>
        </div>
        <button
          type="button"
          disabled={saving}
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
          className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shrink-0 active:scale-95"
        >
          {saving ? "Resetting..." : "Clear Test Data & Reset Revenue"}
        </button>
      </div>

    </div>
  );
}
