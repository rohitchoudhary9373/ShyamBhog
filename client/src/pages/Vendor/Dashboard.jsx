import { useState, useEffect } from 'react';
import API from '../../services/api';
import { FaMoneyBillWave, FaBed, FaCalendarAlt, FaStar } from 'react-icons/fa';

export default function VendorDashboard() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalBookings: 0, pendingBookings: 0, hotelsCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/hotel-vendor/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-10 font-bold text-slate-400">Loading Dashboard...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Business Overview</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Real-time performance metrics across your properties.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={<FaMoneyBillWave />} color="text-green-600" bg="bg-green-50" />
        <StatCard title="Total Bookings" value={stats.totalBookings} icon={<FaCalendarAlt />} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Pending Action" value={stats.pendingBookings} icon={<FaStar />} color="text-orange-600" bg="bg-orange-50" />
        <StatCard title="Active Properties" value={stats.hotelsCount} icon={<FaBed />} color="text-purple-600" bg="bg-purple-50" />
      </div>
      
      {/* Chart placeholder */}
      <div className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm mt-8 h-96 flex items-center justify-center">
         <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Revenue Analytics Chart (Coming Soon)</p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, bg }) {
  return (
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
      <div className={`w-12 h-12 ${bg} ${color} rounded-[16px] flex items-center justify-center text-xl mb-4`}>
        {icon}
      </div>
      <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
    </div>
  );
}
