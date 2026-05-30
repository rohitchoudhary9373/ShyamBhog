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
  FaBed, 
  FaCog, 
  FaImage, 
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
  FaExternalLinkAlt
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
        total: d.totalBookings,
        revenue: d.totalRevenue,
        pending: d.pendingRefunds,
        walletFloat: d.totalWalletFloat || 0,
        adminBalance: d.adminBalance || 0
      });
      setRecent(d.recentBookings);
      if (d.dailyRevenue) {
        setChartData(d.dailyRevenue);
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
    <div className="bg-slate-50/50 min-h-[100dvh] animate-in fade-in duration-1000 pb-20 p-6 md:p-10">

      {/* 🚀 ELITE COMMAND HEADER */}
      <div className="flex flex-col xl:flex-row justify-between mb-10 items-start xl:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-white text-slate-900 border border-slate-200 flex items-center justify-center shadow-sm">
                <FaUserShield size={18} />
             </div>
             <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
               Platform Overview
             </h1>
          </div>
          <p className="text-slate-500 font-medium text-xs tracking-widest uppercase ml-14">System Metrics & Controls</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
           {/* Real-time Status Badge */}
           <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm">
              <div className="relative flex items-center justify-center">
                 <div className={`w-2.5 h-2.5 rounded-full ${crowd === 'High' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                 <div className={`absolute w-full h-full rounded-full animate-ping opacity-50 ${crowd === 'High' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Temple Traffic</span>
                 <span className={`text-xs font-bold ${crowd === 'High' ? 'text-red-600' : 'text-emerald-600'}`}>{crowd || 'Stable'}</span>
              </div>
           </div>

           <button 
             onClick={handleExportWalletFloat} 
             disabled={exporting} 
             className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs shadow-sm hover:border-slate-300 transition-all active:scale-95 disabled:opacity-50"
           >
              <FaDownload className={`${exporting ? 'animate-bounce text-slate-500' : 'text-slate-400'}`} />
              {exporting ? 'Generating...' : 'Export'}
           </button>

           <button onClick={fetchData} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-slate-800 transition-all active:scale-95">
              <FaSyncAlt className="animate-spin-slow text-slate-400" />
              Sync Data
           </button>
        </div>
      </div>

      {/* 📊 KPI INTELLIGENCE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
        <KPICard title="Net Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={<FaWallet />} color="from-[#0A1128] to-[#1E293B]" trend="+12.5%" link="/admin/wallet" />
        <KPICard title="Active Orders" value={stats.total} icon={<FaCheckCircle />} color="from-orange-500 to-orange-700" trend="+4.2%" link="/admin/bookings" />
        <KPICard title="Escalations" value={stats.pending} icon={<FaClock />} color="from-red-500 to-red-700" isAlert={stats.pending > 0} link="/admin/refunds" />
        <KPICard title="Liabilities" value={`₹${stats.walletFloat.toLocaleString()}`} icon={<FaShieldAlt />} color="from-slate-500 to-slate-700" link="/admin/wallet" />
        <KPICard title="Treasury" value={`₹${stats.adminBalance.toLocaleString()}`} icon={<FaWallet />} color="from-emerald-600 to-emerald-800" link="/admin/wallet" trend="Stable" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 🕹️ MODULE ARCHITECTURE */}
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm group">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Modules</h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">Platform-wide Access</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <ModuleCard title="Ritual Requests" path="/admin/manage-arjee" icon={<FaVideo />} color="text-red-500" bg="bg-red-50" />
                 <ModuleCard title="Crowd Status" path="/admin/manage-crowd" icon={<FaUsers />} color="text-blue-500" bg="bg-blue-50" />
                 <ModuleCard title="Parking" path="/admin/manage-parking" icon={<FaParking />} color="text-emerald-500" bg="bg-emerald-50" />
                 <ModuleCard title="Hotel & Stay" path="/admin/manage-hotels" icon={<FaBed />} color="text-purple-500" bg="bg-purple-50" />
                 <ModuleCard title="Catalog" path="/admin/services" icon={<FaBoxOpen />} color="text-orange-500" bg="bg-orange-50" />
                 <ModuleCard title="CMS Visuals" path="/admin/content" icon={<FaImage />} color="text-indigo-500" bg="bg-indigo-50" />
                 <ModuleCard title="Team" path="/admin/agents" icon={<FaUsers />} color="text-slate-600" bg="bg-slate-100" />
                 <ModuleCard title="Security Log" path="/admin/security" icon={<FaHistory />} color="text-slate-500" bg="bg-slate-50" />
              </div>
           </div>

           {/* 📈 GROWTH ANALYTICS */}
           <div className="bg-slate-950 p-8 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/50 rounded-full blur-[80px] -mr-32 -mt-32"></div>
              <div className="flex justify-between items-center mb-8 relative z-10">
                 <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Growth Analytics</h2>
                    <p className="text-xs font-medium text-slate-400 mt-1">Rolling 7-Day Performance</p>
                 </div>
                 <Link to="/admin/wallet" className="text-xs font-bold text-white px-4 py-2 bg-white/10 rounded-lg flex items-center gap-2 hover:bg-white/20 transition-all">
                    Financials <FaArrowRight />
                 </Link>
              </div>

              <div className="h-[280px] w-full relative z-10">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                       <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 500, fill: '#64748b'}} />
                       <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 500, fill: '#64748b'}} />
                       <Tooltip 
                         contentStyle={{ backgroundColor: '#020617', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                         itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#f97316' }}
                       />
                       <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* 🕒 REAL-TIME ACTIVITY (SIDEBAR) */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden h-full flex flex-col">
              <div className="flex justify-between items-center mb-6 relative z-10">
                 <h3 className="text-lg font-bold text-slate-900 tracking-tight">Live Feed</h3>
                 <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-md">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="text-[9px] font-bold uppercase tracking-widest">Live</span>
                 </div>
              </div>
              
              <div className="flex-grow space-y-3 relative z-10 overflow-y-auto pr-2 custom-scrollbar">
                 {recent.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center opacity-40">
                       <FaHistory size={24} className="mb-4 text-slate-300" />
                       <p className="text-xs font-semibold text-slate-400">No activity yet</p>
                    </div>
                 ) : (
                    recent.map(booking => (
                       <div key={booking._id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white transition-all shadow-sm group relative overflow-hidden flex justify-between items-start">
                          <div className="flex justify-between items-start mb-3 relative z-10">
                             <div>
                                <h4 className="font-black text-[13px] text-[#0A1128] group-hover/item:text-orange-600 transition-colors">{booking.name}</h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{booking.serviceType}</p>
                             </div>
                             <div className="text-right">
                                <span className="text-sm font-black text-[#0A1128]">₹{booking.price}</span>
                                <p className="text-[8px] font-bold text-slate-400 mt-1">{new Date(booking.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                             </div>
                          </div>
                          <div className="flex justify-between items-center relative z-10">
                             <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                {booking.status}
                             </span>
                             <a 
                               href={`https://wa.me/91${booking.whatsapp}`} 
                               target="_blank" 
                               rel="noreferrer" 
                               className="flex items-center gap-2 text-[9px] font-black text-slate-400 hover:text-emerald-500 transition-colors"
                             >
                                WhatsApp <FaExternalLinkAlt size={8} />
                             </a>
                          </div>
                       </div>
                    ))
                 )}
              </div>
              
              <Link to="/admin/bookings" className="w-full text-center mt-8 py-4 bg-[#0A1128] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-slate-200">
                 View Global History
              </Link>
            </div>
         </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon, color, trend, link, isAlert }) {
  return (
    <Link to={link} className={`p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow flex flex-col`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${color} mb-4 shadow-sm`}>
        {icon}
      </div>
      <div>
         <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">{title}</h4>
         <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      </div>
    </Link>
  );
}

function ModuleCard({ title, path, icon, color, bg }) {
  return (
    <Link to={path} className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl hover:shadow-md hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
       <div className={`w-12 h-12 rounded-xl ${bg} ${color} flex items-center justify-center text-xl mb-4 transition-all duration-500 group-hover:scale-110 shadow-sm`}>
          {icon}
       </div>
       <span className="text-xs font-semibold text-slate-700 uppercase tracking-widest text-center">{title}</span>
    </Link>
  );
}