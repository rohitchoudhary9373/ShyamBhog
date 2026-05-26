import { useState, useEffect } from "react";
import API from "../../services/api";
import { getUser } from "../../utils/auth";
import { useNavigate } from "react-router-dom";
import { 
  FaFileInvoice, FaFileDownload, FaSearch, 
  FaUserCircle, FaClock, FaCheckCircle, FaTimesCircle, 
  FaArrowRight, FaWallet, FaShieldAlt,
  FaBoxOpen, FaCreditCard, FaChartLine
} from 'react-icons/fa';
import { motion, AnimatePresence } from "framer-motion";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const navigate = useNavigate();

  const user = getUser();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const [bookRes, refundRes] = await Promise.all([
         API.get('/bookings'),
         API.get('/refunds/admin').catch(() => ({ data: { data: [] } }))
      ]);
      const bookingsArray = Array.isArray(bookRes.data) ? bookRes.data : (bookRes.data.data || []);
      const refundsArray = refundRes.data?.data || [];
      
      const merged = bookingsArray.map(b => {
         const refundInfo = refundsArray.find(r => (r.orderId?._id || r.orderId) === b._id);
         if (refundInfo) {
            b.refundRequest = refundInfo;
         }
         return b;
      });

      setBookings(merged);
      setFiltered(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let data = [...bookings];
    if (search) {
      data = data.filter(
        (b) =>
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          b.whatsapp.includes(search) ||
          b._id.toLowerCase().includes(search.toLowerCase()) ||
          b.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== "All") {
      data = data.filter((b) => b.status === statusFilter);
    }
    if (serviceFilter !== "All") {
      data = data.filter((b) => b.serviceType === serviceFilter);
    }
    setFiltered(data);
  }, [search, statusFilter, serviceFilter, bookings]);

  const updateStatus = async (id, newStatus) => {
    if (!window.confirm(`Are you sure you want to change the status to ${newStatus.replace('_', ' ')}?`)) return;
    try {
      await API.put(`/bookings/${id}/status`, { status: newStatus });
      setBookings((prev) =>
        prev.map((b) => {
          if (b._id === id) {
             const updated = { ...b, status: newStatus };
             // Optimistically set invoiceNumber if generated
             if (newStatus === 'Invoice_Generated' && !b.invoiceNumber) {
               updated.invoiceNumber = `SB-INV-${new Date().getFullYear()}-XXXX`; // Placeholder until refetch
             }
             return updated;
          }
          return b;
        })
      );
      if (newStatus === 'Invoice_Generated' || newStatus === 'Refund_Receipt_Generated') {
         fetchBookings(); // Refetch to get the actual invoice number
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
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
      case "Refund_Requested":
        return "bg-orange-50 text-orange-600 border-orange-200";
      case "Refund_Processing":
        return "bg-amber-50 text-amber-600 border-amber-200";
      case "Refund_Receipt_Generated":
      case "Refunded": 
        return "bg-purple-50 text-purple-600 border-purple-200";
      default: 
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const getLifecycleStage = (status) => {
    const stages = ['Pending', 'Payment_Verified', 'Approved', 'Invoice_Generated', 'Completed'];
    const currentIdx = stages.indexOf(status);
    if (status === 'Cancelled' || status === 'Failed') return -1;
    if (['Refund_Requested', 'Refund_Processing', 'Refunded', 'Refund_Receipt_Generated'].includes(status)) return -2;
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

  const exportCSV = () => {
    const headers = ['Order ID', 'Invoice No', 'Date', 'Devotee Name', 'WhatsApp', 'Service', 'Method', 'Transaction ID', 'Total Amount', 'Status'];
    const rows = filtered.map(b => [
      b._id,
      b.invoiceNumber || 'N/A',
      new Date(b.createdAt).toLocaleDateString('en-IN'),
      `"${b.name}"`,
      b.whatsapp,
      b.serviceType,
      b.paymentMethod || 'Razorpay',
      b.paymentId || 'N/A',
      (b.totalPrice || b.price || 0),
      b.status
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ShyamBhog_Enterprise_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalRevenue = bookings.filter(b => ['Completed', 'Invoice_Generated'].includes(b.status)).reduce((sum, b) => sum + (b.totalPrice || b.price || 0), 0);
  const pendingInvoices = bookings.filter(b => b.status === 'Approved').length;
  const activeBookings = bookings.filter(b => ['Pending', 'Payment_Verified'].includes(b.status)).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* ── HEADER ── */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A1128] to-slate-800 text-white flex items-center justify-center shadow-lg border border-slate-700">
                 <FaBoxOpen size={20} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-[#0A1128] tracking-tighter uppercase">Operations <span className="text-orange-600">Ledger</span></h1>
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Universal Service Fulfillment & Billing</p>
              </div>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm active:scale-95 group">
            <FaFileDownload size={14} className="group-hover:-translate-y-0.5 transition-transform" />
            Export Ledger
           </button>
        </div>
      </header>

      {/* ── ANALYTICS WIDGETS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl"><FaChartLine /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Revenue</p>
          <p className="text-2xl font-black text-[#0A1128]">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl"><FaClock /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Bookings</p>
          <p className="text-2xl font-black text-amber-600">{activeBookings}</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl"><FaFileInvoice /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pending Invoices</p>
          <p className="text-2xl font-black text-blue-600">{pendingInvoices}</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl"><FaShieldAlt /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Refund Processing</p>
          <p className="text-2xl font-black text-purple-600">{bookings.filter(b => ['Refund_Requested', 'Refund_Processing', 'Refunded', 'Cancelled'].includes(b.status)).length}</p>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl flex-grow focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all w-full">
          <FaSearch className="text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search Devotee Name, Mobile, Order ID..."
            className="bg-transparent border-none outline-none font-bold text-xs text-[#0A1128] placeholder:text-slate-400 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <select
            className="bg-slate-50 border border-slate-100 outline-none font-black text-[10px] text-[#0A1128] uppercase tracking-widest px-4 py-3 rounded-xl cursor-pointer hover:border-slate-300 transition-colors shrink-0"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Payment_Verified">Payment Verified</option>
            <option value="Approved">Approved</option>
            <option value="Invoice_Generated">Invoice Generated</option>
            <option value="Completed">Completed</option>
            <option value="Refund_Requested">Refund Requested</option>
            <option value="Refund_Processing">Refund Processing</option>
            <option value="Refunded">Refunded</option>
            <option value="Refund_Receipt_Generated">Refund Receipt Generated</option>
          </select>

          <select
            className="bg-slate-50 border border-slate-100 outline-none font-black text-[10px] text-[#0A1128] uppercase tracking-widest px-4 py-3 rounded-xl cursor-pointer hover:border-slate-300 transition-colors shrink-0"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
          >
            <option value="All">All Services</option>
            <option value="Arjee">Arjee</option>
            <option value="Bhog">Bhog</option>
            <option value="Swamani">Swamani</option>
            <option value="Cart">Cart</option>
          </select>
        </div>
      </div>

      {/* ── ENTERPRISE DATA GRID ── */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-32 text-center flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-slate-200">
             <div className="w-10 h-10 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading Universal Ledger...</p>
          </div>
        ) : filtered.length > 0 ? (
          <AnimatePresence>
            {filtered.map((b, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.5) }}
                key={b._id} 
                className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-6"
              >
                
                {/* Top Row: Identity & Primary Info */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center text-[#0A1128] font-black text-lg border border-slate-300 shadow-inner">
                      {b.name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-black text-[#0A1128] text-lg leading-none mb-1">{b.name}</h3>
                      <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                        <FaUserCircle className="text-slate-400"/> {b.whatsapp}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-start md:items-end gap-1">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusStyle(b.status)}`}>
                      {b.status.replace(/_/g, ' ')}
                    </span>
                    <p className="text-[10px] font-black text-slate-400 tracking-wider">
                      ID: <span className="text-[#0A1128]">{b._id}</span>
                    </p>
                  </div>
                </div>

                {/* Middle Row: Order Details & Financials */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Items */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <FaBoxOpen /> Ordered Items
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                      {b.items && b.items.length > 0 ? (
                         b.items.map((item, idx) => (
                           <div key={idx} className="flex justify-between items-center text-[11px]">
                             <span className="font-bold text-slate-700 truncate pr-2">{item.quantity}x {item.title}</span>
                             <span className="font-black text-[#0A1128]">₹{item.price * item.quantity}</span>
                           </div>
                         ))
                      ) : (
                         <div className="text-[11px] font-bold text-slate-500 italic">Standard {b.serviceType} Offering</div>
                      )}
                    </div>
                  </div>

                  {/* Financials & Payment */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <FaCreditCard /> Financials
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-black text-[#0A1128]">₹{(b.totalPrice || b.price)?.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Method: <span className="text-[#0A1128]">{b.paymentMethod || 'Razorpay'}</span>
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 tracking-wider truncate">
                        Txn ID: <span className="text-[#0A1128]">{b.paymentId || 'N/A'}</span>
                      </p>
                      {b.invoiceNumber && (
                        <p className="text-[10px] font-bold text-slate-500 tracking-wider pt-1">
                          Invoice: <span className="text-emerald-600 font-black">{b.invoiceNumber}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Lifecycle & Time */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <FaClock /> Lifecycle
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-600">
                        Booked: {new Date(b.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                      
                      {/* Lifecycle Progress Bar */}
                      {!['Refund_Requested', 'Refund_Processing', 'Refunded', 'Refund_Receipt_Generated', 'Cancelled'].includes(b.status) ? (
                        <div className="pt-2">
                          <div className="flex justify-between mb-1">
                            {['PAY', 'VERIFIED', 'APPROVED', 'INVOICED', 'DONE'].map((stage, idx) => {
                              const normalIdx = getNormalStageIndex(b.status);
                              const isCompleted = normalIdx >= idx;
                              return (
                                <span key={stage} className={`text-[8px] font-black uppercase tracking-wider ${isCompleted ? 'text-emerald-600' : 'text-slate-300'}`}>
                                  {stage}
                                </span>
                              );
                            })}
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                            {['PAY', 'VERIFIED', 'APPROVED', 'INVOICED', 'DONE'].map((_, idx) => {
                              const normalIdx = getNormalStageIndex(b.status);
                              const isCompleted = normalIdx >= idx;
                              return (
                                <div key={idx} className={`h-full flex-1 ${isCompleted ? 'bg-emerald-500' : 'bg-transparent'} ${idx > 0 ? 'border-l border-white/50' : ''}`}></div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2">
                          <div className="flex justify-between mb-1">
                            {['PAY', 'VERIFIED', 'REFUND REQUESTED', 'REFUND PROCESSING', 'REFUNDED', 'REFUND RECEIPT GENERATED'].map((stage, idx) => {
                              let isCompleted = false;
                              if (idx <= 1) isCompleted = true;
                              else if (idx === 2) isCompleted = ['Refund_Requested', 'Refund_Processing', 'Refunded', 'Refund_Receipt_Generated'].includes(b.status);
                              else if (idx === 3) isCompleted = ['Refund_Processing', 'Refunded', 'Refund_Receipt_Generated'].includes(b.status);
                              else if (idx === 4) isCompleted = ['Refunded', 'Refund_Receipt_Generated'].includes(b.status);
                              else if (idx === 5) isCompleted = b.status === 'Refund_Receipt_Generated';
                              return (
                                <span key={stage} className={`text-[7px] md:text-[8px] font-black uppercase tracking-wider ${isCompleted ? 'text-red-500' : 'text-slate-300'}`}>
                                  {stage}
                                </span>
                              );
                            })}
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                            {['PAY', 'VERIFIED', 'REFUND REQUESTED', 'REFUND PROCESSING', 'REFUNDED', 'REFUND RECEIPT GENERATED'].map((_, idx) => {
                              let isCompleted = false;
                              if (idx <= 1) isCompleted = true;
                              else if (idx === 2) isCompleted = ['Refund_Requested', 'Refund_Processing', 'Refunded', 'Refund_Receipt_Generated'].includes(b.status);
                              else if (idx === 3) isCompleted = ['Refund_Processing', 'Refunded', 'Refund_Receipt_Generated'].includes(b.status);
                              else if (idx === 4) isCompleted = ['Refunded', 'Refund_Receipt_Generated'].includes(b.status);
                              else if (idx === 5) isCompleted = b.status === 'Refund_Receipt_Generated';
                              return (
                                <div key={idx} className={`h-full flex-1 ${isCompleted ? 'bg-red-500' : 'bg-transparent'} ${idx > 0 ? 'border-l border-white/50' : ''}`}></div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Admin Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                  {(b.status === 'Pending' || b.status === 'Payment_Verified') && (
                    <button onClick={() => updateStatus(b._id, 'Approved')} className="bg-[#0A1128] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-md">
                      Approve Booking / Accept Bhog
                    </button>
                  )}
                  
                  {b.status === 'Approved' && (
                    <button onClick={() => updateStatus(b._id, 'Invoice_Generated')} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-md flex items-center gap-2">
                      <FaFileInvoice /> Generate Invoice
                    </button>
                  )}

                  {(b.status === 'Invoice_Generated' || b.status === 'Completed' || b.status === 'Refund_Receipt_Generated') && (
                    <button onClick={() => navigate(`/premium-invoice/${b._id}`)} className="bg-white border border-slate-200 text-[#0A1128] px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center gap-2">
                      <FaFileInvoice className="text-slate-400" /> 
                      {b.status === 'Refund_Receipt_Generated' ? 'View Refund Receipt' : 'View Admin Invoice'}
                    </button>
                  )}

                  {b.status === 'Refund_Requested' && (
                    <button onClick={() => updateStatus(b._id, 'Refund_Processing')} className="bg-orange-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 transition-colors shadow-md flex items-center gap-2">
                      Start Refund Processing
                    </button>
                  )}

                  {b.status === 'Refund_Processing' && (
                    <button onClick={() => updateStatus(b._id, 'Refunded')} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-md flex items-center gap-2">
                      <FaCheckCircle /> Mark Refunded
                    </button>
                  )}

                  {b.status === 'Refunded' && (
                    <button onClick={() => updateStatus(b._id, 'Refund_Receipt_Generated')} className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-colors shadow-md flex items-center gap-2">
                      <FaFileInvoice /> Generate Refund Receipt
                    </button>
                  )}
                  
                  {['Pending', 'Payment_Verified', 'Approved'].includes(b.status) && (
                    <button onClick={() => updateStatus(b._id, 'Refund_Requested')} className="bg-white border border-red-200 text-red-600 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors ml-auto">
                      Request Refund
                    </button>
                  )}
                  
                  {b.status === 'Invoice_Generated' && (
                    <button onClick={() => updateStatus(b._id, 'Completed')} className="bg-white border border-emerald-200 text-emerald-600 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-colors ml-auto flex items-center gap-2">
                      <FaCheckCircle /> Mark Completed
                    </button>
                  )}
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="py-32 text-center flex flex-col items-center justify-center gap-6 bg-white rounded-3xl border border-slate-200">
             <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-3xl shadow-inner border border-slate-100">📦</div>
             <div className="space-y-1">
                <p className="text-[14px] font-black text-[#0A1128] uppercase tracking-tighter">No Orders Found</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Adjust filters or wait for incoming requests.</p>
             </div>
          </div>
        )}
      </div>

    </div>
  );
}