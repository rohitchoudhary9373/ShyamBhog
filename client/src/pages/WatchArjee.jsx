import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaChevronLeft, FaVideo, FaPlay, FaHistory, FaInstagram } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { getMediaUrl } from '../utils/url';

export default function WatchArjee() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const settingsAdminId = settings?.adminId;
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const tenantId = settingsAdminId || localStorage.getItem('tenantId') || '';
        const res = await API.get(`/ritual-videos?tenantId=${tenantId}`);
        setVideos(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [settingsAdminId]);

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

  const handleOpenLink = (url) => {
    if (!url) return;
    const finalUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#FDF8F1] flex flex-col items-center font-sans selection:bg-orange-100">
      
      {/* ── LUXURY HEADER ── */}
      <nav className="w-full max-w-xl px-6 pt-10 pb-6 flex flex-col items-center text-center gap-2 relative">
        <button 
          onClick={() => navigate('/')} 
          className="absolute left-6 top-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-center text-slate-400 hover:text-orange-600 transition-all active:scale-90 border border-slate-100"
        >
          <FaChevronLeft size={14}/>
        </button>
        <h1 className="text-3xl font-black text-[#0A1128] tracking-tighter uppercase italic">Ritual <span className="text-orange-600 underline decoration-orange-200">Proofs</span></h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse"></span>
          Live from Khatu Dham
        </p>
      </nav>

      <main className="w-full max-w-xl px-4 pb-32">
        
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-4">
             <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Invoking Divine Proofs...</p>
          </div>
        ) : (videos && videos.length > 0) ? (
          <div className="flex flex-col items-center gap-10">
            {videos.map((vid, idx) => {
              if (!vid) return null;
              const fullUrl = getMediaUrl(vid.videoUrl);
              const thumbUrl = vid.instagramUrl ? getInstaThumbnail(vid.instagramUrl) : null;

              return (
                <motion.div 
                  key={vid._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15 }}
                  onClick={() => handleOpenLink(vid.instagramUrl || fullUrl)}
                  className="group relative w-[88%] aspect-video rounded-[24px] overflow-hidden bg-[#0A1128] shadow-2xl shadow-orange-900/10 border border-white/60 cursor-pointer"
                >
                  {/* Media Content */}
                  <div className="absolute inset-0 z-0">
                    {vid.instagramUrl ? (
                      <img 
                        src={thumbUrl || 'https://images.unsplash.com/photo-1544111306-699703f8373a?q=80&w=800&auto=format&fit=crop'} 
                        alt={vid.title} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80'; }}
                      />
                    ) : (
                      <video 
                        src={fullUrl} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700"
                        muted loop playsInline autoPlay
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A1128] via-transparent to-black/20"></div>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-5 left-5 z-20">
                    <span className="bg-orange-600/90 backdrop-blur-md text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-lg tracking-widest shadow-xl border border-white/20">
                      {vid.category || 'Ritual'}
                    </span>
                  </div>

                  {/* Play Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                     <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        <FaPlay size={14} className="ml-1" />
                     </div>
                  </div>

                  {/* Content Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-[9px] text-orange-200 font-bold uppercase tracking-widest opacity-80">
                       <FaHistory size={8}/> 
                       {vid.createdAt ? new Date(vid.createdAt).toLocaleDateString() : 'Sacred Proof'}
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-tight line-clamp-2">
                      {vid.title}
                    </h3>
                  </div>

                  {/* Premium Texture Overlay */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center bg-white/40 rounded-[40px] border border-dashed border-orange-200">
             <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-200 mx-auto mb-4">
                <FaVideo size={24}/>
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No divine proofs yet</p>
          </div>
        )}

      </main>
    </div>
  );
}
