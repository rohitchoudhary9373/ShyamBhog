import { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  FaMoneyBillWave, FaClock, FaCheckCircle, FaTimesCircle, 
  FaUser, FaBoxOpen, FaSyncAlt, FaArrowRight, FaFilter, 
  FaSearch, FaHistory, FaCreditCard, FaWallet, FaFileExport, 
  FaChartLine, FaUserCircle, FaExclamationTriangle, FaFileInvoice,
  FaPrint, FaShieldAlt, FaCalendarAlt, FaTimes, FaExternalLinkAlt
} from 'react-icons/fa';
import { getUser } from '../../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';

export default function Refunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [resellers, setResellers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  
  // Custom modals state
  const [processingRefund, setProcessingRefund] = useState(null);
  const [processForm, setProcessForm] = useState({ status: 'approved', method: 'wallet', remarks: '' });
  const [viewingOrder, setViewingOrder] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  const user = getUser();
  const isSuperAdmin = user?.role === 'admin';

  // Stats calculation
  const stats = {
    total: refunds.length,
    approved: refunds.filter(r => r.status === 'approved').length,
    pending: refunds.filter(r => r.status === 'pending').length,
    rejected: refunds.filter(r => r.status === 'rejected').length,
    totalAmount: refunds.filter(r => r.status === 'approved').reduce((acc, curr) => acc + (curr.amount || 0), 0)
  };

  const fetchResellers = async () => {
    try {
      const res = await API.get('/users/resellers');
      setResellers(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/refunds/admin?tenantId=${selectedTenant}`);
      setRefunds(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) fetchResellers();
    const ownerId = user?.role === 'agent' ? user?.parentAdmin : user?._id;
    setSelectedTenant(ownerId);
  }, []);

  useEffect(() => {
    if (selectedTenant) fetchRefunds();
  }, [selectedTenant]);

  const handleProcessSubmit = async (e) => {
    e.preventDefault();
    if (!processingRefund) return;
    try {
      await API.put(`/refunds/process/${processingRefund._id}`, { 
        status: processForm.status, 
        adminRemarks: processForm.remarks, 
        method: processForm.method 
      });
      setProcessingRefund(null);
      setProcessForm({ status: 'approved', method: 'wallet', remarks: '' });
      fetchRefunds();
      alert(`✅ Dispute successfully settled: ${processForm.status.toUpperCase()}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing refund');
    }
  };

  const exportCSV = () => {
    const headers = ['Order ID', 'Devotee', 'Amount', 'Method', 'Reason', 'Status', 'Date', 'Admin Note'];
    const rows = filteredRefunds.map(r => [
      r.orderId?._id?.toUpperCase() || 'SYS-ORD',
      `"${r.userId?.name || 'Unknown'}"`,
      r.amount,
      r.refundMethod || (r.upiId ? 'UPI' : r.bankDetails?.accountNumber ? 'Bank' : 'Wallet'),
      `"${r.reason || 'N/A'}"`,
      r.status.toUpperCase(),
      new Date(r.createdAt).toLocaleDateString(),
      `"${r.adminRemarks || ''}"`
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Refund_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRefunds = refunds.filter(r => {
    let match = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const userName = r.userId?.name?.toLowerCase() || '';
      const orderId = r.orderId?._id?.toLowerCase() || '';
      const refundId = r._id?.toLowerCase() || '';
      const receiptNum = r.receiptNumber?.toLowerCase() || '';
      match = userName.includes(q) || orderId.includes(q) || refundId.includes(q) || receiptNum.includes(q);
    }
    if (statusFilter !== 'All') {
      match = match && r.status === statusFilter.toLowerCase();
    }
    if (methodFilter !== 'All') {
      const actualMethod = r.refundMethod || (r.upiId ? 'upi' : r.bankDetails?.accountNumber ? 'bank' : 'wallet');
      match = match && actualMethod === methodFilter.toLowerCase();
    }
    if (typeFilter !== 'All') {
      const bookingType = r.orderId?.serviceType || 'Cart';
      match = match && bookingType.toLowerCase() === typeFilter.toLowerCase();
    }
    return match;
  });

  if (loading) return (
    <div className="py-40 text-center flex flex-col items-center justify-center gap-4">
       <div className="w-10 h-10 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
       <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">Auditing Dispute Ledger...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* ── HEADER ── */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1.5">
             <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center border border-orange-500/20">
               <FaShieldAlt size={12} />
             </div>
             <span className="text-[10px] font-bold text-orange-600 uppercase tracking-[0.2em] italic">Sacred Treasury Operations</span>
           </div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight uppercase italic">Refund Governance</h1>
           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Refund Operations & Resolution Center</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
           <button 
             onClick={exportCSV}
             className="flex-1 lg:flex-none bg-white border border-slate-200 text-slate-900 px-5 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
           >
              <FaFileExport /> Export Data
           </button>
           <button 
             onClick={() => {
                alert(`Platform Refund Analytics are active.\nApproved: ${stats.approved}\nPending: ${stats.pending}\nTotal Disbursed: ₹${stats.totalAmount.toLocaleString()}`);
             }}
             className="flex-1 lg:flex-none bg-slate-900 text-white px-6 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
           >
              <FaChartLine /> Summary Analytics
           </button>
           <button onClick={fetchRefunds} className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-orange-600 transition-all shadow-sm group active:scale-95">
              <FaSyncAlt className="group-hover:rotate-180 transition-transform duration-700" size={14} />
           </button>
        </div>
      </header>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
        {[
          { label: 'Total Requests', val: stats.total, icon: <FaHistory />, color: 'text-blue-600 bg-blue-50 border-blue-100/50' },
          { label: 'Approved & Settled', val: stats.approved, icon: <FaCheckCircle />, color: 'text-emerald-600 bg-emerald-50 border-emerald-100/50' },
          { label: 'Pending Reviews', val: stats.pending, icon: <FaClock />, color: 'text-orange-600 bg-orange-50 border-orange-100/50' },
          { label: 'Rejected Requests', val: stats.rejected, icon: <FaTimesCircle />, color: 'text-red-600 bg-rose-50 border-rose-100/50' },
          { label: 'Total Refund Volume', val: `₹${stats.totalAmount.toLocaleString()}`, icon: <FaMoneyBillWave />, color: 'text-indigo-600 bg-indigo-50 border-indigo-100/50' }
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group flex flex-col justify-between h-28">
             <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[15px] border ${s.color} group-hover:scale-110 transition-transform`}>
                   {s.icon}
                </div>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{s.val}</span>
             </div>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── FILTERS ── */}
      <div className="flex flex-col xl:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-4 z-30">
         <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-2xl flex-1 w-full border border-slate-100/55">
            <FaSearch className="text-slate-400" size={12} />
            <input
              type="text"
              placeholder="Search by Refund ID, Order ID, or Devotee Name..."
              className="bg-transparent border-none outline-none font-bold text-xs text-slate-900 placeholder:text-slate-300 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         
         <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
            {/* Status Filter */}
            <div className="flex-1 sm:flex-none">
              <select
                 className="w-full sm:w-auto bg-slate-50 border border-slate-100 outline-none font-bold text-[9px] text-slate-900 px-4 py-3 rounded-xl uppercase tracking-widest cursor-pointer hover:border-orange-500 transition-all"
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value)}
              >
                 <option value="All">All Statuses</option>
                 <option value="pending">Under Review</option>
                 <option value="approved">Approved & Settled</option>
                 <option value="rejected">Rejected Requests</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <div className="flex-1 sm:flex-none">
              <select
                 className="w-full sm:w-auto bg-slate-50 border border-slate-100 outline-none font-bold text-[9px] text-slate-900 px-4 py-3 rounded-xl uppercase tracking-widest cursor-pointer hover:border-orange-500 transition-all"
                 value={methodFilter}
                 onChange={(e) => setMethodFilter(e.target.value)}
              >
                 <option value="All">All Methods</option>
                 <option value="wallet">Wallet Refund</option>
                 <option value="razorpay">Razorpay Gateway</option>
                 <option value="manual">Manual Settlement</option>
              </select>
            </div>

            {/* Booking Type Filter */}
            <div className="flex-1 sm:flex-none">
              <select
                 className="w-full sm:w-auto bg-slate-50 border border-slate-100 outline-none font-bold text-[9px] text-slate-900 px-4 py-3 rounded-xl uppercase tracking-widest cursor-pointer hover:border-orange-500 transition-all"
                 value={typeFilter}
                 onChange={(e) => setTypeFilter(e.target.value)}
              >
                 <option value="All">All Sectors</option>
                 <option value="Arjee">Arjee Requests</option>
                 <option value="Bhog">Bhog Orders</option>
                 <option value="Cart">Prasad Cart</option>
                 <option value="Stay">Suites & Stays</option>
              </select>
            </div>

            {isSuperAdmin && (
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 min-w-[150px] w-full sm:w-auto">
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Source:</span>
                 <select 
                   value={selectedTenant} 
                   onChange={(e) => setSelectedTenant(e.target.value)}
                   className="bg-transparent border-none outline-none font-bold text-[9px] text-orange-600 uppercase tracking-widest cursor-pointer focus:ring-0 w-full"
                 >
                   <option value={user?._id}>Core Platform</option>
                   {resellers.map(r => (
                     <option key={r._id} value={r._id}>{r.name}</option>
                   ))}
                 </select>
              </div>
            )}
         </div>
      </div>

      {/* ── REFUND LEDGER LIST (Enterprise Design) ── */}
      <div className="space-y-6">
        <AnimatePresence>
        {filteredRefunds.map((refund, i) => {
          const actualMethod = refund.refundMethod || (refund.upiId ? 'razorpay' : refund.bankDetails?.accountNumber ? 'manual' : 'wallet');
          const isPending = refund.status === 'pending';
          const isApproved = refund.status === 'approved';
          const orderType = refund.orderId?.serviceType || 'Cart';

          return (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              key={refund._id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-orange-100/10 hover:border-orange-200/40 transition-all duration-300 relative group overflow-hidden"
            >
              {/* Card Header */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-5 border-b border-slate-100/80 mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform shrink-0">
                    <FaBoxOpen size={20} className="text-slate-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-slate-900 text-base tracking-tighter uppercase italic">
                        Dispute #{refund._id.slice(-6).toUpperCase()}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-widest border ${
                        orderType === 'Arjee' ? 'bg-purple-50 text-purple-600 border-purple-100/60' :
                        orderType === 'Bhog' ? 'bg-orange-50 text-orange-600 border-orange-100/60' :
                        orderType === 'Stay' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/60' :
                        'bg-blue-50 text-blue-600 border-blue-100/60'
                      }`}>
                        {orderType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <FaCalendarAlt size={8} />
                        {new Date(refund.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        Order Ref: #{refund.orderId?._id ? refund.orderId._id.slice(-8).toUpperCase() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
                  <div className="text-left lg:text-right">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">Disputed Sum</p>
                    <p className="text-2xl font-bold text-orange-600 tracking-tight leading-none">₹{refund.amount}</p>
                  </div>
                  <div className="h-8 border-l border-slate-100 hidden lg:block"></div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-widest text-slate-500 border shadow-sm ${
                    refund.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                    refund.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    'bg-red-50 text-red-600 border-red-100'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${refund.status === 'pending' ? 'bg-orange-500 animate-pulse' : refund.status === 'approved' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    {refund.status === 'pending' ? 'Under Review' : refund.status === 'approved' ? 'Settled' : 'Rejected'}
                  </span>
                </div>
              </div>

              {/* Card Body Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                
                {/* Devotee Info */}
                <div className="bg-slate-50/50 border border-slate-100/80 p-5 rounded-[22px] flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-2.5">Devotee Information</span>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-sm uppercase">
                        {refund.userId?.name?.charAt(0) || 'D'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs uppercase tracking-tight leading-none mb-1">{refund.userId?.name || 'Devotee User'}</p>
                        <p className="text-[10px] font-medium text-slate-500 tracking-wider">{refund.userId?.mobile || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] font-semibold uppercase tracking-widest text-slate-500 text-slate-400">
                    <span>Payment Gateway</span>
                    <span className="text-slate-700 font-bold">{refund.orderId?.paymentId ? 'Razorpay' : 'Wallet'}</span>
                  </div>
                </div>

                {/* Settle Details */}
                <div className="bg-slate-50/50 border border-slate-100/80 p-5 rounded-[22px] flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-2.5">Refund Settlement Method</span>
                    {refund.upiId ? (
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                          <FaCreditCard size={12} />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">BHIM UPI</p>
                          <p className="text-xs font-bold text-slate-900 tracking-wider truncate max-w-[140px]">{refund.upiId}</p>
                        </div>
                      </div>
                    ) : refund.bankDetails?.accountNumber ? (
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                          <FaHistory size={12} />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">Direct Bank Account</p>
                          <p className="text-xs font-bold text-slate-900 tracking-widest">****{refund.bankDetails.accountNumber.slice(-4)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                          <FaWallet size={12} />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">Internal Ledger Account</p>
                          <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Devotee Wallet</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] font-semibold uppercase tracking-widest text-slate-500 text-slate-400">
                    <span>Receipt State</span>
                    {refund.receiptNumber ? (
                      <span className="text-emerald-600 font-bold">{refund.receiptNumber}</span>
                    ) : (
                      <span className="text-slate-400 italic">Unissued</span>
                    )}
                  </div>
                </div>

                {/* Dispute Grounds / Notes */}
                <div className="bg-slate-50/50 border border-slate-100/80 p-5 rounded-[22px] flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1">Dispute Grounds</span>
                    <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic line-clamp-2 hover:line-clamp-none">
                      "{refund.reason || 'No specific dispute grounds reported.'}"
                    </p>
                  </div>
                  {refund.adminRemarks && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 border-dashed">
                      <span className="text-[10px] font-semibold text-orange-600 uppercase tracking-widest block mb-0.5">Resolution Note</span>
                      <p className="text-[10px] font-bold text-slate-700 truncate">"{refund.adminRemarks}"</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Refund Timeline Visualization */}
              <div className="bg-slate-50/30 border border-slate-100/60 p-4 rounded-[22px] mb-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[10px] font-semibold uppercase tracking-widest text-slate-500 text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span>
                    <span>Dispute Lifecycle Timeline:</span>
                  </div>
                  <div className="flex flex-wrap gap-4 sm:gap-6 w-full sm:w-auto">
                    {[
                      { label: 'Initiated', active: true },
                      { label: 'Reviewed', active: !isPending },
                      { label: 'Decided', active: !isPending },
                      { label: 'Settled', active: isApproved },
                      { label: 'Receipted', active: isApproved && !!refund.receiptNumber }
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold ${
                          step.active ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-200 text-slate-400'
                        }`}>
                          {step.active ? '✓' : idx + 1}
                        </div>
                        <span className={step.active ? 'text-slate-800 font-bold' : 'text-slate-400 font-semibold'}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex flex-wrap justify-between items-center gap-4 pt-4 border-t border-slate-100/80">
                <div className="flex items-center gap-2">
                  {refund.orderId && (
                    <button 
                      onClick={() => setViewingOrder(refund.orderId)}
                      className="px-4 py-2 bg-white border border-slate-200 hover:border-[#0A1128] hover:text-slate-900 rounded-xl text-[10px] font-semibold uppercase tracking-widest text-slate-500 transition-all active:scale-95 shadow-sm flex items-center gap-1.5"
                    >
                      <FaBoxOpen size={10} />
                      View Order
                    </button>
                  )}
                  {refund.receiptNumber && (
                    <button 
                      onClick={() => setViewingReceipt(refund)}
                      className="px-4 py-2 bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white rounded-xl text-[10px] font-semibold uppercase tracking-widest text-slate-500 transition-all active:scale-95 border border-orange-100 flex items-center gap-1.5"
                    >
                      <FaFileInvoice size={10} />
                      View Refund Receipt
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {isPending ? (
                    <>
                      <button 
                        onClick={() => {
                          setProcessingRefund(refund);
                          setProcessForm({ status: 'approved', method: 'wallet', remarks: '' });
                        }}
                        className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-[10px] font-semibold uppercase tracking-widest text-slate-500 transition-all active:scale-95 shadow-lg shadow-emerald-100 flex items-center gap-1.5"
                      >
                        <FaWallet size={10} />
                        Settle Dispute
                      </button>
                      <button 
                        onClick={() => {
                          setProcessingRefund(refund);
                          setProcessForm({ status: 'rejected', method: 'manual', remarks: '' });
                        }}
                        className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-xl text-[10px] font-semibold uppercase tracking-widest text-slate-500 transition-all active:scale-95 border border-red-100 flex items-center gap-1.5"
                      >
                        <FaTimesCircle size={10} />
                        Reject Request
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                      <FaCheckCircle size={10} className={isApproved ? 'text-emerald-500' : 'text-red-500'} />
                      Settle Path: {actualMethod === 'razorpay' ? 'Razorpay Gateway' : actualMethod === 'wallet' ? 'Devotee Wallet' : 'Manual Settlement'}
                    </div>
                  )}
                </div>
              </div>

            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>

      {!loading && filteredRefunds.length === 0 && (
         <div className="py-40 text-center flex flex-col items-center justify-center gap-6 opacity-20">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
               <FaHistory size={24} />
            </div>
            <div className="space-y-1">
               <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">No Refund Requests</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Refund manifest is clear.</p>
            </div>
         </div>
      )}

      {/* ── DISPUTE SETTLEMENT MODAL ── */}
      <AnimatePresence>
        {processingRefund && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-md" onClick={() => setProcessingRefund(null)}></div>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden border border-slate-200"
            >
              <header className="p-6 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-6xl -mr-6 -mt-6"><FaShieldAlt /></div>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold tracking-tighter uppercase italic">Settle Dispute</h3>
                  <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest text-slate-500 mt-0.5">
                    Order Ref: #{processingRefund.orderId?._id?.slice(-8).toUpperCase() || 'SYS-ORD'}
                  </p>
                </div>
                <button 
                  onClick={() => setProcessingRefund(null)}
                  className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-sm"
                >
                  <FaTimes />
                </button>
              </header>

              <form onSubmit={handleProcessSubmit} className="p-6 space-y-6 bg-[#F8FAFC]">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block px-1">Dispute Action Decided</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setProcessForm({ ...processForm, status: 'approved' })}
                      className={`py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest border transition-all ${
                        processForm.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Approve & Refund
                    </button>
                    <button
                      type="button"
                      onClick={() => setProcessForm({ ...processForm, status: 'rejected' })}
                      className={`py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest border transition-all ${
                        processForm.status === 'rejected'
                          ? 'bg-red-50 text-red-600 border-red-200 shadow-sm'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Reject Request
                    </button>
                  </div>
                </div>

                {processForm.status === 'approved' && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block px-1">Disbursement Settle Method</label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: 'wallet', label: 'Wallet Credit', icon: <FaWallet /> },
                        { id: 'razorpay', label: 'Gateway API', icon: <FaCreditCard /> },
                        { id: 'manual', label: 'Manual Cash', icon: <FaMoneyBillWave /> }
                      ].map(method => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setProcessForm({ ...processForm, method: method.id })}
                          className={`py-3 rounded-xl font-bold text-[9px] uppercase tracking-widest border flex flex-col items-center justify-center gap-1.5 transition-all ${
                            processForm.method === method.id
                              ? 'bg-orange-50 text-orange-600 border-orange-200 shadow-sm'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xs">{method.icon}</span>
                          <span>{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block px-1">Resolution Remarks Note</label>
                  <textarea
                    required
                    placeholder="Provide audit justification details for this dispute resolution action..."
                    value={processForm.remarks}
                    onChange={(e) => setProcessForm({ ...processForm, remarks: e.target.value })}
                    rows={4}
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 font-medium text-xs text-slate-900 resize-none transition-all placeholder:text-slate-300"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setProcessingRefund(null)}
                    className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:bg-white hover:text-slate-900 transition-all"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-4 bg-slate-900 text-white hover:bg-orange-600 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95"
                  >
                    Execute Resolution Settle
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── VIEW ORDER DETAILS MODAL ── */}
      <AnimatePresence>
        {viewingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-md" onClick={() => setViewingOrder(null)}></div>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]"
            >
              <header className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-xl font-bold tracking-tighter uppercase italic">Booking Invoice Details</h3>
                  <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest text-slate-500 mt-0.5">
                    Invoice: {viewingOrder.invoiceNumber || 'Unissued'}
                  </p>
                </div>
                <button 
                  onClick={() => setViewingOrder(null)}
                  className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-sm"
                >
                  <FaTimes />
                </button>
              </header>

              <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 bg-[#F8FAFC] flex-grow">
                {/* Devotee Details */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block border-b border-slate-50 pb-2">Devotee Record</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Name</p>
                      <p className="text-xs font-bold text-slate-800 uppercase mt-0.5">{viewingOrder.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">WhatsApp</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{viewingOrder.whatsapp}</p>
                    </div>
                  </div>
                </div>

                {/* Booking Items */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block border-b border-slate-50 pb-2">Ordered Services</span>
                  <div className="space-y-3">
                    {viewingOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                        <div>
                          <p className="font-bold text-xs text-slate-900 uppercase">{item.title || 'Service Offering'}</p>
                          {item.slot && (
                            <p className="text-[8.5px] font-bold text-slate-400 mt-0.5 uppercase">
                              Date: {new Date(item.slot).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                          {item.message && (
                            <p className="text-[9px] font-medium text-slate-500 italic mt-1">"{item.message}"</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[9px] font-bold text-slate-900">₹{item.price}</p>
                          <p className="text-[8px] font-bold text-slate-400 mt-0.5">Qty: {item.quantity || 1}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block border-b border-slate-50 pb-2">Financial Breakdown</span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>Total Value</span>
                      <span>₹{viewingOrder.totalPrice}</span>
                    </div>
                    {viewingOrder.walletDeduction > 0 && (
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Wallet Redeemed</span>
                        <span>-₹{viewingOrder.walletDeduction}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-slate-900 border-t border-slate-50 pt-2 text-sm">
                      <span>Payable Amount</span>
                      <span className="text-orange-600">₹{viewingOrder.payableAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── VIEW REFUND RECEIPT MODAL ── */}
      <AnimatePresence>
        {viewingReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-md" onClick={() => setViewingReceipt(null)}></div>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden border border-slate-200"
            >
              <div id="refund-receipt-printable" className="p-6 space-y-8 bg-white text-slate-800">
                {/* Receipt Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-100 pb-5">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">SHYAM BHOG</h2>
                    <span className="text-[7.5px] font-bold text-orange-600 uppercase tracking-[0.3em] block mt-1.5">Official Settle Receipt</span>
                  </div>
                  <div className="text-right">
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Disbursed
                    </span>
                    <p className="text-[9.5px] font-bold text-slate-900 uppercase mt-2.5">{viewingReceipt.receiptNumber}</p>
                  </div>
                </div>

                {/* Receipt Details */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs border-b border-slate-100 pb-6">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">Receipt Date</p>
                    <p className="font-bold text-slate-900">
                      {viewingReceipt.processedAt ? new Date(viewingReceipt.processedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">Transaction Ref</p>
                    <p className="font-bold text-slate-900 uppercase">{viewingReceipt.orderId?.paymentId || 'Wallet Ledger'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">Original Invoice</p>
                    <p className="font-bold text-slate-900 uppercase">#{viewingReceipt.orderId?._id?.slice(-8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">Devotee Customer</p>
                    <p className="font-bold text-slate-900 uppercase">{viewingReceipt.userId?.name}</p>
                  </div>
                </div>

                {/* Amount Table */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-900 uppercase">Sacred Order Dispute Settlement</p>
                      <p className="text-[8.5px] text-slate-400 mt-0.5">Refund type: {viewingReceipt.refundMethod?.toUpperCase() || 'WALLET'}</p>
                    </div>
                    <span className="font-bold text-base text-emerald-600">₹{viewingReceipt.amount}</span>
                  </div>
                </div>

                {/* Audit notes */}
                <div className="bg-orange-50/50 border border-orange-100/50 rounded-2xl p-4 text-[10.5px] leading-relaxed text-[#0a1128]/80 font-medium">
                  <span className="text-[10px] font-semibold text-orange-600 uppercase tracking-widest block mb-1">Governance Resolution Remarks</span>
                  "{viewingReceipt.adminRemarks || 'Disputed devotional offering settled by administrator governance.'}"
                </div>

                {/* Footer */}
                <div className="text-center space-y-1 pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] leading-none">Jai Shree Shyam</p>
                  <p className="text-[6.5px] font-bold text-slate-300 uppercase tracking-[0.1em]">Shyam Bhog Devotional Registry • Audit Verification</p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0 justify-end">
                <button
                  onClick={() => setViewingReceipt(null)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl font-bold text-[9px] uppercase tracking-widest text-slate-400 hover:bg-white hover:text-slate-700 transition-all active:scale-95"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const printContent = document.getElementById('refund-receipt-printable').innerHTML;
                    const originalContent = document.body.innerHTML;
                    document.body.innerHTML = printContent;
                    window.print();
                    document.body.innerHTML = originalContent;
                    window.location.reload();
                  }}
                  className="px-5 py-2.5 bg-slate-900 text-white hover:bg-orange-600 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-lg flex items-center gap-1.5"
                >
                  <FaPrint size={10} />
                  Print Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
