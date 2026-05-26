import { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  FaParking, FaSave, FaLink, FaMapMarkedAlt, 
  FaInfoCircle, FaSyncAlt, FaArrowRight, FaShieldAlt 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManageParking() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ url: '', description: '' });

  useEffect(() => {
    const fetchParking = async () => {
      try {
        const res = await API.get('/parking');
        if (res.data) setForm(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchParking();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put('/parking', form);
    } catch (err) {
      alert("Error updating parking");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="py-40 text-center flex flex-col items-center justify-center gap-4">
       <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Syncing Logistics Hub...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* ── LOGISTICS HEADER ── */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#0A1128] text-white flex items-center justify-center shadow-lg">
                 <FaMapMarkedAlt size={20} />
              </div>
              <h1 className="text-3xl font-black text-[#0A1128] tracking-tighter uppercase italic">Parking <span className="text-orange-600 not-italic">Intel</span></h1>
           </div>
           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] ml-1">Geospatial Navigation & Logistics Governance</p>
        </div>

        <div className="flex items-center gap-4 bg-white px-6 py-3.5 rounded-[28px] border border-slate-200 shadow-sm">
           <div className="flex flex-col border-r border-slate-100 pr-6">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Hub Status</span>
              <span className="text-[11px] font-black text-[#0A1128] uppercase tracking-tighter">Operational</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-black text-xs">
                 1
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Master Navigation Node</span>
           </div>
        </div>
      </header>

      {/* ── NAVIGATION CONFIGURATOR ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
         <div className="xl:col-span-7">
            <form onSubmit={handleUpdate} className="bg-white p-10 xl:p-14 rounded-[48px] border border-slate-200/60 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.03)] space-y-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/50 rounded-full blur-[60px] -mr-32 -mt-32"></div>
               
               <div className="flex justify-between items-center relative z-10">
                  <div>
                     <h2 className="text-2xl font-black text-[#0A1128] tracking-tighter uppercase italic">Manifest <span className="text-orange-600 not-italic">Deployer</span></h2>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure geospatial ritual access</p>
                  </div>
                  <div className="w-14 h-14 rounded-[24px] bg-slate-50 flex items-center justify-center text-2xl group cursor-pointer overflow-hidden">
                     <FaParking className="text-orange-500 group-hover:scale-125 transition-transform duration-500" />
                  </div>
               </div>

               <div className="space-y-8 relative z-10">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                        <FaLink className="text-orange-500" size={10} /> Geospatial Coordinates (Maps URL)
                     </label>
                     <div className="relative group">
                        <input 
                           type="url" 
                           required 
                           value={form.url} 
                           onChange={e => setForm({...form, url: e.target.value})} 
                           placeholder="https://goo.gl/maps/ritual-access" 
                           className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-black text-[13px] text-[#0A1128] transition-all" 
                        />
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                        <FaInfoCircle className="text-orange-500" size={10} /> Logistics Manifest (Description)
                     </label>
                     <textarea 
                        value={form.description} 
                        onChange={e => setForm({...form, description: e.target.value})} 
                        placeholder="Detailed navigation protocols for devotees..."
                        className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[28px] outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-[13px] text-slate-600 resize-none h-40 leading-relaxed italic" 
                     />
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100 relative z-10 flex flex-col items-center gap-8">
                  <button 
                     type="submit" 
                     disabled={saving}
                     className="w-full py-5 bg-[#0A1128] text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-2xl shadow-slate-200 active:scale-95 disabled:opacity-50 group"
                  >
                     {saving ? 'Synchronizing Nodes...' : 'Deploy Navigation Manifest'}
                     <FaArrowRight className="inline-block ml-3 group-hover:translate-x-2 transition-transform" />
                  </button>
               </div>
            </form>
         </div>

         <div className="xl:col-span-5 space-y-8">
            <div className="bg-[#0A1128] p-10 rounded-[48px] shadow-2xl relative overflow-hidden group h-full flex flex-col">
               <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
               <div className="flex items-center gap-3 mb-8 relative z-10">
                  <FaShieldAlt className="text-orange-500" size={20} />
                  <h3 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">Logistics Protocols</h3>
               </div>
               
               <div className="space-y-6 relative z-10 flex-grow">
                  <ProtocolItem 
                     number="01" 
                     title="Geospatial Accuracy" 
                     text="Ensure navigation links utilize precise Google Maps lat/long coordinates for maximum devotee reliability." 
                  />
                  <ProtocolItem 
                     number="02" 
                     title="Manifest Clarity" 
                     text="Logistics description should include entrance markers, gate identifiers, and approximate walking durations." 
                  />
                  <ProtocolItem 
                     number="03" 
                     title="Sync Verification" 
                     text="Always verify the navigation payload via mobile device after deployment to ensure cross-platform stability." 
                  />
               </div>

               <div className="mt-10 p-6 bg-white/5 rounded-[32px] border border-white/5 relative z-10">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center animate-pulse">
                        <FaSyncAlt size={16} />
                     </div>
                     <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">Global navigation nodes are automatically synchronized upon deployment.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function ProtocolItem({ number, title, text }) {
   return (
      <div className="flex gap-6 p-6 bg-white/5 rounded-[28px] border border-white/5 hover:bg-white/10 transition-all duration-500 group/item">
         <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-black text-sm shrink-0 group-hover/item:bg-orange-600 group-hover/item:text-white transition-all duration-500">
            {number}
         </div>
         <div className="space-y-1">
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest group-hover/item:text-orange-500 transition-colors">{title}</h4>
            <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic line-clamp-3">"{text}"</p>
         </div>
      </div>
   );
}
