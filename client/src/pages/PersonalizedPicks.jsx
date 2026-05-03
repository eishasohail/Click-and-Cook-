import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Search, User, RefreshCw,
  Utensils, Flame, Leaf, Bookmark,
  Timer, Sparkles, ChefHat, Wand2, LogOut
} from 'lucide-react';
import { logout } from '../redux/slices/authSlice';
import Logo from "../components/shared/Logo";

const SafeLogo = (props) => {
  if (typeof Logo !== 'undefined') return <Logo {...props} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
      <div style={{ fontWeight: '900', fontSize: '24px', color: '#2A241E', letterSpacing: '-0.5px' }}>
        Click<span style={{ color: '#75070C' }}>&</span>Cook
      </div>
      <div style={{ fontSize: '10px', fontWeight: '800', color: '#2A241E', opacity: 0.6, letterSpacing: '1px', textTransform: 'uppercase' }}>
        Smart Kitchen Companion
      </div>
    </div>
  );
};

import PageLoader from '../components/shared/PageLoader';

const PersonalizedPicks = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);

  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRefreshLoader, setShowRefreshLoader] = useState(false);
  const [tasteProfile, setTasteProfile] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!token) {
      navigate('/signin');
      return;
    }
    fetchPicks();
  }, [token, navigate]);

  const fetchPicks = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setShowRefreshLoader(true);
      } else {
        setLoading(true);
        setShowRefreshLoader(true); // Also show global loader on first entry
      }
      setError(null);

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

      const res = await axios.get(
        `${API_BASE_URL}/api/recipes/recommendations?refresh=${isRefresh}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPicks(res.data.picks || []);
      setTasteProfile(res.data.profile || null);
    } catch (err) {
      console.error('Failed to fetch picks:', err);
      setError('Failed to load recommendations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setShowRefreshLoader(false); // Hide ONLY when everything is done
    }
  };

  const handleRefresh = () => fetchPicks(true);

  const handleGenerate = (pick) => {
    navigate('/ai-recipes', { 
      state: { 
        prefillIngredients: pick.keyIngredients,
        prefillCalories: pick.estimatedCalories,
        prefillNotes: `Make ${pick.name} style recipe`
      } 
    });
  };

  const getCategoryGradient = (category) => {
    const gradients = {
      'Dinner': 'linear-gradient(135deg, #75070C, #C62828)',
      'Healthy': 'linear-gradient(135deg, #2E7D32, #4F6815)',
      'Breakfast': 'linear-gradient(135deg, #FFD700, #FF6B35)',
      'Lunch': 'linear-gradient(135deg, #4F6815, #7CB342)',
      'Desserts': 'linear-gradient(135deg, #E91E63, #FF6B35)',
      'Drinks': 'linear-gradient(135deg, #0288D1, #26C6DA)',
      'Snacks': 'linear-gradient(135deg, #F57C00, #FFB300)',
      'Vegan': 'linear-gradient(135deg, #388E3C, #66BB6A)',
      'Italian': 'linear-gradient(135deg, #75070C, #FF6B35)',
      'Brunch': 'linear-gradient(135deg, #FFD700, #FF6B35)',
    };
    return gradients[category] || 'linear-gradient(135deg, #75070C, #FF6B35)';
  };

  const filteredPicks = picks.filter(pick => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchName = (pick.name || '').toLowerCase().includes(q);
    const matchCat = (pick.category || '').toLowerCase().includes(q);
    const matchIng = (pick.keyIngredients || []).some(ing => ing.toLowerCase().includes(q));
    return matchName || matchCat || matchIng;
  });

  return (
    <div style={{ backgroundColor: '#F0E6DA', minHeight: '100vh', fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#2A241E' }}>
      
      {/* ── Page Loader for Refresh ── */}
      <PageLoader isVisible={showRefreshLoader} />

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: '20px 0',
        backgroundColor: 'rgba(255, 248, 246, 0.9)',
        backdropFilter: 'blur(20px)',
        transition: 'all 0.4s ease',
        borderBottom: scrolled ? `1px solid rgba(171, 53, 0, 0.1)` : 'none'
      }}>
        <div style={{ position: 'relative', maxWidth: '1440px', margin: '0 auto', padding: '0 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            <SafeLogo />
          </div>

          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '35px', alignItems: 'center' }}>
            <span onClick={() => navigate('/ai-recipes')} style={{ fontWeight: '700', color: '#594139', cursor: 'pointer', fontSize: '14px', opacity: 0.7, transition: 'opacity 0.3s' }} onMouseEnter={(e) => (e.target.style.opacity = 1)} onMouseLeave={(e) => (e.target.style.opacity = 0.7)}>Recipe Generator</span>
            <span onClick={() => navigate('/library')} style={{ fontWeight: '700', color: '#594139', cursor: 'pointer', fontSize: '14px', opacity: 0.7, transition: 'opacity 0.3s' }} onMouseEnter={(e) => (e.target.style.opacity = 1)} onMouseLeave={(e) => (e.target.style.opacity = 0.7)}>My CookBook</span>
            <span onClick={() => navigate('/personalized-picks')} style={{ fontWeight: '800', color: '#75070C', cursor: 'pointer', fontSize: '14px', borderBottom: `2px solid #75070C`, paddingBottom: '4px' }}>Personalized Picks</span>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', backgroundColor: 'rgba(117, 7, 12, 0.05)', borderRadius: '100px' }}>
              <div style={{ width: '32px', height: '32px', backgroundColor: '#75070C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 8px rgba(117, 7, 12, 0.2)' }}>
                <User size={16} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#2A241E' }}>{user?.firstName || 'Chef'}</span>
            </div>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '120px 60px 60px 60px' }}>
        
        {/* Page Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: '40px',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '40px', fontWeight: '900',
              color: '#2A241E', margin: '0 0 8px 0',
              letterSpacing: '-0.02em'
            }}>
              Personalized Picks
            </h1>
            <p style={{ 
              fontSize: '18px', color: '#594139',
              margin: 0, fontWeight: '500'
            }}>
              Crafted by AI, inspired by your taste
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Minimal Local Search Bar */}
            <div className="relative w-64">
              <Search size={16} color="#2A241E" className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
              <input 
                type="text" 
                placeholder="Filter picks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3 pl-12 pr-4 rounded-full bg-white border border-[#E1BFB5]/30 text-sm font-semibold outline-none transition-all focus:border-[#75070C] focus:ring-2 focus:ring-[#75070C]/10 shadow-sm"
              />
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-water"
              style={{
                display: 'flex', alignItems: 'center',
                gap: '8px', backgroundColor: '#75070C',
                color: 'white', padding: '12px 24px',
                borderRadius: '100px', border: 'none',
                fontWeight: '700', fontSize: '14px',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                opacity: refreshing ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(117,7,12,0.2)',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
              position: 'relative', overflow: 'hidden'
            }}
          >
            <motion.div
              animate={{ rotate: refreshing ? 360 : 0 }}
              transition={{ 
                duration: 0.8, 
                ease: "linear",
                repeat: refreshing ? Infinity : 0
              }}
            >
              <RefreshCw size={16} />
            </motion.div>
            <span style={{ position: 'relative', zIndex: 1 }}>
              {refreshing ? 'Curating...' : 'Refresh Picks'}
            </span>
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
            <Sparkles size={20} />
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-[1.5rem] overflow-hidden border border-[#E1BFB5]/30">
                <div className="h-48 bg-[#F0E6DA]" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-[#F0E6DA] rounded w-3/4" />
                  <div className="h-4 bg-[#F0E6DA] rounded w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-[#F0E6DA] rounded-full w-20" />
                    <div className="h-6 bg-[#F0E6DA] rounded-full w-20" />
                  </div>
                  <div className="pt-4 border-t border-[#F0E6DA]">
                    <div className="h-10 bg-[#F0E6DA] rounded-xl w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <div className="space-y-12">
            
            {/* Taste Profile Card */}
            {tasteProfile && (
              <section>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[24px] p-8 border border-[#E1BFB5]/40"
                  style={{ boxShadow: '0 4px 6px -1px rgba(117,7,12,0.05)' }}
                >
                  <div className="flex items-center gap-3 mb-8">
                    <div style={{
                      width: '48px', height: '48px',
                      backgroundColor: '#FFF1ED',
                      borderRadius: '16px',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Sparkles size={24} color="#75070C" />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#2A241E', margin: 0 }}>
                        Your Taste Profile
                      </h2>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: '#594139', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Based on {tasteProfile.totalSaved} saved recipes
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { 
                        icon: <Utensils size={20} color="#75070C" />,
                        label: 'Fav Category',
                        value: tasteProfile.favCategory || 'Dinner',
                        bg: '#FFF1ED'
                      },
                      {
                        icon: <Flame size={20} color="#FF6B35" />,
                        label: 'Avg Cal',
                        value: tasteProfile.avgCalories ? `${tasteProfile.avgCalories} kcal` : '750 kcal',
                        bg: '#FFF8F1'
                      },
                      {
                        icon: <Leaf size={20} color="#4F6815" />,
                        label: 'Top Ingredient',
                        value: tasteProfile.topIngredient || 'Fresh veggies',
                        bg: '#F8F9F2'
                      },
                      {
                        icon: <Bookmark size={20} color="#594139" />,
                        label: 'Recipes Saved',
                        value: `${tasteProfile.totalSaved} Saved`,
                        bg: '#F5F5F5'
                      }
                    ].map((stat, i) => (
                      <motion.div 
                        key={i} 
                        whileHover={{ y: -5, scale: 1.02 }}
                        style={{
                          display: 'flex', alignItems: 'center',
                          gap: '16px', padding: '20px',
                          borderRadius: '20px',
                          backgroundColor: stat.bg,
                          border: '1px solid rgba(0,0,0,0.03)',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                          cursor: 'default',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div style={{
                          width: '40px', height: '40px',
                          borderRadius: '12px',
                          backgroundColor: 'white',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                        }}>
                          {stat.icon}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <p style={{ fontSize: '11px', fontWeight: '700', color: '#594139', margin: '0 0 4px 0', opacity: 0.6, textTransform: 'uppercase' }}>
                            {stat.label}
                          </p>
                          <p style={{ 
                            fontSize: '15px', fontWeight: '800', 
                            color: '#2A241E', margin: 0,
                            lineHeight: '1.4'
                          }}>
                            {stat.value}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </section>
            )}

            {/* Empty State */}
            {picks.length === 0 && !loading && (
              <div className="bg-white rounded-[24px] p-12 flex flex-col items-center text-center border border-[#E1BFB5]/20"
                style={{ boxShadow: '0 4px 6px -1px rgba(117,7,12,0.05)' }}>
                <div style={{
                  width: '96px', height: '96px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF6B35, #75070C)',
                  display: 'flex', alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: '24px'
                }}>
                  <ChefHat size={48} color="white" />
                </div>
                <h4 style={{ fontSize: '24px', fontWeight: '700', color: '#2A241E', marginBottom: '8px' }}>
                  No taste profile yet!
                </h4>
                <p style={{ fontSize: '16px', color: '#594139', maxWidth: '280px', marginBottom: '32px', lineHeight: '1.6' }}>
                  Save some recipes first to get AI-powered personalized suggestions.
                </p>
                <button
                  onClick={() => navigate('/ai-recipes')}
                  style={{
                    padding: '12px 32px',
                    backgroundColor: '#75070C',
                    color: 'white',
                    borderRadius: '100px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Start Generating
                </button>
              </div>
            )}

            {/* Picks Grid */}
            {picks.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#2A241E' }}>
                    AI Suggestions For You
                  </h2>
                </div>

                {filteredPicks.length === 0 ? (
                  <div className="bg-white rounded-[24px] p-12 text-center border border-[#E1BFB5]/20">
                    <Search size={40} color="#E1BFB5" className="mx-auto mb-4" />
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#2A241E' }}>No matches found</h3>
                    <p style={{ color: '#594139', marginTop: '8px' }}>Try a different search term or refresh your picks.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPicks.map((pick, i) => (
                      <motion.article 
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-[1.5rem] flex flex-col h-full border border-[#E1BFB5]/30 tactile-card group overflow-hidden"
                      >
                      {/* Image section */}
                      <div className="relative h-56 overflow-hidden flex items-end p-5">
                        {pick.imageUrl ? (
                          <div 
                            className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110"
                            style={{
                              backgroundImage: `linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.85) 100%), url(${pick.imageUrl})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          />
                        ) : (
                          <div 
                            className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110"
                            style={{
                              background: getCategoryGradient(pick.category),
                            }}
                          />
                        )}
                        
                        {/* Text Overlay (Stays static) */}
                        <div className="relative z-10 w-full">
                          <h3 style={{ 
                            color: 'white', fontSize: '22px', 
                            fontWeight: '900', lineHeight: '1.2', 
                            margin: 0,
                            textShadow: pick.imageUrl ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'
                          }}>
                            {pick.name}
                          </h3>
                        </div>
                        {/* Category badge */}
                        <div style={{
                          position: 'absolute', top: '16px', left: '16px',
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          backdropFilter: 'blur(8px)',
                          padding: '4px 12px', borderRadius: '100px'
                        }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#75070C' }}>
                            {pick.category}
                          </span>
                        </div>
                      </div>

                      <div className="p-6 flex flex-col flex-grow">
                        
                        {/* Why this - Improved Spacing */}
                        <div className="mb-6">
                          <div style={{
                            padding: '16px 20px', borderRadius: '20px',
                            backgroundColor: '#FFF1ED', color: '#75070C',
                            fontSize: '13px', fontWeight: '600',
                            border: '1px solid rgba(117,7,12,0.08)',
                            lineHeight: '1.6', textAlign: 'left'
                          }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                              <Sparkles size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                              <span>{pick.reason}</span>
                            </div>
                          </div>
                        </div>

                        {/* Key ingredients */}
                        <div className="flex flex-wrap gap-2 mb-6">
                          {(pick.keyIngredients || []).map((ing, j) => (
                            <span key={j} style={{
                              padding: '4px 12px', borderRadius: '100px',
                              backgroundColor: '#f1f4ea',
                              color: '#4F6815', fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {ing}
                            </span>
                          ))}
                        </div>

                        {/* Time + Calories */}
                        <div style={{
                          marginTop: 'auto', paddingTop: '24px',
                          borderTop: '1px solid rgba(225,191,181,0.2)',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '16px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#594139' }}>
                            <Timer size={14} />
                            <span style={{ fontSize: '12px', fontWeight: '600' }}>
                              {pick.prepTime || '30'} min
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#594139' }}>
                            <Flame size={14} />
                            <span style={{ fontSize: '12px', fontWeight: '600' }}>
                              {pick.estimatedCalories || '---'} kcal
                            </span>
                          </div>
                        </div>

                        {/* Generate button */}
                        <button
                          onClick={() => handleGenerate(pick)}
                          className="w-full py-3 bg-[#75070C] text-white rounded-xl font-label-bold hover:bg-[#590509] transition-colors flex items-center justify-center gap-2 btn-water"
                        >
                          Generate This Recipe
                          <Wand2 size={16} />
                        </button>
                      </div>
                    </motion.article>
                  ))}
                </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default PersonalizedPicks;
