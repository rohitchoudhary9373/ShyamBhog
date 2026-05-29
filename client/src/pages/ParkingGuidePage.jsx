import { useState, useEffect } from 'react';
import API from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
   FaParking, 
   FaMapMarkerAlt, 
   FaShieldAlt, 
   FaChevronLeft, 
   FaCompass, 
   FaCheckCircle,
   FaPlus,
   FaMinus
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

export default function ParkingGuidePage() {
   const { t } = useTranslation();
   const navigate = useNavigate();
   const { settings } = useSettings();
   const settingsAdminId = settings?.adminId;
   const [parkings, setParkings] = useState([]);
   const [faqs, setFaqs] = useState([]);
   const [loading, setLoading] = useState(true);
   const [filter, setFilter] = useState('All');
   const [openFaq, setOpenFaq] = useState(null);

   useEffect(() => {
      const fetchData = async () => {
         try {
            const tenantId = settingsAdminId || localStorage.getItem('tenantId') || '';
            console.log(`[ParkingGuidePage] Fetching parkings for tenantId: "${tenantId}"`);
            const [parkRes, faqRes] = await Promise.all([
               API.get(`/parking?tenantId=${tenantId}`),
               API.get(`/faq?category=Parking&tenantId=${tenantId}`)
            ]);
            console.log('[ParkingGuidePage] API Responses received:', { parkings: parkRes.data, faqs: faqRes.data });
            setParkings(parkRes.data);
            const faqArray = Array.isArray(faqRes.data) ? faqRes.data : (faqRes.data.data || []);
            setFaqs(faqArray.filter(f => f.isActive));
         } catch (err) {
            console.error("Failed to load data", err);
         } finally {
            setLoading(false);
         }
      };
      fetchData();
   }, [settingsAdminId]);

   const filteredParkings = filter === 'All' 
      ? parkings 
      : parkings.filter(p => p.type === filter);

   if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF8F1]">
         <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
   );

   return (
      <div className="min-h-screen bg-[#FDF8F1] flex flex-col items-center font-sans selection:bg-orange-100">
         
         {/* ── LUXURY HEADER ── */}
         <nav className="w-full max-w-xl px-6 pt-10 pb-8 flex flex-col items-center text-center gap-2 relative">
            <button 
               onClick={() => navigate('/')} 
               className="absolute left-6 top-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-center text-slate-400 hover:text-orange-600 transition-all active:scale-90 border border-slate-100"
            >
               <FaChevronLeft size={14}/>
            </button>
            <h1 className="text-3xl font-black text-[#0A1128] tracking-tighter uppercase italic">Safe <span className="text-orange-600 underline decoration-orange-200">Parking</span></h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse"></span>
               Verified Official Zones
            </p>
         </nav>

         <main className="w-full max-w-xl px-6 pb-32">

            {/* 🕹️ MODERN PILL FILTERS */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 py-2">
               {['All', 'Government', 'Private'].map((type) => (
                  <button
                     key={type}
                     onClick={() => setFilter(type)}
                     className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shrink-0 border ${
                        filter === type 
                           ? 'bg-[#0A1128] text-white border-[#0A1128] shadow-lg' 
                           : 'bg-white text-slate-400 border-slate-100 hover:border-orange-200'
                     }`}
                  >
                     {type === 'All' ? 'Everywhere' : type === 'Government' ? 'Government' : 'Private Zones'}
                  </button>
               ))}
            </div>

            {/* 🅿️ ELITE PARKING CARDS */}
            <div className="flex flex-col gap-6 mb-16">
               <AnimatePresence mode="popLayout">
                  {filteredParkings.map((p, idx) => (
                     <motion.div
                        key={p._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-[32px] p-6 border border-orange-100/50 shadow-xl shadow-orange-900/5 group hover:border-orange-400 transition-all"
                     >
                        <div className="flex justify-between items-start mb-6">
                           <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-2.5 py-1 rounded-lg border border-orange-100/50 w-fit">
                                 <FaCheckCircle size={8} />
                                 <span className="text-[8px] font-black uppercase tracking-widest">{p.type} Authorized</span>
                              </div>
                              <h3 className="text-xl font-black text-[#0A1128] uppercase tracking-tighter mt-1">{p.name}</h3>
                           </div>
                           <div className="text-right flex flex-col items-end">
                              <span className="text-xl font-black text-orange-600 tracking-tighter leading-none">{p.distance || '1km'}</span>
                              <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mt-0.5">away</p>
                           </div>
                        </div>

                        <p className="text-slate-500 text-[11px] font-medium leading-relaxed mb-6 opacity-80 line-clamp-2">{p.description}</p>

                        <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                           <div className="flex items-center gap-2 text-slate-400">
                              <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center">
                                 <FaMapMarkerAlt size={10} className="text-orange-600" />
                              </div>
                              <span className="text-[8px] font-black uppercase tracking-widest">Khatu Shyam Ji</span>
                           </div>
                           <a 
                              href={p.mapUrl || '#'} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-2.5 bg-[#0A1128] text-white px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg active:scale-95"
                           >
                              <FaCompass size={11} />
                              Navigate
                           </a>
                        </div>
                     </motion.div>
                  ))}
               </AnimatePresence>
            </div>

            {/* ❓ PREMIUM FAQ SECTION */}
            <section className="mb-20">
               <div className="flex items-center gap-4 mb-8">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-orange-100"></div>
                  <h2 className="text-xl font-black text-[#0A1128] uppercase tracking-tighter italic">Parking <span className="text-orange-600">Queries</span></h2>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-orange-100"></div>
               </div>
               
               <div className="flex flex-col gap-3">
                  {faqs.map((faq, idx) => (
                     <div 
                        key={faq._id} 
                        className={`bg-white rounded-[24px] border border-orange-100/30 transition-all overflow-hidden ${openFaq === idx ? 'shadow-xl border-orange-200' : 'shadow-sm'}`}
                     >
                        <button
                           onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                           className="w-full p-5 flex items-center justify-between text-left"
                        >
                           <span className="font-black text-[#0A1128] text-[11px] pr-6 uppercase tracking-tight">{faq.question}</span>
                           <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${openFaq === idx ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                              {openFaq === idx ? <FaMinus size={10} /> : <FaPlus size={10} />}
                           </div>
                        </button>
                        <AnimatePresence>
                           {openFaq === idx && (
                              <motion.div
                                 initial={{ height: 0, opacity: 0 }}
                                 animate={{ height: 'auto', opacity: 1 }}
                                 exit={{ height: 0, opacity: 0 }}
                                 className="overflow-hidden"
                              >
                                 <div className="px-5 pb-5 text-slate-500 text-[11px] font-medium leading-relaxed border-t border-slate-50 pt-4">
                                    {faq.answer}
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                  ))}
               </div>
            </section>

            {/* 🛡️ OFFICIAL TRUST FOOTER */}
            <footer className="text-center py-10 opacity-30 flex flex-col items-center gap-3">
               <FaShieldAlt size={20} className="text-[#0A1128]"/>
               <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#0A1128]">
                  Official Parking Guide
               </p>
            </footer>

         </main>
      </div>
   );
}
