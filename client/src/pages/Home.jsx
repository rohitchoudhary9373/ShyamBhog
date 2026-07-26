import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { getMediaUrl } from '../utils/url';
import { FaVideo, FaUsers, FaParking, FaBed, FaArrowRight, FaWhatsapp, FaShoppingCart, FaStar, FaBolt, FaShieldAlt, FaPrayingHands, FaRegCompass, FaChevronDown, FaChevronUp, FaGlobe } from 'react-icons/fa';
import SEO from '../components/SEO';

export default function Home() {
  const { cart, addToCart, updateQuantity } = useCart();
  const { settings } = useSettings();
  const settingsAdminId = settings?.adminId;
  const { t, i18n } = useTranslation();
  const [services, setServices] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [selectedFaqCat, setSelectedFaqCat] = useState('All');
  const [galleries, setGalleries] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [activeTab, setActiveTab] = useState('Arjee');
  const [loading, setLoading] = useState(true);

  // Hub Data States
  const [crowd, setCrowd] = useState(null);
  const [parking, setParking] = useState(null);

  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({ name: '', message: '' });

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tenantId = settingsAdminId || '';
        console.log(`[Home] Fetching devotee data for tenantId: "${tenantId}"`);
        const [srvRes, faqRes, galRes, feedRes, crowdRes, parkRes] = await Promise.all([
          API.get(`/services?tenantId=${tenantId}`).catch(() => ({ data: [] })),
          API.get(`/faq?tenantId=${tenantId}`).catch(() => ({ data: [] })),
          API.get(`/gallery?tenantId=${tenantId}`).catch(() => ({ data: [] })),
          API.get(`/feedback?tenantId=${tenantId}`).catch(() => ({ data: [] })),
          API.get(`/crowd-status?tenantId=${tenantId}`).catch(() => ({ data: null })),
          API.get(`/parking?tenantId=${tenantId}`).catch(() => ({ data: null }))
        ]);

        console.log('[Home] API Responses received:', {
          services: srvRes.data,
          faqs: faqRes.data,
          gallery: galRes.data,
          feedback: feedRes.data,
          crowd: crowdRes.data,
          parking: parkRes.data,
        });

        const servicesArray = Array.isArray(srvRes.data) ? srvRes.data : (srvRes.data.data || []);
        setServices(servicesArray.filter(s => s.isActive));

        const faqArray = Array.isArray(faqRes.data) ? faqRes.data : (faqRes.data?.data || []);
        const generalFaqs = faqArray.filter(f => f.isActive !== false && (f.category === 'General' || !f.category)).slice(0, 5);
        setFaqs(generalFaqs);

        const galleryArray = Array.isArray(galRes.data) ? galRes.data : (galRes.data.data || []);
        setGalleries(galleryArray.filter(g => g.isActive));
        setFeedbacks(Array.isArray(feedRes.data) ? feedRes.data : []);

        setCrowd(crowdRes.data);
        setParking(parkRes.data);

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
      <div className="min-h-[100dvh] bg-[#FFFBF5] flex flex-col items-center justify-center p-10 gap-4">
         <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Syncing Portal...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-[#FFFBF5] min-h-[100dvh] pt-2 pb-8 font-sans selection:bg-orange-100">
      <SEO 
        title="Shyam Bhog | Khatu Shyam Ji Online Arjee, Bhog & Swamani Prasad Booking"
        description="Book Khatu Shyam Ji Online Arjee, Special Bhog Prasad & Swamani offerings with live video confirmation. Check live crowd status & darshan timings at Shri Khatu Shyam Dham, Sikar."
        keywords="Khatu Shyam Ji, Shyam Bhog, Khatu Shyam Arjee, Online Arjee Booking, Swamani Prasad, Khatu Shyam Bhog, Khatu Shyam Live Crowd Status, Darshan Timings, Nishan Yatra, Sikar Rajasthan"
        canonical="https://shyambhog.com/"
      />

      {/* ── HERO ── */}
      <section className="w-full max-w-xl px-6 mb-4 text-center animate-fade-in pt-2">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-3 px-4 py-1.5 bg-white rounded-full border border-orange-100 shadow-sm">
           <span className="w-1.5 h-1.5 rounded-full bg-orange-50 animate-pulse"></span>
           <span className="text-[9px] font-semibold text-[#0A1128] uppercase tracking-[0.3em]">Official Platform</span>
        </motion.div>
      </section>

      {/* ── DIVINE HUB ── */}
      <section className="w-full max-w-xl px-4 mb-12">
        <div className="grid grid-cols-2 gap-3">
            {[
              { to: "/watch-arjee", icon: <FaVideo size={14} />, title: t('home.watch_arjee'), desc: 'Live Stream' },
              { to: "/crowd-status", icon: <FaUsers size={14} />, title: t('home.bheed_alert'), desc: 'Live Crowd', badge: true },
              { to: "/parking-guide", icon: <FaParking size={14} />, title: t('home.parking'), desc: 'Nav Guide' },
              { to: "#", icon: <FaBed size={14} />, title: t('home.hotel_stay'), desc: t('home.stay_guide') || 'Stay Guide', isHotelStay: true }
            ].map((item, idx) => {
              const waNumber = settings?.whatsappNo || '91XXXXXXXXXX';
              const cleanWaNumber = waNumber.replace(/\D/g, '');
              const waLink = `https://wa.me/${cleanWaNumber || '91XXXXXXXXXX'}?text=Hello%20Shyam%20Bhog,%20I%20want%20hotel%20enquiry`;

              const innerMarkup = (
                <div className="flex flex-col items-center justify-center h-full w-full gap-1 px-1">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-[#0A1128] group-hover:text-white transition-all duration-500 shadow-inner shrink-0 mb-0.5">
                    {item.icon}
                  </div>
                  <div className="flex items-center gap-1 justify-center w-full">
                    <h3 className="text-[13px] sm:text-[14px] font-semibold tracking-tight leading-none text-[#0B1330] group-hover:text-orange-600 transition-colors uppercase text-center truncate max-w-full">{item.title}</h3>
                    {item.badge && <span className={`w-1 h-1 rounded-full animate-pulse shrink-0 ${crowd?.status === 'High' ? 'bg-red-500' : 'bg-green-500'}`}></span>}
                  </div>
                  <p className="text-[8px] sm:text-[8.5px] tracking-wider font-medium uppercase text-gray-400 leading-none text-center truncate max-w-full mt-1">{item.desc}</p>
                </div>
              );

              if (item.isHotelStay) {
                return (
                  <div 
                    key={idx} 
                    className="group relative bg-white/80 backdrop-blur-xl w-full h-[115px] p-2.5 rounded-[22px] border border-white/40 shadow-[0_10px_40px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center text-center cursor-not-allowed select-none transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_10px_35px_rgba(0,0,0,0.12)]"
                  >
                    {/* Floating Coming Soon Badge */}
                    <span className="absolute -top-1.5 right-2 text-[8px] px-1.5 py-0.5 rounded-full bg-orange-500 text-white font-semibold shadow-sm z-20 pointer-events-none uppercase tracking-wider leading-none">
                      Coming Soon
                    </span>

                    {/* Small WhatsApp Enquiry Button */}
                    <a 
                      href={waLink} 
                      target="_blank" 
                      rel="noreferrer" 
                      title="WhatsApp Enquiry"
                      className="absolute top-2 right-2 text-[8px] px-2 py-0.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500 text-white font-semibold flex items-center justify-center shadow-md pointer-events-auto cursor-pointer border border-emerald-400/20 z-20 leading-none"
                    >
                      <FaWhatsapp size={8} className="animate-bounce" />
                    </a>

                    {innerMarkup}
                  </div>
                );
              }

              return (
                <Link 
                  key={idx} 
                  to={item.to} 
                  className="group relative bg-white/80 backdrop-blur-xl w-full h-[115px] p-2.5 rounded-[22px] border border-white/40 shadow-[0_10px_40px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center text-center transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_10px_35px_rgba(0,0,0,0.12)]"
                >
                  {innerMarkup}
                </Link>
              );
            })}
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
      <div className="w-full max-w-xl px-3 mb-20">
        <div className={`grid gap-4 ${activeTab === 'Bhog' ? 'grid-cols-2 gap-3' : 'grid-cols-1'}`}>
          {filteredServices.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-[32px] border border-dashed border-orange-100/50">
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
                    className="bg-[#FCFAF7] rounded-[28px] w-full max-w-full p-2 md:p-4 border border-[#F07924]/80 shadow-[0_10px_40px_rgba(0,0,0,0.06)] hover:scale-[1.02] transition-all duration-300 group flex flex-col justify-between gap-3 h-auto"
                  >
                    {/* Compact Image */}
                    <div className="relative aspect-square rounded-2xl overflow-hidden shrink-0">
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
                    <div className="px-1 flex-1 flex flex-col justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-xs sm:text-sm md:text-base font-medium text-slate-900 truncate leading-tight">{service.title}</h3>
                        {service.unit && (
                          <span className="text-[10px] md:text-xs font-normal text-slate-400 leading-tight">{service.unit}</span>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs md:text-sm font-semibold text-slate-900 tracking-tighter leading-tight">₹{service.price}</span>
                          
                          {/* Compact Circular Add/Quantity Control */}
                          <div className="flex items-center bg-orange-50 rounded-full p-0.5 border border-orange-100 h-8 shadow-sm">
                             <button 
                               onClick={() => isInCart ? updateQuantity(service._id, isInCart.quantity - 1) : null} 
                               className={`w-5 h-5 md:w-6 md:h-6 bg-white text-slate-900 rounded-full font-bold text-[10px] flex items-center justify-center shadow-sm ${!isInCart ? 'opacity-50 cursor-not-allowed' : ''}`}
                             >
                               -
                             </button>
                             <span className="px-1.5 md:px-2 text-[9px] md:text-[10px] font-bold text-orange-700">
                               {isInCart ? isInCart.quantity : 0}
                             </span>
                             <button 
                               onClick={() => isInCart ? updateQuantity(service._id, isInCart.quantity + 1) : addToCart(service)} 
                               className="w-5 h-5 md:w-6 md:h-6 bg-white text-slate-900 rounded-full font-bold text-[10px] flex items-center justify-center shadow-sm"
                             >
                               +
                             </button>
                          </div>
                        </div>
                      </div>

                      {/* Primary Actions Area */}
                      <div className="mt-1">
                        <Link to={`/services/detail/${service._id}`} className="w-full bg-orange-600 text-white py-1 md:py-1.5 rounded-lg text-[10px] font-medium shadow-md flex items-center justify-center hover:bg-orange-700 transition-all active:scale-95 leading-none px-2">
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
                  className="bg-[#FCFAF7] rounded-[28px] w-full max-w-full h-auto min-h-[280px] border border-[#F07924]/80 shadow-[0_10px_40px_rgba(0,0,0,0.06)] flex flex-col justify-between overflow-hidden hover:scale-[1.02] transition-all duration-300 group"
                >
                  {/* Top Strip for Subscription */}
                  {isRecurring && (
                    <div className="w-full bg-[#F5F3FF] py-1.5 px-3 border-b border-purple-100 flex items-center justify-center shrink-0">
                      <span className="text-[8px] sm:text-[9px] font-semibold text-purple-700 tracking-wider uppercase text-center leading-none">
                        • Monthly Ekadashi Arjee Subscription Available •
                      </span>
                    </div>
                  )}

                  {/* Padded Container for Card Interior */}
                  <div className="p-3 flex flex-col flex-grow justify-between gap-3">
                    {/* Image Section */}
                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shrink-0 border border-orange-50/50">
                       <img 
                         src={getImageUrl(service.imageUrl)} 
                         alt={service.title} 
                         className="w-full h-full object-cover" 
                         onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80'; }}
                       />
                       <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md rounded-full px-3 py-1 text-[10px] font-semibold text-slate-800 shadow-sm border border-white/50 z-10 leading-none">
                          {service.tag || "Few slots left"}
                       </div>
                    </div>

                    {/* Bottom Split Layout Area */}
                    <div className="px-1 flex-1 flex justify-between items-stretch gap-4 w-full">
                      {/* Left Side: Title & Description */}
                      <div className="flex-1 flex flex-col justify-between gap-1.5 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#0B1330] leading-snug truncate max-w-full">
                          {service.title}
                        </h3>
                        <p className="text-xs font-medium text-gray-500 leading-relaxed line-clamp-2">
                          {service.description || "A dedicated Arjee, Reserved just for you."}
                        </p>
                      </div>

                      {/* Right Side: Price & CTA button */}
                      <div className="w-24 sm:w-28 shrink-0 flex flex-col justify-between items-end gap-2 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm sm:text-base font-bold text-[#ea580c] leading-none">₹{service.price}</span>
                          {isRecurring && (
                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                              / monthly
                            </span>
                          )}
                        </div>
                        <Link 
                          to={`/services/detail/${service._id}`} 
                          className="w-full bg-gradient-to-r from-[#722F1E] to-[#8C3A27] text-white py-2 rounded-xl text-[10px] sm:text-xs font-semibold shadow-sm hover:brightness-110 transition-all active:scale-95 flex items-center justify-center text-center"
                        >
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

      {/* ── GALLERY ── */}
      {galleries.length > 0 && (
        <section className="w-full max-w-xl px-6 py-8 md:py-12">
          <div className="mb-6 text-center">
             <h2 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight leading-snug text-[#0A1128] uppercase">{t('home.gallery')}</h2>
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
        <section className="w-full max-w-xl px-6 py-8 md:py-12">
          <div className="mb-6 text-center">
             <h2 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight leading-snug text-[#0A1128] uppercase">{t('home.what_devotees_say')}</h2>
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

      {/* ── CLEAN GENERAL FAQ SECTION ── */}
      {faqs.length > 0 && (
        <section className="w-full max-w-xl px-6 py-8 md:py-12">
          <div className="text-center mb-6">
             <h2 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight leading-snug text-[#0A1128] uppercase mb-1">
               Frequently Asked <span className="text-orange-600">Questions</span>
             </h2>
             <p className="text-slate-400 font-medium text-[10px] uppercase tracking-widest">Essential guidance for devotees</p>
          </div>

          <div className="space-y-3">
             {faqs.map((faq, idx) => (
                <div key={faq._id || idx} className={`bg-white rounded-[24px] border ${openFaq === idx ? 'border-orange-200 shadow-xl shadow-orange-50' : 'border-orange-50 shadow-sm'} overflow-hidden transition-all duration-300`}>
                   <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full flex items-center justify-between p-5 text-left group">
                      <span className="font-bold text-[#0A1128] text-sm pr-4 group-hover:text-orange-600 transition-colors">{faq.question}</span>
                      <div className={`w-7 h-7 rounded-full ${openFaq === idx ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-400'} flex items-center justify-center transition-all shrink-0`}>
                         {openFaq === idx ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                      </div>
                   </button>
                   <AnimatePresence>
                      {openFaq === idx && (
                         <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                            <div className="p-5 pt-0 text-slate-600 text-xs sm:text-sm font-medium leading-relaxed border-t border-orange-50/50 pt-4 bg-orange-50/10">"{faq.answer}"</div>
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>
             ))}
          </div>
        </section>
      )}

      {/* ── SUBMIT FEEDBACK ── */}
      <section className="w-full max-w-xl px-6 py-8 md:py-12">
         <div className="bg-[#0A1128] rounded-[40px] p-8 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
            <div className="relative z-10 space-y-6">
               <div className="space-y-2">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight leading-snug text-white uppercase">{t('home.write_to_us')}</h2>
                  <p className="text-white/40 text-[10px] font-medium uppercase tracking-[0.18em]">{t('home.submit_feedback')}</p>
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
