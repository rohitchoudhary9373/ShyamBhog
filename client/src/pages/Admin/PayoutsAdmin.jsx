import { useState, useEffect } from 'react';
import { 
  FaUniversity, FaMoneyCheckAlt, FaSearch, FaFilter, 
  FaCheckCircle, FaClock, FaTimesCircle, FaDownload, FaArrowRight
} from 'react-icons/fa';

export default function PayoutsAdmin() {
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [payouts] = useState([
    { _id: 'PO-9842', vendorName: 'Radisson Blu', amount: 145000, status: 'pending', date: '2026-06-05', bank: 'HDFC Bank (...4455)' },
    { _id: 'PO-9843', vendorName: 'Shyam Palace', amount: 82000, status: 'processing', date: '2026-06-04', bank: 'ICICI Bank (...9912)' },
    { _id: 'PO-9841', vendorName: 'Khatu Dham Resort', amount: 56000, status: 'completed', date: '2026-06-01', bank: 'SBI (...3341)' },
    { _id: 'PO-9839', vendorName: 'Royal Heritage', amount: 12000, status: 'failed', date: '2026-05-28', bank: 'Axis Bank (...1122)' }
  ]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-max"><FaCheckCircle/> Completed</span>;
      case 'processing': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-max"><FaArrowRight className="animate-pulse"/> Processing</span>;
      case 'pending': return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-max"><FaClock/> Pending</span>;
      case 'failed': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-max"><FaTimesCircle/> Failed</span>;
      default: return null;
    }
  };

  const filteredPayouts = payouts
    .filter(p => statusFilter === "all" || p.status === statusFilter)
    .filter(p => p.vendorName.toLowerCase().includes(filterText.toLowerCase()) || p._id.toLowerCase().includes(filterText.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 space-y-8 animate-in fade-in duration-700 font-sans">
      
      {/* HEADER */}
      <header className="bg-slate-900 rounded-[32px] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[60px] rounded-full pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl shadow-inner">
              <FaUniversity />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter">Settlements</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vendor Payouts Dashboard</p>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-300 max-w-xl leading-relaxed mt-4">
            Manage and track financial settlements for all hotel partners. Review pending transactions, handle failed transfers, and export statements.
          </p>
        </div>

        <div className="flex gap-4 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[140px]">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Next Cycle</p>
            <p className="text-2xl font-black text-white">05 Jun 2026</p>
          </div>
          <div className="bg-green-600 rounded-2xl p-4 border border-green-500 text-center min-w-[140px] shadow-lg shadow-green-600/20">
            <p className="text-[10px] font-black uppercase tracking-widest text-green-200 mb-1">Ready to Disburse</p>
            <p className="text-2xl font-black text-white">₹2,27,000</p>
          </div>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto px-2">
          <FaSearch className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search payout ID or vendor..." 
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
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-green-500 w-full sm:w-auto"
          >
            <option value="all">All Payouts</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-colors ml-2 hidden sm:flex">
            <FaDownload /> Export
          </button>
        </div>
      </div>

      {/* PAYOUTS TABLE */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="p-6">Transaction ID</th>
                <th className="p-6">Vendor Details</th>
                <th className="p-6">Net Amount</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Fetching Settlements...</td></tr>
              ) : filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-slate-300"><FaMoneyCheckAlt/></div>
                    <p className="text-slate-900 font-black uppercase tracking-widest">No Payouts Found</p>
                  </td>
                </tr>
              ) : filteredPayouts.map(p => (
                <tr key={p._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6">
                    <span className="text-sm font-black text-slate-900">{p._id}</span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(p.date).toLocaleDateString()}</p>
                  </td>
                  <td className="p-6">
                    <span className="text-sm font-bold text-slate-800">{p.vendorName}</span>
                    <p className="text-[10px] font-bold text-slate-500 tracking-widest mt-1 flex items-center gap-1.5"><FaUniversity className="text-slate-300"/> {p.bank}</p>
                  </td>
                  <td className="p-6">
                    <span className="text-lg font-black text-slate-900">₹{(p.amount).toLocaleString()}</span>
                  </td>
                  <td className="p-6">
                    {getStatusBadge(p.status)}
                  </td>
                  <td className="p-6 text-right">
                    {p.status === 'pending' && (
                      <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-colors w-max ml-auto">
                        Approve Transfer
                      </button>
                    )}
                    {p.status === 'failed' && (
                      <button className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-colors w-max ml-auto">
                        Retry Transfer
                      </button>
                    )}
                    {p.status === 'completed' && (
                      <button className="text-blue-600 hover:text-blue-800 text-[10px] font-black uppercase tracking-widest transition-colors w-max ml-auto">
                        View Receipt
                      </button>
                    )}
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
