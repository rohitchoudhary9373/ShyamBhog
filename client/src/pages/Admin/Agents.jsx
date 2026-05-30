import { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  FaUserFriends, FaPlus, FaEdit, FaShieldAlt, FaCalendarAlt, 
  FaPhoneAlt, FaLock, FaSyncAlt, FaLayerGroup, FaArrowRight,
  FaCheckCircle, FaUserTag, FaIdCard, FaHistory, FaUserSlash, 
  FaCircle, FaBuilding, FaSearch, FaTimes, FaUnlock, FaDesktop
} from 'react-icons/fa';
import { getUser } from '../../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { getBaseURL } from '../../utils/url';

const DEPARTMENTS = [
  'Services',
  'CMS',
  'Manifests',
  'Registry',
  'Multimedia',
  'Logistics',
  'Hospitality',
  'CRM',
  'Treasury',
  'Escalations'
];

const DEPARTMENT_LABELS = {
  'Services': 'Service Catalog',
  'CMS': 'CMS, Rituals & Crowd',
  'Manifests': 'Testimonials',
  'Registry': 'Bookings & Orders',
  'Multimedia': 'Rituals & Media',
  'Logistics': 'Parking Management',
  'Hospitality': 'Luxury Stays',
  'CRM': 'Devotees CRM',
  'Treasury': 'Financials & Wallets',
  'Escalations': 'Refund Management'
};

const PERMISSION_LABELS = {
  manage_services: 'Service Catalog',
  manage_content: 'CMS, Rituals & Crowd',
  manage_feedback: 'Testimonials',
  manage_bookings: 'Bookings & Orders',
  manage_arjee: 'Ritual Media',
  manage_parking: 'Parking Management',
  manage_hotels: 'Luxury Stays',
  manage_devotees: 'Devotees CRM',
  manage_wallet: 'Financials & Wallets',
  manage_refunds: 'Refund Management'
};

