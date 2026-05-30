import { useState, useEffect } from 'react';
import API from '../../services/api';
import { FaPlus, FaCheckCircle, FaClock, FaTimesCircle, FaUpload, FaTimes } from 'react-icons/fa';

export default function VendorHotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const hotelUser = JSON.parse(localStorage.getItem('hotelVendorInfo') || '{}');

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const res = await API.get('/hotel-vendor/hotels', {
        headers: { Authorization: `Bearer ${hotelUser.token}` }
      });
      setHotels(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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

      await API.post('/hotel-vendor/hotels', formData, { 
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${hotelUser.token}`
        } 
      });
      
      alert("✅ Hotel submitted successfully! Awaiting Admin approval.");
      setShowForm(false);
      setForm(initialForm);
      setImageFile(null);
      fetchHotels();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error saving hotel');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">My Properties</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage your hotel listings and details.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95">
            <FaPlus /> Add New Property
          </button>
        )}
      </header>

      {showForm && (
        <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-2xl border border-slate-100 relative">
          <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors">
            <FaTimes size={20} />
          </button>
          
          <h2 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tighter italic">List New Property</h2>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Property Name *</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-colors" placeholder="e.g. Radisson Blu" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Address *</label>
                  <textarea required value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows="3" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-colors" placeholder="Full hotel address..."></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Contact Number</label>
                    <input type="text" value={form.contactNumber} onChange={e => setForm({...form, contactNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Starting Price (₹)</label>
                    <input type="number" required value={form.priceRange} onChange={e => setForm({...form, priceRange: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none" placeholder="e.g. 2500" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Property Image *</label>
                  <div className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
                    <input type="file" required accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <FaUpload className="text-slate-400 text-3xl mb-4" />
                    <p className="text-xs font-bold text-slate-600">{imageFile ? imageFile.name : 'Click or drag image to upload'}</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-1">High resolution exterior or room shot</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Distance (e.g. 500m)</label>
                    <input type="text" value={form.distanceFromTemple} onChange={e => setForm({...form, distanceFromTemple: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Star Rating</label>
                    <select value={form.stars} onChange={e => setForm({...form, stars: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none">
                      <option value="3">3 Star</option>
                      <option value="4">4 Star</option>
                      <option value="5">5 Star</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Features (comma separated)</label>
                  <input type="text" value={form.features} onChange={e => setForm({...form, features: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none" placeholder="AC, Free WiFi, Parking..." />
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="bg-blue-600 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                {saving ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 font-bold">Loading properties...</div>
      ) : hotels.length === 0 ? (
        <div className="bg-white p-12 rounded-[24px] border border-slate-100 shadow-sm text-center">
          <p className="text-slate-500 font-bold">You haven't listed any properties yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map(h => (
            <div key={h._id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all group cursor-pointer flex flex-col">
              <div className="h-48 bg-slate-100 relative overflow-hidden">
                {h.imageUrl ? (
                  <img src={h.imageUrl.startsWith('http') ? h.imageUrl : `https://shyambhog.onrender.com${h.imageUrl}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={h.name} />
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest">No Image</div>
                )}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg">
                  {h.status === 'active' && <FaCheckCircle className="text-green-500" />}
                  {h.status === 'pending' && <FaClock className="text-orange-500" />}
                  {h.status === 'suspended' && <FaTimesCircle className="text-red-500" />}
                  <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">{h.status}</span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-slate-900 tracking-tight line-clamp-1">{h.name}</h3>
                <p className="text-xs font-medium text-slate-500 mt-2 line-clamp-2">{h.address}</p>
                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commission: {h.commissionRate || 15}%</span>
                  <button className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg">Edit Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
