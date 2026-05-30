import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { FaChevronLeft, FaStar, FaMapMarkerAlt, FaBed, FaUserFriends } from 'react-icons/fa';
import { getMediaUrl } from '../utils/url';

export default function HotelDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await API.get(`/hotel-booking/hotels/${id}`);
        setHotel(res.data.hotel);
        setRooms(res.data.rooms || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FDF8F1] text-slate-400 font-bold">Loading Hotel Details...</div>;
  if (!hotel) return <div className="min-h-screen flex items-center justify-center bg-[#FDF8F1] text-slate-400 font-bold">Hotel Not Found</div>;

  return (
    <div className="min-h-screen bg-[#FDF8F1] font-sans animate-fade-in pb-24">
      <div className="relative h-96 bg-slate-900">
        {hotel.imageUrl && (
          <img src={getMediaUrl(hotel.imageUrl)} alt={hotel.name} className="w-full h-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FDF8F1] to-transparent"></div>
        <button onClick={() => navigate(-1)} className="absolute top-10 left-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all">
          <FaChevronLeft />
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-32 relative z-10">
        <div className="bg-white rounded-[40px] p-8 shadow-xl border border-orange-50">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">{hotel.name}</h1>
              <p className="text-slate-500 font-medium mt-2 flex items-center gap-2"><FaMapMarkerAlt className="text-orange-600" /> {hotel.address}</p>
            </div>
            <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 font-black">
              <FaStar className="text-orange-500" /> {hotel.stars}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest mb-6">Available Rooms</h2>
          {rooms.length === 0 ? (
            <div className="bg-white p-12 rounded-[32px] text-center shadow-sm">
              <p className="text-slate-400 font-bold">No rooms available at the moment.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {rooms.map(room => (
                <div key={room._id} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 hover:shadow-xl transition-all">
                  <div className="w-full md:w-48 h-32 bg-slate-100 rounded-[20px] overflow-hidden">
                     <div className="w-full h-full flex items-center justify-center text-slate-300"><FaBed size={32}/></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{room.name}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{room.category}</p>
                    <div className="flex gap-4 mt-4">
                       <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><FaUserFriends className="text-orange-500"/> Max {room.maxGuests} Guests</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 mt-4 md:mt-0">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Per Night</p>
                    <p className="text-3xl font-black text-orange-600 tracking-tighter leading-none mb-4">₹{room.basePrice}</p>
                    <button 
                      onClick={() => navigate(`/hotels/checkout/${room._id}`, { state: { hotel, room } })}
                      className="bg-slate-900 text-white w-full md:w-auto px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg active:scale-95"
                    >
                      Select Room
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
