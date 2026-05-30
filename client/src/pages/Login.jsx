import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "../context/SettingsContext";
import { FaPhoneAlt, FaLock, FaUser, FaArrowRight, FaPray } from "react-icons/fa";
import API from "../services/api";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getMediaUrl } from "../utils/url";

export default function Login() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const searchParams = new URLSearchParams(window.location.search);
  const redirectUrl = searchParams.get('redirect');

  const [isLogin, setIsLogin] = useState(true);
  const [logoutSuccess, setLogoutSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    password: "",
  });

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mobile || !formData.password) return setError("Credential & Password required");
    if (!isLogin && !formData.name) return setError("Name required");

    setLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const isEmail = formData.mobile.includes('@');
      
      let payload;
      if (isLogin) {
        payload = { 
          [isEmail ? 'email' : 'mobile']: formData.mobile, 
          password: formData.password 
        };
      } else {
        payload = {
          name: formData.name,
          [isEmail ? 'email' : 'mobile']: formData.mobile,
          password: formData.password
        };
      }

      const res = await API.post(endpoint, payload);

      const user = res.data.user || res.data;
      const token = res.data.token;

      localStorage.setItem("token", token);
      localStorage.setItem("userInfo", JSON.stringify(user));

      if (user.role === "admin" || user.role === "agent") navigate("/admin");
      else if (redirectUrl) navigate(redirectUrl);
      else navigate("/");

    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential.accessToken;
      const idToken = credential.idToken;
      // The signed-in user info.
      const user = result.user;

      // Send the token to the backend
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
        {/* Subtle Decorative Glows */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/5 blur-[60px] rounded-full -ml-16 -mb-16"></div>

        <div className="relative z-10">
          
          {/* ── LOGO ── */}
          <div className="text-center mb-10">
             <div className="flex flex-col items-center gap-4">
                {settings?.logoUrl && !logoError && (
                   <img src={getMediaUrl(settings.logoUrl)} alt="logo" className="h-20 w-auto object-contain drop-shadow-sm" onError={() => setLogoError(true)} />
                )}
               <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">{settings?.brandName || "Shyam Bhog"}</h1>
            </div>
          </div>

          <div className="space-y-8">
            
            {/* ── GOOGLE LOGIN BUTTON ── */}
            <button 
               type="button"
               onClick={handleGoogleLogin}
               className="w-full flex items-center justify-center gap-4 py-4 border-2 border-slate-100 rounded-[24px] hover:border-primary hover:bg-orange-50/50 transition-all group shadow-sm bg-white"
            >
               <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="google" className="w-6 h-6" />
               <span className="text-sm font-black text-slate-700 uppercase tracking-widest">Continue with Google</span>
            </button>

            <div className="flex items-center gap-4 px-4">
               <div className="flex-grow h-px bg-slate-100"></div>
               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">or use credentials</span>
               <div className="flex-grow h-px bg-slate-100"></div>
            </div>

            <AnimatePresence>
              {logoutSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-3 text-center justify-center"
                >
                  ✓ Logged out successfully
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

            {/* ── FORM ── */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-5 overflow-hidden"
                  >
                    <div className="relative group">
                      <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
                      <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary/50 focus:bg-white font-bold transition-all placeholder:text-slate-300 text-slate-700"
                        required={!isLogin}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative group">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  name="mobile"
                  placeholder="Mobile or Email"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary/50 focus:bg-white font-bold transition-all placeholder:text-slate-300 text-slate-700"
                  required
                />
              </div>

              <div className="relative group">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary/50 focus:bg-white font-bold transition-all placeholder:text-slate-300 text-slate-700"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl hover:bg-primary active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? "Processing..." : (isLogin ? "Sign In" : "Register")}
                {!loading && <FaArrowRight size={12} />}
              </button>
            </form>

            <div className="text-center pt-4">
              <button
                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors"
              >
                {isLogin ? "Need an account? Create One" : "Already a devotee? Login Now"}
              </button>
            </div>
          </div>

          {/* ── FOOTER TAGLINE ── */}
          <div className="mt-12 pt-8 border-t border-slate-50 text-center space-y-2">
             <div className="flex items-center justify-center gap-2 text-primary font-black text-[11px] uppercase tracking-widest italic">
                <FaPray /> Jai Shree Shyam 🙏
             </div>
             <p className="text-[10px] text-slate-400 font-bold max-w-[240px] mx-auto leading-relaxed">
               Your devotion, our ritual. We ensure your offerings reach the divine with absolute care.
             </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}