const AVATARS = ['🪔', '🕉️', '🙏', '🚩', '💮', '🌸', '🔱', '🦚'];

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    mobile: '', 
    password: '', 
    permissions: [], 
    department: 'Services', 
    profession: '',
    avatar: '🪔', 
    agentId: null 
  });

  const [showLogsDrawer, setShowLogsDrawer] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsFilter, setLogsFilter] = useState('');

  const currentUser = getUser();
  const isSuperAdmin = currentUser?.role === 'admin';

  const handleImpersonate = async (agent) => {
    if (agent.role === 'admin') return alert("Cannot impersonate another Super Admin!");
    const confirm = window.confirm(`Are you sure you want to log in as staff ${agent.name}?`);
    if (!confirm) return;

    try {
      const res = await API.post('/auth/impersonate', { userId: agent._id });
      if (res.data.success) {
        // Store Admin session context in sessionStorage so we can return
        sessionStorage.setItem('adminUser', localStorage.getItem('userInfo'));
        sessionStorage.setItem('adminToken', localStorage.getItem('token'));

        // Switch active user credentials in localStorage
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userInfo', JSON.stringify(res.data.user));

        alert(`Successfully switched session to: ${res.data.user.name}`);
        
        // Find the first permission of the agent to redirect them to their primary sector
        // If they have no permissions, default to /admin
        const agentPerms = res.data.user.permissions || [];
        let redirectPath = '/admin';
        if (agentPerms.length > 0) {
          const permToPath = {
            manage_bookings: '/admin/bookings',
            manage_services: '/admin/services',
            manage_content: '/admin/manage-arjee',
            manage_feedback: '/admin/feedback',
            manage_refunds: '/admin/refunds',
            manage_parking: '/admin/manage-parking',
            manage_hotels: '/admin/manage-hotels',
            manage_devotees: '/admin/devotees',
            manage_wallet: '/admin/wallet'
          };
          for (let perm of agentPerms) {
            if (permToPath[perm]) {
              redirectPath = permToPath[perm];
              break;
            }
          }
        }
        window.location.href = redirectPath;
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to switch staff session");
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await API.get('/users/agents');
      setAgents(res.data.data);
    } catch (err) {
      console.error("Error fetching agents:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await API.get('/users/agents-analytics');
      setAnalytics(res.data.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await API.get('/users/agents-activity-logs');
      setLogs(res.data.data || []);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (showLogsDrawer) {
      fetchLogs();
    }
  }, [showLogsDrawer]);

  useEffect(() => {
    const socket = io(getBaseURL());

    if (currentUser?._id) {
      socket.emit("join-team", { userId: currentUser._id });
    }

    socket.on("team-status-update", (userIds) => {
      setOnlineUsers(userIds || []);
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser?._id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePermissionChange = (e) => {
    const { value, checked } = e.target;
    let newPerms = [...formData.permissions];
    if (checked) newPerms.push(value);
    else newPerms = newPerms.filter(p => p !== value);
    setFormData({ ...formData, permissions: newPerms });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.agentId) {
        await API.put(`/users/agents/${formData.agentId}`, formData);
      } else {
        await API.post('/users/agents', formData);
      }
      
      setShowModal(false);
      setFormData({ name: '', mobile: '', password: '', permissions: [], department: 'Services', profession: '', avatar: '🪔', agentId: null });
      fetchAgents();
      fetchAnalytics();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing request');
    }
  };

  const handleEdit = (agent) => {
    setFormData({
      name: agent.name,
      mobile: agent.mobile,
      password: '',
      permissions: agent.permissions || [],
      department: agent.department || 'Services',
      profession: agent.profession || '',
      avatar: agent.avatar || '🪔',
      agentId: agent._id
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (agent) => {
    const action = agent.status === 'blocked' ? 'unfreeze' : 'freeze';
    if (!window.confirm(`Are you sure you want to ${action} this partner account?`)) return;
    try {
      await API.put(`/users/${agent._id}/toggle-status`);
      fetchAgents();
      fetchAnalytics();
    } catch (err) {
      alert(err.response?.data?.message || 'Error changing partner status');
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          agent.mobile.includes(searchTerm);
    const matchesDept = selectedDept === 'All' || agent.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  if (loading) return (
    <div className="py-40 text-center flex flex-col items-center justify-center gap-4">
       <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
       <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest animate-pulse">Syncing Personnel Database...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 relative">
      
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                 <FaUserFriends size={20} />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Partner <span className="text-orange-600 not-italic">Network</span></h1>
           </div>
           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] ml-1">Workforce Distribution & Access Governance</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
           <button 
             onClick={() => setShowLogsDrawer(true)}
             className="bg-white text-slate-700 border border-slate-200 px-6 py-4 rounded-[22px] font-bold text-[10px] uppercase tracking-[0.2em] shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95"
           >
             <FaHistory className="text-slate-400" />
             View Audit Logs
           </button>

           <button 
             onClick={() => {
               setFormData({ name: '', mobile: '', password: '', permissions: [], department: 'Services', avatar: '🪔', agentId: null });
               setShowModal(true);
             }}
             className="bg-slate-900 text-white px-8 py-4 rounded-[22px] font-bold text-[10px] uppercase tracking-[0.2em] shadow-md border border-slate-200 hover:bg-orange-600 transition-all active:scale-95 group"
           >
             <FaPlus className="inline-block mr-3 group-hover:rotate-90 transition-transform" />
             Link New Partner
           </button>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Total Force', 
            val: analytics?.totalForce || 0, 
            subtitle: 'Registered Partners', 
            color: 'from-blue-500/10 to-indigo-500/5', 
            textColor: 'text-blue-600',
            iconBg: 'bg-blue-500/10 text-blue-600'
          },
          { 
            label: 'Active Force', 
            val: analytics?.activeCount || 0, 
            subtitle: 'Fully Operational', 
            color: 'from-emerald-500/10 to-teal-500/5', 
            textColor: 'text-emerald-600',
            iconBg: 'bg-emerald-500/10 text-emerald-600'
          },
          { 
            label: 'Access Suspended', 
            val: analytics?.blockedCount || 0, 
            subtitle: 'Frozen Accounts', 
            color: 'from-rose-500/10 to-orange-500/5', 
            textColor: 'text-rose-600',
            iconBg: 'bg-rose-500/10 text-rose-600'
          },
          { 
            label: 'Real-Time Presence', 
            val: onlineUsers.filter(id => agents.some(a => a._id === id)).length, 
            subtitle: 'Active Socket Links', 
            color: 'from-amber-500/10 to-orange-500/5', 
            textColor: 'text-amber-600',
            iconBg: 'bg-amber-500/10 text-amber-600'
          }
        ].map((stat, i) => (
          <div key={i} className={`bg-gradient-to-br ${stat.color} border border-white/60 p-6 rounded-2xl shadow-sm backdrop-blur-md flex flex-col justify-between h-40 relative overflow-hidden group`}>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <p className={`text-4xl font-bold ${stat.textColor} tracking-tight`}>{stat.val}</p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100/50 pt-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.subtitle}</span>
              {stat.label === 'Real-Time Presence' && stat.val > 0 && (
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white/60 border border-slate-200/50 p-6 rounded-2xl shadow-sm backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
          <input 
            type="text" 
            placeholder="Search by name or mobile..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-xs text-slate-900 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none pb-2 md:pb-0">
          <button 
            onClick={() => setSelectedDept('All')}
            className={`px-4 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-widest text-slate-500 transition-all shrink-0 ${selectedDept === 'All' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}
          >
            All Sectors
          </button>
          {DEPARTMENTS.map(dept => (
            <button 
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-4 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-widest text-slate-500 transition-all shrink-0 ${selectedDept === dept ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}
            >
              {DEPARTMENT_LABELS[dept] || dept}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredAgents.map((agent, i) => {
            const isOnline = onlineUsers.includes(agent._id);
            return (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                key={agent._id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-orange-100/20 hover:border-orange-200/80 transition-all duration-300 relative group overflow-hidden flex flex-col justify-between min-h-[300px]"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-amber-500/15 rounded-full blur-2xl pointer-events-none group-hover:scale-150 group-hover:from-orange-500/20 group-hover:to-amber-500/25 transition-all duration-500"></div>

                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-slate-900xl shadow-lg relative group-hover:scale-110 transition-transform duration-300">
                        <span className="select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">{agent.avatar || '🪔'}</span>
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base tracking-tighter truncate group-hover:text-orange-600 transition-colors uppercase italic">{agent.name}</h3>
                          <span className="flex h-2.5 w-2.5 relative">
                            {isOnline ? (
                              <>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" title="Online now"></span>
                              </>
                            ) : (
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-300" title="Offline"></span>
                            )}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5 mt-1">
                          <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest italic leading-none">
                            {agent.profession || 'Devotee Agent'}
                          </p>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <FaBuilding size={9} className="text-slate-300" />
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#0a1128]/70 leading-none">{DEPARTMENT_LABELS[agent.department] || agent.department || 'Service Catalog'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <span className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-widest rounded-full ${agent.status === 'blocked' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                      {agent.status === 'blocked' ? 'Frozen' : 'Active'}
                    </span>
                  </div>

                  <div className="space-y-2 py-4 border-y border-slate-100/80 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Mobile Link</span>
                      <span className="font-bold text-slate-900 tracking-wider">{agent.mobile}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Deployed On</span>
                      <span className="font-semibold text-slate-600">
                        {new Date(agent.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {isSuperAdmin && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Linked By</span>
                        <span className="font-bold text-[9px] text-slate-900 uppercase tracking-widest bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100/30">
                          {agent.parentAdmin?.name || 'Main Registry'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto custom-scrollbar mb-4">
                    {agent.permissions?.map(p => (
                      <span key={p} className="px-2.5 py-1 bg-amber-50 text-amber-800 text-[10px] font-semibold rounded-lg uppercase tracking-widest border border-amber-100/50 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all cursor-default shadow-sm">
                        {PERMISSION_LABELS[p] || p.replace('manage_', '')}
                      </span>
                    )) || <span className="text-slate-300 text-[10px] font-bold italic uppercase tracking-widest">No Authorized Nodes</span>}
                  </div>

                  {isSuperAdmin && (
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100/80 mb-4">
                      <button
                        onClick={() => handleImpersonate(agent)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white rounded-xl text-[10px] font-semibold uppercase tracking-widest text-slate-500 transition-all duration-200 active:scale-95 border border-orange-100/50"
                        title="Open Staff Panel"
                      >
                        <FaDesktop size={10} />
                        Open Staff Panel
                      </button>
                      <button
                        onClick={() => handleImpersonate(agent)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900/5 text-slate-900 hover:bg-slate-900 hover:text-white rounded-xl text-[10px] font-semibold uppercase tracking-widest text-slate-500 transition-all duration-200 active:scale-95 border border-[#0A1128]/10"
                        title="Login As Staff"
                      >
                        <FaArrowRight size={10} />
                        Login As Staff
                      </button>
                      <button
                        onClick={() => handleEdit(agent)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 hover:bg-slate-200 rounded-xl text-[10px] font-semibold uppercase tracking-widest text-slate-500 transition-all duration-200 active:scale-95 border border-slate-200/40"
                        title="View Permissions"
                      >
                        <FaShieldAlt size={10} />
                        Permissions
                      </button>
                      <button
                        onClick={() => {
                          setLogsFilter(agent.name);
                          setShowLogsDrawer(true);
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 hover:bg-slate-200 rounded-xl text-[10px] font-semibold uppercase tracking-widest text-slate-500 transition-all duration-200 active:scale-95 border border-slate-200/40"
                        title="View Activity Logs"
                      >
                        <FaHistory size={10} />
                        Activity Logs
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-50">
                  <button 
                    onClick={() => handleToggleStatus(agent)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-widest text-slate-500 transition-all ${agent.status === 'blocked' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                  >
                    {agent.status === 'blocked' ? (
                      <>
                        <FaUnlock size={10} />
                        Unfreeze Account
                      </>
                    ) : (
                      <>
                        <FaUserSlash size={10} />
                        Freeze Account
                      </>
                    )}
                  </button>

                  <button 
                    onClick={() => handleEdit(agent)}
                    className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-600 hover:text-white transition-all shadow-sm flex items-center justify-center group/btn active:scale-95"
                  >
                    <FaEdit size={12} className="group-hover/btn:scale-110 transition-transform" />
                  </button>
                </div>

              </motion.div>
            );
          })}
        </AnimatePresence>
      </section>

      {filteredAgents.length === 0 && (
         <div className="py-40 text-center flex flex-col items-center justify-center gap-6 opacity-25">
            <FaLayerGroup size={48} className="text-slate-300" />
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-slate-400">No partner agents match search criteria</p>
         </div>
      )}

      <AnimatePresence>
        {showLogsDrawer && (
          <>
            <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-sm z-[110]" onClick={() => setShowLogsDrawer(false)}></div>
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.35 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-sm border border-slate-200 z-[120] border-l border-slate-100 flex flex-col h-full"
            >
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-6xl -mr-6 -mt-6"><FaHistory /></div>
                <div className="relative z-10">
                  <h2 className="text-xl font-bold tracking-tighter uppercase italic">Team Audit Logs</h2>
                  <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest text-slate-500 mt-0.5">
                    {logsFilter ? `Filtered by: ${logsFilter}` : 'Registry of operational operations'}
                  </p>
                  {logsFilter && (
                    <button 
                      onClick={() => setLogsFilter('')}
                      className="mt-2 bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1 w-max"
                    >
                      ✕ Clear Filter
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => { setShowLogsDrawer(false); setLogsFilter(''); }}
                  className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-sm relative z-10"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto custom-scrollbar p-6 bg-slate-50 space-y-4">
                {logsLoading ? (
                  <div className="py-20 text-center flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Accessing Vault Logs...</span>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest italic opacity-40">
                    No registry log occurrences found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs
                      .filter(log => !logsFilter || 
                        log.userId?.name?.toLowerCase().includes(logsFilter.toLowerCase()) || 
                        log.details?.toLowerCase().includes(logsFilter.toLowerCase())
                      )
                      .map((log) => (
                        <div key={log._id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all space-y-3 relative group">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 text-[#0a1128] block mb-0.5">{log.userId?.name || 'Unknown Operator'}</span>
                              <span className="text-[8px] font-bold text-slate-400 tracking-wider">({log.userId?.role || 'Admin'} • {log.userId?.mobile})</span>
                            </div>
                            
                            <span className={`px-2 py-0.5 text-[7px] font-bold uppercase tracking-widest rounded-lg border ${
                              log.action === 'freeze_partner' ? 'bg-red-50 text-red-600 border-red-100' :
                              log.action === 'link_partner' ? 'bg-green-50 text-green-600 border-green-100' :
                              log.action === 'unfreeze_partner' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              log.action === 'impersonation_switch' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                              log.action === 'impersonation_return' ? 'bg-slate-900/10 text-slate-900 border-slate-200' :
                              'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                              {log.action.replace('_', ' ')}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 font-bold leading-relaxed">{log.details}</p>

                          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 border-t border-slate-50 pt-2 opacity-80 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><FaDesktop /> {log.ipAddress || 'IP Vaulted'}</span>
                            <span>{new Date(log.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-8xl -mr-10 -mt-10"><FaShieldAlt /></div>
                <div className="relative z-10">
                   <h2 className="text-2xl font-bold tracking-tighter uppercase italic">{formData.agentId ? 'Synchronize' : 'Link'} Partner</h2>
                   <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Configure Partner access architecture</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-xl relative z-10">✕</button>
              </div>
              
              <div className="flex-grow overflow-y-auto custom-scrollbar p-6 bg-[#F8FAFC]">
                <form onSubmit={handleSubmit} className="space-y-10">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2"><FaBuilding size={10} /> Sector / Department</label>
                      <select 
                        name="department" 
                        value={formData.department} 
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-white border border-slate-100 rounded-[22px] outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-[13px] text-slate-900 transition-all cursor-pointer appearance-none"
                      >
                        {DEPARTMENTS.map(dept => (
                          <option key={dept} value={dept}>{DEPARTMENT_LABELS[dept] || dept}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">🛡️ Spiritual Avatar Symbol</label>
                      <div className="flex items-center gap-2 flex-wrap bg-white p-3 rounded-[22px] border border-slate-100">
                        {AVATARS.map(av => (
                          <button
                            key={av}
                            type="button"
                            onClick={() => setFormData({ ...formData, avatar: av })}
                            className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${formData.avatar === av ? 'bg-orange-500/20 scale-110 border border-orange-500/30' : 'hover:bg-slate-100 border border-transparent'}`}
                          >
                            {av}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2"><FaUserTag size={10} /> Legal Persona Name</label>
                      <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-6 py-4 bg-white border border-slate-100 rounded-[22px] outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-[13px] text-slate-900 transition-all" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2"><FaUserTag size={10} className="text-orange-500" /> Profession / Title</label>
                      <input type="text" name="profession" placeholder="e.g. Lead Pandit, Prasad Incharge" value={formData.profession} onChange={handleChange} className="w-full px-6 py-4 bg-white border border-slate-100 rounded-[22px] outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-[13px] text-slate-900 transition-all placeholder:text-slate-300" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2"><FaIdCard size={10} /> Direct Access Mobile</label>
                      <input type="text" name="mobile" required value={formData.mobile} onChange={handleChange} className="w-full px-6 py-4 bg-white border border-slate-100 rounded-[22px] outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-[13px] text-slate-900 transition-all" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2"><FaLock size={10} /> Access Security Token {formData.agentId && '(Optional Update)'}</label>
                    <input type="text" name="password" required={!formData.agentId} value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full px-6 py-4 bg-white border border-slate-100 rounded-[22px] outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-[13px] text-slate-900 transition-all placeholder:text-slate-200" />
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                       <FaLayerGroup className="text-orange-500" size={14} />
                       <p className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.2em] italic">Access Authorization Matrix:</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { id: 'manage_services', label: 'Service Catalog' },
                        { id: 'manage_content', label: 'CMS, Rituals & Crowd' },
                        { id: 'manage_feedback', label: 'Testimonials' },
                        { id: 'manage_bookings', label: 'Bookings & Orders' },
                        { id: 'manage_arjee', label: 'Rituals & Media' },
                        { id: 'manage_parking', label: 'Parking Management' },
                        { id: 'manage_hotels', label: 'Accommodations' },
                        { id: 'manage_devotees', label: 'Devotees CRM' },
                        { id: 'manage_wallet', label: 'Financials & Wallets' },
                        { id: 'manage_refunds', label: 'Refund Management' }
                      ].map(perm => (
                        <label key={perm.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-orange-500 hover:bg-orange-50/30 transition-all group relative overflow-hidden">
                          <input 
                            type="checkbox" 
                            value={perm.id} 
                            onChange={handlePermissionChange} 
                            checked={formData.permissions.includes(perm.id)}
                            className="w-5 h-5 rounded-lg border-slate-200 text-slate-900 focus:ring-[#0A1128]/20 transition-all cursor-pointer" 
                          />
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest group-hover:text-slate-900 transition-colors">{perm.label}</span>
                          {formData.permissions.includes(perm.id) && (
                            <div className="absolute bottom-0 right-0 p-1 opacity-20"><FaCheckCircle className="text-slate-900" size={8} /></div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-6 pt-6 sticky bottom-0 bg-[#F8FAFC] pb-4">
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-8 py-5 border border-slate-200 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:bg-white hover:text-slate-900 transition-all"
                    >
                      Abort Mission
                    </button>
                    <button 
                      type="submit" 
                      className="flex-[2] px-8 py-5 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-md border border-slate-200 hover:bg-orange-600 transition-all active:scale-95 group"
                    >
                      {formData.agentId ? 'Synchronize Partner' : 'Deploy Partner Link'}
                      <FaArrowRight className="inline-block ml-3 group-hover:translate-x-2 transition-transform" />
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
