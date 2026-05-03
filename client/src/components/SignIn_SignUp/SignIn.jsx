import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ChefHat, UtensilsCrossed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { recipeService } from '../../services/recipeService';
import './SignIn_SignUp.css';

import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/slices/authSlice';
import PageLoader from '../shared/PageLoader';

const images = ['/bg1.png', '/bg2.jpg', '/bg3.jpg'];

export default function SignIn() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Slideshow Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000); 
    return () => clearInterval(timer);
  }, []);

  const handleLoginSuccess = (response) => {
    const userData = {
      firstName: response.user?.firstName || response.user?.name || response.firstName || 'Chef',
      email: response.user?.email || response.email || email
    };
    dispatch(setCredentials({ user: userData, token: response.token }));
    setShowSuccess(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      triggerShake();
      return;
    }
    try {
      setLoading(true);
      const response = await recipeService.login(email, password);
      handleLoginSuccess(response);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Login failed. Please try again.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await res.json();
        // Send to backend and get token + user data
        const response = await recipeService.googleLogin(tokenResponse.access_token);
        // Merge Google info if backend response is missing it
        const finalUser = {
          ...response.user,
          firstName: response.user?.firstName || userInfo.given_name || userInfo.name
        };
        handleLoginSuccess({ ...response, user: finalUser });
      } catch (err) {
        setError('Google Login failed. Please try again.');
        triggerShake();
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google Login failed.');
      triggerShake();
    },
  });

  const triggerShake = () => {
    setShakeError(true);
    setTimeout(() => setShakeError(false), 500);
  };

  if (showSuccess) {
    return <PageLoader isVisible={true} />;
  }

  return (
    <div className="font-jakarta text-on-surface bg-background mesh-gradient min-h-screen flex items-center justify-center p-6 selection:bg-primary-container selection:text-on-primary-container overflow-hidden">
      
      {/* Background Image */}
      <div className="fixed inset-0 z-0 opacity-40 overflow-hidden pointer-events-none">
        <img
          src="/bg.png"
          alt="Spice Background"
          className="w-full h-full object-cover animate-breathe"
        />
      </div>

      <main className="relative z-10 w-full max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        
        {/* Left Side: Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex flex-col gap-6 w-full max-w-md mx-auto lg:mx-0 items-center text-center justify-center"
        >
          <div className="relative w-full aspect-square max-w-[280px]">
            <div className="absolute inset-0 bg-primary-container/20 rounded-[3rem] rotate-6"></div>
            <div className="absolute inset-0 bg-secondary-container/10 rounded-[3rem] -rotate-3"></div>
            <div className="relative h-full w-full rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/50 group bg-white/10">
              <AnimatePresence initial={false}>
                <motion.img
                  key={currentImageIndex}
                  src={images[currentImageIndex]}
                  alt="Culinary Masterpiece"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -right-6 glass-panel p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-primary/10 z-20"
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: "#ff6b35" }}
              >
                <UtensilsCrossed size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-stone-900">500+ Recipes</p>
                <p className="text-xs text-stone-500">Added weekly</p>
              </div>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg text-stone-800 text-center mx-auto font-bold leading-relaxed max-w-[340px] mt-4"
          >
            Turn your pantry into a gourmet kitchen. Join thousands of home chefs creating magic every single day.
          </motion.p>
        </motion.div>

        {/* Right Side: Card */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -5 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center lg:justify-end w-full"
        >
          <div className="glass-panel w-full max-w-md rounded-[2.5rem] p-6 lg:p-8 shadow-[0_32px_64px_-16px_rgba(171,53,0,0.15)] flex flex-col gap-4 border border-white/40 hover:border-brand-orange/20 transition-colors duration-500">
            
            <div className="flex flex-col gap-1 text-center">
              <h2 className="text-h2 text-on-surface">Welcome back!</h2>
              <p className="text-body-md text-on-surface-variant">Ready to whip up something delicious?</p>
            </div>

            <div className="bg-surface-variant/40 p-1 rounded-full flex relative mt-2">
              <button className="flex-1 py-2 text-label-bold text-on-primary-container bg-white rounded-full shadow-sm z-10 transition-all">
                Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="flex-1 py-2 text-label-bold text-on-surface-variant hover:text-on-surface transition-colors z-10"
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className={`flex flex-col gap-3 ${shakeError ? 'animate-shake' : ''}`}>
              <div className="flex flex-col gap-1.5">
                <label className="text-label-bold text-on-surface ml-2 text-xs uppercase tracking-wider">Email Address</label>
                <div className="relative group shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-brand-orange group-focus-within:scale-110 transition-all duration-300 flex items-center justify-center z-10">
                    <Mail size={18} />
                  </span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-surface rounded-2xl border-none ring-1 ring-outline-variant focus:ring-4 focus:ring-brand-orange/10 focus:border-brand-orange transition-all duration-300 text-body-md text-on-surface placeholder:text-stone-400 outline-none"
                    placeholder="chef@clickandcook.com"
                    type="email"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center px-2">
                  <label className="text-label-bold text-on-surface text-xs uppercase tracking-wider">Password</label>
                  <button type="button" className="text-label-sm text-primary hover:underline font-bold transition-all">Forgot?</button>
                </div>
                <div className="relative group shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-brand-orange group-focus-within:scale-110 transition-all duration-300 flex items-center justify-center z-10">
                    <Lock size={18} />
                  </span>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-surface rounded-2xl border-none ring-1 ring-outline-variant focus:ring-4 focus:ring-brand-orange/10 focus:border-brand-orange transition-all duration-300 text-body-md text-on-surface placeholder:text-stone-400 outline-none"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors z-10"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 shadow-sm"
                  >
                    <p className="text-xs font-medium text-red-800">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative overflow-hidden flex items-center justify-center gap-2 py-3 bg-[#75070C] text-white font-black rounded-2xl shadow-lg hover:shadow-xl hover:bg-[#8b0910] active:scale-[0.98] transition-all duration-300 group disabled:opacity-60 btn-fluid-fill"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Get Cooking
                      <ChefHat size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                    </>
                  )}
                </span>
              </button>

              <p className="text-center text-sm text-stone-500">
                Don't have an account?{' '}
                <button type="button" onClick={() => navigate('/signup')}
                  className="text-brand-red font-bold hover:text-brand-orange transition-colors link-underline-effect"
                >
                  Sign up
                </button>
              </p>
            </form>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-outline-variant"></div>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">or continue with</span>
                <div className="h-px flex-1 bg-outline-variant"></div>
              </div>

              <button
                onClick={() => googleLogin()}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-2xl border border-outline-variant bg-white/60 hover:bg-white hover:shadow-md transition-all duration-300 active:scale-95 group disabled:opacity-50"
              >
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="text-label-bold text-stone-700">Google</span>
              </button>

              <div className="flex items-center justify-center gap-2 py-3 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                <UtensilsCrossed size={14} className="text-[#ff6b35]" />
                <p className="text-[10px] text-stone-500 italic">
                  Psst... our signature Lasagna recipe just went viral!
                </p>
              </div>
            </div>

          </div>
        </motion.div>
      </main>
    </div>
  );
}