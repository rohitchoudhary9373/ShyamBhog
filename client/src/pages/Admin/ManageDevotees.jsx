import { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';
import { 
  FaUserCircle, FaPhoneAlt, FaEnvelope, FaSearch, FaFilter,
  FaHistory, FaWallet, FaPlus, FaMinus, FaIdBadge, FaTrash, 
  FaLock, FaUnlock, FaFileExport, FaUsers, FaUserShield, FaCrown, 
  FaCheckCircle, FaTimesCircle, FaClock, FaChevronDown, FaChevronUp, 
  FaBan, FaShieldAlt, FaSyncAlt
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManageDevotees() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Wallet Adjustment Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjAmount, setAdjAmount] = useState('');
  const [adjType, setAdjType] = useState('credit');
  const [adjReason, setAdjReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/users/all-users').catch(() => ({ data: { users: [] } }));
      setUsers(res.data.users || res.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  // Metrics
  const stats = useMemo(() => {
    const total = users.length;
    const devotees = users.filter(u => u.role !== 'admin' && u.role !== 'agent').length;
    const admins = users.filter(u => u.role === 'admin' || u.role === 'agent').length;
    const blocked = users.filter(u => u.isBlocked || u.status === 'blocked').length;
    const walletFloat = users.reduce((acc, u) => acc + (u.walletBalance || 0), 0);
    return { total, devotees, admins, blocked, walletFloat };
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Tab filter
      if (selectedTab === 'devotee' && (u.role === 'admin' || u.role === 'agent')) return false;
      if (selectedTab === 'team' && u.role !== 'admin' && u.role !== 'agent') return false;
      if (selectedTab === 'blocked' && (!u.isBlocked && u.status !== 'blocked')) return false;

      // Status dropdown
      if (statusFilter === 'active' && (u.isBlocked || u.status === 'blocked')) return false;
      if (statusFilter === 'blocked' && !u.isBlocked && u.status !== 'blocked') return false;

      // Search Query
      const query = searchQuery.toLowerCase();
      const nameMatch = (u.name || '').toLowerCase().includes(query);
      const emailMatch = (u.email || '').toLowerCase().includes(query);
      const phoneMatch = (u.mobile || '').includes(query);
      const idMatch = (u._id || '').toLowerCase().includes(query);

      return nameMatch || emailMatch || phoneMatch || idMatch;
    });
  }, [users, selectedTab, statusFilter, searchQuery]);

  const handleToggleBlock = async (userId, currentStatus) => {
    const action = currentStatus ? "unblock" : "block";
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await API.put(`/users/${userId}/${action}`);
      alert(`User ${action}ed successfully`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} user`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("ARE YOU SURE? This will permanently delete this user account.")) return;
    try {
      await API.delete(`/users/${userId}`);
      alert("User account deleted cleanly");
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleWalletAdjustment = async (e) => {
    e.preventDefault();
    if (!adjAmount || Number(adjAmount) <= 0) return alert("Please enter a valid amount");
    if (!adjReason) return alert("Please provide a reason for adjustment");

    setIsSubmitting(true);
    try {
      await API.post('/wallet/admin-adjustment', {
        userId: selectedUser._id,
        amount: Number(adjAmount),
        type: adjType,
        description: adjReason
      });
      alert("Wallet adjustment saved successfully!");
      setSelectedUser(null);
      setAdjAmount('');
      setAdjReason('');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Wallet adjustment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Devotee ID', 'Name', 'Email', 'WhatsApp', 'Role', 'Status', 'Wallet Balance (₹)', 'Joined Date'];
    const rows = filteredUsers.map(u => [
      `SB-${u._id.slice(-6).toUpperCase()}`,
      `"${u.name || 'N/A'}"`,
      u.email || 'N/A',
      u.mobile || 'N/A',
      u.role === 'admin' ? 'Super Admin' : 'Devotee',
      (u.isBlocked || u.status === 'blocked') ? 'Blocked' : 'Active',
      u.walletBalance || 0,
      u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : 'N/A'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ShyamBhog_Users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="py-40 text-center flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest animate-pulse">Syncing User Directory...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-20">
      
      {/* ── HEADER ── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <FaUsers size={16} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Devotee <span className="text-orange-600">Directory</span></h1>
          </div>
          <p className="text-slate-400 font-semibold text-[11px] uppercase tracking-widest">Razorpay-grade User Accounts & Wallet Control Dashboard</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={exportCSV} 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95"
          >
            <FaFileExport size={12} /> Export CSV
          </button>
          <button 
            onClick={fetchUsers} 
            className="w-10 h-10 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl flex items-center justify-center shadow-md shadow-orange-500/20 transition-all active:scale-95 shrink-0"
            title="Refresh Directory"
          >
            <FaSyncAlt size={13} />
          </button>
        </div>
      </header>

      {/* ── SUMMARY STAT CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Accounts</span>
            <p className="text-xl md:text-2xl font-black text-slate-900 mt-0.5">{stats.total}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
            <FaUsers />
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Devotees</span>
            <p className="text-xl md:text-2xl font-black text-orange-600 mt-0.5">{stats.devotees}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm">
            <FaUserCircle />
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admins</span>
            <p className="text-xl md:text-2xl font-black text-indigo-600 mt-0.5">{stats.admins}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
            <FaUserShield />
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Wallet Liabilities</span>
            <p className="text-xl md:text-2xl font-black text-slate-900 mt-0.5">₹{stats.walletFloat.toLocaleString()}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
            <FaWallet />
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tab Pills */}
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 w-full md:w-auto">
          {[
            { id: 'all', label: 'All Users', count: stats.total },
            { id: 'devotee', label: 'Devotees', count: stats.devotees },
            { id: 'team', label: 'Admins', count: stats.admins },
            { id: 'blocked', label: 'Blocked', count: stats.blocked },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${selectedTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedTab === tab.id ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-600'}`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Search & Status filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Search by name, email, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-orange-500 transition-all"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-orange-500 transition-all"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="blocked">Blocked Only</option>
          </select>
        </div>
      </div>

      {/* ── CRISP RAZORPAY-STYLE USERS TABLE ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="py-3.5 px-5">User Identity</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Role & Auth</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Wallet Balance</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isBlocked = u.isBlocked || u.status === 'blocked';
                  const isAdmin = u.role === 'admin' || u.role === 'agent';
                  
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                      
                      {/* Column 1: Identity */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0 shadow-sm ${isAdmin ? 'bg-slate-900' : 'bg-orange-500'}`}>
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs tracking-tight">{u.name || 'Devotee User'}</p>
                            <span className="text-[10px] font-mono text-slate-400">SB-{u._id.slice(-6).toUpperCase()}</span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Contact */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800 truncate max-w-[180px]">{u.email || 'No email registered'}</p>
                          <p className="text-[10px] font-medium text-slate-500">{u.mobile || 'Google Auth User'}</p>
                        </div>
                      </td>

                      {/* Column 3: Role & Auth */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isAdmin ? 'bg-slate-900 text-white' : 'bg-orange-100 text-orange-700'}`}>
                            {isAdmin ? 'Super Admin' : 'Devotee'}
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isBlocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>

                      {/* Column 5: Wallet Balance */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-black text-slate-900 text-xs">₹{(u.walletBalance || 0).toLocaleString()}</span>
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="px-2 py-1 bg-slate-100 hover:bg-orange-600 hover:text-white rounded-lg text-[10px] font-bold text-slate-600 transition-all"
                            title="Adjust Balance"
                          >
                            Adjust
                          </button>
                        </div>
                      </td>

                      {/* Column 6: Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleBlock(u._id, isBlocked)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${isBlocked ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                            title={isBlocked ? "Unblock Account" : "Block Account"}
                          >
                            {isBlocked ? <FaUnlock size={11} /> : <FaLock size={11} />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="p-1.5 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold transition-all"
                            title="Delete Account"
                          >
                            <FaTrash size={11} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                    No Matching User Accounts Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── WALLET ADJUSTMENT MODAL ── */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 relative"
            >
              <button 
                onClick={() => setSelectedUser(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-black transition-all"
              >
                ✕
              </button>

              <div>
                <h3 className="text-lg font-black text-slate-900">Adjust Wallet Balance</h3>
                <p className="text-xs font-medium text-slate-500">Devotee: <strong className="text-orange-600">{selectedUser.name}</strong></p>
              </div>

              <form onSubmit={handleWalletAdjustment} className="space-y-4">
                <div className="flex bg-slate-100 p-1 rounded-xl gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjType('credit')}
                    className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${adjType === 'credit' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'}`}
                  >
                    + Credit Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjType('debit')}
                    className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${adjType === 'debit' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600'}`}
                  >
                    - Debit Money
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Enter amount..."
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-bold text-slate-900 text-sm transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Reason / Reference Note</label>
                  <textarea
                    required
                    placeholder="Provide a clear reason for this adjustment..."
                    value={adjReason}
                    onChange={(e) => setAdjReason(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-medium text-slate-800 text-xs h-20 resize-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-slate-950 hover:bg-orange-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Confirm & Save Adjustment"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
