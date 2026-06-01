import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import { getUser } from '../utils/auth';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { getMediaUrl } from '../utils/url';
import {
   FaStar, FaArrowRight, FaWhatsapp,
   FaCheckCircle, FaShieldAlt, FaRegCalendarAlt, FaTrashAlt, FaPlus, FaPrayingHands, FaBoxOpen, FaWallet,
   FaChevronDown, FaChevronUp, FaBolt, FaHistory
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function ServiceDetail() {
   const { serviceId } = useParams();
   const navigate = useNavigate();
   const { t } = useTranslation();
   const user = getUser();
   const { cart, totalPrice, clearCart } = useCart();
   const { settings } = useSettings();

   const [service, setService] = useState(null);
   const [loading, setLoading] = useState(true);
   const [walletData, setWalletData] = useState({ balance: 0, walletFrozen: false });
   const [useWallet, setUseWallet] = useState(false);
   const [submitLoading, setSubmitLoading] = useState(false);
   const [error, setError] = useState('');
   const [faqs, setFaqs] = useState([]);
   const [openFaq, setOpenFaq] = useState(null);

   // 📝 BOOKING STATE
   const [step, setStep] = useState(1);
   const [members, setMembers] = useState([{ name: user?.name || '', whatsapp: user?.mobile || '', message: '' }]);
   const [quantity, setQuantity] = useState(1);
   const [standardContact, setStandardContact] = useState({ name: user?.name || '', whatsapp: user?.mobile || '', message: '' });
   const [globalSlot, setGlobalSlot] = useState('');

   useEffect(() => {
      const savedData = sessionStorage.getItem('pending_booking');
      if (savedData) {
         try {
            const parsed = JSON.parse(savedData);
            if (parsed.serviceId === serviceId) {
               if (parsed.isArjee) setMembers(parsed.members);
               else {
                  setStandardContact(parsed.standardContact);
                  setQuantity(parsed.quantity);
               }
               setGlobalSlot(parsed.slot);
               sessionStorage.removeItem('pending_booking');
            }
         } catch (e) { console.error("Restore Error:", e); }
      }
   }, [serviceId]);

   useEffect(() => {
      const fetchService = async () => {
         try {
            const res = await API.get(`/services/${serviceId}`);
            const found = res.data.data || res.data;
            if (found) {
               setService(found);
               if (user) {
                  setStandardContact(prev => ({
                     ...prev,
                     name: user.name || prev.name,
                     whatsapp: user.mobile || prev.whatsapp || ''
                  }));
               }
            }
         } catch (err) {
            console.error("Error fetching service:", err);
         } finally {
            setLoading(false);
         }
      };
      fetchService();
   }, [serviceId, user?._id]);

   const serviceCategory = service?.category;
   useEffect(() => {
      if (serviceCategory) {
         API.get('/faq', { params: { category: serviceCategory } }).then(res => {
            if (res.data.success) setFaqs(res.data.data || []);
         }).catch(err => console.error("FAQ Fetch Error:", err));
      }
   }, [serviceCategory]);

   useEffect(() => {
      if (user) {
         API.get('/users/profile').then(res => {
            if (res.data.success && res.data.data) {
               setWalletData({ 
                  balance: res.data.data.walletBalance || 0,
                  walletFrozen: res.data.data.walletFrozen || false 
               });
            }
         }).catch(() => { });
      }
   }, [user?._id]);

   useEffect(() => {
      window.scrollTo(0, 0);
   }, []);

   if (loading) return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#FFFBF5] gap-4">
         <div className="w-10 h-10 border-2 border-[#0A1128] border-t-orange-500 rounded-full animate-spin" />
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Syncing Portal...</p>
      </div>
   );

   if (!service) return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#FFFBF5] p-10 text-center">
         <h2 className="text-xl font-black text-[#0A1128] mb-6 uppercase tracking-widest">{t('common.no_videos', 'Offering Not Found')}</h2>
         <Link to="/" className="text-orange-600 font-black px-8 py-3 rounded-full border-2 border-orange-600 hover:bg-orange-600 hover:text-white transition-all">Back to Divine Feed</Link>
      </div>
   );

   const isArjee = service.category === 'Arjee';
   const multiplier = isArjee ? members.length : quantity;
   const finalAmount = (service.price || 0) * multiplier;
   const taxRate = Number(settings?.taxRate) || 18;
   const isTaxEnabled = settings?.gstEnabled === true;
   const taxAmount = isTaxEnabled ? (finalAmount - (finalAmount / (1 + (taxRate / 100)))) : 0;
   const walletDeduction = useWallet ? Math.min(walletData.balance, finalAmount) : 0;
   const payableAmount = finalAmount - walletDeduction;

   const handleNextStep = () => {
      if (!globalSlot) return setError(t('booking.select_date'));
      if (isArjee) {
         if (members.some(m => !m.name || !m.whatsapp)) return setError(t('booking.devotee_details'));
      } else {
         if (user) {
            if (!standardContact.name) standardContact.name = user.name || 'Devotee';
            if (!standardContact.whatsapp) standardContact.whatsapp = user.mobile || user.whatsapp || '8888888888';
         } else {
            if (!standardContact.name || !standardContact.whatsapp) return setError(t('booking.devotee_details'));
         }
      }
      if (!user) {
         const pendingData = { serviceId, isArjee, members: isArjee ? members : [], standardContact: !isArjee ? standardContact : null, quantity: !isArjee ? quantity : 1, slot: globalSlot };
         sessionStorage.setItem('pending_booking', JSON.stringify(pendingData));
         navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
         return;
      }
      setError('');
      setStep(2);
   };

   const handleMemberChange = (index, field, value) => {
      const newMembers = [...members];
      newMembers[index][field] = value;
      setMembers(newMembers);
   };

   const handleSubmit = async (e) => {
      e?.preventDefault();
      setSubmitLoading(true);
      setError('');
      try {
         let items = isArjee ? members.map(m => ({ serviceId: service._id, title: `${service.title} (${m.name})`, price: service.price, quantity: 1, slot: new Date(globalSlot), message: m.message, devoteeName: m.name, devoteeWhatsapp: m.whatsapp })) : [{ serviceId: service._id, title: service.title, price: service.price, quantity: quantity, slot: new Date(globalSlot), message: standardContact.message }];
         const bookingPayload = { name: isArjee ? members[0].name : standardContact.name, whatsapp: isArjee ? members[0].whatsapp : standardContact.whatsapp, items, totalPrice: finalAmount, taxAmount, walletDeduction, payableAmount, serviceType: service.category, paymentMode: service.paymentMode || 'one-time', tenantId: service.adminId };
         if (payableAmount === 0) { await API.post('/payment/pay-with-wallet-v2', bookingPayload); alert("Confirmed! 🎉"); navigate("/profile"); return; }
         const orderRes = await API.post('/payment/create-order', { amount: payableAmount });
         if (!orderRes.data.success) throw new Error(orderRes.data.message);
         const options = {
            key: orderRes.data.key_id, amount: orderRes.data.amount, currency: orderRes.data.currency, name: "Shyam Bhog", order_id: orderRes.data.id,
            handler: async (response) => {
               try {
                  const verifyRes = await API.post('/payment/verify-hybrid', { ...response, bookingDetails: bookingPayload, purpose: 'hybrid_booking' });
                  if (verifyRes.data.success) { alert("Booked! 🙏"); navigate("/profile"); }
               } catch (err) { 
                  setError(err.response?.data?.message || err.message || "Verification failed."); 
                  setSubmitLoading(false);
               }
            },
            prefill: { name: isArjee ? members[0].name : standardContact.name, contact: isArjee ? members[0].whatsapp : standardContact.whatsapp },
            theme: { color: "#ff6b00" }, modal: { ondismiss: () => setSubmitLoading(false) }
         };
         new window.Razorpay(options).open();
      } catch (err) {
         setError(err.response?.data?.message || err.message || "Error");
         setSubmitLoading(false);
      }
   };

   return (
      <div className="min-h-[100dvh] bg-[#FFFBF5] font-sans text-slate-900 selection:bg-orange-100 pb-20">
         
         {/* ── PREMIUM MINIMAL NAV ── */}
         <nav className="sticky top-0 z-[100] bg-white/40 backdrop-blur-3xl border-b border-orange-100/10 px-6 py-4 flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white border border-orange-100/30 flex items-center justify-center text-[#0A1128] hover:bg-orange-50 transition-all active:scale-95 shadow-sm">
               <span className="text-lg">←</span>
            </button>
            <div className="flex flex-col items-center">
               <span className="text-xs font-semibold text-[#0A1128] leading-none">{service.title}</span>
               <div className="flex items-center gap-1 mt-1">
                  <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse"></div>
                  <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">{service.category}</span>
               </div>
            </div>
            <div className="w-10"></div>
         </nav>

         <div className="max-w-lg mx-auto px-6 py-8 space-y-8">
            
            {/* ── PREMIUM BALANCED HERO ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] border border-orange-50 overflow-hidden shadow-2xl shadow-orange-100/20 relative group mx-auto p-4 space-y-4">
               
               {/* IMAGE ASSET */}
               <div className="w-full aspect-[16/10] overflow-hidden rounded-[26px] relative">
                  <img src={getMediaUrl(service.imageUrl) || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80'} alt={service.title} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80'; }} />
                  <div className="absolute top-4 left-4">
                     <span className="px-2.5 py-0.5 bg-orange-600 text-white font-semibold text-[9px] rounded-md shadow-sm">{service.category}</span>
                  </div>
               </div>
               
               {/* CONTENT SECTION */}
               <div className="px-2 space-y-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                     <h1 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight leading-snug text-[#0A1128]">{service.title}</h1>
                     <div className="flex items-center justify-center gap-2 mt-1">
                        <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                           <FaStar size={10} className="text-orange-500" />
                           <span className="text-[10px] font-semibold text-orange-700">4.9</span>
                        </div>
                        <a 
                           href={`https://wa.me/${settings?.whatsapp?.replace(/\D/g, '') || '919876543210'}?text=${encodeURIComponent(`Jai Shree Shyam! I want to inquire about the offering: ${service.title} (₹${service.price}). Please guide me.`)}`}
                           target="_blank"
                           rel="noreferrer"
                           className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all active:scale-95 text-[10px] font-medium tracking-normal shrink-0"
                        >
                           <FaWhatsapp size={10} /> Inquire
                        </a>
                     </div>
                  </div>
                  <p className="text-slate-500 text-xs sm:text-sm font-normal leading-relaxed opacity-80 max-w-sm mx-auto">
                     " {service.description || 'Jai Shree Shyam'} "
                  </p>
               </div>
            </motion.div>

            {/* ── BOOKING STEP 1 ── */}
            {step === 1 && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  {/* DATE SELECTION */}
                  <div className="bg-white rounded-[26px] p-6 border border-orange-50 shadow-sm space-y-4">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#0A1128] text-white flex items-center justify-center shadow-lg"><FaRegCalendarAlt size={14} /></div>
                        <h3 className="text-sm font-semibold tracking-tight text-[#0A1128]">{t('booking.select_date')}</h3>
                     </div>
                     <input type="date" required value={globalSlot} onChange={(e) => setGlobalSlot(e.target.value)} className="w-full p-4 bg-orange-50/50 border border-orange-100/50 rounded-2xl outline-none focus:border-orange-600 focus:bg-white font-medium text-slate-700 transition-all text-sm cursor-pointer shadow-inner" />
                  </div>

                  {/* FORM SECTIONS */}
                  <div className="space-y-6">
                     {isArjee ? (
                        <div className="space-y-6">
                           <div className="flex items-center justify-between px-2">
                              <h3 className="text-sm font-semibold tracking-tight text-[#0A1128] flex items-center gap-2">
                                 <FaPrayingHands className="text-orange-500" /> {t('booking.devotee_details')}
                              </h3>
                              <button type="button" onClick={() => setMembers([...members, { name: '', whatsapp: '', message: '' }])} className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg font-medium text-[10px] border border-orange-100 hover:bg-orange-600 hover:text-white transition-all">+ Add Devotee</button>
                           </div>
                           <AnimatePresence mode="popLayout">
                              {members.map((m, idx) => (
                                 <motion.div key={idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 rounded-[26px] border border-orange-50 shadow-sm relative space-y-5 group">
                                    <div className="flex justify-between items-center">
                                       <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">{t('booking.devotee')} {idx + 1}</span>
                                       {members.length > 1 && (
                                          <button type="button" onClick={() => setMembers(members.filter((_, i) => i !== idx))} className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"><FaTrashAlt size={10} /></button>
                                       )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       <div className="space-y-2">
                                          <label className="text-[10px] font-medium text-slate-400 ml-1">{t('booking.full_name')}</label>
                                          <input type="text" required value={m.name} onChange={(e) => handleMemberChange(idx, 'name', e.target.value)} placeholder="e.g. Rahul Kumar" className="w-full p-3.5 bg-orange-50/30 border border-orange-50 rounded-xl outline-none focus:border-orange-500 focus:bg-white font-medium text-[#0A1128] text-sm transition-all" />
                                       </div>
                                       <div className="space-y-2">
                                          <label className="text-[10px] font-medium text-slate-400 ml-1">{t('booking.whatsapp_no')}</label>
                                          <input type="tel" required value={m.whatsapp} onChange={(e) => handleMemberChange(idx, 'whatsapp', e.target.value)} placeholder="10 Digit Number" className="w-full p-3.5 bg-orange-50/30 border border-orange-50 rounded-xl outline-none focus:border-orange-500 focus:bg-white font-medium text-[#0A1128] text-sm transition-all" />
                                       </div>
                                    </div>
                                    <div className="space-y-2">
                                       <label className="text-[10px] font-medium text-slate-400 ml-1">{t('profile.sacred_prayer')}</label>
                                       <textarea value={m.message} onChange={(e) => handleMemberChange(idx, 'message', e.target.value)} placeholder="Type your prayer here..." className="w-full p-3.5 bg-orange-50/30 border border-orange-50 rounded-xl outline-none focus:border-orange-500 focus:bg-white h-20 resize-none font-medium text-slate-600 text-sm transition-all" />
                                    </div>
                                 </motion.div>
                              ))}
                           </AnimatePresence>
                        </div>
                     ) : (
                        <div className="space-y-6">
                           <div className="flex items-center justify-between p-6 bg-white rounded-[26px] border border-orange-50 shadow-sm">
                              <div><span className="text-sm font-semibold text-slate-800 block mb-0.5">Quantity</span><span className="text-[10px] text-orange-500 font-medium tracking-wide">Divine Abundance</span></div>
                              <div className="flex items-center gap-5">
                                 <button type="button" onClick={() => quantity > 1 && setQuantity(prev => prev - 1)} className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center font-semibold shadow-sm text-orange-600 hover:bg-orange-600 hover:text-white transition-all active:scale-90">-</button>
                                 <span className="font-semibold text-[#0A1128] text-base w-6 text-center">{quantity}</span>
                                 <button type="button" onClick={() => setQuantity(prev => prev + 1)} className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center font-semibold shadow-sm text-orange-600 hover:bg-orange-600 hover:text-white transition-all active:scale-90">+</button>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>

                  {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold text-center border border-red-100 animate-shake">⚠ {error}</div>}

                  <button type="button" onClick={handleNextStep} className="w-full bg-[#0A1128] text-white py-3.5 rounded-xl text-xs md:text-sm font-medium hover:bg-orange-600 transition-all duration-300 shadow-lg flex items-center justify-center gap-2 group active:scale-95">
                     Continue to Payment <FaArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                  </button>
               </motion.div>
            )}

            {/* ── BOOKING STEP 2 ── */}
            {step === 2 && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <button onClick={() => setStep(1)} className="text-xs font-medium text-slate-400 hover:text-orange-600 transition-all flex items-center gap-2 group"><span className="group-hover:-translate-x-1 transition-transform">←</span> Edit Details</button>
                  <div className="bg-white rounded-[28px] p-7 border border-orange-50 shadow-2xl shadow-orange-100/30 space-y-8">
                     <div className="space-y-6">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center text-[10px] shadow-lg shadow-orange-200">₹</div>
                           <h3 className="text-sm font-semibold tracking-tight text-[#0A1128]">Divine Summary</h3>
                        </div>
                        <div className="flex justify-between items-end pt-6 border-t border-orange-50/50">
                           <div className="flex flex-col"><span className="text-xs font-medium text-orange-600 mb-0.5">Total Payable</span></div>
                           <span className="text-2xl sm:text-3xl font-semibold text-[#0A1128]">₹{finalAmount}</span>
                        </div>
                     </div>

                     <div className="space-y-4 pt-4">
                        {user && (
                             <div 
                               onClick={() => {
                                  if (!walletData.walletFrozen) {
                                     setUseWallet(!useWallet);
                                  }
                               }} 
                               className={`p-5 rounded-[22px] border-2 transition-all duration-300 ${
                                  walletData.walletFrozen 
                                     ? 'bg-red-50/30 border-red-100/60 cursor-not-allowed opacity-85' 
                                     : useWallet 
                                        ? 'bg-orange-50 border-orange-500 shadow-xl shadow-orange-100/40 cursor-pointer' 
                                        : 'bg-slate-50/30 border-slate-100 cursor-pointer'
                               }`}
                             >
                                <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-4">
                                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                         walletData.walletFrozen 
                                            ? 'bg-red-100 text-red-600' 
                                            : useWallet 
                                               ? 'bg-orange-600 text-white shadow-md' 
                                               : 'bg-slate-200 text-slate-400'
                                      }`}><FaWallet size={12} /></div>
                                      <div className="flex flex-col">
                                         <span className={`text-xs font-semibold ${
                                            walletData.walletFrozen 
                                               ? 'text-red-600' 
                                               : useWallet 
                                                  ? 'text-orange-600' 
                                                  : 'text-[#0A1128]'
                                         }`}>
                                            {t('booking.apply_wallet')} {walletData.walletFrozen && <span className="text-[8px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-2 font-black uppercase tracking-wider animate-pulse">Frozen</span>}
                                         </span>
                                         <span className="text-[10px] font-medium text-slate-400 mt-0.5">Bal: ₹{walletData.balance}</span>
                                      </div>
                                   </div>
                                   {!walletData.walletFrozen ? (
                                      <div className={`w-9 h-5 rounded-full p-1 transition-all ${useWallet ? 'bg-orange-600' : 'bg-slate-300'}`}><div className={`w-3 h-3 bg-white rounded-full transition-all shadow-sm ${useWallet ? 'translate-x-4' : 'translate-x-0'}`}></div></div>
                                   ) : (
                                      <span className="text-[10px] font-semibold text-red-500">Locked</span>
                                   )}
                                </div>
                             </div>
                          )}
                        {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold text-center border border-red-100 animate-shake">⚠ {error}</div>}
                        <button onClick={handleSubmit} disabled={submitLoading} className="w-full bg-[#0A1128] text-white py-3.5 rounded-xl text-xs md:text-sm font-medium hover:bg-orange-600 transition-all duration-300 shadow-lg disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2 group relative overflow-hidden">
                           {submitLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><span className="relative z-10">{payableAmount > 0 ? `Pay ₹${payableAmount}` : "Confirm Ritual"}</span><FaArrowRight size={10} className="relative z-10 group-hover:translate-x-1 transition-transform" /></>}
                        </button>
                        <p className="text-center text-[10px] text-slate-400 font-medium tracking-normal px-4 opacity-70">Secured Divine Transaction Protocol</p>
                     </div>
                  </div>
               </motion.div>
            )}

            {/* ── COMPACT FAQ SECTION ── */}
            {faqs.length > 0 && (
               <div className="space-y-6 pt-4">
                  <div className="text-center mb-8">
                     <h2 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight leading-snug text-[#0A1128] mb-1">Divine <span className="text-orange-600">Clarification</span></h2>
                     <p className="text-slate-400 font-medium text-[10px] tracking-wide mb-4">Essential info for your ritual</p>
                  </div>
                  <div className="space-y-3">
                     {faqs.map((faq, idx) => (
                        <div key={faq._id} className={`bg-white rounded-[22px] border ${openFaq === idx ? 'border-orange-200 shadow-xl shadow-orange-50' : 'border-orange-50 shadow-sm'} overflow-hidden transition-all duration-300`}>
                           <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full flex items-center justify-between p-5 text-left group">
                              <span className="font-semibold text-[#0A1128] text-sm pr-4 group-hover:text-orange-600 transition-colors">{faq.question}</span>
                              <div className={`w-7 h-7 rounded-full ${openFaq === idx ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-400'} flex items-center justify-center transition-all shrink-0`}>
                                 {openFaq === idx ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                              </div>
                           </button>
                           <AnimatePresence>
                              {openFaq === idx && (
                                 <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                                    <div className="p-5 pt-0 text-slate-500 text-xs sm:text-sm font-medium leading-relaxed border-t border-orange-50/50 pt-4 bg-orange-50/10">"{faq.answer}"</div>
                                 </motion.div>
                              )}
                           </AnimatePresence>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* ── FOOTER TRUST ── */}
            <footer className="text-center pt-10 pb-6 opacity-20 flex flex-col items-center gap-6 border-t border-orange-100/20">
               <div className="flex justify-center items-center gap-10">
                  <FaShieldAlt size={20} /><FaHistory size={20} /><FaPrayingHands size={20} />
               </div>
               <p className="text-[10px] font-medium text-slate-300 tracking-wide">Official Divine Platform • Shyam Bhog</p>
            </footer>

         </div>
      </div>
   );
}
