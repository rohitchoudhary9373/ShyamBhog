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
  FaUserShield,
  FaArrowRight,
  FaWallet,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaSyncAlt,
  FaExternalLinkAlt,
  FaChartLine,
  FaHistory,
  FaReceipt,
  FaChevronRight
} from "react-icons/fa";

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, revenue: 0, pending: 0, adminBalance: 0 });
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
        adminBalance: d.adminBalance || 0
      });
      setRecent(d.recentBookings || []);
      if (d.dailyRevenue && d.dailyRevenue.length > 0) {
        setChartData(d.dailyRevenue);
      } else {
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
      
      const headers = ['Devotee Name', 'WhatsApp', 'Email', 'Devotee ID', 'Unspent Wallet Balance'];
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

  if (loading) return <Loader text="Syncing Dashboard..." />;

  return (
    <div className="bg-[#F8FAFC] min-h-[100dvh] pb-24 p-4 sm:p-6 md:p-8 font-sans selection:bg-orange-100">

      {/* ⚪ CLEAN WHITE HEADER */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center">
                <FaUserShield size={16} />
             </div>
             <h1 className="text-2xl md:text-3xl font-black text-[#0A1128] tracking-tight uppercase">
               Dashboard
             </h1>
          </div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-12">Platform Overview & Metrics</p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
           {/* Traffic Status */}
           <div className="flex items-center gap-2.5 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
              <span className={`w-2.5 h-2.5 rounded-full ${crowd === 'High' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
              <div className="flex flex-col">
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Traffic</span>
                 <span className={`text-xs font-bold ${crowd === 'High' ? 'text-red-600' : 'text-emerald-600'}`}>{crowd || 'Normal'}</span>
              </div>
           </div>

           <button 
             onClick={handleExportWalletFloat} 
             disabled={exporting} 
             className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50"
           >
              <FaDownload className={exporting ? 'animate-bounce text-orange-500' : 'text-slate-400'} size={12} />
              {exporting ? 'Exporting...' : 'Export CSV'}
           </button>

           <button onClick={fetchData} className="flex items-center gap-2 px-5 py-2.5 bg-[#0A1128] hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95">
              <FaSyncAlt className="animate-spin-slow text-white/70" size={12} />
              Sync
           </button>
        </div>
      </div>

      {/* 📊 4 ESSENTIAL METRICS (WHITE THEME) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Net Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={<FaWallet />} bg="bg-emerald-50 text-emerald-600 border-emerald-100" link="/admin/wallet" />
        <KPICard title="Active Orders" value={stats.total} icon={<FaCheckCircle />} bg="bg-orange-50 text-orange-600 border-orange-100" link="/admin/bookings" />
        <KPICard title="Escalations" value={stats.pending} icon={<FaClock />} bg="bg-red-50 text-red-600 border-red-100" isAlert={stats.pending > 0} link="/admin/refunds" />
        <KPICard title="Treasury" value={`₹${stats.adminBalance.toLocaleString()}`} icon={<FaWallet />} bg="bg-blue-50 text-blue-600 border-blue-100" link="/admin/wallet" />
      </div>

      {/* 🕒 FULL-WIDTH EXPANDED LIVE FEED SECTION */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
           <div className="space-y-0.5">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center">
                    <FaReceipt size={14} />
                 </div>
                 <h3 className="text-lg font-black text-[#0A1128] uppercase tracking-tight">Live Feed & Recent Bookings</h3>
                 <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 text-[9px] font-black uppercase tracking-widest">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Live Stream
                 </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-11">Real-time Devotee Ritual Requests & Seva Transactions</p>
           </div>
           
           <Link to="/admin/bookings" className="px-5 py-2.5 bg-[#0A1128] hover:bg-orange-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 shrink-0">
              View All Bookings <FaChevronRight size={10} />
           </Link>
        </div>

        {recent.length === 0 ? (
           <div className="py-16 text-center flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-8 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 shadow-sm">
                 <FaHistory size={24} />
              </div>
              <div>
                 <h4 className="text-sm font-black text-[#0A1128] uppercase tracking-tight">No Recent Devotee Orders</h4>
                 <p className="text-xs font-medium text-slate-400 mt-1">Bookings submitted by devotees on the portal will stream here live.</p>
              </div>
              <Link to="/admin/bookings" className="mt-2 text-xs font-bold text-orange-600 hover:underline uppercase tracking-wider">
                 Check Historical Ledger &rarr;
              </Link>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map(booking => (
                 <div key={booking._id} className="p-5 bg-slate-50 hover:bg-white border border-slate-100 hover:border-orange-200 rounded-2xl transition-all duration-200 shadow-xs hover:shadow-md group flex flex-col justify-between space-y-3">
                    <div className="flex justify-between items-start">
                       <div>
                          <h4 className="font-black text-sm text-[#0A1128] group-hover:text-orange-600 transition-colors uppercase tracking-tight">{booking.name}</h4>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{booking.serviceType}</span>
                       </div>
                       <div className="text-right">
                          <span className="text-base font-black text-[#0A1128]">₹{booking.price}</span>
                          <p className="text-[9px] font-bold text-slate-400">{new Date(booking.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                       </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-200/60">
                       <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                          {booking.status}
                       </span>
                       <a 
                         href={`https://wa.me/91${booking.whatsapp}`} 
                         target="_blank" 
                         rel="noreferrer" 
                         className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-emerald-600 transition-colors uppercase tracking-wider bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
                       >
                          WhatsApp <FaExternalLinkAlt size={8} />
                       </a>
                    </div>
                 </div>
              ))}
           </div>
        )}
      </div>

      {/* 🕹️ BOTTOM GRID (Quick Modules + Growth Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
         {/* QUICK MODULES */}
         <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
               <div className="flex justify-between items-center mb-4">
                  <div>
                     <h3 className="text-base font-black text-[#0A1128] uppercase tracking-tight">Quick Access</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Core System Controllers</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                  <ModuleCard title="Ritual Requests" path="/admin/manage-arjee" icon={<FaVideo />} color="text-red-600" bg="bg-red-50 border-red-100" />
                  <ModuleCard title="Crowd Status" path="/admin/manage-crowd" icon={<FaUsers />} color="text-blue-600" bg="bg-blue-50 border-blue-100" />
                  <ModuleCard title="Parking Guide" path="/admin/manage-parking" icon={<FaParking />} color="text-emerald-600" bg="bg-emerald-50 border-emerald-100" />
                  <ModuleCard title="Services" path="/admin/services" icon={<FaBoxOpen />} color="text-orange-600" bg="bg-orange-50 border-orange-100" />
               </div>
            </div>
         </div>

         {/* 📈 GROWTH ANALYTICS (WHITE THEME) */}
         <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex justify-between items-center mb-4">
               <div>
                  <div className="flex items-center gap-2">
                     <FaChartLine className="text-orange-600" size={14} />
                     <h2 className="text-base font-black text-[#0A1128] uppercase tracking-tight">Growth Analytics</h2>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">7-Day Revenue Trends</p>
               </div>
               <Link to="/admin/wallet" className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 uppercase tracking-widest">
                  Financials <FaArrowRight size={10} />
               </Link>
            </div>

            <div className="h-[220px] w-full pt-2">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                     <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#F97316" stopOpacity={0.25}/>
                           <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748B'}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748B'}} />
                     <Tooltip 
                       contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', padding: '10px' }}
                       itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#F97316' }}
                     />
                     <Area type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

      </div>
    </div>
  );
}

function KPICard({ title, value, icon, bg, link, isAlert }) {
  return (
    <Link 
      to={link} 
      className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:border-orange-200 hover:shadow-md transition-all duration-200 group flex flex-col justify-between min-h-[110px]"
    >
      <div className="flex items-center justify-between w-full">
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center text-sm shadow-xs group-hover:scale-105 transition-transform border`}>
          {icon}
        </div>
        {isAlert && (
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
        )}
      </div>

      <div className="mt-3">
         <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{title}</h4>
         <p className="text-xl font-black text-[#0A1128] tracking-tight leading-none">{value}</p>
      </div>
    </Link>
  );
}

function ModuleCard({ title, path, icon, color, bg }) {
  return (
    <Link to={path} className={`flex flex-col items-center justify-center p-4 rounded-2xl border ${bg} hover:border-orange-300 hover:shadow-sm transition-all duration-200 group min-h-[95px] text-center gap-2`}>
       <div className={`w-9 h-9 rounded-xl ${bg} ${color} flex items-center justify-center text-base transition-transform duration-200 group-hover:scale-110 border border-current/10`}>
          {icon}
       </div>
       <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider leading-tight">{title}</span>
    </Link>
  );
}