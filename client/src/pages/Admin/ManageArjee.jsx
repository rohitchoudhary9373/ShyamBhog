import { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  FaPlus, FaTrash, FaVideo, FaLink, FaInstagram, 
  FaExternalLinkAlt, FaCloudUploadAlt, FaHistory, 
  FaPlayCircle, FaCheckCircle, FaShieldAlt
} from 'react-icons/fa';
import { getUser } from '../../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { getMediaUrl } from '../../utils/url';

export default function ManageArjee() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const user = getUser();
  
  const [form, setForm] = useState({
    title: '',
    category: 'Arjee',
    instagramUrl: '',
    description: ''
  });
  const [videoFile, setVideoFile] = useState(null);

  const fetchVideos = async () => {
    try {
      const tenantId = user?.role === 'agent' ? user?.parentAdmin : user?._id;
      const res = await API.get(`/ritual-videos?tenantId=${tenantId}`);
      setVideos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('category', form.category);
      formData.append('description', form.description);
      formData.append('instagramUrl', form.instagramUrl);
      if (videoFile) {
        formData.append('videoFile', videoFile);
      }

      await API.post('/ritual-videos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setForm({ title: '', category: 'Arjee', instagramUrl: '', description: '' });
      setVideoFile(null);
      fetchVideos();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add video';
      alert(`❌ ERROR: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this video proof permanently?")) return;
    try {
      await API.delete(`/ritual-videos/${id}`);
      fetchVideos();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* ── HEADER ── */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                 <FaVideo size={20} />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Ritual <span className="text-orange-600 not-italic">Vault</span></h1>
           </div>
           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] ml-1">Multimedia Proof & Reel Management</p>
        </div>

        <div className="flex items-center gap-4 bg-white px-6 py-3.5 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex flex-col border-r border-slate-100 pr-6">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Vault Status</span>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-tighter">Active Sync</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs">
                 {videos.length}
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ritual Proofs</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* ── REEL PUBLISHER (FORM) ── */}
        <div className="xl:col-span-4">
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border border-slate-200 h-fit xl:sticky xl:top-6">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Upload <span className="text-orange-600 not-italic">Studio</span></h2>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Publish sacred proofs</p>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-xl animate-pulse">
                    <FaCloudUploadAlt />
                 </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Proof Title</label>
                  <input type="text" required placeholder="e.g. Swamani Ritual 12th May" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-[13px] text-slate-900 transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Service Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-[10px] uppercase tracking-[0.2em] text-slate-900 focus:border-orange-500 transition-all cursor-pointer">
                    <option value="Arjee">Arjee Proof</option>
                    <option value="Bhog">Bhog Proof</option>
                    <option value="Swamani">Swamani Proof</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Social Integration (Insta Link)</label>
                  <div className="relative">
                    <input type="text" placeholder="https://instagram.com/reels/..." value={form.instagramUrl} onChange={e => setForm({...form, instagramUrl: e.target.value})} className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-orange-500 font-bold text-[11px] text-slate-600 transition-all" />
                    <FaInstagram className="absolute left-5 top-1/2 -translate-y-1/2 text-pink-500" size={16} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Native Vertical Video</label>
                  <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} className="hidden" id="reel-upload" />
                  <label htmlFor="reel-upload" className="w-full p-6 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center gap-3 cursor-pointer hover:bg-slate-50 hover:border-orange-200 transition-all group overflow-hidden relative">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 group-hover:text-orange-500 group-hover:scale-110 transition-all duration-500">
                       <FaVideo size={18}/>
                    </div>
                    <div className="text-center relative z-10">
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                          {videoFile ? 'File Selected' : 'Upload Vertical Reel'}
                       </p>
                       <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest truncate max-w-[200px]">
                          {videoFile ? videoFile.name : 'MP4, MOV • 9:16 Ratio Preferred'}
                       </p>
                    </div>
                    {videoFile && <div className="absolute inset-0 bg-orange-500/5 pointer-events-none"></div>}
                  </label>
                </div>

                <button type="submit" disabled={saving || (!videoFile && !form.instagramUrl)} className="w-full py-4.5 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-sm border border-slate-200 shadow-slate-300 active:scale-95 disabled:opacity-50">
                  {saving ? 'Synchronizing...' : 'Publish Proof'}
                </button>
              </form>
           </div>
        </div>

        {/* ── REEL SHOWCASE (GRID) ── */}
        <div className="xl:col-span-8">
           <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
              {videos.map((vid, i) => {
                 const fullUrl = getMediaUrl(vid.videoUrl);
                 
                 return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.05 }}
                    key={vid._id} 
                    className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 group shadow-sm border border-slate-200 border border-slate-200/20"
                  >
                    {vid.instagramUrl ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white p-6 relative">
                         <div className="absolute inset-0 bg-black/10"></div>
                         <FaInstagram size={48} className="mb-4 relative z-10 animate-bounce" />
                         <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em] relative z-10 text-center leading-relaxed">Integrated Instagram Reel</span>
                      </div>
                    ) : isLocal ? (
                       <video src={fullUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-white/5"><FaVideo size={60}/></div>
                    )}
                    
                    {/* Overlay UI */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="absolute top-6 left-6 right-6 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-[-10px] group-hover:translate-y-0">
                       <span className="bg-orange-600 text-white text-[10px] font-semibold uppercase px-4 py-2 rounded-full tracking-widest shadow-sm border border-slate-200 shadow-orange-500/20">{vid.category}</span>
                       <button onClick={() => handleDelete(vid._id)} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xl text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-xl">
                          <FaTrash size={14}/>
                       </button>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 text-center transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                       <h3 className="text-[12px] font-bold text-white uppercase tracking-tighter truncate px-2 mb-2">{vid.title}</h3>
                       <div className="h-1 w-12 bg-orange-600 mx-auto rounded-full group-hover:w-20 transition-all duration-500"></div>
                    </div>

                    {/* Play Button Highlight */}
                    {!vid.instagramUrl && (
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                          <FaPlayCircle size={60} className="text-white/40" />
                       </div>
                    )}
                  </motion.div>
              );})}
              </AnimatePresence>
           </div>

           {videos.length === 0 && !loading && (
              <div className="py-40 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
                 <FaHistory size={48} className="text-slate-100 mb-6" />
                 <p className="text-xs font-bold text-slate-300 uppercase tracking-[0.4em]">Vault holds no ritual proofs</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
