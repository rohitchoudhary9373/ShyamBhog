import { useEffect, useState } from "react";
import API from "../../services/api";
import Loader from "../../components/Loader";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { io } from "socket.io-client";
import { getBaseURL } from "../../utils/url";
import { 
  FaVideo, 
  FaUsers, 
  FaParking, 
  FaBoxOpen, 
  FaHistory, 
  FaUserShield,
  FaArrowRight,
  FaWallet,
  FaCheckCircle,
  FaClock,
  FaShieldAlt,
  FaDownload,
  FaSyncAlt,
  FaExternalLinkAlt,
  FaChartLine,
  FaSignal
} from "react-icons/fa";

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, revenue: 0, pending: 0, walletFloat: 0, adminBalance: 0 });
  const [chartData, setChartData] = useState([]);
  const [recent, setRecent] = useState([]);
  const [crowd, setCrowd] = useState("Normal");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchData = async () => {
    try {
      const res = await API.get("/finance/reseller-stats");
      const d = res.data.data;
      setStats({
        total: d.totalBookings || 0,
        revenue: d.totalRevenue || 0,
        pending: d.pendingRefunds || 0,
        walletFloat: d.totalWalletFloat || 0,
        adminBalance: d.adminBalance || 0
      });
      setRecent(d.recentBookings || []);
      if (d.dailyRevenue && d.dailyRevenue.length > 0) {
        setChartData(d.dailyRevenue);
      } else {
        // Fallback chart data for smooth initial render
        setChartData([
          { name: 'Mon', revenue: 0 },
          { name: 'Tue', revenue: 0 },
          { name: 'Wed', revenue: 0 },
          { name: 'Thu', revenue: 0 },
          { name: 'Fri', revenue: 0 },
          { name: 'Sat', revenue: 0 },
          { name: 'Sun', revenue: 0 }
        ]);
      }
    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportWalletFloat = async () => {
    try {
      setExporting(true);
      const res = await API.get('/wallet/all-wallets');
      const usersList = res.data.users || [];
      
      const headers = ['Devotee Name', 'WhatsApp', 'Email', 'Devotee ID', 'Unspent Wallet Balance (Liability)'];
      const rows = usersList.map(u => [
        `"${u.name}"`,
        u.mobile,
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
    } catch (err) {
      alert('Error exporting data');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchData();
    const socket = io(getBaseURL());
    socket.on("crowdUpdate", (data) => setCrowd(data.status));
    socket.on("bookingUpdate", () => {
      fetchData();
    });
    return () => {
      socket.off("crowdUpdate");
      socket.off("bookingUpdate");
      socket.disconnect();
    };
  }, []);

  if (loading) return <Loader text="Syncing Command Center..." />;

  return (
    <div className="bg-[#F8FAFC] min-h-[100dvh] pb-24 p-4 md:p-8 font-sans selection:bg-orange-100">

      {/* 🚀 ULTRA-PREMIUM HERO BANNER */}
      <div className="relative bg-[#0A1128] rounded-[32px] p-6 md:p-10 shadow-2xl mb-8 overflow-hidden border border-slate-800">
        {/* Glowing Background Orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/15 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-[90px] -mb-32 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          
          {/* Header Title */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
              <FaUserShield size={12} className="text-orange-400" />
              <span className="text-[10px] font-black text-white/80 uppercase tracking-[0.25em]">Executive Dashboard</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-none uppercase">
              Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400">Overview</span>
            </h1>
            <p className="text-slate-400 text-xs font-medium tracking-wider uppercase opacity-80">Real-Time Telemetry & Systems Governance</p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
             {/* Real-time Status Monitor */}
             <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/10 shadow-lg">
                <div className="relative flex items-center justify-center">
                   <div className={`w-2.5 h-2.5 rounded-full ${crowd === 'High' ? 'bg-red-500' : 'bg-emerald-400'}`}></div>
                   <div className={`absolute w-full h-full rounded-full animate-ping opacity-50 ${crowd === 'High' ? 'bg-red-500' : 'bg-emerald-400'}`}></div>
                </div>
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none mb-0.5">Temple Traffic</span>
                   <span className={`text-xs font-black uppercase tracking-wider ${crowd === 'High' ? 'text-red-400' : 'text-emerald-400'}`}>{crowd || 'Normal'}</span>
                </div>
             </div>

             <button 
               onClick={handleExportWalletFloat} 
               disabled={exporting} 
               className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 border border-white/15 backdrop-blur-md shadow-md disabled:opacity-50"
             >
                <FaDownload className={`${exporting ? 'animate-bounce text-orange-400' : 'text-white/70'}`} size={12} />
                {exporting ? 'Exporting...' : 'Export CSV'}
             </button>

             <button onClick={fetchData} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-600/20 hover:scale-105 transition-all active:scale-95">
                <FaSyncAlt className="animate-spin-slow" size={12} />
                Sync Telemetry
             </button>
          </div>

        </div>
      </div>

      {/* 📊 KPI INTELLIGENCE METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5 mb-8">
        <KPICard title="Net Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={<FaWallet />} gradient="from-slate-900 to-[#0A1128]" iconBg="bg-orange-500/20 text-orange-400" trend="+12.5%" link="/admin/wallet" />
        <KPICard title="Active Orders" value={stats.total} icon={<FaCheckCircle />} gradient="from-orange-600 to-amber-600" iconBg="bg-white/20 text-white" trend="+4.2%" link="/admin/bookings" />
        <KPICard title="Escalations" value={stats.pending} icon={<FaClock />} gradient="from-red-600 to-rose-700" iconBg="bg-white/20 text-white" isAlert={stats.pending > 0} link="/admin/refunds" />
        <KPICard title="Liabilities" value={`₹${stats.walletFloat.toLocaleString()}`} icon={<FaShieldAlt />} gradient="from-slate-800 to-slate-900" iconBg="bg-white/10 text-slate-300" link="/admin/wallet" />
        <KPICard title="Treasury" value={`₹${stats.adminBalance.toLocaleString()}`} icon={<FaWallet />} gradient="from-emerald-700 to-teal-800" iconBg="bg-white/20 text-white" link="/admin/wallet" trend="Stable" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 🕹️ LEFT SIDE (Modules + Analytics) */}
        <div className="lg:col-span-8 space-y-6">

           {/* MODULE ARCHITECTURE */}
           <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200/80 shadow-xl shadow-slate-100">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-lg font-black text-[#0A1128] tracking-tight uppercase">Modules Architecture</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Platform-wide System Controllers</p>
                 </div>
                 <span className="text-[9px] font-black bg-orange-50 text-orange-600 px-3 py-1 rounded-full border border-orange-100 uppercase tracking-widest">5 Active</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                 <ModuleCard title="Ritual Requests" path="/admin/manage-arjee" icon={<FaVideo />} color="text-red-600" bg="bg-red-50 border-red-100" />
                 <ModuleCard title="Crowd Status" path="/admin/manage-crowd" icon={<FaUsers />} color="text-blue-600" bg="bg-blue-50 border-blue-100" />
                 <ModuleCard title="Parking Guide" path="/admin/manage-parking" icon={<FaParking />} color="text-emerald-600" bg="bg-emerald-50 border-emerald-100" />
                 <ModuleCard title="Service Catalog" path="/admin/services" icon={<FaBoxOpen />} color="text-orange-600" bg="bg-orange-50 border-orange-100" />
                 <ModuleCard title="Security Log" path="/admin/security" icon={<FaHistory />} color="text-purple-600" bg="bg-purple-50 border-purple-100" />
              </div>
           </div>

           {/* 📈 GROWTH ANALYTICS CHART */}
           <div className="bg-[#0A1128] p-6 md:p-8 rounded-[32px] shadow-2xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
              
              <div className="flex justify-between items-center mb-6 relative z-10">
                 <div>
                    <div className="flex items-center gap-2">
                       <FaChartLine className="text-orange-400" size={14} />
                       <h2 className="text-lg font-black text-white tracking-tight uppercase">Growth Analytics</h2>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Rolling 7-Day Performance & Revenue Telemetry</p>
                 </div>
                 <Link to="/admin/wallet" className="text-[10px] font-black text-white px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2 backdrop-blur-md border border-white/10 transition-all uppercase tracking-widest">
                    Financials <FaArrowRight size={10} className="text-orange-400" />
                 </Link>
              </div>

              <div className="h-[260px] w-full relative z-10 pt-2">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                       <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#F97316" stopOpacity={0.4}/>
                             <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94A3B8'}} />
                       <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94A3B8'}} />
                       <Tooltip 
                         contentStyle={{ backgroundColor: '#0A1128', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', padding: '12px' }}
                         itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#F97316' }}
                       />
                       <Area type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

        </div>

        {/* 🕒 RIGHT SIDE (Live Activity Feed) */}
        <div className="lg:col-span-4">
           <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200/80 shadow-xl shadow-slate-100 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-lg font-black text-[#0A1128] tracking-tight uppercase">Live Feed</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Real-time Booking Stream</p>
                 </div>
                 <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 shadow-sm">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[9px] font-black uppercase tracking-widest">Active</span>
                 </div>
              </div>
              
              <div className="flex-grow space-y-3 overflow-y-auto pr-1 custom-scrollbar min-h-[320px]">
                 {recent.length === 0 ? (
                    <div className="py-24 text-center flex flex-col items-center justify-center opacity-40 gap-3">
                       <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <FaHistory size={20} />
                       </div>
                       <p className="text-xs font-black uppercase tracking-widest text-slate-500">No recent activity</p>
                    </div>
                 ) : (
                    recent.map(booking => (
                       <div key={booking._id} className="p-4 bg-slate-50/80 hover:bg-white border border-slate-100 hover:border-orange-200 rounded-2xl transition-all duration-300 shadow-sm group">
                          <div className="flex justify-between items-start mb-2">
                             <div>
                                <h4 className="font-black text-xs text-[#0A1128] group-hover:text-orange-600 transition-colors uppercase tracking-tight">{booking.name}</h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{booking.serviceType}</p>
                             </div>
                             <div className="text-right">
                                <span className="text-sm font-black text-[#0A1128]">₹{booking.price}</span>
                                <p className="text-[8px] font-bold text-slate-400 mt-0.5">{new Date(booking.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                             </div>
                          </div>
                          
                          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                             <span className={`px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                {booking.status}
                             </span>
                             <a 
                               href={`https://wa.me/91${booking.whatsapp}`} 
                               target="_blank" 
                               rel="noreferrer" 
                               className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-wider"
                             >
                                WhatsApp <FaExternalLinkAlt size={8} />
                             </a>
                          </div>
                       </div>
                    ))
                 )}
              </div>
              
              <Link to="/admin/bookings" className="w-full text-center mt-6 py-4 bg-[#0A1128] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl active:scale-95 block">
                 View Global History
              </Link>
           </div>
        </div>

      </div>
    </div>
  );
}

function KPICard({ title, value, icon, gradient, iconBg, trend, link, isAlert }) {
  return (
    <Link 
      to={link} 
      className={`p-5 rounded-[28px] bg-gradient-to-br ${gradient} text-white shadow-xl shadow-slate-200 hover:scale-[1.03] transition-all duration-300 relative overflow-hidden group border border-white/10 flex flex-col justify-between min-h-[125px]`}
    >
      <div className="flex items-center justify-between w-full relative z-10">
        <div className={`w-10 h-10 rounded-2xl ${iconBg} backdrop-blur-md flex items-center justify-center text-base shadow-sm shrink-0 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {trend && (
          <span className="text-[9px] font-black bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full text-white/90 uppercase tracking-widest border border-white/10">
            {trend}
          </span>
        )}
      </div>

      <div className="relative z-10 mt-3">
         <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-none mb-1">{title}</h4>
         <p className="text-xl md:text-2xl font-black tracking-tight leading-none text-white">{value}</p>
      </div>
    </Link>
  );
}

function ModuleCard({ title, path, icon, color, bg }) {
  return (
    <Link to={path} className={`flex flex-col items-center justify-center p-4 rounded-2xl border ${bg} hover:scale-[1.04] transition-all duration-300 group shadow-sm min-h-[100px] gap-2 text-center`}>
       <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center text-lg transition-transform duration-300 group-hover:scale-110 shadow-sm border border-current/10`}>
          {icon}
       </div>
       <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider leading-tight">{title}</span>
    </Link>
  );
}