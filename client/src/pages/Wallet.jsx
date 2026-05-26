import { useState, useEffect } from 'react';
import API from '../services/api';
import { getUser } from '../utils/auth';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWallet, FaHistory, FaPlus, FaCheckCircle, FaTimesCircle, FaClock, FaShieldAlt } from 'react-icons/fa';

export default function MyWallet() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState({ balance: 0, history: [] });
  const [loading, setLoading] = useState(true);
  const [amountToAdd, setAmountToAdd] = useState('');
  const user = getUser();

  const fetchWallet = async () => {
    try {
      const res = await API.get('/wallet/my-wallet');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleAddFunds = async (e) => {
    if (e) e.preventDefault();
    if (!amountToAdd || amountToAdd <= 0) return alert(i18n.language === 'en' ? "Enter valid amount" : "मान्य राशि दर्ज करें");

    const res = await loadRazorpay();
    if (!res) return alert(i18n.language === 'en' ? "Razorpay SDK failed to load" : "भुगतान गेटवे लोड नहीं हो सका");

    try {
      const orderRes = await API.post('/payment/create-order', { amount: amountToAdd });
      const order = orderRes.data;

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Shyam Bhog",
        description: t('wallet.recharge'),
        order_id: order.id,
        handler: async (response) => {
          try {
            await API.post('/payment/verify', {
              ...response,
              purpose: 'wallet_topup',
              amount: amountToAdd
            });
            alert(t('wallet.topup_success'));
            setAmountToAdd('');
            fetchWallet();
            window.dispatchEvent(new Event('walletUpdate'));
          } catch (err) {
            alert(t('wallet.verification_failed'));
          }
        },
        prefill: {
          name: user.name,
          contact: user.mobile
        },
        theme: { color: "#FF6B00" },
        modal: {
          ondismiss: async () => {
            await API.post('/payment/record-failure', { 
              amount: amountToAdd, 
              reason: 'Payment cancelled by user' 
            });
            fetchWallet();
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (response) => {
        alert(response.error.description);
        await API.post('/payment/record-failure', { 
          amount: amountToAdd, 
          reason: response.error.description 
        });
        fetchWallet();
      });
      rzp.open();

    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initiate payment');
    }
  };

  if (loading) return (
    <div className="py-32 flex items-center justify-center bg-[#FDF8F1] min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-primary font-black uppercase tracking-widest text-[10px] italic">{t('wallet.secure_vault')}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDF8F1] pb-24 font-sans animate-fade-in">
      
      {/* 💳 DIVINE HERO SECTION */}
      <div className="max-w-xl mx-auto px-6 pt-24 pb-4">
         <div className="bg-slate-900 rounded-[40px] p-10 shadow-2xl relative overflow-hidden group border border-white/5">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
            
            <div className="relative z-10">
               <div className="flex justify-between items-center mb-12">
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                     <p className="text-slate-400 font-black text-[8px] uppercase tracking-[0.2em]">{t('wallet.balance_label')}</p>
                  </div>
                  <div className="w-10 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg opacity-80 shadow-lg"></div>
               </div>

               <h2 className="text-5xl font-black text-white tracking-tighter mb-12 italic">
                  ₹{data.balance?.toLocaleString()}
               </h2>

               <div className="flex justify-between items-end">
                  <div className="space-y-1">
                     <p className="text-slate-500 font-black text-[9px] uppercase tracking-widest">{user.name}</p>
                     <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${data.walletFrozen ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></span>
                        <p className={`${data.walletFrozen ? 'text-red-500' : 'text-green-500'} font-black text-[9px] uppercase tracking-widest`}>
                          {data.walletFrozen ? (i18n.language === 'en' ? 'FROZEN' : 'अवरुद्ध (फ्रीज)') : t('wallet.active')}
                        </p>
                     </div>
                  </div>
                  <div className="text-white/20">
                     <FaWallet size={24} />
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="max-w-xl mx-auto px-6 space-y-8">
         
         {/* ⚡ RECHARGE SECTION */}
         <div className="bg-white rounded-[40px] border border-orange-50 p-8 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tighter italic flex items-center gap-2">
               <FaPlus className="text-primary text-xs" />
               {t('wallet.add_funds')}
            </h3>

            <div className="grid grid-cols-3 gap-3 mb-6">
               {[101, 501, 1100].map(amt => (
                  <button 
                     key={amt}
                     type="button"
                     disabled={data.walletFrozen}
                     onClick={() => setAmountToAdd(amt)}
                     className={`py-4 rounded-2xl text-[10px] font-black transition-all border ${
                        data.walletFrozen
                        ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                        : amountToAdd == amt 
                        ? 'bg-primary border-primary text-white shadow-xl shadow-orange-100' 
                        : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-primary hover:text-primary'
                     }`}
                  >
                     +₹{amt}
                  </button>
               ))}
            </div>

            <form onSubmit={handleAddFunds} className="space-y-4">
               <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl">₹</span>
                  <input 
                     type="number" 
                     placeholder={i18n.language === 'en' ? "Custom Amount" : "राशि दर्ज करें"} 
                     value={amountToAdd} 
                     onChange={(e) => setAmountToAdd(e.target.value)}
                     disabled={data.walletFrozen}
                     className="w-full pl-12 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:border-primary focus:bg-white font-black text-lg transition-all shadow-inner disabled:cursor-not-allowed disabled:bg-slate-100"
                     required
                  />
               </div>
               <button 
                  disabled={data.walletFrozen}
                  className={`w-full py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${data.walletFrozen ? 'bg-red-100 text-red-400 cursor-not-allowed border border-red-200' : 'bg-slate-900 hover:bg-primary text-white'}`}
               >
                  <FaShieldAlt className={data.walletFrozen ? 'text-red-400' : 'text-primary group-hover:text-white'} />
                  {data.walletFrozen ? (i18n.language === 'en' ? 'Wallet Frozen' : 'वॉलेट फ्रोजन है') : t('wallet.recharge')}
               </button>
            </form>
            
            <p className="text-center text-[8px] font-black text-slate-300 uppercase tracking-widest mt-6 opacity-60">
               Trusted Divine Payment Gateway
            </p>
         </div>

         {/* 📜 TRANSACTION HISTORY */}
         <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic px-4 flex items-center gap-2">
               <FaHistory className="text-primary text-xs" />
               {t('wallet.history')}
            </h3>

            <div className="max-h-[600px] overflow-y-auto pr-2 no-scrollbar space-y-3">
               {data.history.map((tx, idx) => (
                  <motion.div 
                     key={tx._id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.05 }}
                     className="bg-white p-6 rounded-[32px] border border-orange-50 shadow-sm flex items-center gap-5 group hover:shadow-xl hover:shadow-orange-100/40 transition-all"
                  >
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                        tx.type === 'credit' 
                        ? 'bg-orange-50 border-orange-100 text-primary' 
                        : 'bg-slate-50 border-slate-100 text-slate-400'
                     }`}>
                        {tx.type === 'credit' ? <FaPlus size={14}/> : <FaHistory size={14} className="rotate-180"/>}
                     </div>

                     <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start mb-1">
                           <h4 className="text-sm font-black text-slate-900 truncate pr-2 uppercase italic tracking-tight">
                              {tx.description || (tx.type === 'credit' ? 'Wallet Top-up' : 'Service Booking')}
                           </h4>
                           <p className={`text-sm font-black whitespace-nowrap ${tx.type === 'credit' ? 'text-primary' : 'text-slate-900'}`}>
                              {tx.type === 'credit' ? '+' : '-'}₹{tx.amount?.toLocaleString()}
                           </p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                 <FaClock className="text-slate-300" size={10} />
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </p>
                              </div>
                              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">•</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                 {new Date(tx.createdAt).toLocaleDateString()}
                              </p>
                           </div>

                           <div className="flex items-center gap-1">
                              {tx.status === 'failed' ? <FaTimesCircle size={10} className="text-red-400"/> : <FaCheckCircle size={10} className={`${tx.status === 'pending' ? 'text-yellow-400' : 'text-green-400'}`}/>}
                              <span className={`text-[8px] font-black uppercase tracking-widest ${
                                 tx.status === 'failed' ? 'text-red-500' : 
                                 tx.status === 'pending' ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                 {tx.status || 'Success'}
                              </span>
                           </div>
                        </div>
                     </div>
                  </motion.div>
               ))}

               {data.history.length === 0 && (
                  <div className="py-20 text-center bg-white rounded-[40px] border border-dashed border-orange-100">
                     <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl opacity-20">🪙</div>
                     <p className="text-slate-300 font-black uppercase tracking-[0.2em] text-[8px]">{t('wallet.empty_history')}</p>
                  </div>
               )}
            </div>
         </div>
      </div>

    </div>
  );
}
