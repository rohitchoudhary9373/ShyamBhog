import { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  FaChartLine, FaRupeeSign, FaPercentage, FaArrowUp, FaDownload, FaCalendarAlt
} from 'react-icons/fa';

export default function HotelRevenueAdmin() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 1245000,
    platformEarnings: 186750,
    activeVendors: 12,
    totalBookings: 845
  });

  const revenueData = [
    { name: 'Jan', revenue: 400000, commission: 60000 },
    { name: 'Feb', revenue: 300000, commission: 45000 },
    { name: 'Mar', revenue: 550000, commission: 82500 },
    { name: 'Apr', revenue: 278000, commission: 41700 },
    { name: 'May', revenue: 189000, commission: 28350 },
    { name: 'Jun', revenue: 239000, commission: 35850 },
  ];

  const occupancyData = [
    { name: 'Mon', rate: 45 },
    { name: 'Tue', rate: 50 },
    { name: 'Wed', rate: 48 },
    { name: 'Thu', rate: 60 },
    { name: 'Fri', rate: 92 },
    { name: 'Sat', rate: 98 },
    { name: 'Sun', rate: 85 },
  ];

  useEffect(() => {
    // Simulating API call for dynamic visualization
    setTimeout(() => setLoading(false), 800);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 space-y-8 animate-in fade-in duration-700 font-sans">
      
      {/* ENTERPRISE HEADER */}
      <header className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Financial Intelligence</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Platform Revenue & Analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
            <FaCalendarAlt /> Last 6 Months
          </button>
          <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-xl">
            <FaDownload /> Export CSV
          </button>
        </div>
      </header>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform"><FaRupeeSign /></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Gross Booking Value</p>
          <h2 className="text-2xl font-black text-slate-900">₹{(stats.totalRevenue).toLocaleString()}</h2>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
        </div>

        <div className="bg-slate-900 p-6 rounded-[24px] shadow-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/20 blur-xl rounded-full"></div>
          <div className="w-12 h-12 bg-white/10 text-orange-400 rounded-full flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform"><FaChartLine /></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Platform Earnings (15%)</p>
          <h2 className="text-2xl font-black text-white">₹{(stats.platformEarnings).toLocaleString()}</h2>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500"></div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform"><FaPercentage /></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Avg Occupancy Rate</p>
          <h2 className="text-2xl font-black text-slate-900 flex items-end gap-2">
            68% <span className="text-[10px] text-green-500 flex items-center gap-0.5 mb-1"><FaArrowUp/> 12%</span>
          </h2>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform"><FaChartLine /></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Bookings</p>
          <h2 className="text-2xl font-black text-slate-900">{stats.totalBookings}</h2>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pt-6">
        
        {/* Main Revenue Chart */}
        <div className="xl:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6">Revenue & Commission Trends</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '12px' }}
                  itemStyle={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 900 }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="revenue" name="Gross Revenue" stroke="#0f172a" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="commission" name="Platform Earnings" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorComm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Heatmap Concept */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-2">Weekly Occupancy Heat</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Peak demand visualization</p>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`${value}%`, 'Occupancy']}
                />
                <Bar dataKey="rate" radius={[0, 8, 8, 0]}>
                  {
                    occupancyData.map((entry, index) => (
                      <cell key={`cell-${index}`} fill={entry.rate > 80 ? '#ea580c' : entry.rate > 50 ? '#0f172a' : '#cbd5e1'} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Low</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-900"></div> Medium</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-600"></div> Peak</span>
          </div>
        </div>

      </div>

    </div>
  );
}
