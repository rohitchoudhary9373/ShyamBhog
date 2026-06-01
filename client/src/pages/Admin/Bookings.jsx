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

  const [toastMessage, setToastMessage] = useState("");

  const handleCopyMessage = (b) => {
    let fullText = "";
    const itemMessages = b.items?.filter(item => item.message || item.devoteeName) || [];
    
    if (itemMessages.length > 0) {
      fullText = itemMessages.map((item, idx) => {
        let entry = `Devotee ${idx + 1}:`;
        if (item.devoteeName) entry += ` Name: ${item.devoteeName}`;
        if (item.devoteeWhatsapp) entry += ` (WhatsApp: ${item.devoteeWhatsapp})`;
        entry += `\nMessage: ${item.message || 'None'}`;
        return entry;
      }).join('\n\n');
    } else if (b.message) {
      fullText = b.message;
    } else {
      fullText = "No Arjee/Sankalp message submitted.";
    }

    navigator.clipboard.writeText(fullText).then(() => {
      setToastMessage("Message copied successfully");
      setTimeout(() => setToastMessage(""), 3000);
    }).catch(err => {
      console.error("Clipboard copy failed:", err);
    });
  };

  const handlePrintMessage = (b) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert("Please allow popups to print the Arjee card.");
      return;
    }

    const itemMessages = b.items?.filter(item => item.message || item.devoteeName) || [];
    let messagesHtml = "";

    const escapeHtml = (unsafe) => {
      return (unsafe || '')
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    if (itemMessages.length > 0) {
      messagesHtml = itemMessages.map((item, idx) => `
        <div class="message-card">
          <div class="devotee-header">
            <span>Devotee ${idx + 1}: ${escapeHtml(item.devoteeName) || 'N/A'}</span>
            ${item.devoteeWhatsapp ? `<span>WhatsApp: ${escapeHtml(item.devoteeWhatsapp)}</span>` : ''}
          </div>
          <div class="message-body">${escapeHtml(item.message) || 'No message submitted.'}</div>
        </div>
      `).join('');
    } else {
      messagesHtml = `
        <div class="message-card">
          <div class="message-body">${escapeHtml(b.message) || 'No Arjee/Sankalp message submitted.'}</div>
        </div>
      `;
    }

    const orderDate = new Date(b.createdAt).toLocaleDateString('en-IN', {
      dateStyle: 'long',
      timeStyle: 'short'
    });

    const content = `
      <html>
        <head>
          <title>Shyam Bhog - Devotee Arjee Printout</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
            body {
              font-family: 'Outfit', sans-serif;
              color: #1e293b;
              margin: 40px;
              line-height: 1.6;
              background-color: #fff;
            }
            .container {
              max-width: 700px;
              margin: 0 auto;
              border: 3px double #f97316;
              padding: 30px;
              border-radius: 20px;
              background: #fff;
              box-shadow: 0 0 20px rgba(0,0,0,0.02);
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #fed7aa;
              padding-bottom: 20px;
              margin-bottom: 25px;
            }
            .salutation {
              font-family: 'Playfair Display', serif;
              color: #ea580c;
              font-size: 24px;
              font-weight: 800;
              margin-bottom: 5px;
              letter-spacing: -0.5px;
            }
            .brand {
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 2px;
              color: #64748b;
            }
            .order-meta {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 15px;
              background: #fff8f6;
              padding: 15px;
              border-radius: 12px;
              border: 1px solid #ffedd5;
              font-size: 12px;
              margin-bottom: 30px;
            }
            .meta-item {
              display: flex;
              flex-direction: column;
            }
            .meta-label {
              font-weight: 800;
              text-transform: uppercase;
              font-size: 9px;
              color: #94a3b8;
              letter-spacing: 1px;
              margin-bottom: 2px;
            }
            .meta-value {
              font-weight: 600;
              color: #0f172a;
            }
            .section-title {
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              color: #ea580c;
              margin-bottom: 15px;
              border-left: 3px solid #ea580c;
              padding-left: 8px;
            }
            .message-card {
              border: 1px solid #fed7aa;
              background: #fffaf7;
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 15px;
            }
            .devotee-header {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              font-weight: 800;
              color: #c2410c;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 1px dashed #fed7aa;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .message-body {
              font-size: 14px;
              color: #334155;
              white-space: pre-wrap;
              font-style: italic;
            }
            .footer {
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              margin-top: 40px;
              border-top: 1px solid #f1f5f9;
              padding-top: 15px;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .container { border: none; box-shadow: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="salutation">|| जय श्री श्याम ||</div>
              <div class="brand">Shyam Bhog - Offering & Arjee Portal</div>
            </div>
            
            <div class="order-meta">
              <div class="meta-item">
                <span class="meta-label">Primary Devotee</span>
                <span class="meta-value">${escapeHtml(b.name)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">WhatsApp Contact</span>
                <span class="meta-value">${escapeHtml(b.whatsapp)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Order Reference ID</span>
                <span class="meta-value">${escapeHtml(b._id)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Sacred Slot Date</span>
                <span class="meta-value">${new Date(b.slot || b.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
              </div>
            </div>

            <div class="section-title">Devotional Arjee & Sankalp Messages</div>
            ${messagesHtml}

            <div class="footer">
              Printed on ${orderDate} | Shri Khatu Shyam Ji Temple Services
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  const renderDevoteeMessages = (b) => {
    const itemMessages = b.items?.filter(item => item.message || item.devoteeName) || [];
    
    const escapeHtml = (unsafe) => {
      return (unsafe || '')
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    if (itemMessages.length > 0) {
      return (
        <div className="space-y-3">
          {itemMessages.map((item, idx) => (
            <div key={idx} className="bg-white/70 p-3 rounded-xl border border-amber-100/50 space-y-1">
              {item.devoteeName && (
                <div className="text-[10px] font-black text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                  Devotee: {escapeHtml(item.devoteeName)} {item.devoteeWhatsapp ? `(${escapeHtml(item.devoteeWhatsapp)})` : ''}
                </div>
              )}
              <p className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap pl-3">
                {item.message ? escapeHtml(item.message) : <span className="italic text-slate-400">No Arjee message submitted.</span>}
              </p>
            </div>
          ))}
        </div>
      );
    }

    if (b.message) {
      return (
        <p className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap bg-white/70 p-3 rounded-xl border border-amber-100/50">
          {escapeHtml(b.message)}
        </p>
      );
    }

    return (
      <p className="text-xs font-bold text-slate-400 italic bg-white/40 p-3 rounded-xl border border-slate-100 text-center">
        No Arjee/Sankalp message submitted.
      </p>
    );
  };

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 p-6 md:p-8">
      
      {/* ── HEADER ── */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white text-slate-900 border border-slate-200 flex items-center justify-center shadow-sm">
                 <FaBoxOpen size={18} />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Operations Ledger</h1>
                <p className="text-slate-500 font-medium text-xs tracking-widest uppercase">Universal Service Fulfillment & Billing</p>
              </div>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm active:scale-95 group">
            <FaFileDownload size={14} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
            Export Ledger
           </button>
        </div>
      </header>

      {/* ── ANALYTICS WIDGETS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <div className="border border-white/40 bg-white/80 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-2 md:p-4 rounded-[28px] flex flex-col justify-between relative overflow-hidden min-h-[80px] md:min-h-[100px] gap-2 md:gap-4 group hover:scale-[1.02] transition-all duration-300">
          <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-widest leading-none">Total Revenue</p>
          <p className="text-lg md:text-xl font-extrabold text-slate-900 leading-tight">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="border border-white/40 bg-white/80 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-2 md:p-4 rounded-[28px] flex flex-col justify-between relative overflow-hidden min-h-[80px] md:min-h-[100px] gap-2 md:gap-4 group hover:scale-[1.02] transition-all duration-300">
          <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-widest leading-none">Active Bookings</p>
          <p className="text-lg md:text-xl font-extrabold text-amber-600 leading-tight">{activeBookings}</p>
        </div>
        <div className="border border-white/40 bg-white/80 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-2 md:p-4 rounded-[28px] flex flex-col justify-between relative overflow-hidden min-h-[80px] md:min-h-[100px] gap-2 md:gap-4 group hover:scale-[1.02] transition-all duration-300">
          <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-widest leading-none">Pending Invoices</p>
          <p className="text-lg md:text-xl font-extrabold text-blue-600 leading-tight">{pendingInvoices}</p>
        </div>
        <div className="border border-white/40 bg-white/80 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-2 md:p-4 rounded-[28px] flex flex-col justify-between relative overflow-hidden min-h-[80px] md:min-h-[100px] gap-2 md:gap-4 group hover:scale-[1.02] transition-all duration-300">
          <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-widest leading-none">Refund Processing</p>
          <p className="text-lg md:text-xl font-extrabold text-purple-600 leading-tight">{bookings.filter(b => ['Refund_Requested', 'Refund_Processing', 'Refunded', 'Cancelled'].includes(b.status)).length}</p>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-lg flex-grow focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10 transition-all w-full shadow-sm">
          <FaSearch className="text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search Devotee Name, Mobile, Order ID..."
            className="bg-transparent border-none outline-none font-medium text-sm text-slate-900 placeholder:text-slate-400 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <select
            className="bg-white border border-slate-200 outline-none font-semibold text-xs text-slate-700 px-4 py-2.5 rounded-lg cursor-pointer hover:border-slate-300 transition-colors shrink-0 shadow-sm"
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
            className="bg-white border border-slate-200 outline-none font-semibold text-xs text-slate-700 px-4 py-2.5 rounded-lg cursor-pointer hover:border-slate-300 transition-colors shrink-0 shadow-sm"
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
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-lg border border-slate-200">
                      {b.name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-none mb-1">{b.name}</h3>
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                        <FaUserCircle className="text-slate-400"/> {b.whatsapp}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-start md:items-end gap-2">
                    <span className={`px-3 py-1 rounded-md text-[10px] font-semibold border ${statusStyle(b.status)}`}>
                      {b.status.replace(/_/g, ' ')}
                    </span>
                    <p className="text-[10px] font-medium text-slate-500">
                      ID: <span className="text-slate-900 font-semibold">{b._id}</span>
                    </p>
                  </div>
                </div>

                {/* Middle Row: Order Details & Financials */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Items */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <FaBoxOpen /> Ordered Items
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                      {b.items && b.items.length > 0 ? (
                         b.items.map((item, idx) => (
                           <div key={idx} className="flex justify-between items-center text-xs">
                             <span className="font-medium text-slate-700 truncate pr-2">{item.quantity}x {item.title}</span>
                             <span className="font-bold text-slate-900">₹{item.price * item.quantity}</span>
                           </div>
                         ))
                      ) : (
                         <div className="text-xs font-medium text-slate-500 italic">Standard {b.serviceType} Offering</div>
                      )}
                    </div>
                  </div>

                  {/* Financials & Payment */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <FaCreditCard /> Financials
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-bold text-slate-900">₹{(b.totalPrice || b.price)?.toLocaleString()}</p>
                      <p className="text-xs font-medium text-slate-500">
                        Method: <span className="text-slate-900 font-semibold">{b.paymentMethod || 'Razorpay'}</span>
                      </p>
                      <p className="text-xs font-medium text-slate-500 truncate">
                        Txn ID: <span className="text-slate-900 font-semibold">{b.paymentId || 'N/A'}</span>
                      </p>
                      {b.invoiceNumber && (
                        <p className="text-xs font-medium text-slate-500 pt-1">
                          Invoice: <span className="text-emerald-600 font-semibold">{b.invoiceNumber}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Lifecycle & Time */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <FaClock /> Lifecycle
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-600">
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

                {/* Devotee Arjee / Sankalp Message Section */}
                <div className="border border-amber-100/80 bg-amber-50/20 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-3">
                    <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                      Devotee Arjee / Sankalp Message
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => handleCopyMessage(b)}
                        className="flex items-center gap-1.5 text-[9px] font-black text-amber-800 bg-amber-100/80 hover:bg-amber-200/80 px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95 border border-amber-200/40"
                      >
                        Copy Message
                      </button>
                      <button 
                        type="button"
                        onClick={() => handlePrintMessage(b)}
                        className="flex items-center gap-1.5 text-[9px] font-black text-amber-800 bg-amber-100/80 hover:bg-amber-200/80 px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95 border border-amber-200/40"
                      >
                        Print Message
                      </button>
                    </div>
                  </div>

                  <div className="max-h-36 overflow-y-auto custom-scrollbar pr-1">
                    {renderDevoteeMessages(b)}
                  </div>
                </div>

                {/* Bottom Row: Admin Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                  {(b.status === 'Pending' || b.status === 'Payment_Verified') && (
                    <button onClick={() => updateStatus(b._id, 'Approved')} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm">
                      Approve Booking / Accept Bhog
                    </button>
                  )}
                  
                  {b.status === 'Approved' && (
                    <button onClick={() => updateStatus(b._id, 'Invoice_Generated')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2">
                      <FaFileInvoice /> Generate Invoice
                    </button>
                  )}

                  {(b.status === 'Invoice_Generated' || b.status === 'Completed' || b.status === 'Refund_Receipt_Generated') && (
                    <button onClick={() => navigate(`/premium-invoice/${b._id}`)} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
                      <FaFileInvoice className="text-slate-400" /> 
                      {b.status === 'Refund_Receipt_Generated' ? 'View Refund Receipt' : 'View Admin Invoice'}
                    </button>
                  )}

                  {b.status === 'Refund_Requested' && (
                    <button onClick={() => updateStatus(b._id, 'Refund_Processing')} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-orange-700 transition-colors shadow-sm flex items-center gap-2">
                      Start Refund Processing
                    </button>
                  )}

                  {b.status === 'Refund_Processing' && (
                    <button onClick={() => updateStatus(b._id, 'Refunded')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2">
                      <FaCheckCircle /> Mark Refunded
                    </button>
                  )}

                  {b.status === 'Refunded' && (
                    <button onClick={() => updateStatus(b._id, 'Refund_Receipt_Generated')} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2">
                      <FaFileInvoice /> Generate Refund Receipt
                    </button>
                  )}
                  
                  {['Pending', 'Payment_Verified', 'Approved'].includes(b.status) && (
                    <button onClick={() => updateStatus(b._id, 'Refund_Requested')} className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors shadow-sm ml-auto">
                      Request Refund
                    </button>
                  )}
                  
                  {b.status === 'Invoice_Generated' && (
                    <button onClick={() => updateStatus(b._id, 'Completed')} className="bg-white border border-emerald-200 text-emerald-600 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-50 transition-colors shadow-sm ml-auto flex items-center gap-2">
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

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 right-8 z-[200] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl border border-white/10 flex items-center gap-3 font-bold text-xs uppercase tracking-wider"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}