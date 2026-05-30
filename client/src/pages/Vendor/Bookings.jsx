import { useState, useEffect } from 'react';
import API from '../../services/api';

export default function VendorBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await API.get('/hotel-vendor/bookings');
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/hotel-vendor/bookings/${id}/status`, { status });
      fetchBookings();
    } catch (err) {
      alert('Error updating status');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Booking Management</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Review and manage your reservations.</p>
      </header>

      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <tr>
                <th className="p-6">Booking ID</th>
                <th className="p-6">Guest</th>
                <th className="p-6">Room / Dates</th>
                <th className="p-6">Amount (Vendor Earn)</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-slate-400 font-bold">Loading...</td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-500 font-bold">No bookings found.</td>
                </tr>
              ) : bookings.map(b => (
                <tr key={b._id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-6">
                    <span className="text-xs font-black text-slate-800">{b.bookingId}</span>
                    <br />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(b.createdAt).toLocaleDateString()}</span>
                  </td>
                  <td className="p-6">
                    <span className="text-sm font-black text-slate-900">{b.guestDetails?.name || b.userId?.name}</span>
                    <br />
                    <span className="text-xs text-slate-500">{b.guestDetails?.phone || b.userId?.mobile}</span>
                  </td>
                  <td className="p-6">
                    <span className="text-sm font-black text-slate-800">{b.roomId?.name}</span>
                    <br />
                    <span className="text-xs font-medium text-slate-500">{new Date(b.checkInDate).toLocaleDateString()} - {new Date(b.checkOutDate).toLocaleDateString()}</span>
                  </td>
                  <td className="p-6">
                    <span className="text-sm font-black text-green-600">₹{b.vendorEarnings?.toLocaleString()}</span>
                    <br />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total: ₹{b.totalAmount}</span>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      b.bookingStatus === 'confirmed' ? 'bg-green-100 text-green-700' :
                      b.bookingStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {b.bookingStatus}
                    </span>
                  </td>
                  <td className="p-6 text-right space-x-2">
                    {b.bookingStatus === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(b._id, 'confirmed')} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-green-600 transition-all">Accept</button>
                        <button onClick={() => updateStatus(b._id, 'cancelled')} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all">Reject</button>
                      </>
                    )}
                    {b.bookingStatus === 'confirmed' && (
                      <button onClick={() => updateStatus(b._id, 'completed')} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">Mark Checked Out</button>
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
