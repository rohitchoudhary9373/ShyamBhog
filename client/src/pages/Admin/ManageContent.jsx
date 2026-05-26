import { useState, useEffect } from 'react';
import API from '../../services/api';
import { getUser } from '../../utils/auth';
import { 
  FaTrash, FaPlus, FaCloudUploadAlt, FaQuestionCircle, 
  FaImages, FaInstagram, FaSyncAlt, FaExternalLinkAlt, 
  FaTimes, FaChevronDown, FaChevronUp, FaBook, FaCheckCircle,
  FaArrowRight, FaFilter, FaLayerGroup, FaInfoCircle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { getMediaUrl } from '../../utils/url';

export default function ManageContent() {
  const [faqs, setFaqs] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resellers, setResellers] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [expandedCategory, setExpandedCategory] = useState('General');
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [showMediaForm, setShowMediaForm] = useState(false);

  const user = getUser();
  const isSuper = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('library'); // 'library' or 'about'
  const [aboutSaving, setAboutSaving] = useState(false);
  const [aboutForm, setAboutForm] = useState({
    intro: '',
    mission: '',
    services: '',
    whyUs: [
      { title: '', desc: '' },
      { title: '', desc: '' },
      { title: '', desc: '' }
    ],
    contact: ''
  });

  const getInstaThumbnail = (url) => {
    if (!url) return null;
    try {
      const match = url.match(/\/(?:p|reels|reel)\/([A-Za-z0-9_-]+)/);
      if (match && match[1]) {
        const rawUrl = `https://www.instagram.com/p/${match[1]}/media/?size=l`;
        return `https://images.weserv.nl/?url=${encodeURIComponent(rawUrl)}`;
      }
    } catch (e) { console.error(e); }
    return null;
  };

  // Form states
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', order: 0, category: 'General' });
  const [galleryForm, setGalleryForm] = useState({ altText: '', instagramUrl: '', order: 0 });
  const [galleryFile, setGalleryFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats
  const stats = {
    totalFaqs: faqs.length,
    categories: [...new Set(faqs.map(f => f.category))].length || 6,
    media: galleries.length,
    live: faqs.length + galleries.length
  };

  useEffect(() => {
    if (isSuper) fetchResellers();
    const ownerId = user?.role === 'agent' ? user?.parentAdmin : user?._id;
    setSelectedTenant(ownerId);
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      fetchData();
      fetchAbout(selectedTenant);
    }
  }, [selectedTenant]);

  const fetchAbout = async (tenantId) => {
    try {
      const targetTenant = tenantId || selectedTenant;
      if (!targetTenant) return;
      const res = await API.get(`/content/about?tenantId=${targetTenant}`);
      if (res.data && res.data.data) {
        const d = res.data.data;
        setAboutForm({
          intro: d.intro || '',
          mission: d.mission || '',
          services: d.services || '',
          whyUs: d.whyUs || [
            { title: '', desc: '' },
            { title: '', desc: '' },
            { title: '', desc: '' }
          ],
          contact: d.contact || ''
        });
      }
    } catch (err) {
      console.error('Error fetching about content:', err);
      // Pre-fill default texts so the user doesn't start with empty text
      setAboutForm({
        intro: "Welcome to Shyam Bhog, your premier destination for authentic devotional services. We are dedicated to bridging the gap between devotees and the divine, providing transparent and sacred experiences for Khatu Shyam Ji followers worldwide.",
        mission: "Our mission is to digitize and democratize spiritual services, ensuring every devotee can experience the grace of the Lord with complete trust and ease.",
        whyUs: [
          { title: "Transparency", desc: "Real-time updates and clear ritual documentation." },
          { title: "Sacred Authenticity", desc: "Every ritual is performed by authorized temple sevadaars." },
          { title: "Devotee-First", desc: "Personalized support and intuitive booking flows." }
        ],
        services: "We offer Arjee, Bhog, and Swamani services with the highest level of devotion and professional care.",
        contact: "support@shyambhog.com | +91 98765 43210"
      });
    }
  };

  const handleAboutSubmit = async (e) => {
    e.preventDefault();
    setAboutSaving(true);
    try {
      const url = `/content/about${isSuper ? `?adminId=${selectedTenant}` : ''}`;
      await API.put(url, { data: aboutForm });
      alert('About Us content updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating About Us content');
    } finally {
      setAboutSaving(false);
    }
  };

  const fetchResellers = async () => {
    try {
      const res = await API.get('/users/resellers');
      setResellers(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [faqRes, galleryRes] = await Promise.all([
        API.get(`/faq?tenantId=${selectedTenant}`),
        API.get(`/gallery?tenantId=${selectedTenant}`)
      ]);
      setFaqs(faqRes.data.data || faqRes.data);
      setGalleries(galleryRes.data.data || galleryRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFaqSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await API.post(`/faq${isSuper ? `?adminId=${selectedTenant}` : ''}`, faqForm);
      setFaqForm({ question: '', answer: '', order: 0, category: 'General' });
      fetchData();
      setShowFaqForm(false);
    } catch (err) {
      alert('Error adding FAQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGallerySubmit = async (e) => {
    e.preventDefault();
    if (!galleryFile && !galleryForm.instagramUrl) return alert("Select image or enter Instagram URL");
    
    setIsSubmitting(true);
    try {
      const data = new FormData();
      if (galleryFile) data.append('image', galleryFile);
      data.append('instagramUrl', galleryForm.instagramUrl);
      data.append('altText', galleryForm.altText);
      data.append('order', galleryForm.order);
      if (isSuper) data.append('adminId', selectedTenant);
      
      await API.post('/gallery', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setGalleryForm({ altText: '', instagramUrl: '', order: 0 });
      setGalleryFile(null);
      const fileInput = document.getElementById('galleryImageInput');
      if (fileInput) fileInput.value = '';
      fetchData();
      setShowMediaForm(false);
    } catch (err) {
      alert('Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteFaq = async (id) => {
    if(!window.confirm("Delete this FAQ entry?")) return;
    try {
      await API.delete(`/faq/${id}`);
      fetchData();
    } catch (err) { alert('Delete failed'); }
  };

  const deleteGallery = async (id) => {
    if(!window.confirm("Purge this media asset?")) return;
    try {
      await API.delete(`/gallery/${id}`);
      fetchData();
    } catch (err) { alert('Delete failed'); }
  };

  if (loading) return (
    <div className="py-40 text-center flex flex-col items-center justify-center gap-4">
       <div className="w-10 h-10 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
       <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Library...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* ── HEADER ── */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
           <h1 className="text-3xl font-black text-[#0A1128] tracking-tight">CMS Library</h1>
           <p className="text-slate-500 font-medium text-sm mt-1">Manage platform content, FAQs & media assets</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
           {isSuper && (
             <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm mr-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Context:</span>
                <select 
                  value={selectedTenant} 
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  className="bg-transparent border-none outline-none font-black text-[11px] text-orange-600 uppercase tracking-widest cursor-pointer focus:ring-0"
                >
                  <option value={user?._id}>Master Registry</option>
                  {resellers.map(r => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
             </div>
           )}
           <button onClick={() => setShowFaqForm(!showFaqForm)} className="flex-1 lg:flex-none bg-[#0A1128] text-white px-6 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg flex items-center justify-center gap-2">
              {showFaqForm ? <FaTimes /> : <FaPlus />} Add Knowledge
           </button>
           <button onClick={() => setShowMediaForm(!showMediaForm)} className="flex-1 lg:flex-none bg-white border border-slate-200 text-[#0A1128] px-6 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm flex items-center justify-center gap-2">
              <FaCloudUploadAlt /> Upload Asset
           </button>
        </div>
      </header>

      {/* ── TABS ── */}
      <div className="flex border-b border-slate-200">
         <button 
           onClick={() => setActiveTab('library')} 
           className={`pb-4 px-6 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'library' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
         >
           Studio & Library
         </button>
         <button 
           onClick={() => setActiveTab('about')} 
           className={`pb-4 px-6 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'about' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
         >
           About Us Content
         </button>
      </div>

      {activeTab === 'library' ? (
         <>
            {/* ── STATS CARDS ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Total FAQs', val: stats.totalFaqs, icon: <FaQuestionCircle />, color: 'orange' },
                { label: 'Categories', val: stats.categories, icon: <FaLayerGroup />, color: 'blue' },
                { label: 'Media Assets', val: stats.media, icon: <FaImages />, color: 'emerald' },
                { label: 'Live Content', val: stats.live, icon: <FaCheckCircle />, color: 'indigo' }
              ].map((s, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[28px] border border-slate-200/60 shadow-sm relative overflow-hidden group">
                   <div className="flex items-center justify-between mb-2">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[15px] bg-${s.color}-50 text-${s.color}-600 group-hover:scale-110 transition-transform`}>
                         {s.icon}
                      </div>
                      <span className="text-2xl font-black text-[#0A1128] tracking-tight">{s.val}</span>
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
              
              {/* ── KNOWLEDGE STUDIO (LEFT) ── */}
              <div className="xl:col-span-6 space-y-8">
                 <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                       <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Knowledge Studio</h3>
                       <div className="h-[1px] w-20 bg-slate-150 animate-pulse"></div>
                    </div>
                 </div>

                 <AnimatePresence>
                   {showFaqForm && (
                     <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-xl shadow-slate-200/20">
                        <form onSubmit={handleFaqSubmit} className="space-y-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Question</label>
                             <input type="text" placeholder="Enter query identity..." required value={faqForm.question} onChange={e => setFaqForm({...faqForm, question: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] outline-none focus:border-orange-500 font-bold text-[13px] text-[#0A1128] transition-all" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Answer</label>
                             <textarea placeholder="Enter official platform response..." required value={faqForm.answer} onChange={e => setFaqForm({...faqForm, answer: e.target.value})} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:border-orange-500 font-medium text-[13px] text-slate-600 leading-relaxed resize-none transition-all italic" rows="3" />
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Category</label>
                                <select value={faqForm.category} onChange={e => setFaqForm({...faqForm, category: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] font-black text-[11px] uppercase tracking-widest text-[#0A1128] outline-none appearance-none cursor-pointer">
                                   <option value="General">General FAQs</option>
                                   <option value="Arjee">Arjee FAQs</option>
                                   <option value="Bhog">Bhog FAQs</option>
                                   <option value="Swamani">Swamani FAQs</option>
                                   <option value="Hotel">Hospitality</option>
                                   <option value="Parking">Logistics</option>
                                </select>
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Priority</label>
                                <input type="number" value={faqForm.order} onChange={e => setFaqForm({...faqForm, order: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] font-black text-[11px] text-center uppercase tracking-widest" />
                             </div>
                          </div>
                          <button type="submit" disabled={isSubmitting} className="w-full bg-[#0A1128] text-white py-4 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl active:scale-95">
                             {isSubmitting ? 'Publishing...' : 'Publish FAQ'}
                          </button>
                        </form>
                     </motion.div>
                   )}
                 </AnimatePresence>

                 <div className="space-y-6">
                    {['General', 'Arjee', 'Bhog', 'Swamani', 'Hotel', 'Parking'].map(cat => {
                       const catFaqs = faqs.filter(f => f.category === cat);
                       const isExpanded = expandedCategory === cat;
                       if (catFaqs.length === 0 && !isExpanded) return null;

                       return (
                          <div key={cat} className="bg-white rounded-[32px] border border-slate-200/60 shadow-sm overflow-hidden transition-all duration-500">
                             <button 
                               onClick={() => setExpandedCategory(isExpanded ? '' : cat)}
                               className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                             >
                                <div className="flex items-center gap-4">
                                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] ${isExpanded ? 'bg-orange-500 text-white' : 'bg-slate-50 text-slate-400'} group-hover:scale-110 transition-all`}>
                                      <FaBook />
                                   </div>
                                   <span className="text-[12px] font-black text-[#0A1128] uppercase tracking-widest">{cat} Manifest</span>
                                </div>
                                <div className="flex items-center gap-4">
                                   <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{catFaqs.length} Entries</span>
                                   {isExpanded ? <FaChevronUp className="text-slate-300" /> : <FaChevronDown className="text-slate-300" />}
                                </div>
                             </button>

                             <AnimatePresence>
                               {isExpanded && (
                                 <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-50 overflow-hidden">
                                    <div className="p-6 space-y-4">
                                       {catFaqs.map((faq, i) => (
                                          <div key={faq._id} className="p-6 bg-slate-50/50 border border-slate-100 rounded-[24px] hover:border-orange-200 hover:bg-white transition-all relative group">
                                             <button onClick={() => deleteFaq(faq._id)} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white text-slate-300 hover:text-red-500 transition-all flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100">
                                                <FaTrash size={10} />
                                             </button>
                                             <div className="flex items-center gap-2 mb-2 pr-10">
                                                <FaCheckCircle className="text-blue-500" size={10} />
                                                <p className="font-black text-[#0A1128] text-[13px] tracking-tight leading-tight uppercase italic">{faq.question}</p>
                                             </div>
                                             <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic border-l-2 border-slate-200 pl-4">"{faq.answer}"</p>
                                             <div className="mt-4 flex items-center gap-3">
                                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest bg-white px-2 py-1 rounded-lg border border-slate-100">Priority: {faq.order}</span>
                                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live</span>
                                             </div>
                                          </div>
                                       ))}
                                       {catFaqs.length === 0 && (
                                          <p className="py-10 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No Knowledge Records</p>
                                       )}
                                    </div>
                                 </motion.div>
                               )}
                             </AnimatePresence>
                          </div>
                       );
                    })}
                 </div>
              </div>

              {/* ── MEDIA LIBRARY (RIGHT) ── */}
              <div className="xl:col-span-6 space-y-8">
                 <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                       <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Media Library</h3>
                       <div className="h-[1px] w-20 bg-slate-150 animate-pulse"></div>
                    </div>
                 </div>

                 <AnimatePresence>
                   {showMediaForm && (
                     <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-[#0A1128] rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 text-8xl -mr-10 -mt-10"><FaImages /></div>
                        <form onSubmit={handleGallerySubmit} className="space-y-6 relative z-10">
                          <label htmlFor="galleryImageInput" className="block w-full p-8 border-2 border-dashed border-white/10 rounded-[28px] text-center cursor-pointer hover:border-orange-500 hover:bg-white/5 transition-all group">
                             <input type="file" id="galleryImageInput" accept="image/*" onChange={e => setGalleryFile(e.target.files[0])} className="hidden" />
                             {galleryFile ? (
                               <div className="space-y-1">
                                  <FaCheckCircle size={24} className="mx-auto text-emerald-500 mb-2" />
                                  <p className="text-[11px] font-black text-white uppercase tracking-widest truncate">{galleryFile.name}</p>
                               </div>
                             ) : (
                               <div className="flex flex-col items-center">
                                  <FaCloudUploadAlt size={28} className="text-white/20 mb-2 group-hover:scale-110 transition-transform" />
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Upload Media Manifest</span>
                                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">JPG, PNG or WEBP</span>
                               </div>
                             )}
                          </label>

                          <div className="relative">
                             <FaInstagram className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-500" size={14} />
                             <input type="text" placeholder="Instagram Content Link" value={galleryForm.instagramUrl} onChange={e => setGalleryForm({...galleryForm, instagramUrl: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-orange-500 font-black text-[11px] text-white placeholder:text-slate-600 transition-all" />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <input type="text" placeholder="Asset Description" value={galleryForm.altText} onChange={e => setGalleryForm({...galleryForm, altText: e.target.value})} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-orange-500 font-black text-[11px] text-white placeholder:text-slate-600 transition-all" />
                             <input type="number" placeholder="Sort Order" value={galleryForm.order} onChange={e => setGalleryForm({...galleryForm, order: e.target.value})} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-[20px] font-black text-[11px] text-white text-center" />
                          </div>

                          <button type="submit" disabled={isSubmitting} className="w-full bg-white text-[#0A1128] py-4 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-2xl">
                             {isSubmitting ? 'Syncing...' : 'Save Asset'}
                          </button>
                        </form>
                     </motion.div>
                   )}
                 </AnimatePresence>

                 <div className="bg-white rounded-[40px] border border-slate-200/60 shadow-sm p-8">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                       <AnimatePresence>
                       {galleries.map((img, i) => (
                          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} key={img._id} className="relative group aspect-[4/5] rounded-[24px] overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                             {img.instagramUrl ? (
                               getInstaThumbnail(img.instagramUrl) ? (
                                 <img src={getInstaThumbnail(img.instagramUrl)} alt={img.altText} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                               ) : (
                                 <div className="w-full h-full bg-gradient-to-tr from-orange-500 via-pink-500 to-indigo-600 flex flex-col items-center justify-center text-white p-6 text-center">
                                    <FaInstagram size={24} className="mb-2" />
                                    <span className="text-[8px] font-black uppercase tracking-widest leading-tight">Media Gallery<br/>External</span>
                                 </div>
                               )
                             ) : (
                               <img src={getMediaUrl(img.imageUrl)} alt={img.altText} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                             )}
                             
                             <div className="absolute inset-0 bg-[#0A1128]/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-6 gap-3">
                                <button onClick={() => deleteGallery(img._id)} className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-lg active:scale-90">
                                   <FaTrash size={14} />
                                </button>
                                <p className="text-[8px] font-black text-white uppercase tracking-[0.2em] text-center line-clamp-2">{img.altText || 'Media Asset'}</p>
                                {img.instagramUrl && (
                                   <a href={img.instagramUrl} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors"><FaExternalLinkAlt size={10} /></a>
                                )}
                             </div>
                             <div className="absolute bottom-4 left-4">
                                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[7px] font-black text-white uppercase tracking-widest border border-white/10">#{img.order || i+1}</span>
                             </div>
                          </motion.div>
                       ))}
                       </AnimatePresence>
                       {galleries.length === 0 && (
                          <div className="col-span-full py-20 text-center opacity-20">
                             <FaImages size={48} className="mx-auto mb-4" />
                             <p className="text-[10px] font-black uppercase tracking-[0.4em]">Library is empty</p>
                          </div>
                       )}
                    </div>
                 </div>
              </div>

            </div>
         </>
      ) : (
         <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-4xl mx-auto">
           <div className="bg-white rounded-[40px] border border-slate-200/60 shadow-sm p-8 md:p-12">
             <h2 className="text-2xl font-black text-[#0A1128] uppercase tracking-[0.2em] mb-8 text-center italic">About Us Editor</h2>
             <form onSubmit={handleAboutSubmit} className="space-y-8">
               
               {/* Introduction / Genesis Section */}
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> The Genesis (Introductory Quote)
                  </label>
                  <textarea 
                    required 
                    value={aboutForm.intro} 
                    onChange={e => setAboutForm({...aboutForm, intro: e.target.value})} 
                    className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:border-orange-500 font-medium text-[13px] text-slate-600 leading-relaxed resize-none transition-all italic" 
                    rows="3" 
                    placeholder="Enter introductory quote..."
                  />
               </div>

               {/* Mission & Devotional Value Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Our Mission
                     </label>
                     <textarea 
                       required 
                       value={aboutForm.mission} 
                       onChange={e => setAboutForm({...aboutForm, mission: e.target.value})} 
                       className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:border-orange-500 font-medium text-[13px] text-slate-600 leading-relaxed resize-none transition-all" 
                       rows="4" 
                       placeholder="Describe the mission..."
                     />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Devotional Value (Services)
                     </label>
                     <textarea 
                       required 
                       value={aboutForm.services} 
                       onChange={e => setAboutForm({...aboutForm, services: e.target.value})} 
                       className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[24px] outline-none focus:border-orange-500 font-medium text-[13px] text-slate-600 leading-relaxed resize-none transition-all" 
                       rows="4" 
                       placeholder="Describe the services/devotional value..."
                     />
                  </div>
               </div>

               {/* Why Choose Us Cards */}
               <div className="space-y-4">
                  <h3 className="text-xs font-black text-[#0A1128] uppercase tracking-[0.2em] px-2 border-b border-slate-150 pb-2">Why Choose Us (3 Feature Cards)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {aboutForm.whyUs.map((card, idx) => (
                        <div key={idx} className="bg-slate-50/50 p-6 rounded-[28px] border border-slate-100 space-y-4">
                           <span className="px-3 py-1 bg-orange-50 rounded-full text-[8px] font-black text-orange-600 uppercase tracking-widest">Card {idx + 1}</span>
                           <div className="space-y-1">
                              <input 
                                type="text" 
                                required 
                                placeholder="Card Title" 
                                value={card.title} 
                                onChange={e => {
                                   const newWhy = [...aboutForm.whyUs];
                                   newWhy[idx].title = e.target.value;
                                   setAboutForm({...aboutForm, whyUs: newWhy});
                                }} 
                                className="w-full px-4 py-3 bg-white border border-slate-100 rounded-[16px] outline-none focus:border-orange-500 font-black text-[11px] text-[#0A1128]" 
                              />
                           </div>
                           <div className="space-y-1">
                              <textarea 
                                required 
                                placeholder="Card Description" 
                                value={card.desc} 
                                onChange={e => {
                                   const newWhy = [...aboutForm.whyUs];
                                   newWhy[idx].desc = e.target.value;
                                   setAboutForm({...aboutForm, whyUs: newWhy});
                                }} 
                                className="w-full p-4 bg-white border border-slate-100 rounded-[16px] outline-none focus:border-orange-500 font-medium text-[11px] text-slate-500 leading-relaxed resize-none" 
                                rows="3" 
                              />
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Assistance Details */}
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Assistance & Support Info
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={aboutForm.contact} 
                    onChange={e => setAboutForm({...aboutForm, contact: e.target.value})} 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] outline-none focus:border-orange-500 font-black text-[12px] text-[#0A1128]" 
                    placeholder="e.g., support@shyambhog.com | +91 98765 43210"
                  />
               </div>

               {/* Save Button */}
               <div className="pt-4 flex justify-center">
                  <button 
                    type="submit" 
                    disabled={aboutSaving} 
                    className="w-full max-w-xs bg-[#0A1128] text-white py-4.5 rounded-[24px] font-black text-[11px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
                  >
                     {aboutSaving ? 'Updating Registry...' : 'Save About Us Content'}
                  </button>
               </div>

             </form>
           </div>
         </motion.div>
      )}
    </div>
  );
}
