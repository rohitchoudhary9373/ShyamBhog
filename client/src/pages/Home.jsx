import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { getMediaUrl } from '../utils/url';
import { FaVideo, FaUsers, FaParking, FaBed, FaArrowRight, FaWhatsapp, FaShoppingCart, FaStar, FaBolt, FaShieldAlt, FaPrayingHands, FaRegCompass } from 'react-icons/fa';

export default function Home() {
  const { cart, addToCart, updateQuantity } = useCart();
  const { settings } = useSettings();
  const settingsAdminId = settings?.adminId;
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [activeTab, setActiveTab] = useState('Arjee');
  const [loading, setLoading] = useState(true);

  // Hub Data States
  const [crowd, setCrowd] = useState(null);
  const [parking, setParking] = useState(null);
  const [hotel, setHotel] = useState(null);

  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({ name: '', message: '' });

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tenantId = settingsAdminId || '';
        console.log(`[Home] Fetching devotee data for tenantId: "${tenantId}"`);
        const [srvRes, faqRes, galRes, feedRes, crowdRes, parkRes, hotelRes] = await Promise.all([
          API.get(`/services?tenantId=${tenantId}`).catch(() => ({ data: [] })),
          API.get(`/faq?tenantId=${tenantId}`).catch(() => ({ data: [] })),
          API.get(`/gallery?tenantId=${tenantId}`).catch(() => ({ data: [] })),
          API.get(`/feedback?tenantId=${tenantId}`).catch(() => ({ data: [] })),
          API.get(`/crowd-status?tenantId=${tenantId}`).catch(() => ({ data: null })),
          API.get(`/parking?tenantId=${tenantId}`).catch(() => ({ data: null })),
          API.get(`/hotel-stay?tenantId=${tenantId}`).catch(() => ({ data: null }))
        ]);

        console.log('[Home] API Responses received:', {
          services: srvRes.data,
          faqs: faqRes.data,
          gallery: galRes.data,
          feedback: feedRes.data,
          crowd: crowdRes.data,
          parking: parkRes.data,
          hotel: hotelRes.data
        });

        const servicesArray = Array.isArray(srvRes.data) ? srvRes.data : (srvRes.data.data || []);
        setServices(servicesArray.filter(s => s.isActive));

        const faqArray = Array.isArray(faqRes.data) ? faqRes.data : (faqRes.data?.data || []);
        setFaqs(faqArray.filter(f => f.isActive !== false && f.category !== 'Hotel' && f.category !== 'Parking'));

        const galleryArray = Array.isArray(galRes.data) ? galRes.data : (galRes.data.data || []);
        setGalleries(galleryArray.filter(g => g.isActive));
        setFeedbacks(Array.isArray(feedRes.data) ? feedRes.data : []);

        setCrowd(crowdRes.data);
        setParking(parkRes.data);
        setHotel(hotelRes.data);

        const style = document.createElement('style');
        style.innerHTML = '.gallery-iframe-container iframe { pointer-events: none; }';
        document.head.appendChild(style);

      } catch (error) {
        console.error("Critical error fetching home data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [settingsAdminId]);

  const filteredServices = services.filter(s => s.category === activeTab);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const tenantId = settingsAdminId || '';
      await API.post('/feedback', { ...feedbackForm, tenantId });
      alert('Thank you! Your feedback has been submitted for review.');
      setFeedbackForm({ name: '', message: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting feedback');
    }
  };

  const getInstaThumbnail = (url) => {
    if (!url) return null;
    try {
      const match = url.match(/\/(?:p|reels|reel)\/([A-Za-z0-9_-]+)/);
      if (match && match[1]) {
        const rawUrl = `https://www.instagram.com/p/${match[1]}/media/?size=l`;
        return `https://images.weserv.nl/?url=${encodeURIComponent(rawUrl)}`;
      }
    } catch (e) { console.error(e); }
    return null;
  };

  const getImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80';
    return getMediaUrl(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex flex-col items-center justify-center p-10 gap-4">
         <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Syncing Portal...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-[#FFFBF5] min-h-screen pt-2 pb-8 font-sans selection:bg-orange-100">

      {/* ── HERO ── */}
      <section className="w-full max-w-xl px-6 mb-4 text-center animate-fade-in pt-2">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-3 px-4 py-1.5 bg-white rounded-full border border-orange-100 shadow-sm">
           <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
           <span className="text-[9px] font-black text-[#0A1128] uppercase tracking-[0.3em]">Official Platform</span>
        </motion.div>
      </section>

      {/* ── DIVINE HUB ── */}
      <section className="w-full max-w-xl px-6 mb-12">
        <div className="grid grid-cols-2 gap-3">
          {[
            { to: "/watch-arjee", icon: <FaVideo size={16} />, title: t('home.watch_arjee'), desc: 'Live Stream' },
            { to: "/crowd-status", icon: <FaUsers size={16} />, title: t('home.bheed_alert'), desc: 'Live Crowd', badge: true },
            { to: "/parking-guide", icon: <FaParking size={16} />, title: t('home.parking'), desc: 'Nav Guide' },
            { to: "/hotel-stay", icon: <FaBed size={16} />, title: t('home.hotel_stay'), desc: 'Stay Guide' }
          ].map((item, idx) => (
            <Link key={idx} to={item.to} className="group relative bg-white p-5 rounded-[24px] border border-orange-50 hover:border-orange-500/20 transition-all duration-500 shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4 group-hover:bg-[#0A1128] group-hover:text-white transition-all duration-500 shadow-inner">
                {item.icon}
              </div>
              <div className="flex items-center gap-1.5 justify-center">
                <h3 className="text-[10px] font-black text-[#0A1128] tracking-tight uppercase group-hover:text-orange-600 transition-colors italic">{item.title}</h3>
                {item.badge && <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${crowd?.status === 'High' ? 'bg-red-500' : 'bg-green-500'}`}></span>}
              </div>
              <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1.5 opacity-60">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TABS ── */}
      <div className="flex gap-8 mb-10 w-full max-w-xl justify-center px-6">
        {['Arjee', 'Bhog', 'Swamani'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 transition-all relative text-sm font-bold ${activeTab === tab ? 'text-[#0A1128]' : 'text-slate-400 hover:text-slate-900'}`}
          >
            <span className="relative">
              {tab}
              {tab === 'Swamani' && (
                <span className="absolute -top-3 -right-6 bg-[#6366f1] text-white text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter">NEW</span>
              )}
            </span>
            {activeTab === tab && (
              <motion.div layoutId="tabLineHome" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
            )}
          </button>
        ))}
      </div>

      {/* ── PREMIUM OFFERING FEED ── */}
      <div className="w-full max-w-xl px-6 mb-20">
        <div className={activeTab === 'Bhog' ? "grid grid-cols-2 gap-4 md:gap-6" : "flex flex-col gap-10"}>
          {filteredServices.length === 0 ? (
            <div className={activeTab === 'Bhog' ? "col-span-full py-20 text-center bg-white rounded-[32px] border border-dashed border-orange-100/50" : "py-20 text-center bg-white rounded-[32px] border border-dashed border-orange-100/50"}>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No offerings in this category</p>
            </div>
          ) : (
            filteredServices.map(service => {
              const isRecurring = service.paymentMode === 'recurring';
              const isInCart = cart.find(i => i._id === service._id);

              if (activeTab === 'Bhog') {
                return (
                  <motion.div
                    key={service._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-[28px] p-3 border border-orange-50 shadow-sm hover:shadow-xl transition-all group flex flex-col"
                  >
                    {/* Compact Image */}
                    <div className="relative aspect-square rounded-[20px] overflow-hidden mb-3">
                      <img 
                        src={getImageUrl(service.imageUrl)} 
                        alt={service.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" 
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80'; }}
                      />
                      <div className="absolute top-2 right-2">
                         <div className="px-2 py-0.5 bg-white/90 backdrop-blur-md rounded-full text-[8px] font-bold text-orange-600 shadow-sm">
                            Few slots left
                         </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="px-1 flex-1 flex flex-col gap-1">
                      <div className="flex flex-col">
                        <h3 className="text-sm font-bold text-slate-900 truncate">{service.title}</h3>
                        {service.unit && (
                          <span className="text-[10px] font-bold text-slate-400">{service.unit}</span>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-black text-slate-900 tracking-tighter">₹{service.price}</span>
                          
                          {/* Compact Circular Add/Quantity Control */}
                          {isInCart ? (
                            <div className="flex items-center bg-orange-50 rounded-full p-0.5 border border-orange-100 h-8 shadow-sm">
                               <button onClick={() => updateQuantity(service._id, isInCart.quantity - 1)} className="w-6 h-6 bg-white text-slate-900 rounded-full font-bold text-[10px] flex items-center justify-center shadow-sm">-</button>
                               <span className="px-2 text-[10px] font-bold text-orange-700">{isInCart.quantity}</span>
                               <button onClick={() => updateQuantity(service._id, isInCart.quantity + 1)} className="w-6 h-6 bg-white text-slate-900 rounded-full font-bold text-[10px] flex items-center justify-center shadow-sm">+</button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => addToCart(service)} 
                              className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all hover:bg-orange-600"
                            >
                              <span className="text-lg font-light">+</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Primary Actions Area */}
                      <div className="mt-2">
                        <Link to={`/services/detail/${service._id}`} className="w-full bg-orange-600 text-white h-9 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center justify-center hover:bg-orange-700 transition-all active:scale-95">
                           Buy Now
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              }

              // Arjee/Swamani Full Width Layout
              return (
                <motion.div
                  key={service._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-[32px] p-4 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                >
                  {/* Image with Tag inside */}
                  <div className="relative aspect-[16/8] rounded-[24px] overflow-hidden">
                     <img 
                       src={getImageUrl(service.imageUrl)} 
                       alt={service.title} 
                       className="w-full h-full object-cover" 
                       onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80'; }}
                     />
                    <div className="absolute top-4 right-4">
                       <div className="px-3 py-1 bg-white/80 backdrop-blur-md rounded-full text-[10px] font-bold text-slate-800 shadow-sm border border-white/50">
                          {service.tag || "Few slots left"}
                       </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="pt-5 px-1 pb-1">
                    <div className="flex justify-between items-center mb-1">
                       <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                          {service.title}
                       </h3>
                       <div className="text-right">
                          <span className="text-xl font-bold text-slate-900">₹{service.price}</span>
                          {isRecurring && <span className="text-[10px] block font-bold text-slate-400 uppercase tracking-tighter">/ monthly</span>}
                       </div>
                    </div>

                    <div className="flex justify-between items-end">
                       <p className="text-[11px] font-medium text-slate-400 max-w-[65%] leading-relaxed">
                          {service.description || "A dedicated Arjee, Reserved just for you."}
                       </p>
                       <div className="flex items-center gap-2">
                          <Link to={`/services/detail/${service._id}`} className="bg-[#722F1E] text-white px-8 py-2.5 rounded-full text-xs font-bold shadow-lg hover:brightness-110 transition-all active:scale-95">
                             Book Now
                          </Link>
                       </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* View More Bhog Button */}
        {activeTab === 'Bhog' && services.filter(s => s.category === 'Bhog').length > 0 && (
           <div className="mt-12 flex justify-center">
              <button className="px-10 py-4 bg-white border border-orange-100 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-orange-50 transition-all active:scale-95">
                 View More Bhog Offerings
              </button>
           </div>
        )}
      </div>

      {/* ── FAQ ── */}
      <section className="w-full max-w-xl px-6 mb-20">
          <div className="mb-12 text-center">
             <h2 className="text-2xl md:text-3xl font-black text-[#0A1128] uppercase tracking-[0.2em]">{t('home.faq')}</h2>
          </div>
          <div className="space-y-4">
            {faqs.map(faq => (
              <div key={faq._id} className="bg-white rounded-[24px] border border-orange-50 overflow-hidden shadow-sm">
                <button onClick={() => setOpenFaq(openFaq === faq._id ? null : faq._id)} className="w-full text-left px-7 py-5 flex justify-between items-center font-black text-sm text-[#0A1128] hover:text-orange-600 transition-all">
                  <span className="pr-4">{faq?.question || 'Untitled Question'}</span>
                  <div className={`w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 transition-transform duration-500 ${openFaq === faq._id ? 'rotate-180 bg-orange-600 text-white shadow-lg' : ''}`}>▼</div>
                </button>
                <AnimatePresence>
                  {openFaq === faq._id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden bg-orange-50/20">
                       <div className="px-7 pb-6 text-slate-500 text-[13px] font-medium leading-relaxed italic border-t border-orange-50/50 pt-5 whitespace-pre-wrap">
                         {faq?.answer || 'No answer provided.'}
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

      {/* ── GALLERY ── */}
      {galleries.length > 0 && (
        <section className="w-full max-w-xl px-6 mb-20">
          <div className="mb-12 text-center">
             <h2 className="text-2xl md:text-3xl font-black text-[#0A1128] uppercase tracking-[0.2em]">{t('home.gallery')}</h2>
          </div>
          <div className="overflow-hidden -mx-6">
            <div className="flex w-fit gap-4 animate-scroll px-6 hover:[animation-play-state:paused]">
              {[...galleries, ...galleries].map((img, idx) => (
                <motion.div 
                  key={`${img._id}-${idx}`}
                  className="relative w-48 aspect-[4/5] rounded-[20px] overflow-hidden border border-orange-50 shadow-sm group shrink-0"
                >
                  {img.instagramUrl ? (
                     <a href={img.instagramUrl} target="_blank" rel="noreferrer" className="block w-full h-full">
                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 via-pink-500/20 to-indigo-600/20"></div>
                         <img 
                           src={getInstaThumbnail(img.instagramUrl) || getImageUrl(img.imageUrl)} 
                           alt={img.altText} 
                           className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
                           onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80'; }}
                         />
                        <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                              <FaRegCompass size={16} />
                           </div>
                        </div>
                     </a>
                  ) : (
                      <img 
                        src={getImageUrl(img.imageUrl)} 
                        alt={img.altText} 
                        className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80'; }}
                      />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      {feedbacks.length > 0 && (
        <section className="w-full max-w-xl px-6 mb-20">
          <div className="mb-12 text-center">
             <h2 className="text-2xl md:text-3xl font-black text-[#0A1128] uppercase tracking-[0.2em]">{t('home.what_devotees_say')}</h2>
          </div>
          <div className="overflow-hidden -mx-6">
             <div className="flex w-fit gap-4 animate-scroll px-6 hover:[animation-play-state:paused]">
                {[...feedbacks.filter(f => f.isApproved), ...feedbacks.filter(f => f.isApproved)].slice(0, 20).map((f, idx) => (
                   <div 
                     key={`${f._id}-${idx}`}
                     className="w-80 shrink-0 bg-white p-6 rounded-[28px] border border-orange-50 shadow-sm relative overflow-hidden"
                   >
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                         <FaStar size={40} className="text-orange-500" />
                      </div>
                      <div className="flex items-center gap-1.5 mb-3">
                         {[1,2,3,4,5].map(s => <FaStar key={s} className="text-orange-400" size={8} />)}
                      </div>
                      <p className="text-[13px] font-medium text-slate-600 italic leading-relaxed mb-4">"{f.message}"</p>
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-black text-orange-600 uppercase">
                            {f.name[0]}
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[11px] font-black text-[#0A1128] uppercase tracking-wider">{f.name}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t('home.verified_devotee')}</span>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        </section>
      )}

      {/* ── SUBMIT FEEDBACK ── */}
      <section className="w-full max-w-xl px-6 mb-20">
         <div className="bg-[#0A1128] rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
            <div className="relative z-10 space-y-6">
               <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">{t('home.write_to_us')}</h2>
                  <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest italic">{t('home.submit_feedback')}</p>
               </div>
               
               <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <input 
                    type="text" 
                    placeholder={t('home.placeholder_name')}
                    required
                    value={feedbackForm.name}
                    onChange={e => setFeedbackForm({...feedbackForm, name: e.target.value})}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-[20px] text-white font-bold text-xs outline-none focus:border-orange-500 transition-all"
                  />
                  <textarea 
                    placeholder={t('home.placeholder_feedback')}
                    required
                    value={feedbackForm.message}
                    onChange={e => setFeedbackForm({...feedbackForm, message: e.target.value})}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-[24px] text-white font-medium text-xs outline-none focus:border-orange-500 transition-all h-32 resize-none italic"
                  />
                  <button type="submit" className="w-full py-4 bg-orange-600 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                     Submit Devotion
                  </button>
               </form>
            </div>
         </div>
      </section>

    </div>
  );
}
