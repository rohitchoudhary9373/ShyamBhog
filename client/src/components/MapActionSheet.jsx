import { motion, AnimatePresence } from 'framer-motion';
import { FaMapMarkerAlt, FaApple, FaGoogle, FaTimes } from 'react-icons/fa';

export default function MapActionSheet({ isOpen, onClose, locationName, mapUrl }) {
  if (!isOpen) return null;

  const openAppleMaps = () => {
    window.open(`http://maps.apple.com/?q=${encodeURIComponent(locationName)}`, '_blank');
    onClose();
  };

  const openGoogleMaps = () => {
    window.open(mapUrl || `https://maps.google.com/?q=${encodeURIComponent(locationName)}`, '_blank');
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] flex items-end justify-center bg-[#0A1128]/40 backdrop-blur-sm sm:items-center p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-sm bg-white rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-6 shadow-2xl relative"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden"></div>
          
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
            <FaTimes size={20} />
          </button>
          
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4 shadow-sm">
              <FaMapMarkerAlt size={24} />
            </div>
            <h3 className="text-xl font-black text-[#0A1128] tracking-tighter uppercase">{locationName}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Choose Navigation App</p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={openAppleMaps}
              className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-900 hover:text-white transition-all group"
            >
              <div className="flex items-center gap-4">
                <FaApple size={24} className="text-slate-700 group-hover:text-white transition-colors" />
                <span className="font-bold text-sm">Apple Maps</span>
              </div>
            </button>
            <button 
              onClick={openGoogleMaps}
              className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-900 hover:text-white transition-all group"
            >
              <div className="flex items-center gap-4">
                <FaGoogle size={20} className="text-blue-500 group-hover:text-white transition-colors" />
                <span className="font-bold text-sm">Google Maps</span>
              </div>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
