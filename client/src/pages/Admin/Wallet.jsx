import { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  FaWallet, FaPlus, FaHistory, FaUsers, FaArrowUp, 
  FaArrowDown, FaExchangeAlt, FaShieldAlt, FaSearch,
  FaFileInvoiceDollar, FaChartBar, FaArrowRight, FaSyncAlt,
  FaFileExport, FaLock, FaCheckCircle, FaExclamationCircle, FaUserCheck
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminWallet() {
   const [totalRevenue, setTotalRevenue] = useState(0);
   const [adminBalance, setAdminBalance] = useState(0);
   const [totalWalletFloat, setTotalWalletFloat] = useState(0);
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
            API.get('/wallet/all-wallets').catch(() => ({ data: { users: [] } })),
            API.get('/wallet/global-history').catch(() => ({ data: { history: [] } })),
            API.get('/bookings').catch(() => ({ data: { data: [] } })),
            API.get('/users/profile').catch(() => ({ data: { data: {} } }))
         ]);
         
         const usersList = usersRes.data.users || [];
         setAllUsers(usersList);
         setHistory(historyRes.data.history || []);
         setAdminBalance(profileRes.data.data?.walletBalance || 0);

         const floatSum = usersList.reduce((acc, u) => acc + (u.walletBalance || 0), 0);
         setTotalWalletFloat(floatSum);

         const bookingsArray = Array.isArray(bookingsRes.data) ? bookingsRes.data : (bookingsRes.data.data || []);
         const revenue = bookingsArray.reduce((acc, order) => {
            if (['Completed', 'Active', 'Payment_Verified', 'Approved', 'Invoice_Generated'].includes(order.status)) {
               return acc + (order.payableAmount || order.totalPrice || order.price || 0);
            }
            return acc;
         }, 0);
         setTotalRevenue(revenue);
      } catch (err) {
         console.error("Wallet Data Fetch Error:", err);
      } finally {
         setLoading(false);
      }
   };

   const filteredUsers = allUsers.filter(user =>
      (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.mobile || '').includes(searchQuery) ||
      (user._id || '').toLowerCase().includes(searchQuery.toLowerCase())
   );

   const handleAdjustment = async (e) => {
      e.preventDefault();
      if (!adjAmount || Number(adjAmount) <= 0) return alert("Please enter a valid amount");
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
      const headers = ['Devotee Name', 'WhatsApp', 'Email', 'Devotee ID', 'Unspent Wallet Balance (₹)'];

      const rows = filteredUsers.map(u => [
         `"${u.name}"`,
         u.mobile || 'N/A',
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
      link.setAttribute("download", `ShyamBhog_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* ── FINANCIAL HEADER ── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                 <FaFileInvoiceDollar size={18} />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Financial <span className="text-orange-600">Center</span></h1>
           </div>
           <p className="text-slate-400 font-semibold text-[11px] uppercase tracking-widest">Real-time Revenue, Wallet Balances & Transaction Audit Log</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
           <button 
             onClick={exportWalletCSV} 
             className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-95"
           >
              <FaFileExport size={12} /> Export Audit CSV
           </button>
           <button 
             onClick={fetchData} 
             className="w-11 h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 transition-all active:scale-95 shrink-0"
             title="Sync Financial Data"
           >
              <FaSyncAlt size={14} />
           </button>
        </div>
      </header>

      {/* ── FINANCIAL METRICS CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Platform Net Revenue */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-10 text-7xl group-hover:scale-110 transition-transform"><FaWallet /></div>
           <div className="relative z-10 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Net Revenue</span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">₹{totalRevenue.toLocaleString()}</h2>
              <p className="text-[10px] font-bold text-emerald-400 flex items-center gap-1"><FaCheckCircle size={10} /> Verified Booking Payments</p>
           </div>
        </div>

        {/* Card 2: Wallet Liabilities */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-5 text-7xl text-orange-600 group-hover:scale-110 transition-transform"><FaUsers /></div>
           <div className="relative z-10 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unspent Wallet Funds</span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">₹{totalWalletFloat.toLocaleString()}</h2>
              <p className="text-[10px] font-bold text-slate-500">Active Devotee Wallet Balances</p>
           </div>
        </div>

        {/* Card 3: Admin Treasury */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group flex flex-col justify-between">
           <div className="relative z-10 space-y-3">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admin Treasury</span>
                 <button 
                   onClick={() => { setIsSelfTopup(true); setSelectedUser({ name: 'Primary Admin' }); }}
                   className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
                 >
                    + Adjust
                 </button>
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">₹{adminBalance.toLocaleString()}</h2>
              <p className="text-[10px] font-bold text-slate-500">Platform Treasury Reserve</p>
           </div>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* ── DEVOTEE WALLET LEDGER (LEFT 7 COLS) ── */}
        <div className="xl:col-span-7 space-y-6">
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                       <FaUsers size={14} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Devotee Wallet Ledger</h3>
                 </div>
                 <div className="relative w-full sm:w-64">
                    <input
                       type="text"
                       placeholder="Search Devotees..."
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-orange-500 transition-all"
                    />
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
                 </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto custom-scrollbar pr-1">
                 <AnimatePresence>
                 {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, i) => (
                       <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={user._id || i} 
                          className="py-4 px-2 hover:bg-slate-50 rounded-2xl transition-all duration-200 flex items-center justify-between gap-4 group"
                       >
                          <div className="flex items-center gap-4 min-w-0">
                             <div className="w-11 h-11 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-black text-base shadow-md shrink-0">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'D'}
                             </div>
                             <div className="min-w-0">
                                <p className="font-extrabold text-slate-900 text-sm tracking-tight truncate group-hover:text-orange-600 transition-colors">
                                   {user.name || 'Devotee'}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                   <span className="text-[11px] font-medium text-slate-500">{user.mobile || user.email || 'Google User'}</span>
                                   {user.walletFrozen && (
                                      <span className="bg-red-100 text-red-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Frozen</span>
                                   )}
                                </div>
                             </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                             <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Balance</p>
                                <p className="text-base font-black text-slate-900 tracking-tight">₹{(user.walletBalance || 0).toLocaleString()}</p>
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
                                className={`p-2.5 rounded-xl text-xs font-bold transition-all ${user.walletFrozen ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                title={user.walletFrozen ? "Unfreeze Wallet" : "Freeze Wallet"}
                             >
                                <FaLock size={12} />
                             </button>

                             <button
                                onClick={() => { setIsSelfTopup(false); setSelectedUser(user); }}
                                className="px-3 py-2 bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                             >
                                Adjust
                             </button>
                          </div>
                       </motion.div>
                    ))
                 ) : (
                    <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-slate-300">
                       <FaUsers size={36} />
                       <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No Devotee Accounts Found</p>
                    </div>
                 )}
                 </AnimatePresence>
              </div>
           </div>
        </div>

        {/* ── TRANSACTION AUDIT LOG (RIGHT 5 COLS) ── */}
        <div className="xl:col-span-5 space-y-6">
           <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-6 shadow-xl border border-slate-800">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                 <div className="w-8 h-8 rounded-xl bg-slate-800 text-orange-500 flex items-center justify-center font-bold">
                    <FaHistory size={14} />
                 </div>
                 <h3 className="text-lg font-black text-white tracking-tight">Recent Audit Log</h3>
              </div>
              
              <div className="divide-y divide-slate-800/80 max-h-[550px] overflow-y-auto custom-scrollbar pr-1">
                 <AnimatePresence>
                 {history.length > 0 ? (
                    history.map((tx, i) => (
                       <motion.div 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={tx._id || i} 
                          className="py-4 space-y-2 hover:bg-white/5 p-3 rounded-2xl transition-all"
                       >
                          <div className="flex justify-between items-start">
                             <div>
                                <p className="text-xs font-extrabold text-white">
                                   {tx.userId?.name || tx.targetUserId?.name || 'Devotee'}
                                </p>
                                <span className="text-[10px] font-bold text-slate-400">
                                   {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                             </div>
                             <div className={`px-2.5 py-1 rounded-xl text-xs font-black ${tx.type === 'credit' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                             </div>
                          </div>
                          <p className="text-[11px] font-medium text-slate-400 italic leading-relaxed">
                             "{tx.description || 'Wallet transaction completed'}"
                          </p>
                       </motion.div>
                    ))
                 ) : (
                    <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-slate-600">
                       <FaHistory size={36} />
                       <p className="text-xs font-bold uppercase tracking-widest text-slate-500">No Transactions Recorded Yet</p>
                    </div>
                 )}
                 </AnimatePresence>
              </div>
           </div>
        </div>

      </div>

      {/* ── ADJUSTMENT MODAL ── */}
      <AnimatePresence>
         {selectedUser && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6"
            >
               <motion.div 
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 space-y-6 relative"
               >
                  <button 
                     onClick={() => { setSelectedUser(null); setIsSelfTopup(false); }}
                     className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-black transition-all"
                  >
                     ✕
                  </button>

                  <div>
                     <h3 className="text-xl font-black text-slate-900 tracking-tight">Adjust Wallet Balance</h3>
                     <p className="text-xs font-medium text-slate-500 mt-0.5">Target: <strong className="text-orange-600">{selectedUser.name}</strong></p>
                  </div>

                  <form onSubmit={handleAdjustment} className="space-y-5">
                     <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
                        <button
                           type="button"
                           onClick={() => setAdjType('credit')}
                           className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${adjType === 'credit' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                           + Add Money (Credit)
                        </button>
                        <button
                           type="button"
                           onClick={() => setAdjType('debit')}
                           className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${adjType === 'debit' ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                           - Deduct Money (Debit)
                        </button>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Amount (₹)</label>
                        <input
                           type="number"
                           min="1"
                           required
                           placeholder="e.g. 500"
                           value={adjAmount}
                           onChange={(e) => setAdjAmount(e.target.value)}
                           className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-orange-500 font-bold text-slate-900 text-base transition-all"
                        />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Reason / Reference Note</label>
                        <textarea
                           required
                           placeholder="Provide a clear reason for this adjustment..."
                           value={adjReason}
                           onChange={(e) => setAdjReason(e.target.value)}
                           className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-orange-500 font-medium text-slate-800 text-xs h-24 resize-none transition-all"
                        />
                     </div>

                     <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-slate-950 hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50"
                     >
                        {isSubmitting ? "Processing Adjustment..." : "Confirm & Save Adjustment"}
                     </button>
                  </form>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

    </div>
   );
}
