import { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  FaBed, FaPlus, FaTrash, FaPhoneAlt, FaLink, FaMapMarkerAlt, 
  FaStar, FaWalking, FaEdit, FaTimes, FaQuestionCircle, FaUpload,
  FaHotel, FaRegHeart
} from 'react-icons/fa';
import { getMediaUrl } from '../../utils/url';

export default function ManageHotelsDetailed() {
  const [hotels, setHotels] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  
  const initialForm = {
    name: '',
    address: '',
    contactNumber: '',
    priceRange: '',
    bookingUrl: '',
    googleLocationUrl: '',
    distanceFromTemple: '',
    stars: 3,
    features: ''
  };

  const [form, setForm] = useState(initialForm);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', order: 0, category: 'Hotel' });

  const fetchData = async () => {
    try {
      const [hotelRes, faqRes] = await Promise.all([
        API.get('/hotels'),
        API.get('/faq?category=Hotel')
      ]);
      setHotels(hotelRes.data);
      const faqList = faqRes.data?.data || faqRes.data || [];
      setFaqs(Array.isArray(faqList) ? faqList.filter(f => f.category === 'Hotel') : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (hotel) => {
    setEditingId(hotel._id);
    setForm({
      ...hotel,
      features: hotel.features ? hotel.features.join(', ') : ''
    });
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('address', form.address);
      formData.append('contactNumber', form.contactNumber);
      formData.append('priceRange', form.priceRange);
      formData.append('bookingUrl', form.bookingUrl);
      formData.append('googleLocationUrl', form.googleLocationUrl);
      formData.append('distanceFromTemple', form.distanceFromTemple);
      formData.append('stars', form.stars);
      
      const featuresArray = typeof form.features === 'string' 
        ? form.features.split(',').map(f => f.trim()).filter(Boolean)
        : form.features;
      formData.append('features', JSON.stringify(featuresArray));

      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editingId) {
        await API.put(`/hotels/${editingId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        alert("✅ Hotel updated successfully!");
      } else {
        await API.post('/hotels', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        alert("✅ Hotel added successfully!");
      }

      setForm(initialForm);
      setImageFile(null);
      setEditingId(null);
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error saving hotel";
      alert(`❌ ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this hotel recommendation?")) return;
    try {
      await API.delete(`/hotels/${id}`);
      fetchData();
    } catch (err) {
      alert("Error deleting hotel");
    }
  };

  // Helper to construct correct image URL
  const getHotelImageUrl = (hotel) => {
    if (!hotel?.imageUrl) return 'https://via.placeholder.com/350?text=No+Image';
    return getMediaUrl(hotel.imageUrl);
  };

  if (loading) return (
    <div className="py-40 text-center flex flex-col items-center justify-center gap-4">
       <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Loading Stays...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-12">
      
      {/* 🏨 PAGE HEADER */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[32px] p-8 md:p-10 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-orange-500/20 text-orange-400 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase border border-orange-500/30">
              Luxury Stays
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              Active
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase italic">Stay Operations</h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Luxury stay management.</p>
        </div>
        
        {/* Header stats */}
        <div className="flex gap-4 shrink-0">
          <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl text-center backdrop-blur-sm">
            <p className="text-2xl font-black text-orange-500">{hotels.length}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Stays</p>
          </div>
          <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl text-center backdrop-blur-sm">
            <p className="text-2xl font-black text-emerald-400">{hotels.filter(h => h.stars >= 4).length}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Luxury Suites</p>
          </div>
        </div>
      </header>

      {/* 🏨 HOTELS MANAGEMENT SECTION */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        {/* Form Column */}
        <div className="xl:col-span-1">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl space-y-6 sticky top-28">
            <div className="border-b border-slate-100 pb-4 mb-2 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                {editingId ? <><FaEdit className="text-blue-500" /> Edit stay</> : <><FaPlus className="text-orange-500" /> Add Premium Stay</>}
              </h2>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="text-slate-400 hover:text-slate-600">
                  <FaTimes size={16} />
                </button>
              )}
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Hotel Name</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Radhey Palace"
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-sm text-slate-800 transition-all" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Stars</label>
                <select 
                  value={form.stars} 
                  onChange={e => setForm({...form, stars: Number(e.target.value)})} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-sm text-slate-800 transition-all"
                >
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Starting Price (₹)</label>
                <input 
                  type="text" 
                  placeholder="1500" 
                  value={form.priceRange} 
                  onChange={e => setForm({...form, priceRange: e.target.value})} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-sm text-slate-800 transition-all" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contact No.</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. +91 999999999"
                  value={form.contactNumber} 
                  onChange={e => setForm({...form, contactNumber: e.target.value})} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-sm text-slate-800 transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Dist. from Temple</label>
                <input 
                  type="text" 
                  placeholder="e.g. 300m" 
                  value={form.distanceFromTemple} 
                  onChange={e => setForm({...form, distanceFromTemple: e.target.value})} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-sm text-slate-800 transition-all" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Address</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Ring Road, Khatu Shyam Ji"
                value={form.address} 
                onChange={e => setForm({...form, address: e.target.value})} 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-sm text-slate-800 transition-all" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Google Maps Link</label>
              <input 
                type="url" 
                placeholder="https://maps.google.com/..." 
                value={form.googleLocationUrl} 
                onChange={e => setForm({...form, googleLocationUrl: e.target.value})} 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-sm text-slate-800 transition-all" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Hotel Image (Upload)</label>
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => setImageFile(e.target.files[0])} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                <div className="w-full p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 group-hover:border-orange-500 group-hover:text-orange-500 transition-all">
                  <FaUpload className="text-lg" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-center">
                    {imageFile ? imageFile.name : 'Drag & Drop or Choose Image'}
                  </span>
                </div>
              </div>
              {/* Optional image preview */}
              {imageFile && (
                <div className="mt-2 w-24 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              {!imageFile && editingId && form.imageUrl && (
                <div className="mt-2 w-24 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img src={getHotelImageUrl(form)} alt="Current Image" className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop'; }} />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Features (comma separated)</label>
              <input 
                type="text" 
                placeholder="e.g. AC, WiFi, Room Service, Dining" 
                value={form.features} 
                onChange={e => setForm({...form, features: e.target.value})} 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-sm text-slate-800 transition-all" 
              />
            </div>

            <div className="flex gap-3 pt-2">
              {editingId && (
                <button 
                  type="button" 
                  onClick={cancelEdit} 
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
              )}
              <button 
                type="submit" 
                disabled={saving} 
                className={`flex-[2] py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 ${
                  editingId 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100' 
                    : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-100'
                }`}
              >
                {saving ? 'Processing...' : editingId ? 'Update Stay' : 'Publish Stay'}
              </button>
            </div>
          </form>
        </div>

        {/* List Column */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex justify-between items-center mb-2 px-1">
            <h2 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">Active Recommendations ({hotels.length})</h2>
            <div className="w-10 h-1 bg-orange-500 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hotels.map(hotel => {
              const featureList = hotel.features || [];
              return (
                <div 
                  key={hotel._id} 
                  className={`bg-white rounded-[32px] overflow-hidden border-2 shadow-sm flex flex-col justify-between transition-all group ${
                    editingId === hotel._id ? 'border-blue-500 scale-[1.02]' : 'border-slate-100 hover:shadow-md'
                  }`}
                >
                  {/* Image section with relative badges */}
                  <div className="h-48 w-full bg-slate-100 relative overflow-hidden">
                    <img 
                      src={getHotelImageUrl(hotel)} 
                      alt={hotel.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop'; }}
                    />
                    <div className="absolute top-4 left-4 flex gap-1.5">
                      <span className="bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <FaStar className="text-yellow-400" />
                        {hotel.stars} Stars
                      </span>
                      <span className="bg-orange-600/90 backdrop-blur-sm text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <FaWalking />
                        {hotel.distanceFromTemple || 'Near Temple'}
                      </span>
                    </div>

                    <button 
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/30 backdrop-blur-md text-white hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-white/20"
                      title="Favorite Stay"
                    >
                      <FaRegHeart size={12} />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter line-clamp-1">{hotel.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 flex items-start gap-1">
                        <FaMapMarkerAlt className="text-orange-500 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{hotel.address}</span>
                      </p>
                      
                      {/* Features Badges */}
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {featureList.map((feat, idx) => (
                          <span key={idx} className="bg-slate-50 text-slate-600 border border-slate-200/50 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-sm">
                            {feat}
                          </span>
                        ))}
                        {featureList.length === 0 && (
                          <span className="text-slate-300 text-[8px] font-bold uppercase tracking-wider italic">No extra amenities listed</span>
                        )}
                      </div>
                    </div>

                    {/* Pricing & Contact Details */}
                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Starting Price</p>
                        <p className="text-xl font-black text-emerald-600">₹{hotel.priceRange || 'N/A'}<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">/day</span></p>
                      </div>

                      <div className="text-right">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Contact Phone</p>
                        <a href={`tel:${hotel.contactNumber}`} className="text-xs font-black text-slate-800 hover:text-orange-600 transition-colors flex items-center justify-end gap-1">
                          <FaPhoneAlt size={10} className="text-orange-500" />
                          {hotel.contactNumber}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex gap-2 w-full">
                      {hotel.googleLocationUrl && (
                        <a 
                          href={hotel.googleLocationUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex-1 py-2.5 bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-500 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 text-center transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <FaLink size={10} />
                          Map Link
                        </a>
                      )}
                      <button 
                        onClick={() => handleEdit(hotel)} 
                        className={`flex-1 py-2.5 border rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                          editingId === hotel._id 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900'
                        }`}
                      >
                        <FaEdit size={10} />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(hotel._id)} 
                        className="py-2.5 px-4 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100 rounded-xl transition-all shadow-sm flex items-center justify-center"
                        title="Delete Listing"
                      >
                        <FaTrash size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {hotels.length === 0 && (
              <div className="col-span-2 py-20 text-center bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-4">
                <FaHotel className="text-4xl text-slate-200" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No hotel recommendations found</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ❓ HOTEL FAQS SECTION */}
      <section className="mt-16 pt-12 border-t border-slate-100 space-y-8">
        <header className="text-center max-w-xl mx-auto space-y-2">
          <span className="bg-orange-100 text-orange-600 text-[9px] font-black tracking-widest px-3 py-1 rounded-full uppercase border border-orange-200">
            FAQ Governance
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
            Stay FAQs
          </h2>
          <p className="text-slate-400 text-xs font-medium">Frequently Asked Questions.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* FAQ Add Form */}
          <div className="lg:col-span-1">
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await API.post('/faq', faqForm);
                  setFaqForm({ question: '', answer: '', order: 0, category: 'Hotel' });
                  fetchData();
                  alert("✅ FAQ added!");
                } catch (err) { alert("Error adding FAQ"); }
              }} 
              className="bg-slate-900 p-8 rounded-[32px] shadow-xl text-white space-y-5"
            >
              <h3 className="text-lg font-black uppercase tracking-widest italic border-b border-white/10 pb-3 flex items-center gap-2">
                <FaQuestionCircle className="text-orange-500" />
                Add Hotel FAQ
              </h3>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Question</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Is hot water available 24/7?"
                  value={faqForm.question} 
                  onChange={e => setFaqForm({...faqForm, question: e.target.value})} 
                  className="w-full p-4 bg-white/10 border border-white/10 rounded-2xl outline-none focus:border-orange-500 font-bold text-sm text-white transition-all placeholder:text-white/20" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Answer</label>
                <textarea 
                  required 
                  placeholder="e.g. Yes, all recommended stays feature 24-hour hot water supplies..."
                  value={faqForm.answer} 
                  onChange={e => setFaqForm({...faqForm, answer: e.target.value})} 
                  rows="4" 
                  className="w-full p-4 bg-white/10 border border-white/10 rounded-2xl outline-none focus:border-orange-500 font-medium text-sm text-white resize-none transition-all placeholder:text-white/20" 
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-4 bg-orange-600 text-white hover:bg-white hover:text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95"
              >
                Publish FAQ
              </button>
            </form>
          </div>

          {/* FAQ Display Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center mb-2 px-1">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Active Hospitality FAQs ({faqs.length})</h3>
              <div className="w-8 h-1 bg-slate-900 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {faqs.map(faq => (
                <div 
                  key={faq._id} 
                  className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-start gap-4 group hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 font-black text-sm border border-orange-100">
                    ?
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-black text-slate-900 text-sm mb-1 leading-snug">{faq.question}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{faq.answer}</p>
                  </div>
                  <button 
                    onClick={async () => {
                      if(!window.confirm("Delete FAQ?")) return;
                      await API.delete(`/faq/${faq._id}`);
                      fetchData();
                    }} 
                    className="p-3 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete FAQ"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              ))}

              {faqs.length === 0 && (
                <div className="py-20 text-center bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-4">
                  <FaQuestionCircle className="text-3xl text-slate-200" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No hospitality FAQs posted</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
