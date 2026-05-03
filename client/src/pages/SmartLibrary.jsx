import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  LogOut, 
  User, 
  Trash2, 
  Eye, 
  BookOpen, 
  X,
  ChevronRight,
  Clock,
  Flame,
  Users,
  Timer,
  ChefHat,
  Leaf
} from 'lucide-react';
import { logout } from '../redux/slices/authSlice';
import Logo from "../components/shared/Logo";
import { recipeService } from '../services/recipeService';

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

const SmartLibrary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState(location.state?.searchQuery || '');
  const [activeFilter, setActiveFilter] = useState('All');

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [shakingId, setShakingId] = useState(null);
  const [activeTab, setActiveTab] = useState('ingredients');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState(null);

  const categories = [
    'All', 'Breakfast', 'Lunch', 'Dinner', 
    'Desserts', 'Drinks', 'Healthy', 'Snacks'
  ];

  const handleDeleteClick = (recipe) => {
    setShakingId(recipe.id);
    setTimeout(() => {
      setShakingId(null);
      setRecipeToDelete(recipe);
      setShowDeleteConfirm(true);
    }, 400);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!token) {
      navigate('/signin');
      return;
    }
    fetchRecipes();
  }, [token, navigate]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const data = await recipeService.getSavedRecipes(token);
      setRecipes(data);
    } catch (err) {
      console.error('Failed to fetch recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await recipeService.deleteRecipe(id, token);
      setRecipes(prev => prev.filter(r => r.id !== id));
      setShowDeleteConfirm(false);
      setRecipeToDelete(null);
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('Failed to delete recipe. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (recipe) => {
    setSelectedRecipe(recipe);
    setActiveTab('ingredients');
    setShowModal(true);
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const cat = (recipe.category || 'Other').trim().toLowerCase();
    const filter = activeFilter.trim().toLowerCase();
    
    const matchesFilter = filter === 'all' || cat === filter;
    return matchesSearch && matchesFilter;
  });

  const getCategoryImage = (category) => {
    const gradients = {
      'Breakfast': 'linear-gradient(135deg, #FFD700, #FF6B35)',
      'Lunch': 'linear-gradient(135deg, #4F6815, #7CB342)',
      'Dinner': 'linear-gradient(135deg, #75070C, #C62828)',
      'Desserts': 'linear-gradient(135deg, #E91E63, #FF6B35)',
      'Drinks': 'linear-gradient(135deg, #0288D1, #26C6DA)',
      'Healthy': 'linear-gradient(135deg, #2E7D32, #66BB6A)',
      'Snacks': 'linear-gradient(135deg, #F57C00, #FFB300)',
    };
    return gradients[category] || 
      'linear-gradient(135deg, #F0E6DA, #E1BFB5)';
  };

  const cleanRecipeText = (text) => {
    if (!text) return '';
    return text
      .split('\n')
      .filter(line => 
        !line.trim().startsWith('RECIPE NAME:') &&
        !line.trim().startsWith('CATEGORY:')
      )
      .join('\n')
      .trim();
  };

  const parseRecipeSection = (fullText, section) => {
    if (!fullText) return '';
    const lines = fullText.split('\n');
    let capturing = false;
    let result = [];
    const sectionHeaders = [
      'INGREDIENTS:', 'INSTRUCTIONS:', 
      'NUTRITIONAL INFO:', 'TIPS:', 
      'RECIPE NAME:', 'CATEGORY:'
    ];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === section) {
        capturing = true;
        continue;
      }
      if (capturing && sectionHeaders.includes(trimmed)) {
        break;
      }
      if (capturing && trimmed) {
        result.push(trimmed);
      }
    }
    return result.join('\n');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Saved some time ago';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Saved today';
    if (diffDays === 1) return 'Saved yesterday';
    if (diffDays < 7) return `Saved ${diffDays} days ago`;
    return `Saved on ${date.toLocaleDateString()}`;
  };

  // Parse ingredients from text or array
  const parseIngredients = (ingredients) => {
    if (!ingredients) return [];
    if (typeof ingredients === 'string') {
      return ingredients
        .split('\n')
        .filter(line => line.trim() && 
          !line.trim().startsWith('INGREDIENTS:'))
        .map(line => line.trim());
    }
    if (Array.isArray(ingredients)) {
      return ingredients.map(ing => 
        typeof ing === 'string' ? ing :
        `${ing.amount || ''} ${ing.unit || ''} ${ing.item || ''}`.trim()
      );
    }
    return [];
  };

  // Parse instructions from text or array
  const parseInstructions = (instructions) => {
    if (!instructions) return [];
    if (typeof instructions === 'string') {
      return instructions
        .split('\n')
        .filter(line => line.trim() &&
          !line.trim().startsWith('INSTRUCTIONS:') &&
          !line.trim().startsWith('RECIPE NAME:') &&
          !line.trim().startsWith('CATEGORY:') &&
          !line.trim().startsWith('NUTRITIONAL') &&
          !line.trim().startsWith('TIPS:') &&
          !line.trim().startsWith('INGREDIENTS:'))
        .map(line => line.trim());
    }
    if (Array.isArray(instructions)) {
      return instructions.map(step =>
        typeof step === 'string' ? step :
        `${step.instruction || ''} ${step.duration ? '(' + step.duration + ')' : ''}`.trim()
      );
    }
    return [];
  };

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F0E6DA] text-on-surface font-['Plus_Jakarta_Sans']">
      <style>{`
        .custom-shadow {
          box-shadow: 0 4px 20px -2px rgba(45, 41, 38, 0.08);
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .recipe-card:hover {
          box-shadow: 0 20px 60px -10px rgba(117, 7, 12, 0.15),
                      0 4px 20px -2px rgba(45, 41, 38, 0.08);
        }
        .recipe-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 32px;
          border: 1.5px solid transparent;
          background: linear-gradient(135deg, 
            rgba(117,7,12,0.1), 
            rgba(255,107,53,0.05)) border-box;
          -webkit-mask: linear-gradient(#fff 0 0) padding-box, 
                        linear-gradient(#fff 0 0);
          -webkit-mask-composite: destination-out;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .recipe-card:hover::after {
          opacity: 1;
        }
      `}</style>

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
            <span onClick={() => navigate('/library')} style={{ fontWeight: '800', color: '#75070C', cursor: 'pointer', fontSize: '14px', borderBottom: `2px solid #75070C`, paddingBottom: '4px' }}>My CookBook</span>
            <span onClick={() => navigate('/personalized-picks')} style={{ fontWeight: '700', color: '#594139', cursor: 'pointer', fontSize: '14px', opacity: 0.7, transition: 'opacity 0.3s' }} onMouseEnter={(e) => (e.target.style.opacity = 1)} onMouseLeave={(e) => (e.target.style.opacity = 0.7)}>Personalized Picks</span>
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

      <main className="pt-32 pb-32 px-6 max-w-[1440px] mx-auto">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <h1 className="text-5xl font-black tracking-tight text-on-surface leading-none">My CookBook</h1>
              {!loading && (
                <motion.span 
                  key={recipes.length}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-[#75070C] text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-red-900/20"
                >
                  {recipes.length} Recipes
                </motion.span>
              )}
            </div>
            <p className="text-on-surface-variant text-lg font-medium opacity-70">Your curated collection of world-class kitchen inspirations.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Minimal Local Search Bar */}
            <div className="relative w-64">
              <Search size={16} color="#2A241E" className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
              <input 
                type="text" 
                placeholder="Filter saved..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3.5 pl-12 pr-4 rounded-2xl bg-white border border-[#E1BFB5]/30 text-sm font-semibold outline-none transition-all focus:border-[#75070C] focus:ring-2 focus:ring-[#75070C]/10 shadow-sm"
              />
            </div>
            
            <motion.button 
              whileHover={{ 
                scale: 1.03,
                boxShadow: "0 20px 40px rgba(117,7,12,0.3)"
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/ai-recipes')}
              className="bg-[#75070C] text-white px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-red-900/20"
            >
              Add New Recipe
            </motion.button>
          </div>        </motion.div>

        {/* Filter Pills */}
        <motion.nav 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-3 mb-12 overflow-x-auto hide-scrollbar pb-2"
        >
          {categories.map((cat, index) => (
            <motion.button
              key={cat}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.92 }}
              whileHover={{ y: -2 }}
              onClick={() => setActiveFilter(cat)}
              className={activeFilter === cat 
                ? 'whitespace-nowrap px-8 py-3 rounded-full bg-[#75070C] text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-red-900/20 transition-all active:scale-95'
                : 'whitespace-nowrap px-8 py-3 rounded-full bg-white text-on-surface-variant font-bold text-xs uppercase tracking-widest border border-stone-200 hover:border-[#75070C]/40 transition-all active:scale-95'
              }
            >
              {cat}
            </motion.button>
          ))}
        </motion.nav>

        {/* Recipe Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <AnimatePresence mode='popLayout'>
            {loading ? (
              // Loading State
              [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-[32px] overflow-hidden border border-[#E6DCCF] animate-pulse">
                  <div className="h-[240px] bg-stone-200" />
                  <div className="p-8">
                    <div className="h-6 bg-stone-200 rounded-full w-3/4 mb-4" />
                    <div className="flex gap-2 mb-8">
                      <div className="h-5 bg-stone-200 rounded-full w-20" />
                      <div className="h-5 bg-stone-200 rounded-full w-20" />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 h-12 bg-stone-200 rounded-2xl" />
                      <div className="w-12 h-12 bg-stone-200 rounded-2xl" />
                    </div>
                  </div>
                </div>
              ))
            ) : filteredRecipes.length > 0 ? (
              filteredRecipes.map((recipe, index) => (
                <motion.article
                  key={recipe.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, height: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  className="bg-white rounded-[32px] overflow-hidden custom-shadow group border border-[#E6DCCF] transition-all hover:-translate-y-2"
                >
                  <div className="relative h-[240px] overflow-hidden">
                    {recipe.image_url ? (
                      <img 
                        src={recipe.image_url} 
                        alt={recipe.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div 
                        style={{ background: getCategoryImage(recipe.category) }}
                        className="w-full h-full flex flex-col items-center justify-center gap-3"
                      >
                        <BookOpen size={48} color="white" strokeWidth={2.5} />
                        <span className="text-white font-black text-xs uppercase tracking-widest">
                          {recipe.category || 'Recipe'}
                        </span>
                      </div>
                    )}
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="absolute top-6 left-6 bg-white/95 backdrop-blur px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest text-[#75070C] shadow-lg animate-pulse"
                    >
                      {(recipe.category || 'OTHER').toUpperCase()}
                    </motion.div>
                  </div>

                  <div className="p-8">
                    <h3 className="text-xl font-black text-on-surface mb-4 group-hover:text-[#75070C] transition-colors line-clamp-2 min-h-[56px]">
                      {recipe.title}
                    </h3>
                    
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex gap-3">
                        <span className="flex items-center gap-1.5 bg-[#FF6B35]/10 text-[#FF6B35] px-3 py-1 rounded-lg text-[11px] font-black">
                          <Flame size={12} /> {recipe.calories || '---'} KCAL
                        </span>
                        <span className="flex items-center gap-1.5 bg-[#4F6815]/10 text-[#4F6815] px-3 py-1 rounded-lg text-[11px] font-black">
                          <Users size={12} /> {recipe.servings || '1'} SERVINGS
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleView(recipe)}
                        className="flex-1 bg-stone-50 border-2 border-stone-100 text-on-surface font-black py-3.5 rounded-2xl text-xs uppercase tracking-widest hover:bg-[#75070C] hover:text-white hover:border-[#75070C] transition-all flex items-center justify-center gap-2"
                      >
                        <Eye size={16} /> View Details
                      </motion.button>
                      <motion.button 
                        animate={shakingId === recipe.id ? {
                          x: [-5, 5, -5, 5, -3, 3, 0],
                          transition: { duration: 0.4 }
                        } : {}}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={deletingId === recipe.id}
                        onClick={() => handleDeleteClick(recipe)}
                        className={`w-14 h-14 ${deletingId === recipe.id ? 'bg-stone-200' : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'} rounded-2xl transition-all flex items-center justify-center shadow-sm`}
                      >
                        <Trash2 size={20} className={deletingId === recipe.id ? 'animate-spin' : ''} />
                      </motion.button>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-stone-50 flex items-center justify-between opacity-40">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{formatDate(recipe.created_at)}</span>
                      <BookOpen size={12} />
                    </div>
                  </div>
                </motion.article>
              ))
            ) : (
              // Empty State
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-32 text-center"
              >
                <motion.div 
                  animate={{ 
                    y: [0, -15, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl mb-8"
                >
                  <BookOpen size={64} className="text-[#E1BFB5]" />
                </motion.div>
                <h3 className="text-3xl font-black text-on-surface mb-3 uppercase tracking-tight">
                  Your cookbook is empty!
                </h3>
                <p className="text-on-surface-variant mb-10 max-w-md mx-auto font-medium opacity-60">
                  You haven't saved any recipes yet. Generate your first AI-powered masterpiece and it will appear right here.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/ai-recipes')}
                  className="px-12 py-4 bg-[#75070C] text-white font-black rounded-2xl hover:bg-red-800 transition-all hover:-translate-y-1 shadow-2xl shadow-red-900/30 uppercase tracking-widest text-sm"
                >
                  Generate First Recipe
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <AnimatePresence>
        {showModal && selectedRecipe && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.article
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-white w-full max-w-3xl max-h-[88vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col z-[2001] border border-[#E1BFB5]/30"
            >
              {/* Close Button */}
              <motion.button
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300 }}
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 z-[80] w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all"
              >
                <X size={20} color="#2A241E" />
              </motion.button>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 hide-scrollbar pb-8">

                {/* Hero Image */}
                <div className="relative h-[280px] w-full overflow-hidden">
                  {selectedRecipe.image_url ? (
                    <img
                      src={selectedRecipe.image_url}
                      alt={selectedRecipe.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      style={{ background: getCategoryImage(selectedRecipe.category) }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <BookOpen size={64} color="white" />
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                {/* Header Card - overlaps image */}
                <div className="px-6 md:px-10 -mt-10 relative z-10">
                  <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#E1BFB5]/20">
                    
                    {/* Category + Date row */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-[#75070C] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em]">
                        {selectedRecipe.category || 'Recipe'}
                      </span>
                      <span className="text-[11px] font-bold text-[#594139] opacity-60 uppercase tracking-wider">
                        {formatDate(selectedRecipe.created_at)}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-black text-[#2A241E] mb-6 leading-tight">
                      {selectedRecipe.title}
                    </h2>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { 
                          icon: <Timer size={18} />, 
                          label: selectedRecipe.prep_time
                            ? `${(selectedRecipe.prep_time || 0) + (selectedRecipe.cook_time || 0)} mins`
                            : 'N/A',
                          sublabel: 'Time'
                        },
                        { 
                          icon: <ChefHat size={18} />, 
                          label: selectedRecipe.difficulty || 'N/A',
                          sublabel: 'Difficulty'
                        },
                        { 
                          icon: <Users size={18} />, 
                          label: `${selectedRecipe.servings || 1} Servings`,
                          sublabel: 'Servings'
                        },
                        { 
                          icon: <Flame size={18} />, 
                          label: `${selectedRecipe.calories || '---'} kcal`,
                          sublabel: 'Calories'
                        },
                      ].map((stat, i) => (
                        <div key={i} className="bg-[#FFF1ED] rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 border border-[#FFE9E3]">
                          <div className="text-[#75070C]">
                            {stat.icon}
                          </div>
                          <span className="text-xs font-black text-[#2A241E] text-center leading-tight">
                            {stat.label}
                          </span>
                          <span className="text-[9px] font-bold text-[#594139] uppercase tracking-wider opacity-60">
                            {stat.sublabel}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tab Switcher */}
                <div className="px-6 md:px-10 mt-8">
                  <div className="flex p-1 bg-[#FFF1ED] rounded-2xl mb-6 max-w-sm mx-auto border border-[#E1BFB5]/30">
                    <button
                      onClick={() => setActiveTab('ingredients')}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2
                        ${activeTab === 'ingredients'
                          ? 'bg-[#75070C] text-white shadow-md'
                          : 'text-[#594139] hover:text-[#2A241E]'
                        }`}
                    >
                      <BookOpen size={16} />
                      Ingredients
                    </button>
                    <button
                      onClick={() => setActiveTab('steps')}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2
                        ${activeTab === 'steps'
                          ? 'bg-[#75070C] text-white shadow-md'
                          : 'text-[#594139] hover:text-[#2A241E]'
                        }`}
                    >
                      <ChevronRight size={16} />
                      Steps
                    </button>
                  </div>

                  {/* Ingredients Tab */}
                  {activeTab === 'ingredients' && (
                    <motion.section
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3"
                    >
                      {selectedRecipe.ingredients && parseIngredients(selectedRecipe.ingredients).map((ingredient, i) => (
                        <div 
                          key={i} 
                          className="flex items-start p-4 bg-[#FFF8F6] rounded-xl border border-[#E1BFB5]/20 group hover:bg-[#FFF1ED] transition-colors"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-[#75070C] mt-2 mr-4 flex-shrink-0 group-hover:scale-125 transition-transform" />
                          <span className="font-semibold text-sm text-[#2A241E] leading-relaxed">
                            {ingredient}
                          </span>
                        </div>
                      ))}
                    </motion.section>
                  )}

                  {/* Steps Tab */}
                  {activeTab === 'steps' && (
                    <motion.section
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      {/* Timeline line */}
                      <div className="absolute left-4 top-4 bottom-4 w-px bg-[#E1BFB5]/60" />
                      
                      <div className="space-y-6">
                        {selectedRecipe.instructions && parseInstructions(selectedRecipe.instructions).map((step, i) => (
                          <div key={i} className="relative pl-12">
                            <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-[#75070C] text-white flex items-center justify-center font-black text-sm shadow-md ring-4 ring-white">
                              {i + 1}
                            </div>
                            <div className="bg-[#FFF8F6] rounded-2xl p-4 border border-[#E1BFB5]/30">
                              <p className="text-sm font-semibold text-[#2A241E] leading-relaxed">
                                {step}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.section>
                  )}
                </div>

                {/* Nutritional Info */}
                {selectedRecipe.nutritional_info && (
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="px-6 md:px-10 mt-8"
                  >
                    <div className="bg-[#FFF1ED] rounded-3xl p-6 border border-[#E1BFB5]/30">
                      <h3 className="font-black text-sm uppercase tracking-widest text-[#75070C] mb-6 flex items-center gap-2">
                        <Leaf size={16} />
                        Nutritional Information
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: 'Protein', value: selectedRecipe.nutritional_info?.protein || '---' },
                          { label: 'Carbs', value: selectedRecipe.nutritional_info?.carbs || '---' },
                          { label: 'Fats', value: selectedRecipe.nutritional_info?.fat || '---' },
                        ].map((item, i) => (
                          <div key={i} className={`text-center ${i === 1 ? 'border-x border-[#E1BFB5]/50' : ''}`}>
                            <p className="text-2xl font-black text-[#2A241E]">
                              {item.value}
                            </p>
                            <p className="text-[10px] font-bold text-[#594139] uppercase tracking-widest mt-1 opacity-70">
                              {item.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.section>
                )}

              </div>
            </motion.article>
          </div>
        )}
      </AnimatePresence>
 
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl z-[3001] p-8 border border-red-100"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Trash2 size={28} className="text-red-600" />
              </div>
              
              <h3 className="text-xl font-black text-center text-[#2A241E] mb-3">
                Delete Masterpiece?
              </h3>
              
              <p className="text-center text-[#594139] text-sm font-medium mb-8 leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-[#75070C]">"{recipeToDelete?.title}"</span> from your library? This action cannot be undone.
              </p>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-4 rounded-2xl bg-stone-50 text-[#594139] font-bold text-xs uppercase tracking-widest border border-stone-200 hover:bg-stone-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(recipeToDelete?.id)}
                  disabled={deletingId === recipeToDelete?.id}
                  className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {deletingId === recipeToDelete?.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartLibrary;
