import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaArrowRight, FaPrayingHands, FaWallet, FaRegCalendarAlt, FaStar } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import API from '../services/api';
import { getUser } from '../utils/auth';
import { useSettings } from '../context/SettingsContext';
import { getMediaUrl } from '../utils/url';

const Petal = ({ x, y, delay, size, color }) => (
  <motion.div
    initial={{ y: -20, x: x, opacity: 0, rotate: 0 }}
    animate={{ 
      y: y + 250, 
      x: x + (Math.random() * 40 - 20),
      opacity: [0, 1, 1, 0],
      rotate: 360 
    }}
    transition={{ 
      duration: 6 + Math.random() * 4, 
      repeat: Infinity, 
      delay: delay,
      ease: "easeInOut"
    }}
    style={{
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: '50% 0 50% 50%',
      backgroundColor: color,
      filter: 'blur(0.5px)',
      pointerEvents: 'none',
      zIndex: 1,
    }}
  />
);

const PETALS_DATA = [
  { x: 30, y: 150, delay: 0, size: 8, color: '#F59E0B' },
  { x: 120, y: 120, delay: 1, size: 10, color: '#EF4444' },
  { x: 220, y: 180, delay: 1.5, size: 6, color: '#F97316' },
  { x: 80, y: 220, delay: 2, size: 12, color: '#F43F5E' },
  { x: 280, y: 140, delay: 2.5, size: 8, color: '#F59E0B' },
  { x: 170, y: 250, delay: 3, size: 7, color: '#EF4444' },
  { x: 340, y: 200, delay: 3.5, size: 9, color: '#F97316' },
  { x: 50, y: 160, delay: 4, size: 11, color: '#F43F5E' },
];

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems, addToCart, clearCart } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const user = getUser();

  const [recommended, setRecommended] = useState([]);
  const [walletData, setWalletData] = useState({ balance: 0, walletFrozen: false });
  const [useWallet, setUseWallet] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [globalSlot, setGlobalSlot] = useState('');
  const [standardContact, setStandardContact] = useState({ name: '', whatsapp: '', message: '' });

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const response = await API.get('/services/featured-cart');
        if (response.data && response.data.success) {
          setRecommended(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching recommended items:", err);
      }
    };
    fetchRecommended();
  }, []);

  useEffect(() => {
    if (user) {
      setStandardContact({
        name: user.name || '',
        whatsapp: user.mobile || user.phone || user.whatsapp || '',
        message: ''
      });
      // Fetch wallet balance
      API.get('/users/profile').then(res => {
        if (res.data.success && res.data.data) {
          setWalletData({ 
            balance: res.data.data.walletBalance || 0,
            walletFrozen: res.data.data.walletFrozen || false
          });
        }
      }).catch((e) => {
        console.error("Error fetching user profile:", e);
      });
    }
  }, [user?._id]);

  const handleAddRecommended = async (item) => {
    addToCart(item);
    try {
      await API.post(`/services/${item._id}/track-cart-add`);
    } catch (e) {
      console.error("Error tracking cart add:", e);
    }
  };

  // Calculations
  const taxRate = Number(settings?.taxRate) || 18;
  const isTaxEnabled = settings?.gstEnabled === true;
  const taxAmount = isTaxEnabled ? (totalPrice - (totalPrice / (1 + (taxRate / 100)))) : 0;
  const walletDeduction = useWallet ? Math.min(walletData.balance, totalPrice) : 0;
  const payableAmount = totalPrice - walletDeduction;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!globalSlot) {
      setError("Please select offering date");
      const element = document.getElementById("date-input-container");
      if (element) element.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setSubmitLoading(true);
    setError('');

    try {
      const items = cart.map(i => ({
        serviceId: i._id,
        title: i.title,
        price: i.price,
        quantity: i.quantity || 1,
        slot: new Date(globalSlot),
        message: ''
      }));

      const bookingPayload = {
        name: user?.name || 'Devotee',
        whatsapp: user?.mobile || user?.phone || user?.whatsapp || '8888888888',
        items,
        totalPrice,
        taxAmount,
        walletDeduction,
        payableAmount,
        serviceType: 'Cart',
        paymentMode: 'one-time',
        tenantId: cart[0]?.adminId || settings?.adminId
      };

      // 1. Create Pending Booking Order
      const orderRes = await API.post('/bookings/v2', bookingPayload);
      const pendingOrder = orderRes.data.data;

      // 2. Handle Wallet Only Confirmation
      if (payableAmount === 0) {
        clearCart();
        alert("Confirmed! 🎉");
        navigate("/profile");
        return;
      }

      // 3. Create Razorpay Payment order
      const rzpOrderRes = await API.post('/payment/create-order', { amount: payableAmount });
      if (!rzpOrderRes.data.success) throw new Error(rzpOrderRes.data.message);

      const options = {
        key: rzpOrderRes.data.key_id,
        amount: rzpOrderRes.data.amount,
        currency: rzpOrderRes.data.currency,
        name: "Shyam Bhog",
        order_id: rzpOrderRes.data.id,
        handler: async (response) => {
          try {
            // 4. Verify Hybrid Payment
            const verifyRes = await API.post('/payment/verify-hybrid', { 
              ...response, 
              orderId: pendingOrder._id, 
              purpose: 'hybrid_booking_v2' 
            });
            if (verifyRes.data.success) {
              clearCart();
              alert("Booked Successfully! 🙏");
              navigate("/profile");
            }
          } catch (err) {
            setError(err.response?.data?.message || err.message || "Verification failed.");
            setSubmitLoading(false);
          }
        },
        prefill: {
          name: standardContact.name,
          contact: standardContact.whatsapp
        },
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
      setError(err.response?.data?.message || err.message || "Error starting checkout.");
      setSubmitLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center relative overflow-hidden min-h-[70vh]">
        {/* Floating petals in the background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {PETALS_DATA.map((p, idx) => (
            <Petal key={idx} {...p} />
          ))}
        </div>

        {/* Golden/Saffron Spiritual Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Temple SVG / Pooja Thali or Plate Animation */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full animate-pulse border border-amber-200/50 shadow-inner"></div>
          {/* Animated SVG Pooja Thali / Plate */}
          <motion.svg 
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 text-amber-600/70"
            viewBox="0 0 100 100"
            fill="none"
          >
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" />
            <path d="M50 15 C52 35, 48 35, 50 15 Z" fill="currentColor" opacity="0.3" transform="rotate(0 50 50)" />
            <path d="M50 15 C52 35, 48 35, 50 15 Z" fill="currentColor" opacity="0.3" transform="rotate(45 50 50)" />
            <path d="M50 15 C52 35, 48 35, 50 15 Z" fill="currentColor" opacity="0.3" transform="rotate(90 50 50)" />
            <path d="M50 15 C52 35, 48 35, 50 15 Z" fill="currentColor" opacity="0.3" transform="rotate(135 50 50)" />
            <path d="M50 15 C52 35, 48 35, 50 15 Z" fill="currentColor" opacity="0.3" transform="rotate(180 50 50)" />
            <path d="M50 15 C52 35, 48 35, 50 15 Z" fill="currentColor" opacity="0.3" transform="rotate(225 50 50)" />
            <path d="M50 15 C52 35, 48 35, 50 15 Z" fill="currentColor" opacity="0.3" transform="rotate(270 50 50)" />
            <path d="M50 15 C52 35, 48 35, 50 15 Z" fill="currentColor" opacity="0.3" transform="rotate(315 50 50)" />
            <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="1.5" />
          </motion.svg>
          <div className="absolute text-3xl select-none animate-bounce">🪔</div>
        </motion.div>

        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter uppercase font-serif">
          {t('cart.empty_title')}
        </h1>
        <p className="text-slate-500 font-medium text-xs max-w-sm mx-auto mb-8 leading-relaxed">
          {t('cart.empty_desc')}
        </p>

        <Link to="/" className="inline-flex bg-gradient-to-r from-amber-500 to-orange-600 text-white px-10 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:from-amber-600 hover:to-orange-700 transition-all shadow-xl active:scale-95 mb-16">
          {t('cart.explore')}
        </Link>

        {/* Recommendations Section in Empty State */}
        {recommended.length > 0 && (
          <div className="border-t border-orange-100/60 pt-10 text-left">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1">
              {t('cart.recommended_offerings')}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
              {t('cart.recommended_desc')}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommended.map(item => (
                <div key={item._id} className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 border border-orange-100/50 rounded-[24px] p-4 flex gap-3 items-center hover:border-amber-200 transition-all group">
                  <div className="w-16 h-16 rounded-[16px] overflow-hidden bg-white border border-orange-100 flex-shrink-0">
                    <img src={getMediaUrl(item.imageUrl) || 'https://via.placeholder.com/150'} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="text-xs font-black text-slate-900 truncate leading-tight">{item.title}</h4>
                    {item.unit && <p className="text-[9px] font-bold text-slate-400 mt-0.5">{item.unit}</p>}
                    <p className="text-[10px] font-bold text-primary mt-1">₹{item.price}</p>
                  </div>
                  <button 
                    onClick={() => handleAddRecommended(item)}
                    className="px-3.5 py-2 bg-white border border-amber-200 text-amber-700 hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-600 hover:text-white hover:border-transparent rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 shrink-0"
                  >
                    + {t('cart.add_recommended')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const shownRecommendations = recommended.filter(recItem => !cart.some(cartItem => cartItem._id === recItem._id));

  return (
    <div className="max-w-xl mx-auto px-4 py-8 pb-24 md:pb-8 animate-fade-in">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2 uppercase italic">{t('cart.title')}</h1>
        <p className="text-slate-500 font-medium text-xs opacity-60 uppercase tracking-widest">{t('cart.review')}</p>
      </header>

      <div className="flex flex-col gap-8">

        {/* ITEMS LIST */}
        <div className="space-y-4">
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div 
                key={item._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="bg-white border border-orange-50 rounded-[28px] p-4 flex items-center gap-4 group shadow-sm hover:shadow-xl hover:shadow-orange-100/40 transition-all relative"
              >
                <div className="w-20 h-20 rounded-[20px] overflow-hidden bg-slate-50 border border-slate-50 flex-shrink-0">
                  <img src={getMediaUrl(item.imageUrl) || 'https://via.placeholder.com/150'} alt={item.title} className="w-full h-full object-cover" />
                </div>

                <div className="flex-grow">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{item.category}</p>
                  <h3 className="text-sm font-black text-slate-900 leading-tight group-hover:text-primary transition-colors pr-6">{item.title}</h3>
                  {item.unit && <p className="text-[9px] font-semibold text-slate-450 mt-0.5">{item.unit}</p>}
                  <p className="text-sm font-black text-slate-900 mt-1">₹{item.price}</p>
                </div>

                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  <button onClick={() => removeFromCart(item._id)} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-500 bg-red-50/50 hover:bg-red-100 rounded-full transition-all absolute top-3 right-3">
                    <FaTrash size={10} />
                  </button>
                  <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100 mt-4">
                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center font-black text-slate-400 hover:text-slate-900 bg-white rounded-lg shadow-sm">-</button>
                    <span className="w-4 text-center font-black text-[10px]">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center font-black text-slate-400 hover:text-slate-900 bg-white rounded-lg shadow-sm">+</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ACTIVE RECOMMENDATIONS */}
        {shownRecommendations.length > 0 && (
          <div className="border-t border-orange-100/40 pt-6">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1">
              {t('cart.recommended_offerings')}
            </h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              {t('cart.recommended_desc')}
            </p>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
              {shownRecommendations.map(item => (
                <div key={item._id} className="snap-start w-64 bg-gradient-to-br from-amber-50/40 to-orange-50/20 border border-orange-100/30 rounded-3xl p-3.5 flex gap-3.5 items-center flex-shrink-0 shadow-sm hover:shadow-md hover:border-orange-100 transition-all group">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-orange-100/50 flex-shrink-0">
                    <img src={getMediaUrl(item.imageUrl) || 'https://via.placeholder.com/150'} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="text-xs font-black text-slate-900 truncate leading-tight">{item.title}</h4>
                    {item.unit && <p className="text-[9px] font-bold text-slate-400 mt-0.5">{item.unit}</p>}
                    <p className="text-[10px] font-black text-primary mt-1">₹{item.price}</p>
                  </div>
                  <button 
                    onClick={() => handleAddRecommended(item)}
                    className="px-3 py-2 bg-white text-orange-600 border border-orange-100 hover:bg-primary hover:text-white hover:border-transparent rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 shrink-0"
                  >
                    + {t('cart.add_recommended')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INTEGRATED CHECKOUT INPUTS */}
        <div className="bg-white border border-orange-100/40 rounded-[36px] p-6 sm:p-8 shadow-xl shadow-orange-100/10 space-y-6">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 italic">
            <FaRegCalendarAlt className="text-primary" /> Delivery & Booking Options
          </h2>

          {!user ? (
            <div className="bg-orange-50/60 border border-orange-100 rounded-[28px] p-6 text-center space-y-4">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest leading-relaxed">
                Please log in to complete your checkout
              </p>
              <button
                type="button"
                onClick={() => navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)}
                className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-primary transition-all active:scale-95"
              >
                Log In or Sign Up
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* DATE SELECT */}
              <div className="space-y-2" id="date-input-container">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Offering Date</label>
                <input 
                  type="date" 
                  required 
                  value={globalSlot} 
                  onChange={(e) => setModelValue(e.target.value)} 
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold text-slate-700 transition-all text-xs" 
                />
              </div>



              {/* WALLET APPLY */}
              <div 
                onClick={() => {
                  if (!walletData.walletFrozen) {
                    setUseWallet(!useWallet);
                  }
                }} 
                className={`p-5 rounded-[24px] border-2 transition-all ${
                  walletData.walletFrozen 
                    ? 'bg-red-50/30 border-red-100/60 cursor-not-allowed opacity-85' 
                    : useWallet 
                      ? 'bg-orange-50 border-primary shadow-sm cursor-pointer' 
                      : 'bg-slate-50 border-slate-100 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FaWallet className={walletData.walletFrozen ? 'text-red-400' : useWallet ? 'text-primary' : 'text-slate-300'} size={14} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      walletData.walletFrozen 
                        ? 'text-red-600' 
                        : useWallet 
                          ? 'text-primary' 
                          : 'text-slate-900'
                    }`}>
                      Apply Wallet Balance {walletData.walletFrozen && <span className="text-[7px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full ml-1 font-black uppercase tracking-wider animate-pulse">Frozen</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-500">₹{walletData.balance}</span>
                    {!walletData.walletFrozen ? (
                      <div className={`w-7 h-4 rounded-full p-0.5 transition-all ${useWallet ? 'bg-primary' : 'bg-slate-300'}`}><div className={`w-3 h-3 bg-white rounded-full transition-all ${useWallet ? 'translate-x-3' : 'translate-x-0'}`}></div></div>
                    ) : (
                      <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Locked</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SUMMARY */}
        <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl shadow-orange-900/10 border border-white/5 space-y-6">
          <h2 className="text-lg font-black flex items-center gap-3 italic uppercase tracking-widest">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg"><FaPrayingHands size={16} className="text-white" /></div>
            {t('cart.summary')}
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              <span>{t('cart.total_items')}</span>
              <span className="text-white">{totalItems}</span>
            </div>



            {useWallet && (
              <div className="flex justify-between items-center text-rose-400 font-bold text-[10px] uppercase tracking-widest">
                <span>Wallet Discount</span>
                <span>- ₹{walletDeduction.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-slate-400 font-bold text-[10px] uppercase tracking-widest pb-4 border-b border-white/10">
              <span>{t('cart.total_amount')}</span>
              <span className="text-white">₹{totalPrice.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-black italic uppercase tracking-widest">{t('cart.grand_total')}</span>
              <span className="text-3xl font-black tracking-tighter text-primary">₹{payableAmount.toLocaleString()}</span>
            </div>
          </div>

          {error && <div className="p-4 bg-red-950/50 border border-red-900/50 text-red-450 rounded-2xl text-[9px] font-black uppercase tracking-widest text-center">⚠ {error}</div>}

          <button
            onClick={handleSubmit}
            disabled={submitLoading}
            className="w-full bg-white text-slate-900 py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all shadow-xl flex items-center justify-center gap-3 group active:scale-95 disabled:opacity-50"
          >
            {submitLoading ? "Processing Booking..." : !user ? "Log In to Checkout" : payableAmount > 0 ? `Pay ₹${payableAmount}` : "Use Wallet Balance"} <FaArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest text-center mt-6 leading-relaxed opacity-60 px-4">
            {t('cart.terms_note')}
          </p>
        </div>

      </div>

      {/* STICKY MOBILE CHECKOUT */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 z-40 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] flex items-center justify-between gap-4">
        <div>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{totalItems} {totalItems === 1 ? 'Ritual' : 'Rituals'}</p>
          <p className="text-lg font-black text-primary leading-none">₹{payableAmount.toLocaleString()}</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitLoading}
          className="flex-grow bg-slate-900 text-white py-3.5 px-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-slate-900/10 disabled:opacity-50"
        >
          {submitLoading ? "Processing..." : !user ? "Log In" : payableAmount > 0 ? `Pay ₹${payableAmount}` : "Use Wallet"} <FaArrowRight size={10} />
        </button>
      </div>

    </div>
  );

  function setModelValue(val) {
    setGlobalSlot(val);
  }
}
