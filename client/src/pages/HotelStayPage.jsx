import { useState, useEffect } from 'react';
import API from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBed, FaMapMarkerAlt, FaStar, FaChevronLeft, FaBuilding, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { getMediaUrl } from '../utils/url';
import MapActionSheet from '../components/MapActionSheet';

export default function HotelStayPage() {
   const { t } = useTranslation();
   const navigate = useNavigate();
   const { settings } = useSettings();
   const settingsAdminId = settings?.adminId;
   
   const [hotelUser, setHotelUser] = useState(JSON.parse(localStorage.getItem('hotelUserInfo') || 'null'));
   const [hotels, setHotels] = useState([]);
   const [loading, setLoading] = useState(true);
   const [activeMap, setActiveMap] = useState(null);
   const [activeFilter, setActiveFilter] = useState('All');
   const [openFaq, setOpenFaq] = useState(null);

   const premiumFaqs = [
      { id: 1, question: "How does the booking process work?", answer: "Our premium booking engine ensures an instant, secure reservation. Select your preferred luxury stay, choose your dates, and complete payment via our highly secure Razorpay gateway. Your confirmation is instant." },
      { id: 2, question: "What is your cancellation & refund policy?", answer: "We offer flexible cancellation. Cancel up to 48 hours before check-in for a full refund. Refunds are automatically processed back to your original payment method within 5-7 business days." },
      { id: 3, question: "What are the standard check-in and check-out times?", answer: "Standard check-in is at 2:00 PM and check-out is at 11:00 AM. Early check-in or late check-out is subject to availability and can be requested through your customer dashboard." },
      { id: 4, question: "How secure is my payment information?", answer: "We use enterprise-grade 256-bit encryption. Payment details are processed directly by our PCI-DSS compliant payment gateway, ensuring your financial data is never stored on our servers." },
      { id: 5, question: "Do you offer customer support during my stay?", answer: "Absolutely. Our dedicated concierge and support team is available 24/7 to assist you with any inquiries, room upgrades, or special requests during your sacred stay." }
   ];

   useEffect(() => {
      const fetchData = async () => {
         // Only fetch hotels if the user is logged in
         if (!hotelUser) {
            setLoading(false);
            return;
         }

         try {
            const tenantId = settingsAdminId || localStorage.getItem('tenantId') || '';
            const hotelRes = await API.get(`/hotels?tenantId=${tenantId}`);
            setHotels(Array.isArray(hotelRes.data) ? hotelRes.data : (hotelRes.data?.data || []));
         } catch (err) {
            console.error(err);
         } finally {
            setLoading(false);
         }
      };
      fetchData();
   }, [settingsAdminId, hotelUser]);

   const handleLogout = () => {
      localStorage.removeItem('hotelUserInfo');
      setHotelUser(null);
   };

   const filters = ['All', '5 Star', '4 Star', '3 Star'];
   const filteredHotels = activeFilter === 'All' 
      ? hotels 
      : hotels.filter(h => `${h.stars} Star` === activeFilter);

   if (loading) return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#FDF8F1]">
         <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-orange-600 font-black uppercase tracking-widest text-[10px] italic">Loading Luxury Stays...</p>
         </div>
      </div>
   );

   // ──────────────────────────────────────────────────────────
   // LOGGED-IN VIEW: CUSTOMER DASHBOARD & HOTEL SEARCH
   // ──────────────────────────────────────────────────────────
   if (hotelUser) {
      return (
         <div className="min-h-[100dvh] bg-[#FDF8F1] pb-24 font-sans animate-fade-in">
            {/* LOGGED-IN HEADER */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
               <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-900 transition-colors">
                  <FaChevronLeft size={16} />
               </button>
               <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Welcome Back</p>
                     <p className="text-sm font-black text-slate-900 tracking-tight">{hotelUser.name}</p>
                  </div>
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-lg">
                     <FaUserCircle />
                  </div>
                  <button onClick={handleLogout} className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-red-600 rounded-full flex items-center justify-center transition-colors">
                     <FaSignOutAlt />
                  </button>
               </div>
            </div>

            <nav className="w-full max-w-xl mx-auto px-6 pt-10 pb-8 flex flex-col items-center text-center gap-2">
               <h1 className="text-3xl font-black text-[#0A1128] tracking-tighter uppercase italic">Select <span className="text-orange-600 underline decoration-orange-200">Stay</span></h1>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                  Sacred Rest in Khatu Dham
               </p>
            </nav>

            <div className="sticky top-[73px] z-40 bg-[#FDF8F1]/80 backdrop-blur-md py-4 px-6 border-b border-orange-100/50">
               <div className="max-w-xl mx-auto flex justify-center gap-3 overflow-x-auto no-scrollbar">
                  {filters.map(f => (
                     <button 
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                           activeFilter === f ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-300'
                        }`}
                     >
                        {f}
                     </button>
                  ))}
               </div>
            </div>

            <div className="max-w-xl mx-auto px-6 pt-10 space-y-12">
               <div className="grid grid-cols-1 gap-10">
                  <AnimatePresence mode="popLayout">
                     {filteredHotels.map((hotel, idx) => (
                        <motion.div 
                           key={hotel._id}
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, scale: 0.95 }}
                           transition={{ delay: idx * 0.05 }}
                           className="bg-white rounded-[40px] overflow-hidden border border-orange-50 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] group"
                        >
                           {(hotel.imageUrl || hotel.image) && (
                              <div className="relative h-64 overflow-hidden bg-slate-50">
                                 <img 
                                    src={getMediaUrl(hotel.imageUrl || hotel.image)} 
                                    alt={hotel.name} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop'; }}
                                 />
                                 <div className="absolute top-6 left-6 flex gap-2">
                                    <div className="bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border border-white/10">
                                       <FaStar className="text-orange-500" /> {hotel.stars} Star
                                    </div>
                                    {(hotel.distanceFromTemple || hotel.distance) && (hotel.distanceFromTemple !== 'undefined' && hotel.distance !== 'undefined') && (
                                       <div className="bg-white/90 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                          <FaMapMarkerAlt className="text-orange-500" /> {hotel.distanceFromTemple || hotel.distance}
                                       </div>
                                    )}
                                 </div>
                              </div>
                           )}

                           <div className="p-8">
                              <div className="flex justify-between items-start mb-4">
                                 <div className="flex-1 min-w-0 pr-4">
                                    <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter truncate leading-tight">{hotel.name}</h3>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 line-clamp-1">{hotel.address}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Starting From</p>
                                    <p className="text-xl font-black text-orange-600 leading-none">
                                       { (hotel.priceRange || hotel.price) ? ( (hotel.priceRange || hotel.price).toString().startsWith('₹') ? (hotel.priceRange || hotel.price) : `₹${(hotel.priceRange || hotel.price)}` ) : 'N/A' }
                                    </p>
                                 </div>
                              </div>

                              <div className="flex flex-wrap gap-2 mb-8">
                                 {hotel.features && hotel.features.length > 0 ? hotel.features.map((feature, fIdx) => (
                                    <span key={fIdx} className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-slate-100">
                                       {feature}
                                    </span>
                                 )) : (
                                    <span className="text-slate-300 text-[8px] font-black uppercase tracking-widest italic">Premium Amenities</span>
                                 )}
                              </div>

                              <div className="flex gap-3">
                                 <button 
                                    onClick={() => navigate(`/hotels/detail/${hotel._id}`)} 
                                    className="flex-1 bg-slate-900 text-white py-4 rounded-[20px] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl active:scale-95"
                                 >
                                    <FaBed size={12}/> Book Stay
                                 </button>
                                 <button 
                                     onClick={(e) => {
                                        e.preventDefault();
                                        setActiveMap({
                                           locationName: hotel.name,
                                           mapUrl: hotel.googleLocationUrl || hotel.location || `https://www.google.com/maps/search/${encodeURIComponent(hotel.name + " Khatu Shyam Ji")}`
                                        });
                                     }}
                                     className="flex-1 bg-slate-50 text-slate-600 border border-slate-100 py-4 rounded-[20px] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                                  >
                                     <FaMapMarkerAlt size={12}/> View Map
                                  </button>
                              </div>
                           </div>
                        </motion.div>
                     ))}
                  </AnimatePresence>

                  {filteredHotels.length === 0 && (
                     <div className="py-32 text-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm opacity-30">🛎️</div>
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] italic">No stays match your criteria.</p>
                     </div>
                  )}
               </div>
            </div>

            <MapActionSheet 
               isOpen={!!activeMap}
               onClose={() => setActiveMap(null)}
               locationName={activeMap?.locationName}
               mapUrl={activeMap?.mapUrl}
            />
         </div>
      );
   }

   // ──────────────────────────────────────────────────────────
   // GATEWAY VIEW: PREMIUM LANDING PAGE (NO LOGIN)
   // ──────────────────────────────────────────────────────────
   return (
      <div className="min-h-screen bg-[#FDF8F1] font-sans selection:bg-orange-100 selection:text-orange-900 relative">
         
         {/* Absolute Back Button */}
         <button 
            onClick={() => navigate('/')} 
            className="absolute left-6 top-6 md:left-10 md:top-10 w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-slate-900 hover:text-orange-600 hover:scale-105 transition-all z-50 border border-orange-50"
         >
            <FaChevronLeft size={16}/>
         </button>

         {/* Hero Section */}
         <div className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-6 flex flex-col items-center text-center overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none"></div>
            
            <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl shadow-xl mb-8 rotate-3">
               <FaBed />
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase italic mb-6">
               Luxury <span className="text-orange-600 underline decoration-orange-200">Stays</span>
            </h1>
            <p className="text-sm md:text-base font-bold text-slate-500 max-w-lg mb-12 leading-relaxed">
               Experience sacred hospitality with our enterprise-grade booking ecosystem. Select your portal to access exclusive stays and manage luxury properties.
            </p>

            {/* Premium Login Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl relative z-10">
               {/* Customer Card */}
               <button 
                  onClick={() => navigate('/hotel-login')}
                  className="bg-white p-8 md:p-10 rounded-[40px] shadow-xl shadow-orange-900/5 border border-orange-50 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group"
               >
                  <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-2xl mb-6 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                     <FaUserCircle />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-2">Customer Booking</h3>
                  <p className="text-xs font-bold text-slate-400 leading-relaxed mb-8">Access the most luxurious stays, manage your reservations, and track your refunds instantly.</p>
                  <span className="mt-auto px-8 py-4 bg-slate-900 text-white w-full rounded-2xl text-[10px] font-black uppercase tracking-widest group-hover:bg-orange-600 transition-colors">Login / Register</span>
               </button>

               {/* Partner Card */}
               <button 
                  onClick={() => navigate('/vendor-login')}
                  className="bg-slate-900 p-8 md:p-10 rounded-[40px] shadow-2xl border border-white/10 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-orange-900/20 transition-all duration-300 group"
               >
                  <div className="w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center text-2xl mb-6 group-hover:bg-white group-hover:text-slate-900 transition-colors">
                     <FaBuilding />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Partner Portal</h3>
                  <p className="text-xs font-bold text-slate-400 leading-relaxed mb-8">Manage your properties, live inventory, dynamic pricing, and monitor real-time revenue analytics.</p>
                  <span className="mt-auto px-8 py-4 bg-white text-slate-900 w-full rounded-2xl text-[10px] font-black uppercase tracking-widest group-hover:bg-orange-600 group-hover:text-white transition-colors">Access Dashboard</span>
               </button>
            </div>
         </div>

         {/* Elegant FAQ Section */}
         <div className="max-w-3xl mx-auto px-6 pb-32">
            <div className="text-center mb-12">
               <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Frequently Asked</h2>
               <div className="w-12 h-1 bg-orange-600 mx-auto rounded-full"></div>
            </div>
            
            <div className="space-y-4">
               {premiumFaqs.map(faq => (
                  <div key={faq.id} className="bg-white rounded-[28px] border border-orange-50 shadow-sm overflow-hidden hover:border-orange-200 transition-colors">
                     <button 
                        onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                        className="w-full text-left px-8 py-6 flex justify-between items-center group"
                     >
                        <span className="text-sm font-black text-slate-700 uppercase tracking-tight group-hover:text-orange-600 transition-colors pr-8">{faq.question}</span>
                        <span className={`text-xl transition-transform duration-300 ${openFaq === faq.id ? 'rotate-180 text-orange-600' : 'text-slate-300'}`}>↓</span>
                     </button>
                     <AnimatePresence>
                        {openFaq === faq.id && (
                           <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                           >
                              <div className="px-8 pb-8 text-xs text-slate-500 font-bold leading-relaxed border-t border-slate-50 pt-6">
                                 {faq.answer}
                              </div>
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
               ))}
            </div>
         </div>

      </div>
   );
}
