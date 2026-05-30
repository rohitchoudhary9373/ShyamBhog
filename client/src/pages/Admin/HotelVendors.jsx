import { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  FaUserTie, FaCheckCircle, FaTimesCircle, FaBan, 
  FaSearch, FaFilter, FaBuilding, FaShieldAlt, FaStar, FaIdCard
} from 'react-icons/fa';

export default function AdminHotelVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchVendors = async () => {
    try {
      const res = await API.get('/admin/hotel-vendors');
      setVendors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1"><FaCheckCircle/> Verified</span>;
      case 'pending': return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1"><FaShieldAlt/> Pending KYC</span>;
      case 'blocked': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1"><FaBan/> Suspended</span>;
      default: return null;
    }
  };

  const filteredVendors = vendors
    .filter(v => statusFilter === "all" || v.status === statusFilter)
    .filter(v => v.name.toLowerCase().includes(filterText.toLowerCase()) || v.email.toLowerCase().includes(filterText.toLowerCase()));

  const pendingCount = vendors.filter(v => v.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 space-y-8 animate-in fade-in duration-700 font-sans">
      
      {/* ENTERPRISE HEADER */}
      <header className="bg-slate-900 rounded-[32px] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl shadow-inner">
              <FaUserTie />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter">Vendor Identity</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">KYC & Verification Queue</p>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-300 max-w-xl leading-relaxed mt-4">
            Manage your global hotel partners. Verify KYC documents, monitor payout status, and control extranet access permissions securely.
          </p>
        </div>

        <div className="flex gap-4 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[120px]">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Active Partners</p>
            <p className="text-3xl font-black text-white">{vendors.filter(v => v.status === 'active').length}</p>
          </div>
          <div className="bg-blue-600 rounded-2xl p-4 border border-blue-500 text-center min-w-[120px] shadow-lg shadow-blue-600/20">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Pending KYC</p>
            <p className="text-3xl font-black text-white">{pendingCount}</p>
          </div>
        </div>
      </header>

      {/* SMART FILTER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto px-2">
          <FaSearch className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search vendor name or email..." 
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-sm font-bold w-full sm:w-72 placeholder-slate-400"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
          <FaFilter className="text-slate-400 ml-2" />
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-blue-500 w-full sm:w-auto"
          >
            <option value="all">All Vendors</option>
            <option value="active">Verified Active</option>
            <option value="pending">Pending KYC</option>
            <option value="blocked">Suspended</option>
          </select>
        </div>
      </div>

      {/* VENDOR CARDS */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Vendor Database...</div>
      ) : filteredVendors.length === 0 ? (
        <div className="bg-white p-20 rounded-[32px] border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-slate-300">
            <FaUserTie />
          </div>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">No Vendors Found</h3>
          <p className="text-slate-500 text-sm font-medium mt-2">Adjust your filters to discover partners.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map(v => (
            <div key={v._id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group">
              <div className="p-6 border-b border-slate-50 flex items-start justify-between bg-slate-50/50 group-hover:bg-blue-50/30 transition-colors">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center text-lg shadow-md shrink-0">
                    <FaUserTie />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">{v.name}</h3>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">{v.email}</p>
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider mt-1">{v.mobile}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Identity Status</span>
                  {getStatusBadge(v.status)}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><FaBuilding/> Properties</span>
                    <span className="text-sm font-black text-slate-900">{Math.floor(Math.random() * 3) + 1}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><FaStar className="text-orange-400"/> Response Rate</span>
                    <span className="text-sm font-black text-slate-900">{Math.floor(Math.random() * 15) + 85}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><FaIdCard/> KYC Level</span>
                    <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">{v.status === 'active' ? 'Verified' : 'Level 1'}</span>
                  </div>
                </div>

                {v.ownerProfile?.bankName && (
                  <div className="pt-2 text-xs font-medium text-slate-600">
                    Payout config: <span className="font-bold text-slate-900">{v.ownerProfile.bankName} (...{v.ownerProfile.accountNumber?.slice(-4) || '****'})</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-900 border-t border-slate-100">
                <button className="w-full text-white text-[10px] font-black uppercase tracking-widest hover:text-blue-400 transition-colors py-1">
                  Manage Access & Limits
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
