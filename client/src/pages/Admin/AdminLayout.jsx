import { Outlet, NavLink, useLocation, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  FaHome, FaBox, FaUsers, FaCog, FaBars, FaHistory, 
  FaWallet, FaVideo, FaParking, FaBed, FaBell, FaSearch, 
  FaArrowRight, FaChartLine, FaShieldAlt, FaSignOutAlt, FaDesktop
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { getUser, logout } from "../../utils/auth";
import { useSettings } from "../../context/SettingsContext";
import API from "../../services/api";
import axios from "axios";
import { getBaseURL, getMediaUrl } from "../../utils/url";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const [logoError, setLogoError] = useState(false);
  const { settings } = useSettings();
  const [adminSettings, setAdminSettings] = useState(null);
  const [wallet, setWallet] = useState(0);
  const [totalFloat, setTotalFloat] = useState(0);
  const [refundCount, setRefundCount] = useState(0);

  const user = getUser();
  const isImpersonating = !!sessionStorage.getItem('adminToken');
  const switchedUser = JSON.parse(localStorage.getItem('userInfo') || '{}');

  const handleReturnToAdmin = async () => {
    const adminUserJson = sessionStorage.getItem('adminUser');
    const adminToken = sessionStorage.getItem('adminToken');
    const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');

    if (adminUserJson && adminToken) {
      try {
        await axios.post(`${getBaseURL()}/api/auth/impersonate/return`, 
          { targetUserId: currentUser._id },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
      } catch (err) {
        console.error("Failed to log return event:", err);
      }

      localStorage.setItem('userInfo', adminUserJson);
      localStorage.setItem('token', adminToken);
      
      sessionStorage.removeItem('adminUser');
      sessionStorage.removeItem('adminToken');

      alert('Instantly restored administrator session context.');
      window.location.href = '/admin/bookings';
    }
  };

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const ownerId = user?.role === 'agent' ? user?.parentAdmin : user?._id;
        const res = await API.get(`/settings?tenantId=${ownerId}`);
        setAdminSettings(res.data);
      } catch (err) {
        console.error("Branding failed to load");
      }
    };
    const loadWalletData = async () => {
      try {
        const [profRes, floatRes] = await Promise.all([
          API.get('/users/profile'),
          API.get('/wallet/total-float')
        ]);
        const userProfile = profRes.data.data || profRes.data;
        const currentInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
        localStorage.setItem("userInfo", JSON.stringify({ ...currentInfo, ...userProfile }));

        setWallet(userProfile.walletBalance || 0);
        setTotalFloat(floatRes.data.total || 0);
      } catch (e) {
        console.error("Financial sync failed:", e);
      }
    };
    const fetchRefundCount = async () => {
      try {
        const res = await API.get('/refunds/admin');
        const pending = res.data.data.filter(r => r.status === 'pending').length;
        setRefundCount(pending);
      } catch (err) { }
    };

    if (user?._id) {
      loadBranding();
      loadWalletData();
      if (user.role !== 'agent') fetchRefundCount();
    }
  }, [user?._id]);

  const fullMenu = [
    { name: "Dashboard", path: "/admin", icon: <FaHome />, permission: 'all' },
    { name: "Orders", path: "/admin/bookings", icon: <FaBox />, permission: 'manage_bookings' },
    { name: "Service Catalog", path: "/admin/services", icon: <FaBox />, permission: 'manage_services' },
    { name: "Ritual Requests", path: "/admin/manage-arjee", icon: <FaVideo />, permission: 'manage_content' },
    { name: "CMS Library", path: "/admin/content", icon: <FaBox />, permission: 'manage_content' },
    { name: "Testimonials", path: "/admin/feedback", icon: <FaUsers />, permission: 'manage_feedback' },
    { name: "Refunds", path: "/admin/refunds", icon: <FaShieldAlt />, permission: 'manage_refunds' },
    { name: "Crowd Status", path: "/admin/manage-crowd", icon: <FaUsers />, permission: 'manage_content' },
    { name: "Parking", path: "/admin/manage-parking", icon: <FaParking />, permission: 'manage_parking' },
    { name: "Luxury Stays", path: "/admin/manage-hotels", icon: <FaBed />, permission: 'manage_hotels' },
    { name: "Users", path: "/admin/users", icon: <FaUsers />, permission: 'manage_devotees' },
    { name: "Team", path: "/admin/agents", icon: <FaUsers />, permission: 'admin_only' },
    { name: "Security Log", path: "/admin/security", icon: <FaHistory />, permission: 'admin_only' },
    { name: "Financials", path: "/admin/wallet", icon: <FaWallet />, permission: 'manage_wallet' },
    { name: "Settings", path: "/admin/settings", icon: <FaCog />, permission: 'admin_only' },
  ];

  const menu = fullMenu.filter(item =>
    user?.role === 'admin' ||
    (user?.role === 'admin' && (item.permission === 'all' || item.permission === 'admin_only')) ||
    (user?.role === 'agent' && item.permission !== 'all' && user?.permissions?.includes(item.permission))
  );

  const userRole = user?.role;
  useEffect(() => {
    if (userRole === 'agent' && location.pathname === '/admin' && menu.length > 0) {
      window.location.href = menu[0].path;
    }
  }, [location.pathname, userRole, menu]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-orange-100 selection:text-orange-900" style={isImpersonating ? { paddingTop: '44px' } : {}}>
      {isImpersonating && (
        <div className="fixed top-0 left-0 w-full bg-slate-950 text-white h-[44px] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-wider z-[100] border-b border-orange-500/30">
          <span className="flex items-center gap-1.5 text-orange-400">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            Impersonation Mode:
          </span>
          <span>Viewing as <strong className="text-white normal-case font-black">{switchedUser.name}</strong></span>
          <button 
            onClick={handleReturnToAdmin}
            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ml-2 shadow-lg border border-orange-500"
          >
            Return to Admin
          </button>
        </div>
      )}

      {/* ── SIDEBAR (Modern SaaS Dark Style) ── */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-950 text-slate-300 border-r border-white/5 flex flex-col z-50 transition-all duration-500 ease-in-out shadow-2xl
      ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      style={isImpersonating ? { top: '44px', height: 'calc(100vh - 44px)' } : {}}>

        {/* Brand Identity */}
        <div className="h-16 flex items-center px-6 border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-white shadow-md group-hover:bg-slate-700 transition-colors">
              {adminSettings?.logoUrl && !logoError ? (
                <img
                  src={getMediaUrl(adminSettings?.logoUrl)}
                  alt="Logo"
                  className="w-full h-full object-cover rounded-lg"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <FaShieldAlt size={16} className="text-orange-500" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-tight leading-none">{adminSettings?.brandName || 'Admin'}</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 flex flex-col gap-1 overflow-y-auto px-4 no-scrollbar">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3 px-3">Overview</p>
          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 group ${isActive
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }
              onClick={() => setOpen(false)}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm">{item.icon}</span>
                {item.name}
              </div>
              {item.name === "Refunds" && refundCount > 0 && (
                 <span className="bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {refundCount}
                 </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Support */}
        <div className="p-4 mt-auto border-t border-white/5">
          <div className="bg-slate-900 rounded-xl p-4 text-center border border-white/5 group">
            <p className="text-white font-bold text-xs mb-1 z-10">Need Help?</p>
            <p className="text-slate-400 text-[10px] mb-3 z-10">24/7 Priority Support</p>
            <button className="w-full bg-slate-800 text-white py-2 rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors z-10">Contact Admin</button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Header (Glassmorphism Navbar) */}
        <header className="flex justify-between items-center bg-white/70 backdrop-blur-xl px-6 md:px-10 py-4 border-b border-slate-200/60 sticky top-0 z-40"
        style={isImpersonating ? { top: '44px' } : {}}>

          <div className="flex items-center gap-6">
            <button className="md:hidden p-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-600" onClick={() => setOpen(true)}>
              <FaBars size={14} />
            </button>
            
            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg focus-within:ring-2 focus-within:ring-slate-900/10 transition-all">
              <FaSearch className="text-slate-400" size={14} />
              <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400 w-48" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Financial Status (Premium Design) */}
            {user?.role !== 'agent' && (
              <div className="hidden sm:flex items-center gap-4 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                <div className="flex flex-col pr-4 border-r border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Treasury</span>
                  <span className="text-sm font-bold text-slate-900">₹{totalFloat.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaWallet className="text-slate-400 text-xs" />
                  <span className="text-sm font-bold text-slate-900">₹{wallet.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Profile & Notifications */}
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-orange-600 hover:border-orange-200 transition-all relative">
                <FaBell size={16} />
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-orange-600 rounded-full border border-white"></span>
              </button>
              
              <div className="h-10 border-l border-slate-200 ml-2 mr-2"></div>

              <div className="flex items-center gap-4 group cursor-pointer">
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] font-black text-[#0A1128] uppercase tracking-tighter leading-none">{user?.name}</p>
                  <p className="text-[8px] font-bold text-orange-600 uppercase tracking-widest mt-1">{user?.role?.replace('_', ' ')}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#0A1128] border-2 border-white shadow-lg flex items-center justify-center text-white font-black text-xs uppercase group-hover:scale-105 transition-transform">
                  {user?.name?.charAt(0)}
                </div>
              </div>

              <button
                onClick={logout}
                className="ml-2 w-10 h-10 rounded-xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95"
                title="Logout"
              >
                <FaSignOutAlt size={14} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area with Soft Background */}
        <main className="flex-1 overflow-y-auto pt-6 px-10 pb-10 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-700">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}