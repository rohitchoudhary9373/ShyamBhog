import { useState, useEffect } from 'react';
import API from '../services/api';
import { getUser, logout } from '../utils/auth';
import Invoice from '../components/Invoice';
import RefundReceipt from '../components/RefundReceipt';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaUserEdit, FaMapMarkerAlt, FaEnvelope, FaPhoneAlt, FaVideo, FaDownload, FaCheckCircle, FaTimes, FaShieldAlt, FaHistory, FaQrcode, FaWhatsapp, FaPrayingHands, FaBoxOpen } from 'react-icons/fa';

export default function Profile() {
   const { t, i18n } = useTranslation();
   const [orders, setOrders] = useState([]);
   const [userData, setUserData] = useState(getUser());
   const [loading, setLoading] = useState(!getUser());
   const [selectedInvoice, setSelectedInvoice] = useState(null);
   const [selectedRefundReceipt, setSelectedRefundReceipt] = useState(null);
   const [isEditing, setIsEditing] = useState(false);
   const [editForm, setEditForm] = useState(getUser() || {});
   const [saving, setSaving] = useState(false);

   const fetchProfileData = async () => {
      try {
         const [userRes, ordersRes, refundRes] = await Promise.all([
            API.get('/auth/me'),
            API.get('/bookings'),
            API.get('/refunds/my').catch(() => ({ data: { data: [] } }))
         ]);

         const user = userRes.data;
         setUserData(user);
         setEditForm(user);

         const refundsArray = refundRes.data?.data || [];
         const allOrders = ordersRes.data.data || ordersRes.data;

         const myOrders = allOrders
            .filter(o => o.whatsapp === user.mobile || o.userId === user._id)
            .map(o => {
               const refundInfo = refundsArray.find(r => (r.orderId?._id || r.orderId) === o._id);
               if (refundInfo) o.refundRequest = refundInfo;
               return o;
            });

         setOrders(myOrders);
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchProfileData();
   }, []);

   const handleUpdateProfile = async (e) => {
      e.preventDefault();
      setSaving(true);
      try {
         await API.put('/auth/profile', editForm);
         setUserData(editForm);
         
         // Update localStorage userInfo so header/other parts sync immediately
         const currentUser = JSON.parse(localStorage.getItem("userInfo") || "{}");
         localStorage.setItem("userInfo", JSON.stringify({ ...currentUser, ...editForm }));

         setIsEditing(false);
         alert(i18n.language === 'en' ? "Profile updated!" : "प्रोफ़ाइल अपडेट हो गई!");
      } catch (err) {
         alert("Update failed");
      } finally {
         setSaving(false);
      }
   };

   const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
         if (file.size > 2 * 1024 * 1024) return alert("File too large (Max 2MB)");
         const reader = new FileReader();
         reader.onloadend = () => setEditForm({ ...editForm, profilePic: reader.result });
         reader.readAsDataURL(file);
      }
   };

   const getLifecycleStage = (status) => {
      const stages = ['Pending', 'Payment_Verified', 'Approved', 'Invoice_Generated', 'Completed'];
      const currentIdx = stages.indexOf(status);
      if (status === 'Cancelled' || status === 'Failed') return -1;
      if (status === 'Refunded' || status === 'Refund_Receipt_Generated') return -2;
      return currentIdx >= 0 ? currentIdx : 0;
   };

   const getNormalStageIndex = (status) => {
      if (status === 'Pending') return 0;
      if (status === 'Payment_Verified') return 1;
      if (status === 'Approved' || status === 'Bhog_Approved') return 2;
      if (status === 'Invoice_Generated') return 3;
      if (status === 'Completed') return 4;
      return -1;
   };

   const statusStyle = (status) => {
      switch (status) {
         case "Invoice_Generated":
         case "Completed": 
            return "bg-emerald-50 text-emerald-600 border-emerald-200";
         case "Approved":
            return "bg-blue-50 text-blue-600 border-blue-200";
         case "Payment_Verified":
            return "bg-teal-50 text-teal-600 border-teal-200";
         case "Cancelled": 
         case "Failed": 
            return "bg-red-50 text-red-600 border-red-200";
         case "Refund_Receipt_Generated":
         case "Refunded": 
            return "bg-purple-50 text-purple-600 border-purple-200";
         default: 
            return "bg-amber-50 text-amber-600 border-amber-200";
      }
   };

   if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF8F1]">
         <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-primary font-black uppercase tracking-widest text-[10px] italic">{t('common.loading')}</p>
         </div>
      </div>
   );

   return (
      <div className="min-h-screen bg-[#FDF8F1] pb-24 font-sans animate-fade-in">

         {/* 👤 DIVINE PROFILE HERO */}
         <div className="max-w-xl mx-auto px-6 pt-24 pb-4">
            <div className="bg-white rounded-[40px] border border-orange-100 p-10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-50 rounded-full blur-3xl opacity-50"></div>

               <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-[32px] bg-slate-900 text-white flex items-center justify-center text-3xl font-black mb-6 shadow-xl border-4 border-white overflow-hidden relative group/pic">
                     {userData.profilePic ? <img src={userData.profilePic} alt="profile" className="w-full h-full object-cover" /> : userData.name?.charAt(0)}
                  </div>

                  <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase mb-2">
                     {userData.name}
                  </h1>
                  <div className="flex flex-col gap-1">
                     <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest flex items-center justify-center gap-2">
                        <FaEnvelope className="text-primary" size={10} /> {userData.email}
                     </p>
                     <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest flex items-center justify-center gap-2">
                        <FaPhoneAlt className="text-primary" size={10} /> {userData.mobile}
                     </p>
                  </div>

                  <div className="flex items-center gap-4 mt-8">
                     <button
                        onClick={() => setIsEditing(true)}
                        className="bg-slate-50 text-slate-400 hover:bg-primary hover:text-white px-8 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all border border-slate-100"
                     >
                        {t('common.edit')}
                     </button>
                     <button
                        onClick={logout}
                        className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-8 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 duration-200"
                     >
                        {t('common.logout', 'Logout')}
                     </button>
                  </div>
               </div>
            </div>
         </div>

         <div className="max-w-xl mx-auto px-6 space-y-8">

            {/* 📍 LOCATION & SECURITY */}
            <div className="grid grid-cols-1 gap-6">
               <div className="bg-white rounded-[40px] p-8 border border-orange-50 shadow-sm relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 text-orange-50 group-hover:text-primary transition-colors duration-700">
                     <FaMapMarkerAlt size={40} />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mb-6 uppercase tracking-tighter italic flex items-center gap-2">
                     {t('profile.location_details')}
                  </h3>
                  <div className="space-y-4">
                     <div>
                        <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-1">{t('profile.primary_address')}</p>
                        <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                           {userData.address || t('profile.no_address')}
                           {userData.pincode && <><br />{userData.pincode}, {userData.district}, {userData.state}</>}
                        </p>
                     </div>
                     <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div>
                           <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-1">{t('profile.security_code')}</p>
                           <p className="text-[10px] font-black text-slate-900 tracking-widest flex items-center gap-2">
                              <FaShieldAlt className="text-green-500" size={10} /> ****{userData.mobile?.slice(-4)}
                           </p>
                        </div>
                        <FaQrcode className="text-slate-100" size={24} />
                     </div>
                  </div>
               </div>

               <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-xl relative overflow-hidden group">
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                  <h3 className="text-sm font-black mb-2 uppercase tracking-tighter italic">{t('profile.need_help')}</h3>
                  <p className="text-slate-400 text-[10px] font-medium leading-relaxed mb-6 italic">{t('profile.help_desc')}</p>
                  <Link to="/#feedback" className="inline-block bg-primary px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all shadow-lg shadow-orange-900/20">
                     {t('profile.support_center')}
                  </Link>
               </div>
            </div>

            {/* 📜 BOOKING HISTORY */}
            <div className="space-y-6">
               <div className="flex justify-between items-center px-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-2">
                     <FaHistory className="text-primary text-xs" />
                     {t('profile.history')}
                  </h3>
                  <span className="text-[8px] font-black bg-slate-900 text-white px-4 py-1.5 rounded-full uppercase tracking-widest">
                     {orders.length} {t('profile.total')}
                  </span>
               </div>

               <div className="space-y-6 max-h-[800px] overflow-y-auto no-scrollbar pr-1 pb-10">
                  {orders.map((order, idx) => (
                     <motion.div
                        key={order._id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-[32px] border border-orange-50 shadow-lg overflow-hidden group hover:shadow-xl transition-all relative flex flex-col"
                     >
                        {/* Top Accent Strip */}
                        <div className={`h-1.5 w-full ${getLifecycleStage(order.status) >= 0 ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-red-500'}`}></div>

                        <div className="p-8 pb-6">
                           {/* Row 1: Primary Header */}
                           <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                              <div className="flex items-start gap-4">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 shadow-inner shrink-0 ${order.status === 'Completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' :
                                       order.status === 'Failed' ? 'bg-red-50 border-red-100 text-red-500' :
                                          'bg-orange-50 border-orange-100 text-primary'
                                    }`}>
                                    {order.status === 'Failed' ? <FaTimes size={18} /> : order.category === 'Arjee' ? <FaPrayingHands size={18} /> : order.category === 'Bhog' ? <FaBoxOpen size={18} /> : <FaCheckCircle size={18} />}
                                 </div>
                                 <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                       <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">{order.serviceType || order.category || 'Order'}</span>
                                       <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${statusStyle(order.status)}`}>
                                          {order.status?.replace(/_/g, ' ')}
                                       </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-1">
                                       {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                 </div>
                              </div>
                              <div className="text-left md:text-right">
                                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Total Paid</p>
                                 <p className={`text-2xl font-black tracking-tighter italic ${order.status === 'Failed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>₹{(order.totalPrice || order.price || 0).toLocaleString()}</p>
                              </div>
                           </div>

                           {/* Row 2: Itemized Breakdowns */}
                           <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 mb-6 space-y-3">
                              <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                 <FaBoxOpen className="text-orange-400" /> Ordered Items
                              </h5>
                              {order.items && order.items.length > 0 ? (
                                 order.items.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm font-bold border-b border-slate-100/50 last:border-0 pb-2 last:pb-0">
                                       <span className="text-slate-700 flex items-center gap-2">
                                          <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">{item.quantity}x</span>
                                          {item.title}
                                       </span>
                                       <span className="text-slate-900">₹{(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                 ))
                              ) : (
                                 <div className="text-sm font-bold text-slate-700">{order.title || order.name || 'Standard Offering'}</div>
                              )}
                           </div>

                           {/* Row 3: Devotee Details Grid */}
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-left border-y border-slate-50 py-4">
                              <div>
                                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Order ID</p>
                                 <p className="text-[11px] font-bold text-slate-700">{order._id.slice(-8).toUpperCase()}</p>
                              </div>
                              <div>
                                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Txn ID</p>
                                 <p className="text-[11px] font-bold text-slate-700 truncate">{order.paymentId || 'N/A'}</p>
                              </div>
                              <div>
                                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Payment Method</p>
                                 <p className="text-[11px] font-bold text-slate-700">{order.paymentMethod || 'Razorpay'}</p>
                              </div>
                              {order.invoiceNumber && (
                                 <div>
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Invoice Ref</p>
                                    <p className="text-[11px] font-black text-emerald-600">{order.invoiceNumber}</p>
                                 </div>
                              )}
                           </div>

                           {/* Row 4: Lifecycle Tracker */}
                           {!['Refund_Requested', 'Refund_Processing', 'Refunded', 'Refund_Receipt_Generated', 'Cancelled'].includes(order.status) ? (
                              <div className="mb-2">
                                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-3">Order Progress</p>
                                 <div className="relative">
                                    <div className="flex justify-between mb-1.5 px-1 relative z-10">
                                       {['PAY', 'VERIFIED', 'APPROVED', 'INVOICED', 'DONE'].map((stage, idx) => {
                                          const normalIdx = getNormalStageIndex(order.status);
                                          const isCompleted = normalIdx >= idx;
                                          return (
                                             <span key={stage} className={`text-[8px] font-black uppercase tracking-wider ${isCompleted ? 'text-emerald-600' : 'text-slate-300'}`}>
                                                {stage}
                                             </span>
                                          );
                                       })}
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex relative z-0">
                                       {['PAY', 'VERIFIED', 'APPROVED', 'INVOICED', 'DONE'].map((_, idx) => {
                                          const normalIdx = getNormalStageIndex(order.status);
                                          const isCompleted = normalIdx >= idx;
                                          return (
                                             <div key={idx} className={`h-full flex-1 transition-all duration-700 ${isCompleted ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-transparent'} ${idx > 0 ? 'border-l border-white/50' : ''}`}></div>
                                          );
                                       })}
                                    </div>
                                 </div>
                              </div>
                           ) : (
                              <div className="mb-2">
                                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-3">Refund Progress</p>
                                 <div className="relative">
                                    <div className="flex justify-between mb-1.5 px-1 relative z-10">
                                       {['PAY', 'VERIFIED', 'REFUND REQUESTED', 'REFUND PROCESSING', 'REFUNDED', 'REFUND RECEIPT GENERATED'].map((stage, idx) => {
                                          let isCompleted = false;
                                          if (idx <= 1) isCompleted = true;
                                          else if (idx === 2) isCompleted = ['Refund_Requested', 'Refund_Processing', 'Refunded', 'Refund_Receipt_Generated'].includes(order.status);
                                          else if (idx === 3) isCompleted = ['Refund_Processing', 'Refunded', 'Refund_Receipt_Generated'].includes(order.status);
                                          else if (idx === 4) isCompleted = ['Refunded', 'Refund_Receipt_Generated'].includes(order.status);
                                          else if (idx === 5) isCompleted = order.status === 'Refund_Receipt_Generated';
                                          return (
                                             <span key={stage} className={`text-[7px] md:text-[8px] font-black uppercase tracking-wider ${isCompleted ? 'text-red-500' : 'text-slate-300'}`}>
                                                {stage}
                                             </span>
                                          );
                                       })}
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex relative z-0">
                                       {['PAY', 'VERIFIED', 'REFUND REQUESTED', 'REFUND PROCESSING', 'REFUNDED', 'REFUND RECEIPT GENERATED'].map((_, idx) => {
                                          let isCompleted = false;
                                          if (idx <= 1) isCompleted = true;
                                          else if (idx === 2) isCompleted = ['Refund_Requested', 'Refund_Processing', 'Refunded', 'Refund_Receipt_Generated'].includes(order.status);
                                          else if (idx === 3) isCompleted = ['Refund_Processing', 'Refunded', 'Refund_Receipt_Generated'].includes(order.status);
                                          else if (idx === 4) isCompleted = ['Refunded', 'Refund_Receipt_Generated'].includes(order.status);
                                          else if (idx === 5) isCompleted = order.status === 'Refund_Receipt_Generated';
                                          return (
                                             <div key={idx} className={`h-full flex-1 transition-all duration-700 ${isCompleted ? 'bg-red-500' : 'bg-transparent'} ${idx > 0 ? 'border-l border-white/50' : ''}`}></div>
                                          );
                                       })}
                                    </div>
                                 </div>
                              </div>
                           )}
                        </div>

                        {/* Bottom Row: Actions (Strictly Auth-Gated) */}
                        <div className="bg-slate-50 px-8 py-5 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 mt-auto">
                           {(order.status === 'Invoice_Generated' || order.status === 'Completed') && (
                              <Link to={`/premium-invoice/${order._id}`} className="bg-slate-900 text-white border border-slate-900 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center gap-2 shadow-sm active:scale-95">
                                 <FaDownload size={12} /> Download Invoice
                              </Link>
                           )}

                           {order.status === 'Refund_Receipt_Generated' && (
                              <Link to={`/premium-invoice/${order._id}`} className="bg-purple-600 text-white border border-purple-600 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all flex items-center gap-2 shadow-sm shadow-purple-200 active:scale-95">
                                 <FaDownload size={12} /> View Refund Receipt
                              </Link>
                           )}
                           
                           {/* Remove fallback invoice buttons, ensuring they ONLY appear if Admin generates them */}
                        </div>
                     </motion.div>
                  ))}

                  {orders.length === 0 && (
                     <div className="py-24 text-center bg-white rounded-[48px] border border-dashed border-orange-100">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl opacity-20">🪔</div>
                        <p className="text-slate-300 font-black uppercase tracking-[0.2em] text-[10px] italic">{t('profile.no_history')}</p>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* ── INVOICE MODAL ── */}
         {selectedInvoice && (
            <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[48px] shadow-2xl relative no-scrollbar">
                  <button onClick={() => setSelectedInvoice(null)} className="absolute top-8 right-8 z-10 w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-xl">✕</button>
                  <Invoice order={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
               </motion.div>
            </div>
         )}

         {/* ── REFUND RECEIPT MODAL ── */}
         {selectedRefundReceipt && (
            <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[48px] shadow-2xl relative no-scrollbar">
                  <button onClick={() => setSelectedRefundReceipt(null)} className="absolute top-8 right-8 z-10 w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-xl">✕</button>
                  <RefundReceipt refund={selectedRefundReceipt.refundRequest} order={selectedRefundReceipt} />
               </motion.div>
            </div>
         )}

         {/* ── EDIT PROFILE MODAL ── */}
         <AnimatePresence>
            {isEditing && (
               <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                  <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-white w-full max-w-xl rounded-[48px] p-12 shadow-2xl relative">
                     <button onClick={() => setIsEditing(false)} className="absolute top-10 right-10 w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">✕</button>
                     <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-10 italic">{t('profile.edit_title')}</h2>
                     <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">{t('profile.full_name') || 'Name'}</label>
                              <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] px-6 py-5 text-sm font-bold outline-none focus:border-primary transition-all shadow-inner" />
                           </div>
                           <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">{t('profile.email') || 'Email'}</label>
                              <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] px-6 py-5 text-sm font-bold outline-none focus:border-primary transition-all shadow-inner" />
                           </div>
                           <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Mobile Number</label>
                              <input type="text" value={editForm.mobile || ''} onChange={e => setEditForm({ ...editForm, mobile: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] px-6 py-5 text-sm font-bold outline-none focus:border-primary transition-all shadow-inner" disabled={userData.authProvider !== 'google' && !!userData.mobile} />
                           </div>
                           <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">WhatsApp Number</label>
                              <input type="text" value={editForm.whatsappNumber || ''} onChange={e => setEditForm({ ...editForm, whatsappNumber: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] px-6 py-5 text-sm font-bold outline-none focus:border-primary transition-all shadow-inner" />
                           </div>
                           <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Alternate Contact</label>
                              <input type="text" value={editForm.alternateContact || ''} onChange={e => setEditForm({ ...editForm, alternateContact: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] px-6 py-5 text-sm font-bold outline-none focus:border-primary transition-all shadow-inner" />
                           </div>
                           <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Date of Birth</label>
                              <input type="date" value={editForm.dob ? new Date(editForm.dob).toISOString().split('T')[0] : ''} onChange={e => setEditForm({ ...editForm, dob: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] px-6 py-5 text-sm font-bold outline-none focus:border-primary transition-all shadow-inner" />
                           </div>
                           <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Gender</label>
                              <select value={editForm.gender || ''} onChange={e => setEditForm({ ...editForm, gender: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] px-6 py-5 text-sm font-bold outline-none focus:border-primary transition-all shadow-inner">
                                 <option value="">Select Gender</option>
                                 <option value="Male">Male</option>
                                 <option value="Female">Female</option>
                                 <option value="Other">Other</option>
                              </select>
                           </div>
                           <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Profile Photo (Max 2MB)</label>
                              <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] px-6 py-[14px] text-sm font-bold outline-none focus:border-primary transition-all shadow-inner file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-slate-900 file:text-white hover:file:bg-primary" />
                           </div>
                        </div>
                        <div>
                           <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">{t('profile.complete_address') || 'Address'}</label>
                           <textarea value={editForm.address || ''} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] px-6 py-5 text-sm font-bold outline-none focus:border-primary transition-all h-28 resize-none shadow-inner" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                           <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">{t('profile.district') || 'City/District'}</label>
                              <input type="text" value={editForm.district || ''} onChange={e => setEditForm({ ...editForm, district: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] px-6 py-5 text-sm font-bold outline-none focus:border-primary transition-all shadow-inner" />
                           </div>
                           <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">{t('profile.state') || 'State'}</label>
                              <input type="text" value={editForm.state || ''} onChange={e => setEditForm({ ...editForm, state: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] px-6 py-5 text-sm font-bold outline-none focus:border-primary transition-all shadow-inner" />
                           </div>
                           <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Pincode</label>
                              <input type="text" value={editForm.pincode || ''} onChange={e => setEditForm({ ...editForm, pincode: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] px-6 py-5 text-sm font-bold outline-none focus:border-primary transition-all shadow-inner" />
                           </div>
                        </div>
                        <div>
                           <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Country</label>
                           <input type="text" value={editForm.country || 'India'} onChange={e => setEditForm({ ...editForm, country: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-[24px] px-6 py-5 text-sm font-bold outline-none focus:border-primary transition-all shadow-inner" />
                        </div>
                        <button disabled={saving} className="w-full bg-slate-900 text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-primary transition-all active:scale-95 mt-4">
                           {saving ? 'Processing...' : t('common.save')}
                        </button>
                     </form>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>



      </div>
   );
}
