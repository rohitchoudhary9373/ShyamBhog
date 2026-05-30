import { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  FaBed, FaMapMarkerAlt, FaStar, FaCheckCircle, 
  FaTimesCircle, FaBan, FaSearch, FaFilter
} from 'react-icons/fa';
import { getMediaUrl } from '../../utils/url';

export default function ManageHotelsDetailed() {
  const [hotels, setHotels] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  
  const fetchHotels = async () => {
    try {
      const res = await API.get('/hotels');
      setHotels(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleModerate = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this hotel?`)) return;
    try {
      await API.put(`/hotels/${id}/moderate`, { status });
      fetchHotels();
    } catch (err) {
      alert(err.response?.data?.message || 'Moderation failed');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><FaCheckCircle/> Active</span>;
      case 'pending': return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><FaStar/> Pending</span>;
      case 'suspended': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><FaBan/> Suspended</span>;
      case 'rejected': return <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><FaTimesCircle/> Rejected</span>;
      default: return null;
    }
  };

  const filteredHotels = hotels
    .filter(h => statusFilter === "all" || h.status === statusFilter)
    .filter(h => h.name.toLowerCase().includes(filterText.toLowerCase()));

  const pendingCount = hotels.filter(h => h.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 space-y-8 animate-in fade-in duration-700 font-sans">
      
      {/* HEADER */}
      <header className="bg-slate-900 rounded-[32px] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[60px] rounded-full pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl shadow-inner">
              <FaBed />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter">Luxury Stays</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enterprise Moderation Hub</p>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-300 max-w-xl leading-relaxed mt-4">
            Monitor, approve, and moderate hotel listings submitted by partners. Maintain quality and compliance across the platform.
          </p>
        </div>

        <div className="flex gap-4 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[120px]">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Active</p>
            <p className="text-3xl font-black text-white">{hotels.filter(h => h.status === 'active').length}</p>
          </div>
          <div className="bg-orange-500 rounded-2xl p-4 border border-orange-400 text-center min-w-[120px] shadow-lg shadow-orange-500/20">
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-200 mb-1">Pending Approval</p>
            <p className="text-3xl font-black text-white">{pendingCount}</p>
          </div>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto px-2">
          <FaSearch className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search listings..." 
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-sm font-bold w-full sm:w-64 placeholder-slate-400"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
          <FaFilter className="text-slate-400 ml-2" />
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-orange-500 w-full sm:w-auto"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending ({pendingCount})</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* LISTINGS GRID */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Directory...</div>
      ) : filteredHotels.length === 0 ? (
        <div className="bg-white p-20 rounded-[32px] border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-slate-300">
            <FaBed />
          </div>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">No listings found</h3>
          <p className="text-slate-500 text-sm font-medium mt-2">Adjust your filters to see more results.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredHotels.map(hotel => (
            <div key={hotel._id} className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm flex flex-col sm:flex-row group hover:shadow-xl transition-all duration-300">
              
              <div className="sm:w-2/5 h-48 sm:h-auto relative bg-slate-100 overflow-hidden">
                {hotel.imageUrl ? (
                  <img src={getMediaUrl(hotel.imageUrl)} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                    <FaBed size={24} className="mb-2 opacity-50" />
                    <span className="text-[10px] font-black uppercase tracking-widest">No Image</span>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  {getStatusBadge(hotel.status)}
                </div>
              </div>

              <div className="p-6 sm:w-3/5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-black text-slate-900 leading-tight line-clamp-1">{hotel.name}</h3>
                    <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">
                      <FaStar size={10} /> <span className="text-[10px] font-black">{hotel.stars}</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1 line-clamp-1">
                    <FaMapMarkerAlt className="text-slate-400" /> {hotel.address}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Starting Price</p>
                      <p className="text-sm font-black text-slate-900">₹{hotel.priceRange}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Distance</p>
                      <p className="text-sm font-black text-slate-900">{hotel.distanceFromTemple}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                  {hotel.status === 'pending' && (
                    <>
                      <button onClick={() => handleModerate(hotel._id, 'active')} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">Approve</button>
                      <button onClick={() => handleModerate(hotel._id, 'rejected')} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">Reject</button>
                    </>
                  )}
                  {hotel.status === 'active' && (
                    <button onClick={() => handleModerate(hotel._id, 'suspended')} className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">Suspend Listing</button>
                  )}
                  {(hotel.status === 'suspended' || hotel.status === 'rejected') && (
                    <button onClick={() => handleModerate(hotel._id, 'active')} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">Reactivate</button>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
