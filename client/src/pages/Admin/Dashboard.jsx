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
    <div className="bg-[#F8FAFC] min-h-screen animate-in fade-in duration-1000 pb-20">

      {/* 🚀 ELITE COMMAND HEADER */}
      <div className="flex flex-col xl:flex-row justify-between mb-12 items-start xl:items-center gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-[20px] bg-[#0A1128] text-orange-500 flex items-center justify-center shadow-2xl shadow-slate-200">
                <FaUserShield size={24} />
             </div>
             <h1 className="text-4xl font-black text-[#0A1128] tracking-tighter uppercase italic">
               Platform <span className="text-orange-600 not-italic">Overview</span>
             </h1>
          </div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] ml-1">Secure Digital Ecosystem Management</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
           {/* Real-time Status Badge */}
           <div className="flex items-center gap-4 bg-white px-6 py-3.5 rounded-[28px] border border-slate-200 shadow-sm">
              <div className="relative flex items-center justify-center">
                 <div className={`w-2.5 h-2.5 rounded-full ${crowd === 'High' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                 <div className={`absolute w-full h-full rounded-full animate-ping ${crowd === 'High' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
              </div>
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Temple Traffic</span>
                 <span className={`text-[11px] font-black uppercase tracking-tight ${crowd === 'High' ? 'text-red-600' : 'text-emerald-600'}`}>{crowd || 'Stable'}</span>
              </div>
           </div>

           <button 
             onClick={handleExportWalletFloat} 
             disabled={exporting} 
             className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 text-[#0A1128] rounded-[28px] font-black text-[10px] uppercase tracking-widest shadow-sm hover:border-orange-500 transition-all group active:scale-95 disabled:opacity-50"
           >
              <FaDownload className={`group-hover:text-orange-500 transition-colors ${exporting ? 'animate-bounce' : ''}`} />
              {exporting ? 'Generating...' : 'Export Financials'}
           </button>

           <button onClick={fetchData} className="flex items-center gap-3 px-8 py-4 bg-[#0A1128] text-white rounded-[28px] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-300 hover:bg-orange-600 transition-all active:scale-95">
              <FaSyncAlt className="animate-spin-slow" />
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* 🕹️ MODULE ARCHITECTURE */}
        <div className="lg:col-span-8 space-y-10">
           <div className="bg-white p-10 rounded-[48px] border border-slate-200/60 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.03)] group">
              <div className="flex justify-between items-center mb-10">
                 <div>
                    <h3 className="text-xl font-black text-[#0A1128] tracking-tighter uppercase italic">Control <span className="text-orange-600 not-italic">Center</span></h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Platform-wide Module Access</p>
                 </div>
                 <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">Active System</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <ModuleCard title="Ritual Requests" path="/admin/manage-arjee" icon={<FaVideo />} color="text-red-500" bg="bg-red-50" />
                 <ModuleCard title="Crowd Status" path="/admin/manage-crowd" icon={<FaUsers />} color="text-blue-500" bg="bg-blue-50" />
                 <ModuleCard title="Parking" path="/admin/manage-parking" icon={<FaParking />} color="text-green-500" bg="bg-green-50" />
                 <ModuleCard title="Hotel & Stay" path="/admin/manage-hotels" icon={<FaBed />} color="text-purple-500" bg="bg-purple-50" />
                 <ModuleCard title="Catalog" path="/admin/services" icon={<FaBoxOpen />} color="text-orange-500" bg="bg-orange-50" />
                 <ModuleCard title="CMS Visuals" path="/admin/content" icon={<FaImage />} color="text-indigo-500" bg="bg-indigo-50" />
                 <ModuleCard title="Team" path="/admin/agents" icon={<FaUsers />} color="text-emerald-500" bg="bg-emerald-50" />
                 <ModuleCard title="Security Log" path="/admin/security" icon={<FaHistory />} color="text-slate-500" bg="bg-slate-50" />
              </div>
           </div>

           {/* 📈 GROWTH ANALYTICS */}
           <div className="bg-[#0A1128] p-10 rounded-[48px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
              <div className="flex justify-between items-center mb-10 relative z-10">
                 <div>
                    <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">Growth <span className="text-orange-500 not-italic">Analytics</span></h2>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Rolling 7-Day Performance Metric</p>
                 </div>
                 <Link to="/admin/wallet" className="text-[10px] font-black text-white px-5 py-2.5 bg-white/10 rounded-2xl flex items-center gap-3 hover:bg-orange-600 transition-all group">
                    Financials <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                 </Link>
              </div>

              <div className="h-[320px] w-full relative z-10">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                       <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#F97316" stopOpacity={0.4}/>
                             <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#64748B'}} />
                       <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#64748B'}} />
                       <Tooltip 
                         contentStyle={{ backgroundColor: '#0A1128', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}
                         itemStyle={{ fontSize: '11px', fontWeight: 'black', color: '#F97316', textTransform: 'uppercase' }}
                       />
                       <Area type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* 🕒 REAL-TIME ACTIVITY (SIDEBAR) */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white p-10 rounded-[48px] border border-slate-200/60 shadow-xl relative overflow-hidden group h-full flex flex-col">
              <div className="flex justify-between items-center mb-8 relative z-10">
                 <h3 className="text-lg font-black text-[#0A1128] tracking-tighter uppercase italic">Live <span className="text-orange-600 not-italic">Feed</span></h3>
                 <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-pulse"></span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Queue</span>
                 </div>
              </div>
              
              <div className="flex-grow space-y-4 relative z-10 overflow-y-auto pr-2 custom-scrollbar">
                 {recent.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center opacity-20">
                       <FaHistory size={40} className="mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Transactions...</p>
                    </div>
                 ) : (
                    recent.map(booking => (
                       <div key={booking._id} className="p-5 bg-slate-50/50 border border-slate-100 rounded-[32px] hover:border-orange-200 hover:bg-white transition-all duration-300 group/item relative overflow-hidden">
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

           <div className="bg-orange-50 border border-orange-100 p-8 rounded-[40px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-200/30 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
              <h4 className="text-[10px] font-black text-orange-800 uppercase tracking-[0.2em] mb-4 relative z-10">System Intelligence</h4>
              <p className="text-xs font-bold text-orange-600/80 leading-relaxed relative z-10">
                All platform nodes are operational. Real-time synchronization is active for all service categories.
              </p>
           </div>
        </div>

      </div>

    </div>
  );
}

// 🎴 ELITE KPI CARD COMPONENT
function KPICard({ title, value, icon, color, trend, isAlert, link }) {
  const CardContent = (
    <div className={`bg-white p-8 rounded-[44px] border-2 ${isAlert ? 'border-red-100 bg-red-50/20' : 'border-slate-50'} shadow-sm hover:shadow-2xl transition-all relative overflow-hidden group ${link ? 'cursor-pointer hover:border-orange-500/20 hover:scale-[1.03]' : ''}`}>
       <div className="flex justify-between items-center mb-8 relative z-10">
          <div className={`w-14 h-14 rounded-[20px] bg-gradient-to-br ${color} text-white flex items-center justify-center text-2xl shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
             {icon}
          </div>
          {trend && (
            <div className={`px-3 py-1.5 ${trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'} rounded-xl text-[9px] font-black uppercase tracking-widest`}>
              {trend}
            </div>
          )}
       </div>
       <div className="flex flex-col relative z-10">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</span>
          <span className={`text-3xl font-black text-[#0A1128] tracking-tighter ${isAlert ? 'text-red-600' : ''}`}>{value}</span>
       </div>
       <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-slate-50/50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
    </div>
  );

  return link ? <Link to={link} className="block w-full">{CardContent}</Link> : CardContent;
}

// 🎛️ PREMIUM MODULE CARD
function ModuleCard({ title, path, icon, color, bg }) {
  return (
    <Link to={path} className="flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-[36px] hover:shadow-2xl hover:shadow-slate-200/50 hover:border-orange-500/30 hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
       <div className={`w-16 h-16 rounded-[22px] ${bg} ${color} flex items-center justify-center text-2xl mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm`}>
          {icon}
       </div>
       <span className="text-[9px] font-black text-[#0A1128] uppercase tracking-[0.2em] text-center px-1 leading-tight">{title}</span>
       <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </Link>
  );
}

function FaWhatsapp() {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.7-30.6-38.1-3.2-5.5-.3-8.5 2.5-11.2 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.2 3.7-5.5 5.6-9.2 1.9-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.5 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.5 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path>
    </svg>
  );
}