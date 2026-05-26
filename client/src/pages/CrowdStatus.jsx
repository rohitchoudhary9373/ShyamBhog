import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { 
  FaUsers, FaClock, FaCalendarAlt, FaHistory, 
  FaChevronRight, FaArrowLeft, FaBolt, FaStar,
  FaMapMarkerAlt, FaShieldAlt, FaCircle, FaExclamationTriangle,
  FaSyncAlt, FaShareAlt, FaWhatsapp, FaTelegram, FaTwitter, 
  FaInstagram, FaDownload, FaCopy, FaCheck, FaInfoCircle, FaVolumeUp,
  FaArrowUp, FaLeaf, FaExternalLinkAlt, FaChevronLeft
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';

export default function CrowdStatus() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [crowd, setCrowd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('today');
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [copying, setCopying] = useState(false);
  const shareRef = useRef(null);
  const popupRef = useRef(null);

  useEffect(() => {
    fetchCrowdStatus();
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowSharePopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [settings?.adminId]);

  const fetchCrowdStatus = async () => {
    try {
      const tenantId = settings?.adminId || '';
      const res = await API.get(`/crowd-status?tenantId=${tenantId}`);
      setCrowd(res.data);
    } catch (err) {
      console.error("Error fetching crowd status:", err);
    } finally {
      setLoading(false);
    }
  };

  const trackShare = async (platform) => {
    try {
      await API.post('/crowd-status/share', { 
        tenantId: settings?.adminId || '', 
        platform 
      });
    } catch (err) {
      console.error("Share tracking failed", err);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Extreme':
        return {
          label: 'Critical Peak', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200',
          glow: 'shadow-[0_0_40px_-10px_rgba(220,38,38,0.2)]', bar: 'from-red-500 to-red-700', ambient: 'bg-red-500/5', pulse: 'bg-red-500'
        };
      case 'High':
        return {
          label: 'Heavy Density', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100',
          glow: 'shadow-[0_0_40px_-10px_rgba(234,88,12,0.15)]', bar: 'from-orange-500 to-orange-700', ambient: 'bg-orange-500/5', pulse: 'bg-orange-600'
        };
      case 'Medium':
        return {
          label: 'Moderate Flow', color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-100',
          glow: 'shadow-[0_0_40px_-10px_rgba(217,119,6,0.1)]', bar: 'from-amber-400 to-amber-600', ambient: 'bg-amber-500/5', pulse: 'bg-amber-500'
        };
      default:
        return {
          label: 'Smooth Flow', color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-100',
          glow: 'shadow-[0_0_40px_-10px_rgba(5,150,105,0.1)]', bar: 'from-emerald-400 to-emerald-600', ambient: 'bg-emerald-500/5', pulse: 'bg-emerald-500'
        };
    }
  };

  const config = getStatusConfig(crowd?.status);

  const getShareMessage = () => {
    if (!crowd?.shareConfig?.template) return '';
    let msg = crowd.shareConfig.template.message;
    msg = msg.replace('{status}', crowd.status)
             .replace('{wait}', crowd.waitingTime)
             .replace('{temple}', settings?.brandName || 'Khatu Shyam Ji')
             .replace('{link}', window.location.href);
    return `${msg}\n\n${crowd.shareConfig.template.hashtags}`;
  };

  const downloadSnapshot = async (platform = 'instagram') => {
    const canvas = await html2canvas(shareRef.current, {
      backgroundColor: '#FFFBF5',
      scale: 2,
      logging: false,
      useCORS: true
    });
    const link = document.createElement('a');
    link.download = `CrowdStatus_${settings?.brandName || 'ShyamBhog'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    trackShare(platform);
    setShowSharePopup(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopying(true);
    trackShare('link');
    setTimeout(() => {
      setCopying(false);
      setShowSharePopup(false);
    }, 2000);
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(getShareMessage())}`, '_blank');
    trackShare('whatsapp');
    setShowSharePopup(false);
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(getShareMessage())}`, '_blank');
    trackShare('telegram');
    setShowSharePopup(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col items-center justify-center p-10 gap-6">
       <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-[2px] border-orange-100 rounded-full"></div>
          <div className="absolute inset-0 border-[2px] border-t-orange-600 rounded-full animate-spin"></div>
       </div>
       <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Syncing Intel...</p>
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#FFFBF5] pb-16 font-sans selection:bg-orange-100 transition-colors duration-1000 relative overflow-hidden`}>
      
      {/* 🔮 AMBIENCE 🔮 */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-orange-50/40 to-transparent pointer-events-none -z-10"></div>

      {/* 🚨 EMERGENCY ALERTS 🚨 */}
      <AnimatePresence>
         {crowd?.emergencyBanner && (
           <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-[#B91C1C] text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest text-center relative z-[110] shadow-xl">
              <span>{crowd.emergencyBanner}</span>
           </motion.div>
         )}
      </AnimatePresence>

      {/* ── LUXURY HEADER ── */}
      <nav className="w-full max-w-xl mx-auto px-6 pt-10 pb-8 flex flex-col items-center text-center gap-2 relative">
         <button 
            onClick={() => navigate('/')} 
            className="absolute left-6 top-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-center text-slate-400 hover:text-orange-600 transition-all active:scale-90 border border-slate-100"
         >
            <FaChevronLeft size={14}/>
         </button>
         <h1 className="text-3xl font-black text-[#0A1128] tracking-tighter uppercase italic">Bheed <span className="text-orange-600 underline decoration-orange-200">Bhad</span></h1>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${crowd?.status === 'High' ? 'bg-red-500' : 'bg-green-500'}`}></span>
            Live Density Intel
         </p>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-8">
        
        {/* ── COMPACT MAIN CARD ── */}
        <section className="relative">
           <div className={`absolute inset-0 blur-[80px] transition-colors duration-1000 ${config.ambient} opacity-30 -z-10`}></div>

           <motion.div 
             initial={{ opacity: 0, y: 20 }} 
             animate={{ opacity: 1, y: 0 }}
             className={`bg-white/95 backdrop-blur-3xl rounded-[26px] border border-white/60 p-7 shadow-xl ${config.glow} relative overflow-hidden group`}
           >
              {/* ── INLINE SHARE ── */}
              {crowd?.shareConfig?.enableSharing && (
                <div className="absolute top-6 right-6 z-20">
                   <button 
                     onClick={() => setShowSharePopup(!showSharePopup)}
                     className="w-8 h-8 rounded-full bg-white border border-orange-100/40 flex items-center justify-center text-[#0A1128] shadow-sm hover:shadow-md hover:scale-105 transition-all"
                   >
                      <FaShareAlt size={12} />
                   </button>

                   <AnimatePresence>
                      {showSharePopup && (
                        <motion.div 
                          ref={popupRef}
                          initial={{ opacity: 0, scale: 0.95, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 5 }}
                          className="absolute top-10 right-0 w-48 bg-white/98 backdrop-blur-xl rounded-[22px] border border-orange-100/20 shadow-2xl p-4 space-y-4 z-[100] origin-top-right"
                        >
                           <span className="text-[9px] font-black text-[#0A1128] uppercase tracking-[0.2em] block border-b border-orange-50 pb-2">Share Status</span>
                           <div className="grid grid-cols-2 gap-2">
                              {crowd?.shareConfig?.platforms?.whatsapp && (
                                <button onClick={shareWhatsApp} className="flex flex-col items-center gap-1.5 p-2.5 bg-emerald-50 rounded-xl hover:bg-emerald-500 hover:text-white transition-all group">
                                   <FaWhatsapp size={14} />
                                   <span className="text-[7px] font-black uppercase">WhatsApp</span>
                                </button>
                              )}
                              <button onClick={() => downloadSnapshot('instagram')} className="flex flex-col items-center gap-1.5 p-2.5 bg-pink-50 rounded-xl hover:bg-pink-500 hover:text-white transition-all group">
                                 <FaInstagram size={14} />
                                 <span className="text-[7px] font-black uppercase">IG Story</span>
                              </button>
                              <button onClick={copyLink} className="flex flex-col items-center gap-1.5 p-2.5 bg-slate-50 rounded-xl hover:bg-[#0A1128] hover:text-white transition-all group">
                                 {copying ? <FaCheck size={14} className="text-emerald-500" /> : <FaCopy size={14} />}
                                 <span className="text-[7px] font-black uppercase">{copying ? 'Copied' : 'Link'}</span>
                              </button>
                              <button onClick={() => downloadSnapshot('download')} className="flex flex-col items-center gap-1.5 p-2.5 bg-orange-50 rounded-xl hover:bg-orange-600 hover:text-white transition-all group">
                                 <FaDownload size={14} />
                                 <span className="text-[7px] font-black uppercase">Card</span>
                              </button>
                           </div>
                        </motion.div>
                      )}
                   </AnimatePresence>
                </div>
              )}

              <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                 {/* MINI ICON */}
                 <div className="relative">
                    <div className={`w-16 h-16 rounded-[22px] ${config.bg} ${config.color} flex items-center justify-center text-3xl shadow-sm transition-transform duration-500 hover:scale-105`}>
                       <FaUsers />
                    </div>
                    <div className={`absolute -inset-3 rounded-[26px] border border-dashed ${config.border} opacity-20 animate-spin-slow`}></div>
                 </div>

                 <div className="space-y-1">
                    <motion.h2 key={crowd?.status} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-4xl font-black ${config.color} tracking-tight uppercase`}>
                       {crowd?.status}
                    </motion.h2>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Intensity Index</p>
                 </div>

                 {/* COMPACT STAT GRID */}
                 <div className="w-full grid grid-cols-2 gap-4">
                    <div className="bg-slate-50/50 rounded-[20px] p-4 border border-slate-100 group/stat transition-all">
                       <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-2 group-hover/stat:bg-orange-500 group-hover/stat:text-white transition-colors">
                          <FaClock size={14} />
                       </div>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">Wait Est.</p>
                       <p className="text-lg font-black text-[#0A1128] tracking-tight">{crowd?.waitingTime}</p>
                    </div>
                    <div className="bg-slate-50/50 rounded-[20px] p-4 border border-slate-100 group/stat transition-all">
                       <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-2 group-hover/stat:bg-amber-500 group-hover/stat:text-white transition-colors">
                          <FaBolt size={14} />
                       </div>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">Prime</p>
                       <p className="text-sm font-black text-[#0A1128] tracking-tight">{crowd?.bestSlot}</p>
                    </div>
                 </div>

                 {/* SLIM DENSITY INDEX */}
                 <div className="w-full space-y-3">
                    <div className="flex justify-between items-end px-1">
                       <div className="flex items-center gap-1.5">
                          <FaStar className="text-orange-500" size={10} />
                          <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Density Index</span>
                       </div>
                       <span className={`text-[10px] font-black ${config.color} uppercase`}>{crowd?.percentage}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100/50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                       <motion.div initial={{ width: 0 }} animate={{ width: `${crowd?.percentage}%` }} transition={{ duration: 1.5 }} className={`h-full rounded-full bg-gradient-to-r ${config.bar}`} />
                    </div>
                 </div>

                 <div className="w-full p-5 bg-[#0A1128]/5 rounded-[22px] border border-[#0A1128]/5">
                    <p className="text-[12px] font-bold text-slate-700 italic leading-snug line-clamp-2">
                       "{crowd?.description}"
                    </p>
                 </div>
              </div>
           </motion.div>
        </section>

        {/* ── COMPACT TOGGLE ── */}
        <section className="space-y-6">
           <div className="flex p-1 bg-white rounded-[20px] border border-orange-100/60 shadow-sm w-fit mx-auto">
              {['today', 'weekly'].map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} className={`px-8 py-3 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all relative ${viewMode === mode ? 'text-white' : 'text-slate-400'}`}>
                   {viewMode === mode && ( <motion.div layoutId="miniPill" className="absolute inset-0 bg-[#0A1128] rounded-[16px]" /> )}
                   <span className="relative z-10">{mode}</span>
                </button>
              ))}
           </div>

           <AnimatePresence mode="wait">
             {viewMode === 'today' ? (
               <motion.div key="today" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid gap-3">
                  {(crowd?.slots || []).map((slot, i) => (
                    <div key={i} className="bg-white p-4 rounded-[22px] border border-orange-50 shadow-sm flex items-center justify-between group transition-all hover:border-orange-200">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 group-hover:bg-[#0A1128] group-hover:text-white transition-all"><FaClock size={16} /></div>
                          <div><h4 className="text-[13px] font-black text-[#0A1128] leading-none mb-1 uppercase italic">{slot.title}</h4><span className="text-[9px] font-bold text-slate-400 italic">{slot.startTime} - {slot.endTime}</span></div>
                       </div>
                       <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${slot.level === 'Low' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>{slot.level}</span>
                    </div>
                  ))}
               </motion.div>
             ) : (
               <motion.div key="weekly" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white p-8 rounded-[32px] border border-orange-50 shadow-lg">
                  <div className="flex items-end justify-between h-40 gap-4">
                     {[{day:'Mon', intensity:15},{day:'Tue', intensity:20},{day:'Wed', intensity:40},{day:'Thu', intensity:15},{day:'Fri', intensity:50},{day:'Sat', intensity:90},{day:'Sun', intensity:95}].map((d, i) => (
                       <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                          <div className="w-full flex-grow relative flex flex-col justify-end"><motion.div initial={{ height: 0 }} animate={{ height: `${d.intensity}%` }} className={`w-full rounded-t-xl bg-orange-500/80 group-hover:bg-orange-500 transition-colors`} /></div>
                          <span className="text-[9px] font-black text-[#0A1128] uppercase opacity-40 group-hover:opacity-100">{d.day}</span>
                       </div>
                     ))}
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </section>

        {/* ── SLIM ADVISORY ── */}
        <section className="space-y-5 pt-4">
           <div className="flex items-center gap-3 px-1"><FaShieldAlt className="text-orange-600" size={14} /><h3 className="text-[11px] font-black text-[#0A1128] uppercase tracking-widest">Safety Protocol</h3></div>
           <div className="grid gap-3">
              {crowd?.advisories?.length > 0 ? crowd.advisories.map((adv, i) => (
                <div key={i} className="bg-white p-5 rounded-[22px] border border-orange-50 shadow-sm flex gap-4 group">
                   <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 font-black text-sm">{i+1}</div>
                   <p className="text-[12px] font-bold text-slate-700 italic opacity-90 pt-1.5">{adv.text}</p>
                </div>
              )) : (
                <div className="bg-emerald-50/30 p-8 rounded-[32px] border border-emerald-100/30 text-center space-y-3">
                   <FaLeaf size={20} className="text-emerald-500 mx-auto animate-pulse" />
                   <h4 className="text-[11px] font-black text-emerald-900 uppercase">Status: Optimal</h4>
                </div>
              )}
           </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="text-center pt-10 pb-6 opacity-20 flex justify-center items-center gap-8">
           <FaMapMarkerAlt size={20} /><FaInfoCircle size={20} /><FaHistory size={20} />
        </footer>

      </div>

      {/* ── HIDDEN SNAPSHOT ── */}
      <div className="absolute -left-[9999px]"><div ref={shareRef} className="bg-[#FFFBF5] p-10 rounded-[40px] border border-orange-100 shadow-sm space-y-8"><div className="flex justify-between items-start"><div><h4 className="text-3xl font-black text-[#0A1128] tracking-tighter">{settings?.brandName || 'Khatu Shyam Ji'}</h4><p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-1">{crowd?.shareConfig?.template?.title}</p></div><div className="w-12 h-12 bg-[#0A1128] rounded-2xl flex items-center justify-center text-white"><FaUsers size={20} /></div></div><div className={`p-8 rounded-[32px] bg-white border ${config.border} flex flex-col items-center text-center gap-4`}><h2 className={`text-5xl font-black ${config.color} uppercase tracking-tighter`}>{crowd?.status}</h2><div className="grid grid-cols-2 gap-4 w-full"><div className="p-5 bg-slate-50 rounded-2xl"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Wait Time</p><p className="text-xl font-black text-slate-900">{crowd?.waitingTime}</p></div><div className="p-5 bg-slate-50 rounded-2xl"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Intensity</p><p className="text-xl font-black text-slate-900">{crowd?.percentage}%</p></div></div></div></div></div>

    </div>
  );
}
