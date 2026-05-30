import { useState, useEffect } from 'react';
import API from '../../services/api';
import { FaPlus, FaTrash, FaVideo, FaLink } from 'react-icons/fa';
import { getMediaUrl } from '../../utils/url';

export default function RitualVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Dainik Arjee',
    description: ''
  });
  const [videoFile, setVideoFile] = useState(null);

  const fetchVideos = async () => {
    try {
      const res = await API.get('/ritual-videos');
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
      if (videoFile) {
        formData.append('videoFile', videoFile);
      }

      await API.post('/ritual-videos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setForm({ title: '', category: 'Dainik Arjee', description: '' });
      setVideoFile(null);
      fetchVideos();
      alert("Ritual video proof added successfully!");
    } catch (err) {
      alert("Failed to upload video proof");
    } finally {
      setSaving(false);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id) => {
    if (isDeleting) return;

    setIsDeleting(true);
    const confirmed = window.confirm("Are you sure you want to remove this ritual proof?");
    if (!confirmed) {
      setIsDeleting(false);
      return;
    }

    try {
      await API.delete(`/ritual-videos/${id}`);
      fetchVideos();
    } catch (err) {
      alert("Failed to delete video");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl animate-fade-in">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tighter">Ritual Proof Management</h1>
        <p className="text-slate-500 font-medium mt-1">Upload divine ritual videos as proof for devotees.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Card */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 sticky top-24">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-orange-100 text-primary flex items-center justify-center text-sm"><FaPlus/></div>
               Publish New Proof
            </h2>

            <div className="space-y-1">
               <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Proof Title</label>
               <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Morning Dainik Arjee" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary font-bold" />
            </div>

            <div className="space-y-1">
               <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Ritual Category</label>
               <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary font-bold appearance-none">
                  <option value="Dainik Arjee">Dainik Arjee</option>
                  <option value="Vyaktigat Arjee">Vyaktigat Arjee</option>
                  <option value="Bhog">Bhog</option>
                  <option value="Swamani">Swamani</option>
               </select>
            </div>

            <div className="space-y-1">
               <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Video File (Direct Upload)</label>
               <div className="relative group/upload">
                  <input 
                    type="file" 
                    required 
                    accept="video/*" 
                    onChange={e => setVideoFile(e.target.files[0])} 
                    className="hidden" 
                    id="video-upload" 
                  />
                  <label 
                    htmlFor="video-upload" 
                    className="w-full p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary hover:bg-orange-50 transition-all group"
                  >
                     <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <FaVideo size={20} />
                     </div>
                     <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">
                           {videoFile ? videoFile.name : 'Choose Video Proof'}
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Max Size: 50MB</p>
                     </div>
                  </label>
               </div>
            </div>

            <div className="space-y-1">
               <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Description</label>
               <textarea rows="2" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the ritual..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary font-bold resize-none" />
            </div>

            <button type="submit" disabled={saving || !videoFile} className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
               {saving ? 'Uploading Proof...' : 'Add Video Proof'}
            </button>
          </form>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2 space-y-6">
           {loading ? (
             <div className="p-20 text-center text-slate-400 font-bold animate-pulse">Loading Proofs...</div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {videos.map(vid => {
                   const isLocal = vid.videoUrl?.startsWith('/uploads');
                   const fullUrl = getMediaUrl(vid.videoUrl);
                   
                   return (
                   <div key={vid._id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm group">
                      <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                         {isLocal ? (
                            <video className="w-full h-full object-cover opacity-60">
                               <source src={fullUrl} type="video/mp4" />
                            </video>
                         ) : (vid.videoUrl?.includes('youtube.com') || vid.videoUrl?.includes('youtu.be')) ? (
                            <img src={`https://img.youtube.com/vi/${vid.videoUrl.split('v=')[1]?.split('&')[0] || vid.videoUrl.split('/').pop()}/mqdefault.jpg`} className="w-full h-full object-cover opacity-60" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80'; }} />
                         ) : (
                            <FaVideo size={40} className="text-white/20" />
                         )}
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                            <a href={fullUrl} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-xl"><FaVideo /></a>
                         </div>
                         <span className="absolute top-4 left-4 bg-white/10 backdrop-blur-md text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-white/20 tracking-widest">
                            {vid.category}
                         </span>
                      </div>
                      <div className="p-6 flex justify-between items-start">
                         <div>
                            <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{vid.title}</h3>
                            <p className="text-xs text-slate-400 font-bold mt-1">{new Date(vid.createdAt).toLocaleDateString()}</p>
                         </div>
                         <button onClick={() => handleDelete(vid._id)} className="text-slate-300 hover:text-red-500 transition-colors p-2"><FaTrash/></button>
                      </div>
                   </div>
                );})}
                {videos.length === 0 && (
                   <div className="col-span-2 p-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">No ritual proofs uploaded yet.</p>
                   </div>
                )}
             </div>
           )}
        </div>

      </div>
    </div>
  );
}
