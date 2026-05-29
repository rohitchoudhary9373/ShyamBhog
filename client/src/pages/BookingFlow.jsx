import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { getUser } from '../utils/auth';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { getFullUrl } from '../utils/url';
import { FaWallet, FaCheckCircle, FaRegCalendarAlt, FaTrashAlt, FaPlus, FaPrayingHands, FaBoxOpen, FaStar, FaWhatsapp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function BookingFlow() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const { cart, totalPrice, clearCart } = useCart();
  const { settings } = useSettings();

  const [walletData, setWalletData] = useState({ balance: 0, walletFrozen: false });
  const [useWallet, setUseWallet] = useState(false);
  const [serviceDetails, setServiceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  // 📝 STATE
  const [members, setMembers] = useState([{ name: user?.name || '', whatsapp: '', message: '' }]);
  const [quantity, setQuantity] = useState(1);
  const [standardContact, setStandardContact] = useState({ name: user?.name || '', whatsapp: '', message: '' });
  const [globalSlot, setGlobalSlot] = useState('');

  const isCart = serviceId === 'cart';

  useEffect(() => {
    const fetchService = async () => {
      if (isCart) {
        setLoading(false);
        return;
      }
      try {
        const res = await API.get(`/services`);
        const found = res.data.data.find(s => s._id === serviceId);
        if (found) {
          setServiceDetails(found);
          if (user) {
            setStandardContact(prev => ({ ...prev, name: user.name || prev.name, whatsapp: user.phone || user.whatsapp || '' }));
          }
        }
        else setError("Offering not found");
      } catch (err) { setError("Error loading service"); }
      finally { setLoading(false); }
    };
    fetchService();
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
  }, [serviceId]);

  const isArjee = serviceDetails?.category === 'Arjee';

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...members];
    newMembers[index][field] = value;
    setMembers(newMembers);
  };

  const getImageUrl = (url) => {
    return getFullUrl(url);
  };

  const basePrice = isCart ? totalPrice : (serviceDetails?.price || 0);
  const multiplier = isArjee ? members.length : quantity;
  const subTotal = basePrice * multiplier;
  const finalAmount = subTotal;

  // Dynamic Tax Calculation
  const taxRate = Number(settings?.taxRate) || 18;
  const isTaxEnabled = settings?.gstEnabled === true;
  const taxAmount = isTaxEnabled ? (finalAmount - (finalAmount / (1 + (taxRate / 100)))) : 0;
  const walletDeduction = useWallet ? Math.min(walletData.balance, finalAmount) : 0;
  const payableAmount = finalAmount - walletDeduction;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isArjee) {
      if (members.some(m => !m.name || !m.whatsapp)) return setError("Fill details for all members");
    } else {
      if (!standardContact.name || !standardContact.whatsapp) return setError("Contact details required");
    }

    setSubmitLoading(true);
    setError('');

    try {
      let items = [];
      if (isCart) {
        items = cart.map(i => ({ serviceId: i._id, title: i.title, price: i.price, quantity: i.quantity, slot: globalSlot ? new Date(globalSlot) : null, message: standardContact.message }));
      } else if (isArjee) {
        items = members.map(m => ({ serviceId: serviceDetails._id, title: `${serviceDetails.title} (${m.name})`, price: serviceDetails.price, quantity: 1, slot: globalSlot ? new Date(globalSlot) : null, message: m.message, devoteeName: m.name, devoteeWhatsapp: m.whatsapp }));
      } else {
        items = [{ serviceId: serviceDetails._id, title: serviceDetails.title, price: serviceDetails.price, quantity: quantity, slot: globalSlot ? new Date(globalSlot) : null, message: standardContact.message }];
      }

      const bookingPayload = { name: isArjee ? members[0].name : standardContact.name, whatsapp: isArjee ? members[0].whatsapp : standardContact.whatsapp, items, totalPrice: finalAmount, taxAmount, walletDeduction, payableAmount, serviceType: isCart ? 'Cart' : serviceDetails.category, paymentMode: isCart ? 'one-time' : (serviceDetails.paymentMode || 'one-time'), tenantId: isCart ? cart[0]?.adminId : serviceDetails.adminId };

      // 1. Create PENDING order first to track it
      const orderRes = await API.post('/bookings/v2', bookingPayload);
      const pendingOrder = orderRes.data.data;

      if (payableAmount === 0) {
        // Wallet only - already handled by v2 if we wanted, but let's be explicit
        // Actually pay-with-wallet-v2 does it all. 
        // If I use v2 here, I should make sure it doesn't create DUPLICATES.
        // Let's refine: v2 creates the order. If it's 100% wallet, we are done.
        alert("Confirmed! 🎉");
        if (isCart) clearCart(); navigate("/profile"); return;
      }

      // 2. Create Razorpay Order
      const rzpOrderRes = await API.post('/payment/create-order', { amount: payableAmount });
      if (!rzpOrderRes.data.success) throw new Error(rzpOrderRes.data.message);

      const options = {
        key: rzpOrderRes.data.key_id, amount: rzpOrderRes.data.amount, currency: rzpOrderRes.data.currency, name: "Shyam Bhog", order_id: rzpOrderRes.data.id,
        handler: async (response) => {
          try {
            // 3. Verify and Upgrade to COMPLETED
            const verifyRes = await API.post('/payment/verify-hybrid', { ...response, orderId: pendingOrder._id, purpose: 'hybrid_booking_v2' });
            if (verifyRes.data.success) { alert("Booked Successfully! 🙏"); if (isCart) clearCart(); navigate("/profile"); }
          } catch (err) {
            setError(err.response?.data?.message || err.message || "Verification failed.");
            setSubmitLoading(false);
          }
        },
        prefill: { name: isArjee ? members[0].name : standardContact.name, contact: isArjee ? members[0].whatsapp : standardContact.whatsapp },
        theme: { color: "#ff6b00" },
        modal: {
          ondismiss: async () => {
            setSubmitLoading(false);
            await API.post('/payment/record-failure', {
              amount: payableAmount,
              reason: 'Payment cancelled by user',
              orderId: pendingOrder._id,
              type: 'booking'
            });
          }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (response) => {
        await API.post('/payment/record-failure', {
          amount: payableAmount,
          reason: response.error.description,
          orderId: pendingOrder._id,
          type: 'booking'
        });
        alert(response.error.description);
      });
      rzp.open();
    } catch (err) { 
      setError(err.response?.data?.message || err.message || "Error"); 
      setSubmitLoading(false); 
    }
  };

  if (loading) return <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-20">
      <div className="max-w-6xl mx-auto px-6 pt-6">

        {/* BACK ACTION */}
        <button onClick={() => navigate(-1)} className="mb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-all flex items-center gap-2">
          ← Back to Details
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* LEFT: COMPACT VISUAL SUMMARY */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8 h-fit">

            <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-xl shadow-slate-100">
              {/* Image Section (Smaller aspect) */}
              <div className="relative">
                <img
                  src={getImageUrl(serviceDetails?.imageUrl)}
                  alt={serviceDetails?.title}
                  className="w-full aspect-[16/10] object-cover"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80'; }}
                />
                <div className="absolute bottom-4 left-4">
                  <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-white shadow-sm">
                    <div className="flex text-yellow-400 gap-0.5">
                      <FaStar size={8} />
                    </div>
                    <span className="text-[9px] font-black text-slate-700">4.9 Divine Rating</span>
                  </div>
                </div>
              </div>

              {/* Info Section (More compact padding) */}
              <div className="p-6 space-y-5">
                <div>
                  <span className="text-primary font-black text-[9px] uppercase tracking-[0.2em]">{serviceDetails?.category || 'Offering'}</span>
                  <h3 className="text-xl font-black tracking-tight text-slate-900 mt-1">{isCart ? 'Your Cart' : serviceDetails?.title}</h3>
                </div>

                <div className="pt-5 border-t border-slate-50 space-y-3">
                  <div className="flex justify-between items-end pt-3">
                    <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Total Payable</span>
                    <span className="text-3xl font-black tracking-tighter text-slate-900">₹{finalAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: CLEAN SIMPLE FORM */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[32px] p-8 sm:p-10 border border-slate-100 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-10">

                {/* STEP 1: DATE */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest">
                    <FaRegCalendarAlt className="text-primary" /> Select Offering Date
                  </div>
                  <input type="date" required value={globalSlot} onChange={(e) => setGlobalSlot(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold text-slate-700 transition-all" />
                </div>

                {/* STEP 2: DETAILS */}
                <div className="space-y-8">
                  {isArjee ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest">
                        <FaPrayingHands className="text-primary" /> Devotee Details
                      </div>
                      <AnimatePresence mode="popLayout">
                        {members.map((m, idx) => (
                          <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 relative group">
                            <div className="flex justify-between items-center mb-6">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-black italic">
                                  {idx + 1}
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Person {idx + 1}</span>
                              </div>
                              {members.length > 1 && (
                                <button type="button" onClick={() => setMembers(members.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 transition-colors p-2"><FaTrashAlt size={12} /></button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <input type="text" required value={m.name} onChange={(e) => handleMemberChange(idx, 'name', e.target.value)} placeholder="Full Name" className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-primary font-bold text-slate-900" />
                              <input type="tel" required value={m.whatsapp} onChange={(e) => handleMemberChange(idx, 'whatsapp', e.target.value)} placeholder="WhatsApp Number" className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-primary font-bold text-slate-900" />
                            </div>
                            <textarea value={m.message} onChange={(e) => handleMemberChange(idx, 'message', e.target.value)} placeholder="Your sacred prayer..." className="w-full p-5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-primary h-24 resize-none font-medium text-slate-600 text-sm" />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <button type="button" onClick={() => setMembers([...members, { name: '', whatsapp: '', message: '' }])} className="w-full py-5 border-2 border-dashed border-slate-200 rounded-[32px] text-slate-400 font-bold text-[11px] uppercase tracking-widest hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"><FaPlus size={10} /> Add Member</button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest">
                        <FaBoxOpen className="text-primary" /> Delivery Details
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" required value={standardContact.name} onChange={(e) => setStandardContact({ ...standardContact, name: e.target.value })} placeholder="Full Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary font-bold text-slate-900" />
                        <input type="tel" required value={standardContact.whatsapp} onChange={(e) => setStandardContact({ ...standardContact, whatsapp: e.target.value })} placeholder="WhatsApp Number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary font-bold text-slate-900" />
                      </div>
                      <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Quantity</span>
                        <div className="flex items-center gap-6">
                          <button type="button" onClick={() => quantity > 1 && setQuantity(prev => prev - 1)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold shadow-sm hover:border-primary transition-all">-</button>
                          <span className="font-black text-slate-900 text-lg">{quantity}</span>
                          <button type="button" onClick={() => setQuantity(prev => prev + 1)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold shadow-sm hover:border-primary transition-all">+</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* STEP 3: PAYMENT */}
                <div className="pt-10 border-t border-slate-100 space-y-6">
                  {user && (
                    <div 
                      onClick={() => {
                        if (!walletData.walletFrozen) {
                          setUseWallet(!useWallet);
                        }
                      }} 
                      className={`p-6 rounded-[32px] border-2 transition-all ${
                        walletData.walletFrozen 
                          ? 'bg-red-50/30 border-red-100/60 cursor-not-allowed opacity-85' 
                          : useWallet 
                            ? 'bg-orange-50 border-primary shadow-sm cursor-pointer' 
                            : 'bg-slate-50 border-slate-100 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FaWallet className={walletData.walletFrozen ? 'text-red-400' : useWallet ? 'text-primary' : 'text-slate-300'} />
                          <span className={`text-[11px] font-black uppercase tracking-widest ${
                            walletData.walletFrozen 
                              ? 'text-red-600' 
                              : useWallet 
                                ? 'text-primary' 
                                : 'text-slate-900'
                          }`}>
                            Apply Wallet Balance {walletData.walletFrozen && <span className="text-[8px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-2 font-black uppercase tracking-wider animate-pulse">Frozen</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">₹{walletData.balance}</span>
                          {!walletData.walletFrozen ? (
                            <div className={`w-8 h-4 rounded-full p-0.5 transition-all ${useWallet ? 'bg-primary' : 'bg-slate-300'}`}><div className={`w-3 h-3 bg-white rounded-full transition-all ${useWallet ? 'translate-x-4' : 'translate-x-0'}`}></div></div>
                          ) : (
                            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Locked</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-center">⚠ {error}</div>}

                  <button type="submit" disabled={submitLoading} className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] hover:bg-primary transition-all shadow-xl active:scale-95 disabled:opacity-50">
                        {payableAmount > 0 ? `Pay ₹${payableAmount}` : "Use Wallet Balance"}               </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}