import { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  FaWallet, FaPlus, FaHistory, FaUsers, FaArrowUp, 
  FaArrowDown, FaExchangeAlt, FaShieldAlt, FaSearch,
  FaFileInvoiceDollar, FaChartBar, FaArrowRight, FaSyncAlt,
  FaFileExport, FaLock
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminWallet() {
   const [totalRevenue, setTotalRevenue] = useState(0);
   const [adminBalance, setAdminBalance] = useState(0);
   const [allUsers, setAllUsers] = useState([]);
   const [history, setHistory] = useState([]);
   const [loading, setLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState('');
   const [isSelfTopup, setIsSelfTopup] = useState(false);

   // Adjustment Modal State
   const [selectedUser, setSelectedUser] = useState(null);
   const [adjAmount, setAdjAmount] = useState('');
   const [adjType, setAdjType] = useState('credit'); 
   const [adjReason, setAdjReason] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);

   useEffect(() => {
      fetchData();
   }, []);

   const fetchData = async () => {
      setLoading(true);
      try {
         const [usersRes, historyRes, bookingsRes, profileRes] = await Promise.all([
            API.get('/wallet/all-wallets'),
            API.get('/wallet/global-history'),
            API.get('/bookings'),
            API.get('/users/profile')
         ]);
         setAllUsers(usersRes.data.users || []);
         setHistory(historyRes.data.history || []);
         setAdminBalance(profileRes.data.data?.walletBalance || 0);

         const usersList = usersRes.data.users || [];
         const totalWalletFloat = usersList.reduce((acc, u) => acc + (u.walletBalance || 0), 0);

         const bookingsArray = Array.isArray(bookingsRes.data) ? bookingsRes.data : (bookingsRes.data.data || []);
         const revenue = bookingsArray.reduce((acc, order) => {
            if (['Completed', 'Active'].includes(order.status)) {
               return acc + (order.totalPrice || order.price || 0);
            }
            return acc;
         }, 0);
         setTotalRevenue(revenue + totalWalletFloat);
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   const filteredUsers = allUsers.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.mobile.includes(searchQuery) ||
      user._id.toLowerCase().includes(searchQuery.toLowerCase())
   );

   const handleAdjustment = async (e) => {
      e.preventDefault();
      if (!adjAmount || adjAmount <= 0) return alert("Enter valid amount");
      if (!adjReason) return alert("Please provide a reason for adjustment");

      setIsSubmitting(true);
      try {
         if (isSelfTopup) {
            await API.post('/wallet/self-topup', {
               amount: Number(adjAmount),
               type: adjType,
               description: adjReason
            });
         } else {
            await API.post('/wallet/admin-adjustment', {
               userId: selectedUser._id,
               amount: Number(adjAmount),
               type: adjType,
               description: adjReason
            });
         }
         setSelectedUser(null);
         setIsSelfTopup(false);
         setAdjAmount('');
         setAdjReason('');
         fetchData();
         window.dispatchEvent(new Event('walletUpdate'));
      } catch (err) {
         alert(err.response?.data?.message || "Adjustment failed");
      } finally {
         setIsSubmitting(false);
      }
   };

   const exportWalletCSV = () => {
      const headers = ['Devotee Name', 'WhatsApp', 'Email', 'Devotee ID', 'Unspent Wallet Balance (Liability)'];

      const rows = filteredUsers.map(u => [
         `"${u.name}"`,
         u.mobile,
         u.email || 'N/A',
         `SB-${u._id.slice(-6).toUpperCase()}`,
         u.walletBalance || 0
      ]);

      let csvContent = "data:text/csv;charset=utf-8,"
         + headers.join(",") + "\n"
         + rows.map(e => e.join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `ShyamBhog_Treasury_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   if (loading) return (
    <div className="py-40 text-center flex flex-col items-center justify-center gap-4">
       <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
       <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest animate-pulse">Syncing Financial Ledger...</p>
    </div>
   );

   return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* ── FINANCIAL HEADER ── */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                 <FaFileInvoiceDollar size={20} />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Financial <span className="text-orange-600 not-italic">Center</span></h1>
           </div>
           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] ml-1">Universal Treasury & Liability Governance</p>
        </div>

        <div className="flex flex-wrap items-center gap-6">
           <div className="flex items-center gap-4 bg-white px-8 py-6 rounded-2xl border border-slate-200 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.02)] group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-6xl group-hover:scale-125 transition-transform duration-700"><FaShieldAlt /></div>
              <div className="relative z-10">
                 <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2 leading-none">Administrative Balance</p>
                 <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-bold tracking-tighter text-slate-900">₹{adminBalance.toLocaleString()}</h2>
                    <button 
                      onClick={() => { setIsSelfTopup(true); setSelectedUser({ name: 'Platform Authority' }); }}
                      className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl text-[10px] font-semibold uppercase tracking-widest text-slate-500 hover:bg-orange-600 transition-all shadow-xl shadow-slate-100 active:scale-95"
                    >
                       Adjust
                    </button>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-4 bg-slate-900 px-8 py-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-125 transition-transform duration-700"><FaWallet /></div>
              <div className="relative z-10">
                 <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2 leading-none">Net Platform Liability</p>
                 <h2 className="text-3xl font-bold tracking-tighter text-white">₹{totalRevenue.toLocaleString()}</h2>
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* ── DEVOTEE WALLET LEDGER (LEFT) ── */}
        <div className="xl:col-span-8 space-y-8">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                    <FaUsers size={14} />
                 </div>
                 <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Wallet <span className="text-orange-600 not-italic">Ledger</span></h3>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                 <button onClick={exportWalletCSV} className="flex items-center gap-2.5 bg-white border border-slate-200 px-6 py-3 rounded-2xl text-[10px] font-semibold uppercase tracking-widest text-slate-500 hover:border-emerald-500 hover:text-emerald-600 transition-all group">
                    <FaFileExport size={12} className="group-hover:scale-110 transition-transform" />
                    Export Audit
                 </button>
                 <div className="relative">
                    <input
                       type="text"
                       placeholder="Filter Devotees..."
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="bg-white border border-slate-200 pl-12 pr-6 py-3 rounded-2xl text-xs font-semibold uppercase tracking-widest text-slate-500 outline-none focus:border-orange-500 transition-all w-full md:w-64 shadow-sm"
                    />
                    <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={10} />
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="divide-y divide-slate-50 max-h-[650px] overflow-y-auto custom-scrollbar">
                 <AnimatePresence>
                 {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, i) => (
                       <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          key={user._id} 
                          className="p-6 hover:bg-slate-50/40 transition-all duration-300 group flex flex-col md:flex-row items-center justify-between gap-6"
                       >
                          <div className="flex items-center gap-6 flex-1">
                             <div className="w-14 h-14 rounded-[22px] bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-xl shadow-slate-100 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                                <span>{user.name.charAt(0)}</span>
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent"></div>
                             </div>
                             <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-[15px] tracking-tighter truncate group-hover:text-orange-600 transition-colors">{user.name}</p>
                                <div className="flex items-center gap-3 mt-1">
                                   <p className="text-[10px] font-bold text-slate-400">{user.mobile}</p>
                                   <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                   <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">SB-{user._id.slice(-6).toUpperCase()}</span>
                                   {user.walletFrozen && (
                                      <span className="bg-red-100 text-red-600 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">Frozen</span>
                                   )}
                                </div>
                             </div>
                          </div>

                          <div className="flex items-center gap-4 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                             <div className="text-right mr-4">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-2">Devotee Balance</p>
                                <p className="text-2xl font-bold text-slate-900 tracking-tighter group-hover:scale-105 transition-transform origin-right">₹{user.walletBalance?.toLocaleString() || 0}</p>
                             </div>
                             <button
                                onClick={async () => {
                                   try {
                                      const endpoint = user.walletFrozen ? '/wallet/unfreeze' : '/wallet/freeze';
                                      await API.post(endpoint, { userId: user._id });
                                      alert(user.walletFrozen ? "Wallet unfrozen successfully!" : "Wallet frozen successfully!");
                                      fetchData();
                                   } catch (err) {
                                      alert(err.response?.data?.message || "Action failed");
                                   }
                                }}
                                className={`px-6 py-4 rounded-[22px] text-xs font-semibold uppercase tracking-widest text-slate-500 transition-all active:scale-95 flex items-center gap-2 ${user.walletFrozen ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
                             >
                                <FaLock size={10} className={user.walletFrozen ? "animate-pulse" : ""} />
                                {user.walletFrozen ? "Unfreeze" : "Freeze"}
                             </button>
                          </div>
                       </motion.div>
                    ))
                 ) : (
                    <div className="py-40 text-center flex flex-col items-center justify-center gap-6 opacity-20">
                       <FaChartBar size={48} />
                       <p className="text-xs font-bold uppercase tracking-[0.4em]">Database query returned null results</p>
                    </div>
                 )}
                 </AnimatePresence>
              </div>
           </div>
        </div>

        {/* ── GLOBAL TRANSACTION LOG (RIGHT) ── */}
        <div className="xl:col-span-4 space-y-8">
           <div className="flex items-center gap-3 px-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                 <FaHistory size={14} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Transfer <span className="text-orange-600 not-italic">Intel</span></h3>
           </div>
           
           <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-200 p-2 overflow-hidden border border-white/5">
              <div className="divide-y divide-white/5 max-h-[650px] overflow-y-auto custom-scrollbar">
                 <AnimatePresence>
                 {history.length > 0 ? (
                    history.map((tx, i) => (
                       <motion.div 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          key={tx._id} 
                          className="p-6 hover:bg-white/5 transition-all group border-l-4 border-transparent hover:border-orange-500"
                       >
                          <div className="flex justify-between items-start mb-4">
                             <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                                   {tx.type === 'credit' ? 'Registry Injection' : 'Registry Deduction'}
                                </p>
                                <p className="text-[13px] font-bold text-white tracking-tighter uppercase italic group-hover:text-orange-500 transition-colors">
                                   {tx.userId?.role === 'user' ? tx.userId?.name : tx.targetUserId?.name}
                                </p>
                             </div>
                             <div className={`px-4 py-2 rounded-xl text-[10px] font-bold tracking-tighter ${tx.type === 'credit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                             </div>
                          </div>
                          <p className="text-[11px] font-medium text-slate-400 mb-6 italic leading-relaxed">"{tx.description || 'System synchronized manifest adjustment.'}"</p>
                          <div className="flex justify-between items-center pt-5 border-t border-white/5">
                             <div className="flex flex-col">
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest leading-none mb-1">Time Marker</span>
                                <span className="text-[10px] font-bold text-slate-400">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                             </div>
                             <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                                <FaShieldAlt size={8} className="text-orange-500" />
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Master Node</span>
                             </div>
                          </div>
                       </motion.div>
                    ))
                 ) : (
                    <div className="py-40 text-center flex flex-col items-center justify-center gap-4 opacity-10">
                       <FaSyncAlt size={40} />
                       <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Waiting for manifest sync...</p>
                    </div>
                 )}
                 </AnimatePresence>
              </div>
           </div>
        </div>

      </div>

      {/* ── ADJUSTMENT STUDIO (MODAL) ── */}
      <AnimatePresence>
         {selectedUser && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[100] flex items-center justify-center p-6"
            >
               <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => { setSelectedUser(null); setIsSelfTopup(false); }}></div>
               <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
               >
                  <div className="p-12">
                     <div className="flex justify-between items-center mb-10">
                        <div>
                           <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Treasury <span className="text-orange-600 not-italic">Adjustment</span></h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manual Balance Governance: <span className="text-orange-600 font-bold">{selectedUser.name}</span></p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-bold text-xl text-slate-900">
                           {selectedUser.name.charAt(0)}
                        </div>
                     </div>

                     <form onSubmit={handleAdjustment} className="space-y-8">
                        <div className="flex p-2 bg-slate-100 rounded-xl gap-2">
                           <button 
                             type="button"
                             onClick={() => setAdjType('credit')}
                             className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[22px] text-[10px] font-bold uppercase tracking-widest transition-all ${adjType === 'credit' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100' : 'text-slate-500 hover:bg-slate-200'}`}
                           >
                              <FaPlus /> Registry Injection
                           </button>
                           <button 
                             type="button"
                             onClick={() => setAdjType('debit')}
                             className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[22px] text-[10px] font-bold uppercase tracking-widest transition-all ${adjType === 'debit' ? 'bg-red-600 text-white shadow-xl shadow-red-100' : 'text-slate-500 hover:bg-slate-200'}`}
                           >
                              <FaArrowDown /> Registry Deduction
                           </button>
                        </div>

                        <div className="space-y-3">
                           <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2"><FaLock size={8} /> Adjustment Quantum (₹)</label>
                           <div className="relative">
                              <span className="absolute left-8 top-1/2 -translate-y-1/2 text-3xl font-bold text-slate-300 group-focus-within:text-orange-500 transition-colors">₹</span>
                              <input 
                                type="number" 
                                placeholder="0.00"
                                value={adjAmount}
                                onChange={(e) => setAdjAmount(e.target.value)}
                                className="w-full pl-16 pr-8 py-8 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-4xl text-slate-900 transition-all text-center"
                              />
                           </div>
                        </div>

                        <div className="space-y-3">
                           <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Operational Manifest Remark</label>
                           <textarea 
                             placeholder="Internal documentation for this treasury change..."
                             value={adjReason}
                             onChange={(e) => setAdjReason(e.target.value)}
                             className="w-full p-6 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-orange-500 font-bold text-[12px] text-slate-600 min-h-[120px] resize-none transition-all italic"
                           />
                        </div>

                        <button 
                           disabled={isSubmitting}
                           className={`w-full py-5 rounded-xl font-bold uppercase tracking-[0.2em] text-[11px] transition-all shadow-sm border border-slate-200 text-white ${
                              adjType === 'credit' ? 'bg-emerald-600 shadow-emerald-100' : 'bg-red-600 shadow-red-100'
                           } ${isSubmitting ? 'opacity-50 cursor-wait' : 'active:scale-95'}`}
                        >
                           {isSubmitting ? 'Synchronizing Treasury...' : `Confirm Registry ${adjType === 'credit' ? 'Injection' : 'Deduction'}`}
                        </button>
                     </form>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

    </div>
   );
}
