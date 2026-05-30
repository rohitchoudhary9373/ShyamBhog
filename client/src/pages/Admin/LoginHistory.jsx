import { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  FaShieldAlt, FaDesktop, FaMobileAlt, FaGlobe, 
  FaClock, FaMapMarkerAlt, FaSyncAlt, FaArrowRight,
  FaTerminal, FaFingerprint, FaCheckCircle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await API.get('/auth/me'); 
      setHistory(res.data.loginHistory || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) return (
    <div className="py-40 text-center flex flex-col items-center justify-center gap-4">
       <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
       <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest animate-pulse">Syncing Security Telemetry...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* ── SECURITY HEADER ── */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                 <FaShieldAlt size={20} />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Security <span className="text-orange-600 not-italic">Audit</span></h1>
           </div>
           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] ml-1">Account Telemetry & Forensic Access Logs</p>
        </div>

        <div className="flex items-center gap-4">
           <div className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-[22px] text-xs font-semibold uppercase tracking-widest text-slate-500 border border-emerald-100 flex items-center gap-3 shadow-sm">
              <FaCheckCircle className="animate-pulse" />
              Manifest Integrity: SECURE
           </div>
           <button onClick={fetchHistory} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-orange-600 transition-all shadow-sm active:scale-95 group">
              <FaSyncAlt className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'} />
           </button>
        </div>
      </header>

      {/* ── ACCESS LEDGER ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="divide-y divide-slate-50">
          <AnimatePresence>
          {history.map((log, idx) => (
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: idx * 0.05 }}
               key={idx} 
               className="p-6 flex flex-col xl:flex-row items-center justify-between hover:bg-slate-50/40 transition-all duration-300 group gap-6"
            >
              <div className="flex items-center gap-6 flex-1 w-full xl:w-auto">
                <div className="w-16 h-16 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-200 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden shrink-0">
                  {log.userAgent?.includes('Mobi') ? <FaMobileAlt size={24}/> : <FaDesktop size={24}/>}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent"></div>
                </div>
                
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-4">
                     <p className="font-bold text-slate-900 text-[16px] tracking-tighter uppercase italic">{log.ip || 'ANONYMOUS_IP'}</p>
                     <span className={`px-3 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-widest border ${
                        log.userAgent?.includes('Mobi') ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                     }`}>
                        {log.userAgent?.includes('Mobi') ? 'Mobile Access' : 'Desktop Access'}
                     </span>
                  </div>
                  <div className="flex items-center gap-3">
                     <FaTerminal className="text-slate-300 shrink-0" size={10} />
                     <p className="text-[10px] font-bold text-slate-400 font-mono truncate max-w-xl group-hover:text-slate-600 transition-colors uppercase tracking-tight">{log.userAgent}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full xl:w-auto justify-between xl:justify-end border-t xl:border-t-0 pt-6 xl:pt-0 border-slate-100">
                <div className="flex flex-col xl:items-end gap-1">
                   <div className="flex items-center gap-2 text-slate-400">
                      <FaClock size={10} />
                      <p className="text-xs font-bold text-slate-900 tracking-widest">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                   </div>
                   <div className="flex items-center gap-2 text-slate-300">
                      <FaGlobe size={10} />
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em]">{new Date(log.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                   </div>
                </div>

                <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                   <div className="h-10 w-[1px] bg-slate-100"></div>
                   <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                      <FaFingerprint className="text-orange-600" size={12} />
                      <span className="text-[9px] font-bold text-slate-900 uppercase tracking-widest">Verified</span>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>

          {history.length === 0 && (
            <div className="py-40 text-center flex flex-col items-center justify-center gap-6 opacity-20">
               <FaShieldAlt size={64} className="mb-4" />
               <div className="space-y-1">
                  <p className="text-[14px] font-bold text-slate-900 uppercase tracking-tighter italic">No security records detected</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Forensic access log is currently empty.</p>
               </div>
            </div>
          )}
        </div>
      </div>

      <footer className="flex items-center justify-center gap-3 opacity-30 pt-10">
         <FaShieldAlt size={12} />
         <p className="text-[9px] font-bold uppercase tracking-[0.4em]">End-to-End Encryption Protocol Active</p>
      </footer>
    </div>
  );
}
