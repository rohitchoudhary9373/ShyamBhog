import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import API from '../services/api';
import { FaCalendarAlt, FaUserFriends, FaCreditCard, FaCheckCircle } from 'react-icons/fa';

export default function HotelCheckoutPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { hotel, room } = location.state || {};

  const [form, setForm] = useState({
    checkInDate: '',
    checkOutDate: '',
    numberOfGuests: 1,
    guestName: '',
    guestEmail: '',
    guestPhone: ''
  });
  const [loading, setLoading] = useState(false);

  const hotelUser = JSON.parse(localStorage.getItem('hotelUserInfo') || 'null');

  if (!hotel || !room) return <div className="p-10 text-center font-bold text-slate-400">Invalid Booking Session. Please restart.</div>;

  if (!hotelUser) {
    return (
      <div className="min-h-screen bg-[#FDF8F1] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-[32px] text-center shadow-xl max-w-sm">
          <h2 className="text-xl font-black uppercase text-slate-900 mb-2">Login Required</h2>
          <p className="text-sm font-bold text-slate-400 mb-6">You must be logged in as a Hotel Customer to complete this booking.</p>
          <button onClick={() => navigate('/hotel-login', { state: { from: location.pathname } })} className="bg-orange-600 text-white w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-all">Go to Login</button>
        </div>
      </div>
    );
  }

  const handleBook = async (e) => {
    e.preventDefault();
    if (!form.checkInDate || !form.checkOutDate) return alert("Select dates");
    setLoading(true);
    
    try {
      const res = await API.post('/hotel-booking/book', {
        hotelId: hotel._id,
        roomId: room._id,
        checkInDate: form.checkInDate,
        checkOutDate: form.checkOutDate,
        numberOfGuests: form.numberOfGuests,
        guestDetails: {
          name: form.guestName,
          email: form.guestEmail,
          phone: form.guestPhone
        }
      }, {
        headers: { Authorization: `Bearer ${hotelUser.token}` }
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_xxx",
        amount: res.data.amount,
        currency: "INR",
        name: "Shyam Bhog",
        description: `Booking for ${room.name} at ${hotel.name}`,
        order_id: res.data.orderId,
        handler: async function (response) {
          try {
            await API.post('/hotel-booking/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: res.data.booking._id
            }, {
              headers: { Authorization: `Bearer ${hotelUser.token}` }
            });
            alert("Booking Confirmed!");
            navigate('/profile');
          } catch (err) {
            alert("Payment verification failed");
          }
        },
        prefill: {
          name: form.guestName,
          email: form.guestEmail,
          contact: form.guestPhone
        },
        theme: { color: "#F97316" }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error processing booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8F1] pt-24 pb-24 font-sans px-6 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic mb-8">Secure <span className="text-orange-600 underline decoration-orange-200">Checkout</span></h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <form onSubmit={handleBook} className="bg-white rounded-[32px] p-8 shadow-sm border border-orange-50 space-y-6">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-4">Guest Details & Dates</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Check-In</label>
                  <input type="date" required value={form.checkInDate} onChange={e => setForm({...form, checkInDate: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Check-Out</label>
                  <input type="date" required value={form.checkOutDate} onChange={e => setForm({...form, checkOutDate: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-orange-500" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Number of Guests</label>
                <input type="number" min="1" max={room.maxGuests} required value={form.numberOfGuests} onChange={e => setForm({...form, numberOfGuests: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-orange-500" />
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <input type="text" placeholder="Guest Full Name" required value={form.guestName} onChange={e => setForm({...form, guestName: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-orange-500" />
                <input type="email" placeholder="Guest Email" required value={form.guestEmail} onChange={e => setForm({...form, guestEmail: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-orange-500" />
                <input type="tel" placeholder="Guest Phone" required value={form.guestPhone} onChange={e => setForm({...form, guestPhone: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-orange-500" />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-all shadow-xl disabled:opacity-50 mt-8 flex items-center justify-center gap-2">
                 <FaCreditCard /> {loading ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </form>
          </div>

          <div className="md:col-span-1">
             <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl sticky top-24">
                <h3 className="text-xs font-black uppercase tracking-widest text-orange-500 mb-6">Booking Summary</h3>
                <h4 className="text-xl font-black tracking-tighter mb-1">{hotel.name}</h4>
                <p className="text-xs font-bold text-slate-400 mb-6">{room.name} ({room.category})</p>
                
                <div className="space-y-3 pt-6 border-t border-white/10 mb-6 text-sm font-bold">
                   <div className="flex justify-between">
                     <span className="text-slate-400">Base Price</span>
                     <span>₹{room.basePrice}/night</span>
                   </div>
                </div>

                <div className="flex justify-between items-end pt-6 border-t border-white/10">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total (Per Night)</span>
                   <span className="text-3xl font-black text-orange-500 tracking-tighter leading-none">₹{room.basePrice}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
