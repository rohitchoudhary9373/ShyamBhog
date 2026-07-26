import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "../context/SettingsContext";
import { FaPray, FaShieldAlt, FaCheckCircle, FaLock } from "react-icons/fa";
import API from "../services/api";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getMediaUrl } from "../utils/url";

export default function Login() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const searchParams = new URLSearchParams(window.location.search);
  const redirectUrl = searchParams.get('redirect');

  const [logoutSuccess, setLogoutSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("logout_success") === "true") {
      setLogoutSuccess(true);
      localStorage.removeItem("logout_success");
      const timer = setTimeout(() => {
        setLogoutSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential.accessToken;
      const idToken = credential.idToken;

      const res = await API.post('/auth/google', { 
         tokenId: accessToken || idToken,
         isAccessToken: !!accessToken 
      });

      const dbUser = res.data.user || res.data;
      const dbToken = res.data.token;

      localStorage.setItem("token", dbToken);
      localStorage.setItem("userInfo", JSON.stringify(dbUser));

      if (dbUser.role === "admin" || dbUser.role === "agent") navigate("/admin");
      else if (redirectUrl) navigate(redirectUrl);
      else navigate("/");

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Google Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FDF8F1] py-12 md:py-20 px-4 flex items-center justify-center font-sans">
      
      {/* 🔹 Main Clean Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-slate-200/60 p-8 md:p-12 border border-slate-100 relative overflow-hidden"
      >
        {/* Decorative Glows */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/10 blur-[60px] rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-primary/10 blur-[60px] rounded-full -ml-16 -mb-16"></div>

        <div className="relative z-10">
          
          {/* ── LOGO & BRAND ── */}
          <div className="text-center mb-8">
             <div className="flex flex-col items-center gap-4">
                {settings?.logoUrl && !logoError && (
                   <img src={getMediaUrl(settings.logoUrl)} alt="logo" className="h-20 w-auto object-contain drop-shadow-sm" onError={() => setLogoError(true)} />
                )}
               <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">{settings?.brandName || "Shyam Bhog"}</h1>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Secure Devotee Portal</p>
            </div>
          </div>

          <div className="space-y-6">
            
            <AnimatePresence>
              {logoutSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-3 text-center justify-center"
                >
                  <FaCheckCircle className="text-emerald-500 shrink-0" size={14} /> Logged out successfully
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-3 text-center justify-center"
                >
                  ⚠ {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── EXCLUSIVE GOOGLE LOGIN BUTTON ── */}
            <div className="space-y-4 pt-2">
              <button 
                 type="button"
                 onClick={handleGoogleLogin}
                 disabled={loading}
                 className="w-full flex items-center justify-center gap-4 py-5 px-6 border-2 border-orange-100 hover:border-orange-500 bg-white hover:bg-orange-50/40 rounded-[24px] transition-all group shadow-md active:scale-95 disabled:opacity-50"
              >
                 {loading ? (
                   <div className="w-6 h-6 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                 ) : (
                   <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="google" className="w-6 h-6 shrink-0 group-hover:scale-110 transition-transform" />
                 )}
                 <span className="text-sm font-black text-slate-800 uppercase tracking-widest">
                   {loading ? "Authenticating..." : "Continue with Google"}
                 </span>
              </button>

              <div className="flex items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <FaLock className="text-emerald-500 shrink-0" size={11} />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">100% Encrypted & Passwordless Access</span>
              </div>
            </div>

          </div>

          {/* ── FOOTER TAGLINE ── */}
          <div className="mt-10 pt-6 border-t border-slate-100 text-center space-y-2">
             <div className="flex items-center justify-center gap-2 text-primary font-black text-[11px] uppercase tracking-widest italic">
                <FaPray /> Jai Shree Shyam 🙏
             </div>
             <p className="text-[10px] text-slate-400 font-bold max-w-[260px] mx-auto leading-relaxed">
               Your devotion, our ritual. We ensure your offerings reach the divine with absolute care and transparency.
             </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}