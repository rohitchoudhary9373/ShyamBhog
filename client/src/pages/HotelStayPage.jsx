import { useState, useEffect } from 'react';
import API from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBed, FaPhoneAlt, FaMapMarkerAlt, FaStar, FaGlobe, FaSearch, FaTimes, FaChevronLeft } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getMediaUrl } from '../utils/url';

export default function HotelStayPage() {
   const { t } = useTranslation();
   const navigate = useNavigate();
   const [hotels, setHotels] = useState([]);
   const [faqs, setFaqs] = useState([]);
   const [loading, setLoading] = useState(true);
   const [activeFilter, setActiveFilter] = useState('All');
   const [openFaq, setOpenFaq] = useState(null);

   useEffect(() => {
      const fetchData = async () => {
         try {
            const [hotelRes, faqRes] = await Promise.all([
               API.get('/hotels'),
               API.get('/faq?category=Hotel')
            ]);
            setHotels(Array.isArray(hotelRes.data) ? hotelRes.data : (hotelRes.data?.data || []));
            setFaqs(Array.isArray(faqRes.data) ? faqRes.data : (faqRes.data?.data || []));
         } catch (err) {
            console.error(err);
         } finally {
            setLoading(false);
         }
      };
      fetchData();
   }, []);

   const filters = ['All', '5 Star', '4 Star', '3 Star'];
   const filteredHotels = activeFilter === 'All' 
      ? hotels 
      : hotels.filter(h => `${h.stars} Star` === activeFilter);

   if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF8F1]">
         <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-primary font-black uppercase tracking-widest text-[10px] italic">{t('hotel.loading_vault') || 'Locating Best Stays...'}</p>
         </div>
      </div>
   );

   return (
      <div className="min-h-screen bg-[#FDF8F1] pb-24 font-sans animate-fade-in">
         
         {/* ── LUXURY HEADER ── */}
         <nav className="w-full max-w-xl mx-auto px-6 pt-10 pb-8 flex flex-col items-center text-center gap-2 relative">
            <button 
               onClick={() => navigate('/')} 
               className="absolute left-6 top-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-center text-slate-400 hover:text-orange-600 transition-all active:scale-90 border border-slate-100"
            >
               <FaChevronLeft size={14}/>
            </button>
            <h1 className="text-3xl font-black text-[#0A1128] tracking-tighter uppercase italic">Hotel <span className="text-orange-600 underline decoration-orange-200">Stay</span></h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse"></span>
               Sacred Rest in Khatu Dham
            </p>
         </nav>

         {/* 🏷️ FILTER TABS */}
         <div className="sticky top-0 z-40 bg-[#FDF8F1]/80 backdrop-blur-md py-6 px-6 border-b border-orange-100/50">
            <div className="max-w-xl mx-auto flex justify-center gap-3 overflow-x-auto no-scrollbar">
               {filters.map(f => (
                  <button 
                     key={f}
                     onClick={() => setActiveFilter(f)}
                     className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        activeFilter === f ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-100 hover:border-primary'
                     }`}
                  >
                     {f}
                  </button>
               ))}
            </div>
         </div>

         <div className="max-w-xl mx-auto px-6 pt-10 space-y-12">
            
            {/* 🏨 HOTEL LIST */}
            <div className="grid grid-cols-1 gap-10">
               <AnimatePresence mode="popLayout">
                  {filteredHotels.map((hotel, idx) => (
                     <motion.div 
                        key={hotel._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-[40px] overflow-hidden border border-orange-50 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] group"
                     >
                  { (hotel.imageUrl || hotel.image) && (
                     <div className="relative h-64 overflow-hidden bg-slate-50">
                        <img 
                           src={getMediaUrl(hotel.imageUrl || hotel.image)} 
                           alt={hotel.name} 
                           className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                           onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop'; }}
                        />
                        <div className="absolute top-6 left-6 flex gap-2">
                           <div className="bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border border-white/10">
                              <FaStar className="text-primary" /> {hotel.stars} {t('hotel.star')}
                           </div>
                           { (hotel.distanceFromTemple || hotel.distance) && (hotel.distanceFromTemple !== 'undefined' && hotel.distance !== 'undefined') && (
                              <div className="bg-white/90 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                 <FaMapMarkerAlt className="text-primary" /> {hotel.distanceFromTemple || hotel.distance} {t('hotel.near_temple')}
                              </div>
                           )}
                        </div>
                     </div>
                  )}

                        <div className="p-8">
                           <div className="flex justify-between items-start mb-4">
                              <div className="flex-1 min-w-0 pr-4">
                                 <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter truncate leading-tight">{hotel.name}</h3>
                                 <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 line-clamp-1">{hotel.address}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t('hotel.starting_from')}</p>
                                 <p className="text-xl font-black text-primary leading-none">
                                    { (hotel.priceRange || hotel.price) ? ( (hotel.priceRange || hotel.price).toString().startsWith('₹') ? (hotel.priceRange || hotel.price) : `₹${(hotel.priceRange || hotel.price)}` ) : 'N/A' }
                                 </p>
                              </div>
                           </div>

                           <div className="flex flex-wrap gap-2 mb-8">
                              {hotel.features && hotel.features.length > 0 ? hotel.features.map((feature, fIdx) => (
                                 <span key={fIdx} className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-slate-100">
                                    {feature}
                                 </span>
                              )) : (
                                 <span className="text-slate-300 text-[8px] font-black uppercase tracking-widest italic">Divine Stay Amenities</span>
                              )}
                           </div>

                           <div className="flex gap-3">
                              <a 
                                 href={`tel:${hotel.contactNumber || hotel.phone}`} 
                                 className="flex-1 bg-slate-900 text-white py-4 rounded-[20px] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl active:scale-95"
                              >
                                 <FaPhoneAlt size={12}/> {t('hotel.call') || 'Call'}
                              </a>
                               <a 
                                  href={hotel.googleLocationUrl || hotel.location || `https://www.google.com/maps/search/${encodeURIComponent(hotel.name + " Khatu Shyam Ji")}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="flex-1 bg-slate-50 text-slate-600 border border-slate-100 py-4 rounded-[20px] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                               >
                                  <FaMapMarkerAlt size={12}/> {t('hotel.view_map') || 'View Map'}
                               </a>
                           </div>
                        </div>
                     </motion.div>
                  ))}
               </AnimatePresence>

               {filteredHotels.length === 0 && (
                  <div className="py-32 text-center">
                     <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm opacity-30">🛎️</div>
                     <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] italic">{t('hotel.no_hotels_found') || 'No hotels match your divine selection.'}</p>
                  </div>
               )}
            </div>

            {/* ❓ HOTEL FAQS */}
            {faqs.length > 0 && (
               <section className="pt-12 border-t border-orange-100">
                  <h2 className="text-2xl font-serif font-bold text-center mb-10 text-slate-900 uppercase tracking-widest">{t('hotel.faq_title') || 'Hotel Queries'}</h2>
                  <div className="space-y-4">
                     {faqs.map(faq => (
                        <div key={faq._id} className="bg-white rounded-[28px] border border-orange-50 shadow-sm overflow-hidden">
                           <button 
                              onClick={() => setOpenFaq(openFaq === faq._id ? null : faq._id)}
                              className="w-full text-left px-8 py-6 flex justify-between items-center group"
                           >
                              <span className="text-sm font-black text-slate-700 uppercase tracking-tight group-hover:text-primary transition-colors">{faq.question}</span>
                              <span className={`text-xl transition-transform duration-300 ${openFaq === faq._id ? 'rotate-180 text-primary' : 'text-slate-300'}`}>↓</span>
                           </button>
                           <AnimatePresence>
                              {openFaq === faq._id && (
                                 <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                 >
                                    <div className="px-8 pb-8 text-xs text-slate-500 font-medium leading-relaxed border-t border-slate-50 pt-6 italic">
                                       {faq.answer}
                                    </div>
                                 </motion.div>
                              )}
                           </AnimatePresence>
                        </div>
                     ))}
                  </div>
               </section>
            )}

         </div>
      </div>
   );
}
