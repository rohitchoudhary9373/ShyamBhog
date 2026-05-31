import { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';
import { 
  FaUserCircle, FaPhoneAlt, FaEnvelope, FaSearch, FaFilter,
  FaHistory, FaWallet, FaPlus, FaMinus, FaIdBadge, FaTrash, 
  FaLock, FaUnlock, FaFileExport, FaUsers, FaUserShield, FaCrown, 
  FaHotel, FaBuilding, FaBed, FaCheckCircle, FaTimesCircle, 
  FaClock, FaChevronDown, FaChevronUp, FaBan, FaShieldAlt,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// ─── TAB DEFINITIONS ───────────────────────────────────────────────────────
const TABS = [
  { id: 'all',            label: 'All Users',       icon: FaUsers,       color: 'slate' },
  { id: 'devotee',        label: 'Devotee Users',   icon: FaUserCircle,  color: 'orange' },
  { id: 'team',           label: 'Team / Admins',   icon: FaUserShield,  color: 'indigo' },
  { id: 'suspended',      label: 'Suspended',        icon: FaBan,         color: 'red' },
];

const TAB_COLOR = {
  slate:  { pill: 'bg-slate-900 text-white',   soft: 'bg-slate-50 text-slate-700 border-slate-200'   },
  orange: { pill: 'bg-orange-600 text-white',  soft: 'bg-orange-50 text-orange-700 border-orange-200' },
  indigo: { pill: 'bg-indigo-600 text-white',  soft: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  red:    { pill: 'bg-red-600 text-white',     soft: 'bg-red-50 text-red-700 border-red-200'          },
};

// ─── HELPERS ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  if (status === 'active')  return <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full"><FaCheckCircle size={8}/>Active</span>;
  if (status === 'blocked') return <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full"><FaBan size={8}/>Blocked</span>;
  if (status === 'pending') return <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full"><FaClock size={8}/>Pending</span>;
  return null;
}

function KycBadge({ kycStatus }) {
  if (!kycStatus) return null;
  if (kycStatus === 'verified')  return <span className="text-[9px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">KYC ✓</span>;
  if (kycStatus === 'rejected')  return <span className="text-[9px] font-black uppercase tracking-widest text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">KYC ✗</span>;
  return <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">KYC Pending</span>;
}

function RoleBadge({ role, userType }) {
  if (role === 'admin')          return <span className="text-[9px] font-black uppercase tracking-widest text-slate-100 bg-slate-900 px-2.5 py-0.5 rounded-full flex items-center gap-1"><FaUserShield size={8}/>Super Admin</span>;
  if (role === 'agent')          return <span className="text-[9px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">Team</span>;
  return <span className="text-[9px] font-black uppercase tracking-widest text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full flex items-center gap-1"><FaUserCircle size={8}/>Devotee</span>;
}

// ─── METRIC CARD ────────────────────────────────────────────────────────────
function MetricCard({ label, value, color, icon: Icon, sub }) {
  const colorMap = {
    slate:  'bg-slate-900 text-white shadow-slate-200',
    orange: 'bg-white border-orange-100 text-orange-600',
    blue:   'bg-white border-blue-100 text-blue-600',
    purple: 'bg-white border-purple-100 text-purple-600',
    indigo: 'bg-white border-indigo-100 text-indigo-600',
    red:    'bg-white border-red-100 text-red-600',
    green:  'bg-white border-green-100 text-green-600',
  };
  const isHero = color === 'slate';
  return (
    <div className={`p-6 rounded-[20px] border shadow-sm flex flex-col gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${colorMap[color]}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base ${isHero ? 'bg-white/10 text-white' : `bg-${color}-50 text-${color}-600`}`}>
        <Icon />
      </div>
      <div>
        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isHero ? 'text-slate-400' : 'text-slate-400'}`}>{label}</p>
        <p className={`text-3xl font-black ${isHero ? 'text-white' : 'text-slate-900'}`}>{value}</p>
        {sub && <p className={`text-[9px] font-bold mt-0.5 ${isHero ? 'text-slate-400' : 'text-slate-400'} uppercase tracking-widest`}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function ManageDevotees() {
  const [devotees,      setDevotees]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [activeTab,     setActiveTab]     = useState('all');
  const [statusFilter,  setStatusFilter]  = useState('all');

  // Modals
  const [selectedUser,    setSelectedUser]    = useState(null);
  const [history,         setHistory]         = useState([]);
  const [historyLoading,  setHistoryLoading]  = useState(false);
  const [adjustingUser,   setAdjustingUser]   = useState(null);
  const [adjAmount,       setAdjAmount]       = useState('');
  const [adjType,         setAdjType]         = useState('credit');
  const [adjReason,       setAdjReason]       = useState('');
  const [isSubmitting,    setIsSubmitting]    = useState(false);

  // ─── FETCH ALL 3 USER TYPES ────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await API.get('/users');
      setDevotees(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ─── ENRICH DATA ────────────────────────────────────────────────────────
  const enrichedDevotees = devotees.map(u => ({ ...u, _userType: 'devotee' }));

  const allUsers = useMemo(() => [
    ...enrichedDevotees,
  ], [devotees]);

  // ─── METRICS ──────────────────────────────────────────────────────────
  const devoteeCount     = enrichedDevotees.length;
  const teamCount        = devotees.filter(d => ['admin', 'agent'].includes(d.role)).length;
  const suspendedCount   = allUsers.filter(u => u.status === 'blocked').length;
  const totalCount       = allUsers.length;
  const totalWalletFloat = devotees.reduce((sum, d) => sum + (d.walletBalance || 0), 0);

  // ─── FILTER LOGIC ─────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    let pool = allUsers;

    // Tab filtering
    if (activeTab === 'devotee')        pool = enrichedDevotees.filter(u => !['admin', 'agent'].includes(u.role));
    else if (activeTab === 'team')           pool = enrichedDevotees.filter(u => ['admin', 'agent'].includes(u.role));
    else if (activeTab === 'suspended')      pool = allUsers.filter(u => u.status === 'blocked');

    // Status sub-filter
    if (statusFilter !== 'all') {
      pool = pool.filter(u => u.status === statusFilter);
    }

    // Search
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      pool = pool.filter(u =>
        (u.name || '').toLowerCase().includes(s) ||
        (u.mobile || '').includes(s) ||
        (u.email || '').toLowerCase().includes(s) ||
        (u._id && `SB-${u._id.slice(-6).toUpperCase()}`.toLowerCase().includes(s))
      );
    }

    return pool;
  }, [allUsers, activeTab, statusFilter, searchTerm]);

  // ─── ACTIONS ───────────────────────────────────────────────────────────
  const handleToggleStatus = async (user) => {
    if (user.role === 'admin') return alert("Super Admin cannot be blocked!");
    const action = user.status === 'blocked' ? 'UNBLOCK' : 'BLOCK';
    if (!window.confirm(`${action} ${user.name}?`)) return;
    try {
      await API.put(`/users/${user._id}/toggle-status`);
      fetchAll();
    } catch (err) { alert(err.response?.data?.message || "Action failed"); }
  };

  const handleForceDelete = async (user) => {
    if (user.role === 'admin') return alert("Super Admin cannot be deleted!");
    if (!window.confirm(`PERMANENTLY DELETE ${user.name}?`)) return;
    try {
      await API.delete(`/users/${user._id}`);
      fetchAll();
    } catch (err) { alert(err.response?.data?.message || "Deletion failed"); }
  };

  const fetchUserHistory = async (user) => {
    if (user._userType !== 'devotee') return;
    setSelectedUser(user);
    setHistoryLoading(true);
    try {
      const res = await API.get(`/wallet/user-history/${user._id}`);
      setHistory(res.data.history || []);
    } catch (err) { console.error(err); }
    finally { setHistoryLoading(false); }
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
      setAdjustingUser(null); setAdjAmount(''); setAdjReason('');
      fetchAll();
      window.dispatchEvent(new Event('walletUpdate'));
    } catch (err) { alert(err.response?.data?.message || "Adjustment failed"); }
    finally { setIsSubmitting(false); }
  };

  const handleImpersonate = async (user) => {
    if (user.role === 'admin') return alert("Cannot impersonate Super Admin!");
    if (user._userType !== 'devotee') return alert("Impersonation is only available for Devotee Users.");
    if (!window.confirm(`Login as ${user.name}?`)) return;
    try {
      const res = await API.post('/auth/impersonate', { userId: user._id });
      if (res.data.success) {
        sessionStorage.setItem('adminUser', localStorage.getItem('userInfo'));
        sessionStorage.setItem('adminToken', localStorage.getItem('token'));
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userInfo', JSON.stringify(res.data.user));
        alert(`Switched session to: ${res.data.user.name}`);
        window.location.href = '/profile';
      }
    } catch (err) { alert(err.response?.data?.message || "Failed"); }
  };

  const exportToCSV = () => {
    const headers = ["Type", "Name", "Mobile", "Email", "Status", "Role", "Joined"];
    const rows = filteredUsers.map(u => [
      u._userType, u.name, u.mobile, u.email || 'N/A', u.status, u.role,
      new Date(u.createdAt).toLocaleDateString()
    ]);
    const csv = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `UserRegistry_${Date.now()}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // ─── TAB COUNTS ────────────────────────────────────────────────────────
  const tabCounts = {
    all:            totalCount,
    devotee:        enrichedDevotees.filter(u => !['admin', 'agent'].includes(u.role)).length,
    team:           teamCount,
    suspended:      suspendedCount,
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8 font-sans">

      {/* ── HEADER ── */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-200">
              <FaUsers size={20} />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">User Intelligence</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise User Segregation Dashboard</p>
            </div>
          </div>
        </div>
        <button onClick={exportToCSV} className="flex items-center gap-2 bg-slate-900 text-white hover:bg-orange-600 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95">
          <FaFileExport size={12} /> Export Registry
        </button>
      </header>

      {/* ── ANALYTICS STRIP ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="col-span-2 md:col-span-1 lg:col-span-1 bg-slate-900 p-5 rounded-[20px] shadow-xl flex flex-col gap-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Users</p>
          <p className="text-3xl font-black text-white">{totalCount}</p>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-orange-100 shadow-sm flex flex-col gap-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Devotees</p>
          <p className="text-3xl font-black text-orange-600">{tabCounts.devotee}</p>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-indigo-100 shadow-sm flex flex-col gap-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Team</p>
          <p className="text-3xl font-black text-indigo-600">{teamCount}</p>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-red-100 shadow-sm flex flex-col gap-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Suspended</p>
          <p className="text-3xl font-black text-red-600">{suspendedCount}</p>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-green-100 shadow-sm flex flex-col gap-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Wallet Float</p>
          <p className="text-xl font-black text-green-600">₹{totalWalletFloat.toLocaleString()}</p>
        </div>
      </div>

      {/* ── SEGMENTED TABS ── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-2 flex gap-1 overflow-x-auto no-scrollbar">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchTerm(''); setStatusFilter('all'); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                isActive ? TAB_COLOR[tab.color].pill : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Icon size={11} />
              {tab.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[8px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {tabCounts[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── FILTER BAR ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2.5 w-full sm:flex-1 focus-within:border-slate-800 transition-all shadow-sm gap-3">
          <FaSearch className="text-slate-400 flex-shrink-0" size={13}/>
          <input
            type="text"
            placeholder={`Search in ${TABS.find(t => t.id === activeTab)?.label || 'all users'}...`}
            className="bg-transparent border-none outline-none font-bold text-sm text-slate-900 placeholder:text-slate-400 w-full"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="text-slate-300 hover:text-slate-600 transition-colors text-xs font-black">✕</button>}
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-slate-800 shadow-sm text-slate-700 w-full sm:w-auto"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="blocked">Blocked Only</option>
          <option value="pending">Pending Only</option>
        </select>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
          {filteredUsers.length} {filteredUsers.length === 1 ? 'result' : 'results'}
        </div>
      </div>

      {/* ── USER TABLE ── */}
      {loading ? (
        <div className="py-32 text-center flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing User Database...</p>
        </div>
      ) : (
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Profile</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Contact</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Type / Role</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden xl:table-cell">Wallet / Info</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-40">
                          <FaUserCircle size={48} className="text-slate-300" />
                          <div>
                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight italic">No users match criteria</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Refine filters or search term</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, i) => (
                      <motion.tr
                        key={`${u._userType}-${u._id}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.4) }}
                        className={`hover:bg-slate-50/60 transition-all group ${u.status === 'blocked' ? 'opacity-60' : ''}`}
                      >
                        {/* PROFILE */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0 ${
                              u.role === 'admin'          ? 'bg-slate-900' :
                              u.role === 'agent'          ? 'bg-indigo-600' :
                              'bg-orange-500'
                            }`}>
                              {u.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-slate-900 text-sm truncate max-w-[160px]">{u.name}</p>
                              <p className="text-[9px] font-bold font-mono text-slate-400 tracking-widest mt-0.5">
                                SB-{u._id?.slice(-6).toUpperCase()}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                Joined {new Date(u.createdAt).toLocaleDateString('en-GB')}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* CONTACT */}
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                              <FaPhoneAlt size={9} className="text-slate-400"/>{u.mobile || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 truncate max-w-[180px]">
                              <FaEnvelope size={9} className="text-slate-300"/>{u.email || '—'}
                            </div>
                            {u.authProvider === 'google' && (
                              <span className="text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">Google</span>
                            )}
                          </div>
                        </td>

                        {/* TYPE / ROLE */}
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <div className="flex flex-col gap-1.5">
                            <RoleBadge role={u.role} userType={u._userType} />
                            {u.kycStatus && <KycBadge kycStatus={u.kycStatus} />}
                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <StatusBadge status={u.status || 'active'} />
                          {u.lastLogin && (
                            <p className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">
                              Last seen {new Date(u.lastLogin).toLocaleDateString('en-GB')}
                            </p>
                          )}
                        </td>

                        {/* WALLET / INFO */}
                        <td className="px-6 py-4 hidden xl:table-cell">
                          <div className="flex flex-col gap-2">
                            <span className="text-lg font-black text-slate-900">₹{(u.walletBalance || 0).toLocaleString()}</span>
                            <div className="flex gap-1.5">
                              <button onClick={() => { setAdjustingUser(u); setAdjType('credit'); }} className="py-1 px-2.5 bg-green-50 text-green-700 rounded-lg text-[9px] font-black border border-green-200 hover:bg-green-100 transition-colors">+ADD</button>
                              <button onClick={() => { setAdjustingUser(u); setAdjType('debit'); }} className="py-1 px-2.5 bg-red-50 text-red-700 rounded-lg text-[9px] font-black border border-red-200 hover:bg-red-100 transition-colors">−DEDUCT</button>
                            </div>
                          </div>
                        </td>

                        {/* CONTROLS */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 justify-end">
                            {u.role !== 'admin' && (
                              <>
                                <button onClick={() => fetchUserHistory(u)} className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors flex items-center justify-center" title="Transaction History">
                                  <FaHistory size={12}/>
                                </button>
                                <button onClick={() => handleImpersonate(u)} className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center justify-center" title="Login as User">
                                  <FaIdBadge size={13}/>
                                </button>
                              </>
                            )}
                            <button onClick={() => handleToggleStatus(u)} className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${u.status === 'blocked' ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`} title={u.status === 'blocked' ? 'Unblock' : 'Block'}>
                              {u.status === 'blocked' ? <FaUnlock size={12}/> : <FaLock size={12}/>}
                            </button>
                            <button onClick={() => handleForceDelete(u)} className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center" title="Delete">
                              <FaTrash size={12}/>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination hint */}
          {filteredUsers.length > 0 && (
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 flex justify-between items-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Showing {filteredUsers.length} {filteredUsers.length === 1 ? 'record' : 'records'}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Live Sync Active</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── WALLET ADJUSTMENT MODAL ── */}
      <AnimatePresence>
        {adjustingUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setAdjustingUser(null)}/>
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} className="relative z-10 w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden">
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">Wallet Governance</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Adjusting for {adjustingUser.name}</p>
                  </div>
                  <button onClick={() => setAdjustingUser(null)} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 transition-colors flex items-center justify-center font-bold">✕</button>
                </div>
                <form onSubmit={handleAdjustment} className="space-y-5">
                  <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
                    <button type="button" onClick={() => setAdjType('credit')} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${adjType === 'credit' ? 'bg-green-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}><FaPlus size={8}/> Add Funds</button>
                    <button type="button" onClick={() => setAdjType('debit')} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${adjType === 'debit' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}><FaMinus size={8}/> Deduct</button>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Amount (₹)</label>
                    <input type="number" required placeholder="0.00" value={adjAmount} onChange={e => setAdjAmount(e.target.value)} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-900 font-black text-3xl text-center text-slate-900"/>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Reason / Memo</label>
                    <textarea required placeholder="Enter reason for auditing..." value={adjReason} onChange={e => setAdjReason(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-900 font-medium text-xs text-slate-700 min-h-[80px] resize-none"/>
                  </div>
                  <button type="submit" disabled={isSubmitting} className={`w-full py-4 rounded-xl font-black uppercase tracking-wider text-[10px] text-white shadow-md transition-all active:scale-95 ${adjType === 'credit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} ${isSubmitting ? 'opacity-50 cursor-wait' : ''}`}>
                    {isSubmitting ? 'Processing...' : 'Confirm Adjustment'}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TRANSACTION LEDGER MODAL ── */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setSelectedUser(null)}/>
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} className="relative z-10 w-full max-w-2xl bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[80vh]">
              <header className="p-6 bg-slate-900 text-white flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-black text-sm">{selectedUser.name.charAt(0)}</div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight uppercase italic">{selectedUser.name}'s Ledger</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Transaction History</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center font-bold">✕</button>
              </header>
              <div className="flex-grow overflow-y-auto p-4 bg-slate-50 space-y-3">
                {historyLoading ? (
                  <div className="py-20 text-center flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"/>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Syncing Ledger...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center gap-3 opacity-30">
                    <FaHistory size={32} className="text-slate-400"/>
                    <p className="text-[9px] font-black uppercase tracking-widest">No transaction records</p>
                  </div>
                ) : history.map((tx, idx) => (
                  <div key={tx._id || idx} className="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-center hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shadow-sm ${tx.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {tx.type === 'credit' ? <FaPlus size={10}/> : <FaMinus size={10}/>}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-xs uppercase tracking-tight">{tx.description || 'System Adjustment'}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{new Date(tx.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>{tx.type === 'credit' ? '+' : '-'}₹{tx.amount?.toLocaleString()}</p>
                      <span className="text-[7px] font-black uppercase tracking-wider px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-slate-400 mt-1 inline-block">{tx.method?.toUpperCase() || 'MANUAL'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
