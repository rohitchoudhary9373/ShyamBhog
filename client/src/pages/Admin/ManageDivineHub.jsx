import { useState, useEffect } from 'react';
import API from '../../services/api';
import { FaVideo, FaUsers, FaParking, FaSave } from 'react-icons/fa';

export default function ManageDivineHub() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    arjeeVideoUrl: '',
    crowdStatus: 'Low',
    parkingUrl: '',
    hotelUrl: ''
  });

  useEffect(() => {
    const fetchHub = async () => {
      try {
        const res = await API.get('/divine-hub');
        if (res.data) setForm({ ...form, ...res.data });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put('/divine-hub', form);
      alert("✅ Divine Hub updated successfully!");
    } catch (err) {
      alert("Error updating hub");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Loading Hub Configuration...</div>;

  return (
    <div className="max-w-4xl animate-fade-in">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tighter">Divine Hub Management</h1>
        <p className="text-slate-500 font-medium mt-1">Control live ritual links and real-time crowd status.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-8">
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
               <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Arjee Video URL</label>
               <div className="relative">
                  <FaVideo className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type="url" 
                    value={form.arjeeVideoUrl} 
                    onChange={e => setForm({...form, arjeeVideoUrl: e.target.value})} 
                    placeholder="https://youtube.com/..." 
                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary font-bold" 
                  />
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Crowd Status Alert</label>
               <div className="relative">
                  <FaUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <select 
                    value={form.crowdStatus} 
                    onChange={e => setForm({...form, crowdStatus: e.target.value})} 
                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary font-bold appearance-none"
                  >
                    <option value="Low">🟢 Low Crowd (Peaceful)</option>
                    <option value="Medium">🟡 Medium Crowd (Moderate)</option>
                    <option value="High">🔴 High Crowd (Bheed Bhad)</option>
                  </select>
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Parking Guide URL</label>
               <div className="relative">
                  <FaParking className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type="url" 
                    value={form.parkingUrl} 
                    onChange={e => setForm({...form, parkingUrl: e.target.value})} 
                    placeholder="Google Maps Link" 
                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary font-bold" 
                  />
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Hotel & Stay URL</label>
               <div className="relative">
                  <FaParking className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type="url" 
                    value={form.hotelUrl} 
                    onChange={e => setForm({...form, hotelUrl: e.target.value})} 
                    placeholder="Stay Recommendations Link" 
                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary font-bold" 
                  />
               </div>
            </div>

         </div>

         <button 
           type="submit" 
           disabled={saving} 
           className="w-full py-5 bg-primary text-white rounded-3xl font-bold text-sm uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-orange-100 flex items-center justify-center gap-3"
         >
            <FaSave /> {saving ? 'Updating Hub...' : 'Publish Divine Updates'}
         </button>
      </form>

      <div className="mt-10 p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
         <span className="text-2xl">💡</span>
         <p className="text-blue-700 text-sm font-medium leading-relaxed">
            These updates are pushed **instantly** to the Home Page and all User Profiles. 
            Ensure your ritual links are correct and the crowd status is checked regularly for the best devotee experience.
         </p>
      </div>
    </div>
  );
}
