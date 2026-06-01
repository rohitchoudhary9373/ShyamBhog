import { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  FaUsers, FaClock, FaCheckCircle, FaExclamationTriangle, 
  FaSyncAlt, FaShieldAlt, FaInfoCircle, FaBroadcastTower, 
  FaArrowRight, FaPlus, FaTrash, FaSave, FaEye, FaToggleOn, 
  FaToggleOff, FaExclamationCircle, FaListUl, FaBolt, FaStar, 
  FaCircle, FaShareAlt, FaWhatsapp, FaTelegram, FaTwitter, 
  FaInstagram, FaHashtag, FaLink, FaChartLine
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManageCrowd() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    title: 'Live Crowd Status',
    subtitle: 'Real-time darshan insights from Khatu Shyam Dham',
    status: 'Low',
    waitingTime: '15-30 Mins',
    bestSlot: 'Anytime Now',
    percentage: 15,
    description: 'Peaceful darshan environment. Smooth movement through all corridors.',
    liveStatusText: 'Live Sync Active',
    isLive: true,
    emergencyBanner: '',
    slots: [],
    advisories: [],
    weekly: [
      { day: 'Mon', intensity: 15 },
      { day: 'Tue', intensity: 20 },
      { day: 'Wed', intensity: 40 },
      { day: 'Thu', intensity: 15 },
      { day: 'Fri', intensity: 50 },
      { day: 'Sat', intensity: 90 },
      { day: 'Sun', intensity: 95 }
    ],
    shareConfig: {
      enableSharing: true,
      platforms: { whatsapp: true, telegram: true, twitter: true, instagram: true },
      template: {
        title: 'Live Crowd Update from Khatu Shyam Dham',
        message: '🔱 Live Crowd Status: {status}\n⏳ Wait Time: {wait}\n🏰 Temple: {temple}\n\nCheck live updates here: {link}',
        footer: 'Official Digital Platform',
        hashtags: '#KhatuShyamJi #LiveDarshan #CrowdStatus'
      },
      brandLogo: '',
      ctaText: 'Share Live Status'
    },
    analytics: { totalShares: 0, whatsappShares: 0, telegramShares: 0, twitterShares: 0, instagramShares: 0, linkClicks: 0 }
  });

  const [activeTab, setActiveTab] = useState('hero'); 
  const [waitTimes, setWaitTimes] = useState([]);
  const [waitLoading, setWaitLoading] = useState(false);

  const [newEntry, setNewEntry] = useState({
    exactDate: '',
    weekday: 'Monday',
    lines: [{ range: 'Line 1 - 4', time: '15 min', label: '' }],
    priority: 0,
    isActive: true
  });
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');

  const addLine = () => {
    setNewEntry(prev => ({
      ...prev,
      lines: [...prev.lines, { range: '', time: '', label: '' }]
    }));
  };

  const removeLine = (idx) => {
    setNewEntry(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== idx)
    }));
  };

  const updateLine = (idx, field, val) => {
    const updatedLines = [...newEntry.lines];
    updatedLines[idx][field] = val;
    setNewEntry(prev => ({
      ...prev,
      lines: updatedLines
    }));
  };

  const handleSaveWaitTime = async (e) => {
    e.preventDefault();
    try {
      let entriesToSave = [];
      if (isBulkMode) {
        if (!bulkStartDate || !bulkEndDate) {
          alert("Please select both Start Date and End Date.");
          return;
        }
        let current = new Date(bulkStartDate + 'T00:00:00');
        const end = new Date(bulkEndDate + 'T00:00:00');
        while (current <= end) {
          const year = current.getFullYear();
          const month = String(current.getMonth() + 1).padStart(2, '0');
          const day = String(current.getDate()).padStart(2, '0');
          const dStr = `${year}-${month}-${day}`;
          
          const options = { weekday: 'long' };
          const wDay = new Intl.DateTimeFormat('en-US', options).format(current);

          entriesToSave.push({
            exactDate: dStr,
            weekday: wDay,
            lines: newEntry.lines,
            priority: newEntry.priority,
            isActive: newEntry.isActive
          });
          current.setDate(current.getDate() + 1);
        }
      } else {
        let weekdayVal = newEntry.weekday;
        if (newEntry.exactDate) {
          const dateObj = new Date(newEntry.exactDate + 'T00:00:00');
          const options = { weekday: 'long' };
          weekdayVal = new Intl.DateTimeFormat('en-US', options).format(dateObj);
        }
        entriesToSave.push({
          ...newEntry,
          weekday: weekdayVal
        });
      }

      await API.post('/crowd-status/wait-times/bulk', { entries: entriesToSave });
      alert("Wait times configuration saved successfully! 🙏");
      fetchWaitTimes();
      setNewEntry({ exactDate: '', weekday: 'Monday', lines: [{ range: 'Line 1 - 4', time: '15 min', label: '' }], priority: 0, isActive: true });
      setIsBulkMode(false);
      setBulkStartDate('');
      setBulkEndDate('');
    } catch (err) {
      console.error(err);
      alert("Failed to save wait times.");
    }
  };

  const handleDeleteWaitTime = async (id) => {
    if (!window.confirm("Are you sure you want to delete this configuration?")) return;
    try {
      await API.delete(`/crowd-status/wait-times/${id}`);
      fetchWaitTimes();
    } catch (err) {
      alert("Failed to delete wait time config.");
    }
  };

  const handleToggleActiveWaitTime = async (item) => {
    try {
      await API.put(`/crowd-status/wait-times/${item._id}`, { isActive: !item.isActive });
      fetchWaitTimes();
    } catch (err) {
      alert("Failed to toggle status.");
    }
  };

  const handleDuplicateWeekday = (item) => {
    setNewEntry({
      exactDate: '',
      weekday: item.weekday,
      lines: item.lines.map(l => ({ ...l })),
      priority: item.priority || 0,
      isActive: item.isActive
    });
    alert(`Duplicated configuration template for ${item.weekday}! Customize details in form.`);
  };

  useEffect(() => {
    fetchData();
    fetchWaitTimes();
  }, []);

  const fetchWaitTimes = async () => {
    setWaitLoading(true);
    try {
      const res = await API.get('/crowd-status/wait-times/admin');
      setWaitTimes(res.data || []);
    } catch (err) {
      console.error("Error fetching admin wait times:", err);
    } finally {
      setWaitLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('userInfo'));
      const tenantId = user?.role === 'agent' ? user?.parentAdmin : user?._id;
      const res = await API.get(`/crowd-status?tenantId=${tenantId}`);
      if (res.data) {
          setData(prev => ({ 
            ...prev, 
            ...res.data,
            weekly: res.data.weekly || prev.weekly
          }));
      }
    } catch (err) {
      console.error("Error fetching status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await API.put('/crowd-status', data);
      alert("Platform Infrastructure Synchronized Successfully!");
    } catch (err) {
      alert("Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  // Helper functions for slots/advisories...
  const addSlot = () => setData({ ...data, slots: [...data.slots, { title: '', startTime: '', endTime: '', level: 'Low', notes: '', order: data.slots.length }] });
  const updateSlot = (index, field, val) => { const newSlots = [...data.slots]; newSlots[index][field] = val; setData({ ...data, slots: newSlots }); };
  const removeSlot = (index) => setData({ ...data, slots: data.slots.filter((_, i) => i !== index) });
  
  const addAdvisory = () => setData({ ...data, advisories: [...data.advisories, { text: '', order: data.advisories.length }] });
  const updateAdvisory = (index, val) => { const newAdv = [...data.advisories]; newAdv[index].text = val; setData({ ...data, advisories: newAdv }); };
  const removeAdvisory = (index) => setData({ ...data, advisories: data.advisories.filter((_, i) => i !== index) });

  if (loading) return (
    <div className="py-40 text-center flex flex-col items-center justify-center gap-4">
       <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
       <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest animate-pulse">Syncing Monitoring Grid...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* ── MONITORING HEADER ── */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                 <FaBroadcastTower size={20} />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Crowd <span className="text-orange-600 not-italic">Matrix</span></h1>
           </div>
           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] ml-1">Dynamic Intelligence & Social Governance</p>
        </div>

        <div className="flex items-center gap-4 bg-white px-6 py-3.5 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex flex-col border-r border-slate-100 pr-6">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Live Mode</span>
              <button onClick={() => setData({...data, isLive: !data.isLive})} className="flex items-center gap-2">
                 {data.isLive ? <FaToggleOn className="text-emerald-500 text-xl" /> : <FaToggleOff className="text-slate-300 text-xl" />}
                 <span className={`text-[10px] font-bold uppercase tracking-widest ${data.isLive ? 'text-emerald-600' : 'text-slate-400'}`}>{data.isLive ? 'Active' : 'Offline'}</span>
              </button>
           </div>
           <button onClick={handleUpdate} disabled={saving} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center gap-2 shadow-lg shadow-slate-200">
              <FaSave /> {saving ? 'Syncing...' : 'Publish Matrix'}
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
         
         <div className="xl:col-span-8 space-y-8">
            {/* TABS */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-white border border-slate-200 rounded-xl w-fit">
               {[
                 { id: 'hero', label: 'Hero Content', icon: <FaStar /> },
                 { id: 'slots', label: 'Time Slots', icon: <FaClock /> },
                 { id: 'advisory', label: 'Advisories', icon: <FaShieldAlt /> },
                 { id: 'weekly', label: 'Weekly Patterns', icon: <FaChartLine /> },
                 { id: 'share', label: 'Share Engine', icon: <FaShareAlt /> },
                 { id: 'waitTimes', label: 'Wait Manager', icon: <FaClock /> }
               ].map(tab => (
                 <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
                    {tab.icon} {tab.label}
                 </button>
               ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 xl:p-12 shadow-sm space-y-10">
               <AnimatePresence mode="wait">
                  {activeTab === 'hero' && (
                    <motion.div key="hero" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Page Title</label>
                             <input type="text" value={data.title} onChange={e => setData({...data, title: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold text-sm" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Live Subtitle</label>
                             <input type="text" value={data.subtitle} onChange={e => setData({...data, subtitle: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold text-sm" />
                          </div>
                       </div>
                       {/* Intensity Selector ... */}
                       <div className="space-y-4">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Intensity Governance</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             {['Low', 'Medium', 'High', 'Extreme'].map(lvl => (
                               <button key={lvl} onClick={() => setData({...data, status: lvl})} className={`px-4 py-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${data.status === lvl ? (lvl === 'Low' ? 'border-emerald-500 bg-emerald-50' : lvl === 'Medium' ? 'border-amber-500 bg-amber-50' : lvl === 'High' ? 'border-orange-500 bg-orange-50' : 'border-red-500 bg-red-50') : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'}`}>
                                  <div className={`w-3 h-3 rounded-full ${lvl === 'Low' ? 'bg-emerald-500' : lvl === 'Medium' ? 'bg-amber-500' : lvl === 'High' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                                  <span className={`text-xs font-bold uppercase tracking-widest ${data.status === lvl ? 'text-slate-900' : 'text-slate-400'}`}>{lvl}</span>
                               </button>
                             ))}
                          </div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                             <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Wait Duration</label>
                             <input type="text" value={data.waitingTime} onChange={e => setData({...data, waitingTime: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold text-sm" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Best Window</label>
                             <input type="text" value={data.bestSlot} onChange={e => setData({...data, bestSlot: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold text-sm" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Rush Meter %</label>
                             <input type="number" value={data.percentage} onChange={e => setData({...data, percentage: parseInt(e.target.value)})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold text-sm text-center" />
                          </div>
                       </div>
                    </motion.div>
                  )}

                  {activeTab === 'slots' && (
                    <motion.div key="slots" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                       <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase">Slot Registry</h3>
                          <button onClick={addSlot} className="bg-orange-50 text-orange-600 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all"><FaPlus className="inline mr-2" /> Add Slot</button>
                       </div>
                       <div className="space-y-4">
                          {data.slots.map((slot, i) => (
                             <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6 relative group">
                                <button onClick={() => removeSlot(i)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors"><FaTrash size={12} /></button>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                                   <div className="md:col-span-4 space-y-2"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Title</label><input type="text" value={slot.title} onChange={e => updateSlot(i, 'title', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-xs" /></div>
                                   <div className="md:col-span-3 space-y-2"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Start</label><input type="text" value={slot.startTime} onChange={e => updateSlot(i, 'startTime', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-xs" /></div>
                                   <div className="md:col-span-3 space-y-2"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">End</label><input type="text" value={slot.endTime} onChange={e => updateSlot(i, 'endTime', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-xs" /></div>
                                   <div className="md:col-span-2 space-y-2"><select value={slot.level} onChange={e => updateSlot(i, 'level', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-[10px] uppercase tracking-widest"><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Extreme">Extreme</option></select></div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </motion.div>
                  )}

                  {activeTab === 'advisory' && (
                    <motion.div key="advisory" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                       <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase">Protocol Ledger</h3>
                          <button onClick={addAdvisory} className="bg-orange-50 text-orange-600 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all"><FaPlus className="inline mr-2" /> New Notice</button>
                       </div>
                       <div className="space-y-4">
                          {data.advisories.map((adv, i) => (
                             <div key={i} className="flex gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 items-center">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-[10px] shrink-0">{i+1}</div>
                                <input type="text" value={adv.text} onChange={e => updateAdvisory(i, e.target.value)} className="flex-1 bg-transparent border-none outline-none font-bold text-sm text-slate-600 italic" />
                                <button onClick={() => removeAdvisory(i)} className="text-slate-300 hover:text-red-500 transition-colors"><FaTrash size={12} /></button>
                             </div>
                          ))}
                       </div>
                    </motion.div>
                  )}

                  {activeTab === 'share' && (
                    <motion.div key="share" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
                       <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                          <div>
                             <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase italic">Share <span className="text-orange-600 not-italic">Engine</span></h3>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global propagation & Social tracking</p>
                          </div>
                          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Master Switch</span>
                             <button onClick={() => setData({...data, shareConfig: {...data.shareConfig, enableSharing: !data.shareConfig.enableSharing}})}>
                                {data.shareConfig.enableSharing ? <FaToggleOn className="text-emerald-500 text-2xl" /> : <FaToggleOff className="text-slate-300 text-2xl" />}
                             </button>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-6">
                             <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center"><FaChartLine size={14} /></div>
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Propagation Stats</h4>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Impact</p>
                                   <p className="text-2xl font-bold text-slate-900 tracking-tighter">{data.analytics.totalShares}</p>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">WhatsApp</p>
                                   <p className="text-2xl font-bold text-emerald-600 tracking-tighter">{data.analytics.whatsappShares}</p>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Telegram</p>
                                   <p className="text-2xl font-bold text-blue-500 tracking-tighter">{data.analytics.telegramShares}</p>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Link Clicks</p>
                                   <p className="text-2xl font-bold text-orange-600 tracking-tighter">{data.analytics.linkClicks}</p>
                                </div>
                             </div>
                          </div>

                          <div className="space-y-6">
                             <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center"><FaShareAlt size={14} /></div>
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Platform Toggles</h4>
                             </div>
                             <div className="space-y-3">
                                {Object.keys(data.shareConfig.platforms).map(p => (
                                   <div key={p} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                      <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm uppercase font-bold text-[8px]">{p.charAt(0)}</div>
                                         <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">{p} Integration</span>
                                      </div>
                                      <button onClick={() => setData({...data, shareConfig: {...data.shareConfig, platforms: {...data.shareConfig.platforms, [p]: !data.shareConfig.platforms[p]}}})}>
                                         {data.shareConfig.platforms[p] ? <FaToggleOn className="text-emerald-500 text-xl" /> : <FaToggleOff className="text-slate-300 text-xl" />}
                                      </button>
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>

                       <div className="space-y-8 pt-6 border-t border-slate-50">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center"><FaHashtag size={14} /></div>
                             <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Dynamic Message Template</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Share Title</label>
                                <input type="text" value={data.shareConfig.template.title} onChange={e => setData({...data, shareConfig: {...data.shareConfig, template: {...data.shareConfig.template, title: e.target.value}}})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold text-sm" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Global Hashtags</label>
                                <input type="text" value={data.shareConfig.template.hashtags} onChange={e => setData({...data, shareConfig: {...data.shareConfig, template: {...data.shareConfig.template, hashtags: e.target.value}}})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold text-sm" />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">WhatsApp / Social Message</label>
                             <textarea value={data.shareConfig.template.message} onChange={e => setData({...data, shareConfig: {...data.shareConfig, template: {...data.shareConfig.template, message: e.target.value}}})} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-orange-500 font-medium text-sm leading-relaxed italic resize-none" rows="4" />
                             <p className="text-[10px] font-medium text-slate-400 italic px-2">Use tags: <span className="text-orange-500">{"{status}"}, {"{wait}"}, {"{temple}"}, {"{link}"}</span></p>
                          </div>
                       </div>
                    </motion.div>
                  )}

                  {activeTab === 'weekly' && (
                    <motion.div key="weekly" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                       <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                          <div>
                             <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Weekly Rush <span className="text-orange-600 not-italic">Patterns</span></h3>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Adjust historical weekly density estimates</p>
                          </div>
                       </div>
                       <div className="space-y-6">
                          {(data.weekly || []).map((w, idx) => (
                             <div key={idx} className="flex flex-col md:flex-row items-center gap-6 p-6 bg-slate-50/50 border border-slate-100 rounded-xl">
                                <div className="w-24 shrink-0 font-bold text-slate-700 uppercase tracking-widest text-xs italic">{w.day}</div>
                                <div className="flex-grow w-full flex items-center gap-4">
                                   <input 
                                     type="range" 
                                     min="0" 
                                     max="100" 
                                     value={w.intensity} 
                                     onChange={e => {
                                        const newWeekly = [...data.weekly];
                                        newWeekly[idx].intensity = parseInt(e.target.value);
                                        setData({...data, weekly: newWeekly});
                                     }}
                                     className="w-full accent-orange-650 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none" 
                                   />
                                   <input 
                                     type="number" 
                                     min="0" 
                                     max="100"
                                     value={w.intensity}
                                     onChange={e => {
                                        const newWeekly = [...data.weekly];
                                        newWeekly[idx].intensity = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                        setData({...data, weekly: newWeekly});
                                     }}
                                     className="w-16 px-3 py-2 bg-white border border-slate-150 rounded-xl font-bold text-center text-xs" 
                                   />
                             <span className="text-xs font-bold text-slate-400">%</span>
                                </div>
                             </div>
                          ))}
                       </div>
                     </motion.div>
                  )}

                  {activeTab === 'waitTimes' && (
                     <motion.div key="waitTimes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-50 pb-6 gap-4">
                           <div>
                              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Darshan Wait <span className="text-orange-600 not-italic">Manager</span></h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure line wait times for specific dates or recurring weekdays</p>
                           </div>
                           <div className="flex items-center gap-2">
                              <button
                                 type="button"
                                 onClick={() => setIsBulkMode(!isBulkMode)}
                                 className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                    isBulkMode 
                                       ? 'bg-orange-50 text-orange-600 border-orange-200' 
                                       : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                 }`}
                              >
                                 {isBulkMode ? "Switch to Single Entry" : "Switch to Bulk Dates"}
                              </button>
                           </div>
                        </div>

                        {/* CONFIGURATION FORM */}
                        <form onSubmit={handleSaveWaitTime} className="bg-slate-50/50 border border-slate-100 p-6 rounded-2xl space-y-6">
                           <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Add / Update Config</h4>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {isBulkMode ? (
                                 <>
                                    <div className="space-y-2">
                                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Start Date</label>
                                       <input 
                                          type="date" 
                                          required 
                                          value={bulkStartDate} 
                                          onChange={e => setBulkStartDate(e.target.value)} 
                                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-bold text-xs" 
                                       />
                                    </div>
                                    <div className="space-y-2">
                                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">End Date</label>
                                       <input 
                                          type="date" 
                                          required 
                                          value={bulkEndDate} 
                                          onChange={e => setBulkEndDate(e.target.value)} 
                                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-bold text-xs" 
                                       />
                                    </div>
                                 </>
                              ) : (
                                 <>
                                    <div className="space-y-2">
                                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Specific Date (One-off)</label>
                                       <input 
                                          type="date" 
                                          value={newEntry.exactDate} 
                                          onChange={e => setNewEntry({...newEntry, exactDate: e.target.value})} 
                                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-bold text-xs" 
                                       />
                                       <p className="text-[9px] text-slate-400 italic px-1">Leave empty to configure a recurring weekday template</p>
                                    </div>
                                    {!newEntry.exactDate && (
                                       <div className="space-y-2">
                                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Recurring Weekday</label>
                                          <select 
                                             value={newEntry.weekday} 
                                             onChange={e => setNewEntry({...newEntry, weekday: e.target.value})} 
                                             className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-bold text-xs"
                                          >
                                             {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                                <option key={day} value={day}>{day}</option>
                                             ))}
                                          </select>
                                       </div>
                                    )}
                                 </>
                              )}
                           </div>

                           {/* Lines Sub-section */}
                           <div className="space-y-3">
                              <div className="flex justify-between items-center px-1">
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lines configuration</label>
                                 <button 
                                    type="button" 
                                    onClick={addLine} 
                                    className="text-orange-600 text-[10px] font-bold uppercase tracking-widest hover:underline"
                                 >
                                    + Add Line Row
                                 </button>
                              </div>

                              <div className="space-y-3">
                                 {newEntry.lines.map((line, idx) => (
                                    <div key={idx} className="flex gap-2 items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                       <input 
                                          type="text" 
                                          required 
                                          value={line.range} 
                                          onChange={e => updateLine(idx, 'range', e.target.value)} 
                                          placeholder="e.g. Line 1 - 4" 
                                          className="flex-grow min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 font-semibold text-xs" 
                                       />
                                       <input 
                                          type="text" 
                                          required 
                                          value={line.time} 
                                          onChange={e => updateLine(idx, 'time', e.target.value)} 
                                          placeholder="e.g. 25 min" 
                                          className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 font-semibold text-xs" 
                                       />
                                       <input 
                                          type="text" 
                                          value={line.label || ''} 
                                          onChange={e => updateLine(idx, 'label', e.target.value)} 
                                          placeholder="Tag (e.g. Best)" 
                                          className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 font-semibold text-xs" 
                                       />
                                       {newEntry.lines.length > 1 && (
                                          <button 
                                             type="button" 
                                             onClick={() => removeLine(idx)} 
                                             className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-all"
                                          >
                                             <FaTrash size={12} />
                                          </button>
                                       )}
                                    </div>
                                 ))}
                              </div>
                           </div>

                           <div className="flex justify-end gap-2 pt-2">
                              <button 
                                 type="submit" 
                                 className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md"
                              >
                                 Save Wait Config
                              </button>
                           </div>
                        </form>

                        {/* LISTING SENSITIVE DATA GRID */}
                        <div className="space-y-4">
                           <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Active Wait-time Configurations</h4>
                           
                           {waitLoading ? (
                              <div className="text-center py-10">
                                 <div className="w-8 h-8 border-2 border-t-orange-500 rounded-full animate-spin mx-auto mb-2"></div>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Syncing Wait Registry...</p>
                              </div>
                           ) : waitTimes.length === 0 ? (
                              <div className="bg-slate-50/50 border border-dashed border-slate-200 p-10 rounded-2xl text-center text-slate-400 text-xs font-medium">
                                 No configurations found. Standard system fallback config is active.
                              </div>
                           ) : (
                              <div className="grid gap-3">
                                 {waitTimes.map((item) => (
                                    <div key={item._id} className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                       <div className="space-y-1.5 flex-grow">
                                          <div className="flex items-center gap-2 flex-wrap">
                                             {item.exactDate ? (
                                                <span className="px-2.5 py-0.5 bg-orange-600 text-white text-[9px] font-bold uppercase tracking-wider rounded-md">
                                                   Date: {item.exactDate}
                                                </span>
                                             ) : (
                                                <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 text-[9px] font-bold uppercase tracking-wider rounded-md">
                                                   Recurring Weekday
                                                 </span>
                                             )}
                                             <span className="text-xs font-extrabold text-slate-800">{item.weekday}</span>
                                             {!item.isActive && (
                                                <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[8px] font-bold uppercase tracking-wider rounded-full border border-red-100/50">Disabled</span>
                                             )}
                                          </div>
                                          <div className="flex flex-wrap gap-2 pt-1">
                                             {item.lines.map((l, lIdx) => (
                                                <span key={lIdx} className="bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-600 flex items-center gap-1.5">
                                                   {l.range}: <strong className="text-[#F07924]">{l.time}</strong>
                                                   {l.label && <span className="bg-emerald-50 text-emerald-600 text-[8px] px-1 rounded font-extrabold">{l.label}</span>}
                                                </span>
                                             ))}
                                          </div>
                                       </div>

                                       <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                          <button
                                             type="button"
                                             onClick={() => handleToggleActiveWaitTime(item)}
                                             className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all ${
                                                item.isActive 
                                                   ? 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100' 
                                                   : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                             }`}
                                          >
                                             {item.isActive ? "Disable" : "Enable"}
                                          </button>
                                          <button
                                             type="button"
                                             onClick={() => handleDuplicateWeekday(item)}
                                             className="px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-orange-100 text-orange-600 hover:bg-orange-50 transition-all"
                                          >
                                             Copy Setup
                                          </button>
                                          <button
                                             type="button"
                                             onClick={() => handleDeleteWaitTime(item._id)}
                                             className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                                          >
                                             <FaTrash size={12} />
                                          </button>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
         </div>

         {/* ── RIGHT PREVIEW ── */}
         <div className="xl:col-span-4 space-y-8">
            <div className="flex items-center gap-3 px-2">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Quick Actions</h3>
               <div className="h-[1px] flex-1 bg-slate-100"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <button className="bg-emerald-50 text-emerald-600 p-5 rounded-xl border border-emerald-100 flex flex-col items-center gap-2 hover:bg-emerald-500 hover:text-white transition-all">
                  <FaWhatsapp size={20} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Share Now</span>
               </button>
               <button className="bg-blue-50 text-blue-600 p-5 rounded-xl border border-blue-100 flex flex-col items-center gap-2 hover:bg-blue-500 hover:text-white transition-all">
                  <FaLink size={20} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Copy Link</span>
               </button>
            </div>

            <div className="bg-[#FDF8F1] border border-orange-100/50 rounded-2xl overflow-hidden shadow-sm border border-slate-200 sticky top-6 scale-95 origin-top">
               <div className="p-6 space-y-6">
                  {activeTab === 'waitTimes' ? (
                     <div className="space-y-4">
                        <div className="text-center space-y-2">
                           <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-orange-100 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                              <FaCircle className="text-orange-500 animate-pulse" size={6} /> Live Wait Preview
                           </span>
                        </div>
                        <div className="bg-[#FFFDF9]/85 backdrop-blur-md rounded-2xl border border-[#F07924]/80 p-5 shadow-[0_8px_30px_rgba(240,121,36,0.06)] space-y-3.5 text-left">
                           <div className="flex items-center justify-between border-b border-orange-50 pb-2.5">
                              <span className="text-xs font-semibold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                                 <span className="w-1.5 h-1.5 rounded-full bg-[#F07924]"></span>
                                 Darshan Wait Time
                              </span>
                              <span className="text-[9px] font-extrabold text-[#F07924] uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded-full">
                                 {isBulkMode ? "Bulk dates" : (newEntry.exactDate ? newEntry.exactDate : newEntry.weekday)}
                              </span>
                           </div>
                           <div className="space-y-2">
                              {newEntry.lines.map((line, idx) => (
                                 <div key={idx} className="flex items-center justify-between py-2 px-3 bg-white/70 rounded-xl border border-orange-100/30 gap-2">
                                    <span className="text-[11px] font-bold text-slate-800">{line.range || 'Range Config'}</span>
                                    <div className="flex items-center gap-1.5">
                                       <span className="text-[11px] font-extrabold text-[#F07924] bg-orange-50/50 px-2 py-0.5 rounded-lg border border-orange-100/20">{line.time || '15 min'}</span>
                                       {line.label && (
                                          <span className="text-[8px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100/30 px-1.5 py-0.5 rounded-md">{line.label}</span>
                                       )}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                        <p className="text-[9px] text-slate-400 italic text-center">Changes will reflect immediately on client page</p>
                     </div>
                  ) : (
                     <>
                        <div className="text-center space-y-2">
                           <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-orange-100 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                              <FaCircle className="text-orange-500 animate-pulse" size={6} /> Live Feed
                           </span>
                           <h4 className="text-2xl font-bold text-slate-900 tracking-tight">{data.shareConfig.template.title}</h4>
                        </div>

                        <div className={`bg-white rounded-2xl border p-6 flex flex-col items-center text-center gap-4 ${data.status === 'Low' ? 'border-emerald-100' : 'border-orange-100'} shadow-xl`}>
                           <h5 className={`text-4xl font-bold uppercase ${data.status === 'Low' ? 'text-emerald-600' : 'text-orange-600'}`}>{data.status}</h5>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Wait: {data.waitingTime}</p>
                           <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden mt-2">
                              <div className="h-full bg-orange-500" style={{width: `${data.percentage}%`}}></div>
                           </div>
                        </div>

                        <div className="p-6 bg-white/40 border border-white rounded-2xl text-center">
                           <p className="text-[10px] font-bold text-slate-400 italic line-clamp-3">"{data.shareConfig.template.message.replace('{status}', data.status).replace('{wait}', data.waitingTime).replace('{temple}', 'Khatu Shyam Ji')}"</p>
                        </div>

                        <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl">
                           {data.shareConfig.ctaText}
                        </button>
                     </>
                  )}
               </div>
            </div>
         </div>

      </div>

    </div>
  );
}
