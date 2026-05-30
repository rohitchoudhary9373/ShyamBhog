import { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  FaUserCircle, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaSearch, 
  FaHistory, FaCheckCircle, FaExclamationCircle, FaWallet, FaPlus, 
  FaMinus, FaIdBadge, FaTrash, FaLock, FaUnlock, FaFilter, FaArrowRight,
  FaFileExport, FaUsers, FaUserShield, FaCrown, FaToggleOn, FaToggleOff
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManageDevotees() {
  const [devotees, setDevotees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, suspended, staff
  
  // Modals State
  const [selectedUser, setSelectedUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Adjustment State
  const [adjustingUser, setAdjustingUser] = useState(null);
  const [adjAmount, setAdjAmount] = useState('');
  const [adjType, setAdjType] = useState('credit');
  const [adjReason, setAdjReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDevotees = async () => {
    try {
      const res = await API.get('/users'); 
      setDevotees(res.data.data || res.data);
    } catch (err) {
      console.error("Error fetching devotees:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    if (user.role === 'admin') return alert("Super Admin cannot be blocked!");
    const action = user.status === 'blocked' ? 'UNBLOCK' : 'BLOCK';
    const confirm = window.confirm(`Are you sure you want to ${action} ${user.name}?`);
    if (!confirm) return;

    try {
      await API.put(`/users/${user._id}/toggle-status`);
      fetchDevotees();
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    }
  };

  const handleForceDelete = async (user) => {
    if (user.role === 'admin') return alert("Super Admin cannot be deleted!");
    const confirm = window.confirm(`Are you absolutely sure you want to PERMANENTLY DELETE ${user.name}?`);
    if (!confirm) return;

    try {
      await API.delete(`/users/${user._id}`);
      fetchDevotees();
    } catch (err) {
      alert(err.response?.data?.message || "Deletion failed");
    }
  };

  const fetchUserHistory = async (user) => {
    setSelectedUser(user);
    setHistoryLoading(true);
    try {
       const res = await API.get(`/wallet/user-history/${user._id}`);
       setHistory(res.data.history || []);
    } catch (err) {
       console.error("Error fetching history:", err);
    } finally {
       setHistoryLoading(false);
    }
  };

  const handleAdjustment = async (e) => {
    e.preventDefault();
    if (!adjAmount || adjAmount <= 0) return alert("Enter valid amount");
    if (!adjReason) return alert("Provide a reason");

    setIsSubmitting(true);
    try {
      await API.post('/wallet/admin-adjustment', {
        userId: adjustingUser._id,
        amount: Number(adjAmount),
        type: adjType,
        description: adjReason
      });
      setAdjustingUser(null);
      setAdjAmount('');
      setAdjReason('');
      fetchDevotees();
      window.dispatchEvent(new Event('walletUpdate'));
    } catch (err) {
      alert(err.response?.data?.message || "Adjustment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["User Name", "Contact Number", "Email", "Status", "Role", "Balance"];
    const rows = filteredDevotees.map(d => [
      d.name,
      d.mobile,
      d.email || 'N/A',
      d.status,
      d.role,
      `₹${d.walletBalance || 0}`
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Users_Registry_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImpersonate = async (user) => {
    if (user.role === 'admin') return alert("Cannot impersonate another Super Admin!");
    const confirm = window.confirm(`Are you sure you want to log in as ${user.name}?`);
    if (!confirm) return;

    try {
      const res = await API.post('/auth/impersonate', { userId: user._id });
      if (res.data.success) {
        // Store Admin session context in sessionStorage so we can return
        sessionStorage.setItem('adminUser', localStorage.getItem('userInfo'));
        sessionStorage.setItem('adminToken', localStorage.getItem('token'));

        // Switch active user credentials in localStorage
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userInfo', JSON.stringify(res.data.user));

        alert(`Successfully switched session to: ${res.data.user.name}`);
        window.location.href = '/profile';
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to switch user session");
    }
  };

  useEffect(() => {
    fetchDevotees();
  }, []);

  // Filter devotees by search term and filter tab
  const filteredDevotees = devotees.filter(d => {
    const s = searchTerm.toLowerCase();
    const devoteeId = d._id ? `SB-${d._id.slice(-6).toUpperCase()}` : '';
    
    const name = d.name ? d.name.toLowerCase() : '';
    const mobile = d.mobile || '';
    const email = d.email ? d.email.toLowerCase() : '';

    const matchesSearch = name.includes(s) || 
                          mobile.includes(s) ||
                          email.includes(s) ||
                          devoteeId.toLowerCase().includes(s) ||
                          (d.whatsappNumber && d.whatsappNumber.includes(s)) ||
                          (d.alternateContact && d.alternateContact.includes(s)) ||
                          (d.district && d.district.toLowerCase().includes(s));

    if (!matchesSearch) return false;

    if (filterStatus === 'active') return d.status !== 'blocked';
    if (filterStatus === 'suspended') return d.status === 'blocked';
    if (filterStatus === 'staff') return ['admin', 'agent'].includes(d.role);
    return true;
  });

  // Calculate quick metrics
  const totalCount = devotees.length;
  const activeCount = devotees.filter(d => d.status !== 'blocked').length;
  const suspendedCount = devotees.filter(d => d.status === 'blocked').length;
  const staffCount = devotees.filter(d => ['admin', 'agent'].includes(d.role)).length;
  const totalBalance = devotees.reduce((sum, d) => sum + (d.walletBalance || 0), 0);
  const activeWalletUsers = devotees.filter(d => d.walletBalance > 0).length;

  if (loading) return (
    <div className="py-40 text-center flex flex-col items-center justify-center gap-4">
       <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Syncing User Database...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8 animate-in fade-in duration-1000">
      
      {/* ── HEADER ── */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-slate-900 border border-slate-200 flex items-center justify-center shadow-sm">
              <FaUsers size={18} />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              User CRM
            </h1>
          </div>
          <p className="text-slate-500 font-medium text-xs tracking-widest uppercase mt-1 ml-14">
            Relationship Management & Wallet Governance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={exportToCSV} 
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-all group"
          >
            <FaFileExport size={12} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
            Export Registry
          </button>
        </div>
      </header>

      {/* ── METRICS DASHBOARD ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Total Users</p>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-slate-900">{totalCount}</span>
            <span className="text-[10px] font-medium text-slate-400 uppercase">Registered</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Active & Operational</p>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-emerald-600">{activeCount}</span>
            <span className="text-[10px] font-medium text-slate-400 uppercase">Users</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Active Wallet Users</p>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-orange-500">{activeWalletUsers}</span>
            <span className="text-[10px] font-medium text-slate-400 uppercase">Accounts</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Wallet Float</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-[#0A1128]">₹{totalBalance.toLocaleString()}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase">INR Float</span>
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH PANEL ── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Filter Tabs */}
        <div className="flex p-1 bg-slate-50 rounded-lg gap-1 w-full md:w-auto border border-slate-200/60">
          {[
            { id: 'all', label: 'All', count: totalCount },
            { id: 'active', label: 'Active', count: activeCount },
            { id: 'suspended', label: 'Suspended', count: suspendedCount },
            { id: 'staff', label: 'Staff', count: staffCount }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                filterStatus === tab.id 
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {tab.label} <span className="text-slate-400 font-medium ml-1">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-900 transition-all w-full md:w-80 shadow-sm">
          <FaSearch className="text-slate-400 flex-shrink-0" size={14} />
          <input
            type="text"
            placeholder="Search by ID, Name, Phone..."
            className="bg-transparent border-none outline-none font-medium text-sm text-slate-900 placeholder:text-slate-400 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ── DEVOTEES LIST ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 w-[35%]">User Profile</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 w-[25%]">Contact Info</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 w-[20%]">Wallet</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 w-[20%]">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {filteredDevotees.map((d, i) => {
                  const isVip = (d.walletBalance || 0) >= 5000;
                  const isStaff = ['admin', 'agent'].includes(d.role);
                  return (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      key={d._id} 
                      className={`hover:bg-slate-50/50 transition-all duration-200 group ${d.status === 'blocked' ? 'bg-slate-50/20' : ''}`}
                    >
                      {/* Identity Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {/* Avatar Circle */}
                          <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm shadow-sm relative overflow-hidden flex-shrink-0 ${
                            isStaff ? 'bg-indigo-600' : 'bg-slate-900'
                          }`}>
                            <span className="relative z-10">{d.name?.charAt(0).toUpperCase()}</span>
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-slate-900 text-sm truncate max-w-[150px]">{d.name}</p>
                              
                              {isStaff && (
                                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-indigo-100">
                                  Staff
                                </span>
                              )}
                              {isVip && (
                                <span className="bg-amber-50 text-amber-600 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-100 flex items-center gap-1">
                                  <FaCrown size={10} /> VIP
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                              <span className="font-mono bg-slate-50 border border-slate-200 px-1.5 rounded text-[10px]">
                                SB-{d._id.slice(-6).toUpperCase()}
                              </span>
                              <span>•</span>
                              <span>Reg: {new Date(d.createdAt).toLocaleDateString('en-GB')}</span>
                              {d.authProvider === 'google' && (
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 ml-1 text-[10px]">
                                  Google
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Column */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 text-xs text-slate-600 font-medium">
                          <div className="flex flex-wrap items-center gap-2">
                            <a href={`tel:${d.mobile}`} className="flex items-center gap-1.5 hover:text-slate-900 transition-colors">
                              <FaPhoneAlt size={10} className="text-slate-400" />
                              {d.mobile || 'N/A'}
                            </a>
                            {d.whatsappNumber && (
                              <a href={`https://wa.me/${d.whatsappNumber}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-1.5 rounded text-[10px] font-semibold">
                                WA
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-2 truncate max-w-[200px]">
                            <FaEnvelope size={10} className="text-slate-400 flex-shrink-0" />
                            {d.email || <span className="text-slate-400 italic">No email</span>}
                          </div>
                          
                          {(d.address || d.district || d.state) ? (
                            <div className="flex items-start gap-2 text-slate-500 mt-1">
                              <FaMapMarkerAlt size={10} className="text-slate-400 flex-shrink-0 mt-0.5" />
                              <span className="truncate whitespace-normal max-w-[220px]">
                                {d.address ? `${d.address}, ` : ''}{d.district || 'Khatu'}, {d.state || 'RJ'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-400 italic mt-1">
                              <FaMapMarkerAlt size={10} className="text-slate-300" />
                              Location unset
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Wallet Balance Column */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-slate-900">
                              ₹{d.walletBalance?.toLocaleString() || 0}
                            </span>
                            <button 
                              onClick={() => fetchUserHistory(d)} 
                              className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all flex items-center justify-center border border-slate-200 shadow-sm"
                              title="Transaction History"
                            >
                              <FaHistory size={12} />
                            </button>
                          </div>
                          
                          {/* Wallet Adjustment Quick Buttons */}
                          <div className="flex gap-2 max-w-[150px]">
                            <button 
                              onClick={() => { setAdjustingUser(d); setAdjType('credit'); }}
                              className="flex-1 py-1.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-semibold border border-emerald-200 hover:bg-emerald-100 transition-colors"
                              title="Add Funds"
                            >
                              + ADD
                            </button>
                            <button 
                              onClick={() => { setAdjustingUser(d); setAdjType('debit'); }}
                              className="flex-1 py-1.5 bg-rose-50 text-rose-700 rounded-md text-[10px] font-semibold border border-rose-200 hover:bg-rose-100 transition-colors"
                              title="Deduct Funds"
                            >
                              - DEDUCT
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Operational Controls Column */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button 
                            onClick={() => handleImpersonate(d)}
                            className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center justify-center"
                            title="Login as User"
                          >
                            <FaIdBadge size={14} />
                          </button>

                          <button 
                            onClick={() => handleToggleStatus(d)}
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                              d.status === 'blocked' 
                                ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                            title={d.status === 'blocked' ? 'Unblock User' : 'Block User'}
                          >
                            {d.status === 'blocked' ? <FaUnlock size={14} /> : <FaLock size={14} />}
                          </button>

                          <button 
                            onClick={() => handleForceDelete(d)}
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center ml-2"
                            title="Delete User"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredDevotees.length === 0 && (
          <div className="py-32 text-center flex flex-col items-center justify-center gap-4 bg-slate-50/20">
            <FaUserCircle className="text-4xl text-slate-200" />
            <div>
              <p className="text-sm font-black text-slate-800 uppercase tracking-tighter italic">No users match criteria</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Refine your filters or search keywords</p>
            </div>
          </div>
        )}
      </div>

      {/* ── WALLET ADJUSTMENT STUDIO (MODAL) ── */}
      <AnimatePresence>
        {adjustingUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          >
            <div className="absolute inset-0" onClick={() => setAdjustingUser(null)}></div>
            
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-[#0A1128] uppercase italic tracking-tight">Wallet Governance</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Adjusting balance for {adjustingUser.name}</p>
                  </div>
                  <button onClick={() => setAdjustingUser(null)} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 transition-colors flex items-center justify-center">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAdjustment} className="space-y-6">
                  {/* Selector tabs credit/debit */}
                  <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
                    <button 
                      type="button"
                      onClick={() => setAdjType('credit')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        adjType === 'credit' 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <FaPlus size={8} /> Inject Funds
                    </button>
                    <button 
                      type="button"
                      onClick={() => setAdjType('debit')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        adjType === 'debit' 
                          ? 'bg-red-600 text-white shadow-sm' 
                          : 'text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <FaMinus size={8} /> Deduct Funds
                    </button>
                  </div>

                  {/* Input quantum */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Adjustment Amount (₹)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="0.00"
                      value={adjAmount}
                      onChange={(e) => setAdjAmount(e.target.value)}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 font-black text-3xl text-center text-slate-900"
                    />
                  </div>

                  {/* Remarks input */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Adjustment Reason / Memo</label>
                    <textarea 
                      required
                      placeholder="Enter a descriptive reason for auditing purposes..."
                      value={adjReason}
                      onChange={(e) => setAdjReason(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-medium text-xs text-slate-700 min-h-[90px] resize-none"
                    />
                  </div>

                  {/* Submit Adjustment */}
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 rounded-xl font-black uppercase tracking-wider text-[10px] text-white shadow-md transition-all active:scale-95 ${
                      adjType === 'credit' 
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' 
                        : 'bg-red-600 hover:bg-red-700 shadow-red-100'
                    } ${isSubmitting ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    {isSubmitting ? 'Processing Transaction...' : 'Confirm Wallet Adjustment'}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TRANSACTION LEDGER (MODAL) ── */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          >
            <div className="absolute inset-0" onClick={() => setSelectedUser(null)}></div>
            
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-2xl bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[80vh]"
            >
              {/* Header */}
              <header className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-sm uppercase">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight uppercase italic">
                      {selectedUser.name}'s Ledger
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      Transaction Logs & Auditing History
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)} 
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center"
                >
                  ✕
                </button>
              </header>

              {/* Transactions List */}
              <div className="flex-grow overflow-y-auto p-4 bg-slate-50 divide-y divide-slate-100 max-h-[50vh]">
                {historyLoading ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Ledger History...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((tx, idx) => (
                      <div 
                        key={tx._id || idx} 
                        className="bg-white p-5 rounded-2xl border border-slate-150 flex justify-between items-center hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shadow-sm ${
                            tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {tx.type === 'credit' ? <FaPlus size={10} /> : <FaMinus size={10} />}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-xs uppercase tracking-tight leading-tight">
                              {tx.description || 'System Adjustment'}
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                              {new Date(tx.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`text-sm font-black tracking-tighter ${
                            tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                          </p>
                          <span className="text-[7px] font-black uppercase tracking-wider px-2 py-0.5 bg-slate-50 border border-slate-200/50 rounded-md text-slate-400 mt-1 inline-block">
                            Method: {tx.method?.toUpperCase() || 'MANUAL'}
                          </span>
                        </div>
                      </div>
                    ))}

                    {history.length === 0 && (
                      <div className="py-20 text-center flex flex-col items-center justify-center opacity-30 gap-2">
                        <FaHistory size={32} className="text-slate-400" />
                        <p className="text-[9px] font-black uppercase tracking-widest">No transaction ledger recorded</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <footer className="p-4 bg-white border-t border-slate-100 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Secure Cryptographic Ledger Ledger Verification Active
                </p>
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
