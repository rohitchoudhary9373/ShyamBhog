import { useState, useEffect } from 'react';
import API from '../../services/api';
import { FaParking, FaPlus, FaTrash, FaMapMarkerAlt, FaWalking, FaLink, FaQuestionCircle } from 'react-icons/fa';

export default function ManageParkingDetailed() {
  const [spots, setSpots] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'Government',
    googleMapsUrl: '',
    distanceFromTemple: '',
    description: ''
  });

  // FAQ Form State
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', order: 0, category: 'Parking' });

  const fetchData = async () => {
    try {
      const [parkRes, faqRes] = await Promise.all([
        API.get('/parking'),
        API.get('/faq?category=Parking')
      ]);
      setSpots(parkRes.data);
      const faqList = faqRes.data?.data || faqRes.data || [];
      setFaqs(Array.isArray(faqList) ? faqList.filter(f => f.category === 'Parking') : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.post('/parking', form);
      setForm({ name: '', type: 'Government', googleMapsUrl: '', distanceFromTemple: '', description: '' });
      fetchData();
      alert("✅ Parking spot added successfully!");
    } catch (err) {
      alert("Error adding parking spot");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this parking location?")) return;
    try {
      await API.delete(`/parking/${id}`);
      fetchData();
    } catch (err) {
      alert("Error deleting parking");
    }
  };

  // FAQ Handlers
  const handleFaqSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/faq', faqForm);
      setFaqForm({ question: '', answer: '', order: 0, category: 'Parking' });
      fetchData();
      alert("✅ FAQ added to Parking section!");
    } catch (err) { alert("Error adding FAQ"); }
  };

  const deleteFaq = async (id) => {
    if(!window.confirm("Delete this FAQ?")) return;
    try {
      await API.delete(`/faq/${id}`);
      fetchData();
    } catch (err) { alert("Delete failed"); }
  };

  if (loading) return <div className="p-12 text-center text-slate-400 font-bold">Loading Parking Management...</div>;

  return (
    <div className="max-w-7xl animate-fade-in pb-20">
      
      {/* 🚗 PARKING MANAGEMENT */}
      <section className="mb-20">
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tighter">Manage Parking Locations</h1>
          <p className="text-slate-500 font-medium mt-1">Manage Government and Private parking information for devotees.</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          
          {/* Form Column */}
          <div className="xl:col-span-1">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm space-y-5 sticky top-24">
               <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">Add Parking Spot</h2>
               
               <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Location Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary font-bold text-sm" />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Type</label>
                     <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary font-bold text-sm">
                        <option value="Government">Government</option>
                        <option value="Private">Private</option>
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Dist. from Temple</label>
                     <input type="text" placeholder="500m" value={form.distanceFromTemple} onChange={e => setForm({...form, distanceFromTemple: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary font-bold text-sm" />
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Google Maps URL</label>
                  <input type="url" required value={form.googleMapsUrl} onChange={e => setForm({...form, googleMapsUrl: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary font-bold text-sm" />
               </div>

               <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="2" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary font-bold text-sm resize-none" />
               </div>

               <button type="submit" disabled={saving} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-slate-900 transition-all">
                  {saving ? 'Adding...' : 'Add Parking Location'}
               </button>
            </form>
          </div>

          {/* List Column */}
          <div className="xl:col-span-2 space-y-6">
             {spots.map(spot => (
               <div key={spot._id} className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 text-xl ${
                    spot.type === 'Government' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                     <FaParking />
                  </div>
                  <div className="flex-grow text-center md:text-left">
                     <div className="flex items-center justify-center md:justify-start gap-3">
                        <h3 className="text-lg font-bold text-slate-900">{spot.name}</h3>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-widest ${
                          spot.type === 'Government' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                           {spot.type}
                        </span>
                     </div>
                     <p className="text-xs text-slate-500 font-medium mb-2">{spot.description}</p>
                     <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        <span className="bg-slate-50 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                           <FaWalking /> {spot.distanceFromTemple}
                        </span>
                        <a href={spot.googleMapsUrl} target="_blank" rel="noreferrer" className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                           <FaLink /> Google Maps
                        </a>
                     </div>
                  </div>
                  <button onClick={() => handleDelete(spot._id)} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                     <FaTrash />
                  </button>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* ❓ PARKING FAQS MANAGEMENT */}
      <section className="mt-20 pt-20 border-t-2 border-slate-100">
         <header className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tighter flex items-center gap-3">
               <FaQuestionCircle className="text-blue-600" />
               Parking Specific FAQs
            </h2>
            <p className="text-slate-500 font-medium mt-1">Manage questions and answers that appear only on the Parking Guide page.</p>
         </header>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* FAQ Form */}
            <div className="lg:col-span-1">
               <form onSubmit={handleFaqSubmit} className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 text-white space-y-5">
                  <h3 className="text-lg font-bold mb-4">Add Parking FAQ</h3>
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Devotee Question</label>
                     <input type="text" required value={faqForm.question} onChange={e => setFaqForm({...faqForm, question: e.target.value})} className="w-full p-4 bg-white/10 border border-white/10 rounded-2xl outline-none focus:border-blue-600 font-bold text-sm text-white" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Detailed Answer</label>
                     <textarea required value={faqForm.answer} onChange={e => setFaqForm({...faqForm, answer: e.target.value})} rows="4" className="w-full p-4 bg-white/10 border border-white/10 rounded-2xl outline-none focus:border-blue-600 font-medium text-sm text-white resize-none" />
                  </div>
                  <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all shadow-xl shadow-blue-900/20">
                     Publish FAQ
                  </button>
               </form>
            </div>

            {/* FAQ List */}
            <div className="lg:col-span-2 space-y-4">
               {faqs.map(faq => (
                  <div key={faq._id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4 group">
                     <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">?</div>
                     <div className="flex-grow">
                        <h4 className="font-bold text-slate-900 text-sm mb-1">{faq.question}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{faq.answer}</p>
                     </div>
                     <button onClick={() => deleteFaq(faq._id)} className="p-3 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <FaTrash size={14} />
                     </button>
                  </div>
               ))}
               {faqs.length === 0 && (
                  <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                     <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No FAQs added for Parking yet.</p>
                  </div>
               )}
            </div>
         </div>
      </section>

    </div>
  );
}
