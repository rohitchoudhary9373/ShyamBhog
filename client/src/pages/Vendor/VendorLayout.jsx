import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FaHotel, FaBed, FaCalendarAlt, FaWallet, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "../../utils/auth";

export default function VendorLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("hotelVendorInfo") || "{}");

  useEffect(() => {
    if (user?.role !== 'hotel_owner') {
      navigate('/vendor-login');
    }
  }, [user, navigate]);

  const menu = [
    { name: "Dashboard", path: "/vendor/dashboard", icon: <FaHotel /> },
    { name: "My Properties", path: "/vendor/hotels", icon: <FaHotel /> },
    { name: "Room Inventory", path: "/vendor/rooms", icon: <FaBed /> },
    { name: "Bookings", path: "/vendor/bookings", icon: <FaCalendarAlt /> },
    { name: "Payouts", path: "/vendor/payouts", icon: <FaWallet /> }
  ];

  const handleLogout = () => {
    localStorage.removeItem("hotelVendorInfo");
    navigate("/vendor-login");
  };

  return (
    <div className="flex min-h-[100dvh] bg-[#F8FAFC] text-slate-800 font-sans">
      {/* SIDEBAR */}
      <aside className={`fixed md:sticky top-0 left-0 h-[100dvh] w-64 bg-slate-900 text-slate-300 border-r border-white/5 flex flex-col z-50 transition-all duration-500 ease-in-out shadow-2xl
      ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-8 border-b border-white/5">
          <h2 className="text-xl font-black text-white tracking-tighter">Vendor <span className="text-blue-500">Hub</span></h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Partner Network</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
          {menu.map((item, i) => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={i}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 group relative overflow-hidden
                ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
              >
                <span className="text-lg relative z-10">{item.icon}</span>
                <span className="relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            <FaSignOutAlt className="text-lg" />
            Logout
          </button>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 max-h-[100dvh] overflow-y-auto custom-scrollbar">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setOpen(true)} className="md:hidden text-slate-800 text-2xl active:scale-95 transition-transform"><FaBars /></button>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Partner Dashboard</h2>
              <p className="text-[10px] font-bold text-slate-400">Manage your properties</p>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 flex-1 w-full max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
