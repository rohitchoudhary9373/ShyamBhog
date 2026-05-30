import { useState, useEffect } from 'react';
import API from '../../services/api';
import { FaCheckCircle, FaTimesCircle, FaUserTie } from 'react-icons/fa';

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

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-12">
      <header className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Vendor Management</h1>
          <p className="text-slate-400 font-medium mt-2">Approve, reject, and manage hotel partners.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input 
            type="text" 
            placeholder="Search vendors..." 
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 w-full sm:w-64 text-white placeholder-slate-400"
          />
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-white w-full sm:w-auto"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <tr>
                <th className="p-6">Vendor Name</th>
                <th className="p-6">Contact</th>
                <th className="p-6">Bank Info</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="p-6 text-center text-slate-400 font-bold">Loading...</td></tr>
              ) : vendors
                  .filter(v => statusFilter === "all" || v.status === statusFilter)
                  .filter(v => v.name.toLowerCase().includes(filterText.toLowerCase()) || v.email.toLowerCase().includes(filterText.toLowerCase()))
                  .map(v => (
                <tr key={v._id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-6 font-black text-slate-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                       <FaUserTie />
                    </div>
                    {v.name}
                  </td>
                  <td className="p-6">
                    <span className="text-sm font-bold text-slate-800">{v.email}</span><br/>
                    <span className="text-xs text-slate-500">{v.mobile}</span>
                  </td>
                  <td className="p-6 text-xs text-slate-600 font-medium">
                    {v.ownerProfile?.bankName ? (
                      <>
                        Bank: {v.ownerProfile.bankName}<br/>
                        A/C: {v.ownerProfile.accountNumber}
                      </>
                    ) : 'Not Provided'}
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${v.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <button className="text-blue-600 text-xs font-black uppercase tracking-widest hover:text-blue-800 transition-colors">Manage Access</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
