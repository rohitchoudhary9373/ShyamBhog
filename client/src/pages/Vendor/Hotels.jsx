import { useState, useEffect } from 'react';
import API from '../../services/api';
import { FaPlus, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';

export default function VendorHotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const res = await API.get('/hotel-vendor/hotels');
      setHotels(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">My Properties</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage your hotel listings and details.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95">
          <FaPlus /> Add New Property
        </button>
      </header>

      {loading ? (
        <div className="text-slate-400 font-bold">Loading properties...</div>
      ) : hotels.length === 0 ? (
        <div className="bg-white p-12 rounded-[24px] border border-slate-100 shadow-sm text-center">
          <p className="text-slate-500 font-bold">You haven't listed any properties yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map(h => (
            <div key={h._id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all group cursor-pointer flex flex-col">
              <div className="h-48 bg-slate-100 relative overflow-hidden">
                {h.imageUrl ? (
                  <img src={h.imageUrl.startsWith('http') ? h.imageUrl : `https://shyambhog.onrender.com${h.imageUrl}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={h.name} />
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest">No Image</div>
                )}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg">
                  {h.status === 'approved' && <FaCheckCircle className="text-green-500" />}
                  {h.status === 'pending' && <FaClock className="text-orange-500" />}
                  {h.status === 'suspended' && <FaTimesCircle className="text-red-500" />}
                  <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">{h.status}</span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{h.name}</h3>
                <p className="text-xs font-medium text-slate-500 mt-2 line-clamp-2">{h.address}</p>
                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commission: {h.commissionRate || 15}%</span>
                  <button className="text-blue-600 text-xs font-black uppercase tracking-widest hover:text-blue-800">Edit Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
