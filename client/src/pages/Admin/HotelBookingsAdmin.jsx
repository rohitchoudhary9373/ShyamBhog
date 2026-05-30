import { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  FaSearch, FaFilter, FaCalendarAlt, FaCheckCircle, 
  FaClock, FaTimesCircle, FaEllipsisV, FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminHotelBookings() {
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState(null);

  // Mocking some enterprise-looking data while keeping the UI robust for real API hooks later
  const [bookings, setBookings] = useState([
    { _id: 'BK-001', guestName: 'Rohan Sharma', hotelName: 'Radisson Blu Khatu', checkIn: '2026-06-01', checkOut: '2026-06-03', status: 'confirmed', amount: 4500, payment: 'paid', roomType: 'Deluxe Suite', bookedAt: '2026-05-28T10:30:00Z' },
    { _id: 'BK-002', guestName: 'Anita Desai', hotelName: 'Shyam Palace', checkIn: '2026-06-02', checkOut: '2026-06-05', status: 'pending', amount: 8200, payment: 'pending', roomType: 'Premium Double', bookedAt: '2026-05-29T14:15:00Z' },
    { _id: 'BK-003', guestName: 'Vikram Singh', hotelName: 'Khatu Dham Resort', checkIn: '2026-05-30', checkOut: '2026-06-01', status: 'checked_in', amount: 3200, payment: 'paid', roomType: 'Standard AC', bookedAt: '2026-05-25T09:20:00Z' },
    { _id: 'BK-004', guestName: 'Priya Patel', hotelName: 'Radisson Blu Khatu', checkIn: '2026-06-10', checkOut: '2026-06-12', status: 'cancelled', amount: 5000, payment: 'refunded', roomType: 'Deluxe Suite', bookedAt: '2026-05-20T11:45:00Z' }
  ]);

  useEffect(() => {
    // Simulating API call
    setTimeout(() => setLoading(false), 600);
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-max"><FaCheckCircle/> Confirmed</span>;
      case 'checked_in': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-max"><FaCheckCircle/> Checked In</span>;
      case 'pending': return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-max"><FaClock/> Pending</span>;
      case 'cancelled': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-max"><FaTimesCircle/> Cancelled</span>;
      default: return null;
    }
  };

  const filteredBookings = bookings
    .filter(b => statusFilter === "all" || b.status === statusFilter)
    .filter(b => b.guestName.toLowerCase().includes(filterText.toLowerCase()) || b._id.toLowerCase().includes(filterText.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 space-y-8 animate-in fade-in duration-700 font-sans">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Reservations</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Enterprise Booking Management</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2 w-full sm:w-64 focus-within:border-blue-500 transition-colors shadow-sm">
            <FaSearch className="text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search booking ID or guest..." 
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-sm font-bold w-full placeholder-slate-400"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-blue-500 w-full sm:w-auto shadow-sm text-slate-700"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </header>

      {/* ENTERPRISE TABLE */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="p-6">Booking ID</th>
                <th className="p-6">Guest / Hotel</th>
                <th className="p-6">Dates</th>
                <th className="p-6">Amount</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Reservations...</td></tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-slate-300"><FaCalendarAlt/></div>
                    <p className="text-slate-900 font-black uppercase tracking-widest">No Bookings Found</p>
                    <p className="text-slate-400 text-xs font-bold mt-1">Adjust filters to view history</p>
                  </td>
                </tr>
              ) : filteredBookings.map(b => (
                <React.Fragment key={b._id}>
                  <tr className={`hover:bg-slate-50/50 transition-colors cursor-pointer group ${expandedRow === b._id ? 'bg-blue-50/30' : ''}`} onClick={() => setExpandedRow(expandedRow === b._id ? null : b._id)}>
                    <td className="p-6">
                      <span className="text-sm font-black text-slate-900">{b._id}</span>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Via Web</p>
                    </td>
                    <td className="p-6">
                      <span className="text-sm font-bold text-slate-800">{b.guestName}</span>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{b.hotelName}</p>
                    </td>
                    <td className="p-6">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-2"><FaCalendarAlt className="text-slate-300"/> {b.checkIn}</span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 pl-5">to {b.checkOut}</p>
                    </td>
                    <td className="p-6">
                      <span className="text-sm font-black text-slate-900">₹{b.amount}</span>
                      <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${b.payment === 'paid' ? 'text-green-600' : b.payment === 'refunded' ? 'text-slate-400' : 'text-orange-500'}`}>{b.payment}</p>
                    </td>
                    <td className="p-6">
                      {getStatusBadge(b.status)}
                    </td>
                    <td className="p-6 text-right">
                      <button className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors ml-auto">
                        {expandedRow === b._id ? <FaChevronUp size={12}/> : <FaChevronDown size={12}/>}
                      </button>
                    </td>
                  </tr>

                  {/* EXPANDABLE TIMELINE ROW */}
                  <AnimatePresence>
                    {expandedRow === b._id && (
                      <tr className="bg-slate-900 border-none">
                        <td colSpan="6" className="p-0">
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
                              <div>
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3 border-b border-slate-800 pb-2">Booking Details</h4>
                                <div className="space-y-2 text-xs font-medium text-slate-300">
                                  <p className="flex justify-between"><span>Room Type:</span> <span className="font-bold text-white">{b.roomType}</span></p>
                                  <p className="flex justify-between"><span>Booked On:</span> <span className="font-bold text-white">{new Date(b.bookedAt).toLocaleDateString()}</span></p>
                                  <p className="flex justify-between"><span>Nights:</span> <span className="font-bold text-white">2</span></p>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3 border-b border-slate-800 pb-2">Financial Split</h4>
                                <div className="space-y-2 text-xs font-medium text-slate-300">
                                  <p className="flex justify-between"><span>Gross Amount:</span> <span className="font-bold text-white">₹{b.amount}</span></p>
                                  <p className="flex justify-between"><span>Platform Fee (15%):</span> <span className="font-bold text-orange-400">-₹{b.amount * 0.15}</span></p>
                                  <p className="flex justify-between border-t border-slate-800 pt-2 mt-2"><span>Net Payout:</span> <span className="font-black text-green-400">₹{b.amount * 0.85}</span></p>
                                </div>
                              </div>
                              <div className="flex flex-col justify-center items-end gap-3 border-l border-slate-800 pl-8">
                                <button className="w-full bg-white text-slate-900 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">Download Invoice</button>
                                <button className="w-full bg-slate-800 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-900 hover:text-red-400 transition-colors border border-slate-700">Initiate Refund</button>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* PAGINATION (MOCK) */}
        {!loading && filteredBookings.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
            <span>Showing 1 to {filteredBookings.length} of 124 entries</span>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white transition-colors opacity-50 cursor-not-allowed">Prev</button>
              <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white shadow-md">1</button>
              <button className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white transition-colors">2</button>
              <button className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
