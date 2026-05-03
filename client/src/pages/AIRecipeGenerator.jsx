import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import Logo from "../components/shared/Logo";
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Search, LogOut, User, Plus, Minus, X, Send,
  ChefHat, Timer, Flame, Users, Heart, CheckCircle2,
  ChevronRight, Bot, Loader2, Bookmark
} from 'lucide-react';

// Failsafe sub-component definitions
const SafeLogo = (props) => {
  if (typeof Logo !== 'undefined') return <Logo {...props} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
      <div style={{ fontWeight: '900', fontSize: '24px', color: '#2A241E', letterSpacing: '-0.5px' }}>
        Click<span style={{ color: '#ab3500' }}>&</span>Cook
      </div>
      <div style={{ fontSize: '10px', fontWeight: '800', color: '#2A241E', opacity: 0.6, letterSpacing: '1px', textTransform: 'uppercase' }}>
        Smart Kitchen Companion
      </div>
    </div>
  );
};

const AIRecipeGenerator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const [scrolled, setScrolled] = useState(false);

  // Form State
  const [ingredients, setIngredients] = useState(
    location.state?.prefillIngredients || []
  );
  const [ingredientInput, setIngredientInput] = useState('');
  const [calories, setCalories] = useState(
    location.state?.prefillCalories || 750
  );
  const [servings, setServings] = useState(2);
  const [dietaryNotes, setDietaryNotes] = useState(
    location.state?.prefillNotes || ''
  );

  // UI / API State
  const [isLoading, setIsLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [messages, setMessages] = useState([]);
  const [followUpInput, setFollowUpInput] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);

  const scrollRef = useRef(null);
  const recipeRef = useRef(null);

  const cleanFollowUpText = (text) => {
    if (!text) return '';
    return text
      .replace(/RECIPE NAME:.*?\n/gi, '')
      .replace(/CATEGORY:.*?\n/gi, '')
      .replace(/INGREDIENTS:.*?\n/gi, '')
      .replace(/INSTRUCTIONS:.*?\n/gi, '')
      .trim();
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, followUpLoading]);

  useEffect(() => {
    if (showSaveSuccess) {
      const timer = setTimeout(() => setShowSaveSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showSaveSuccess]);

  useEffect(() => {
    const progress = ((calories - 100) / (2000 - 100)) * 100;
    document.documentElement.style.setProperty(
      '--slider-progress', `${progress}%`
    );
  }, [calories]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const addIngredient = () => {
    if (!ingredientInput.trim()) return;
    
    // Allow users to paste comma-separated lists (e.g. "chicken, tomato, garlic")
    const newItems = ingredientInput
      .split(',')
      .map(item => item.trim())
      .filter(item => item && !ingredients.includes(item));

    if (newItems.length > 0) {
      setIngredients([...ingredients, ...newItems]);
    }
    setIngredientInput('');
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const generateRecipe = async () => {
    if (ingredients.length === 0) {
      alert("Please add at least one ingredient.");
      return;
    }

    setIsLoading(true);
    setRecipe(null);
    setMessages([]);
    setIsSaved(false);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    try {
      const response = await axios.post(`${API_BASE_URL}/api/recipes/generate`, {
        ingredients,
        calories,
        servings,
        preferences: dietaryNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("GENERATED RECIPE DATA:", response.data);
      setRecipe(response.data);
      setMessages([
        {
          role: 'bot',
          text: `Your recipe is ready! I've generated "${response.data.recipeName}" based on your ingredients. Scroll down to see the full recipe. Feel free to ask me anything about it!`
        }
      ]);

      setTimeout(() => {
        if (recipeRef.current) {
          const top = recipeRef.current.getBoundingClientRect().top + window.pageYOffset - 100;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 100);
    } catch (err) {
      console.error("Failed to generate recipe:", err);
      let errorMsg = "Something went wrong while generating your recipe. Please try again.";
      
      if (err.response?.data?.error) {
        errorMsg = typeof err.response.data.error === 'string' 
          ? err.response.data.error 
          : JSON.stringify(err.response.data.error);
      }
      
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const saveRecipe = async () => {
    if (!recipe || isSaved || saveLoading) return;
    setSaveLoading(true);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
      || 'http://localhost:5000';

    // Log what we are sending
    console.log('=== SAVING RECIPE ===');
    console.log('category:', recipe.category);
    console.log('image:', recipe.image);
    console.log('recipeName:', recipe.recipeName);
    console.log('====================');

    try {
      await axios.post(`${API_BASE_URL}/api/recipes/save`, {
        ...recipe,
        // Explicitly map fields server expects
        title: recipe.recipeName,
        image_url: recipe.image,
        category: recipe.category,
        sourceType: 'ai-generated'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsSaved(true);
      setShowSaveSuccess(true);
    } catch (err) {
      console.error("Failed to save recipe:", err);
      alert("Failed to save recipe to your library.");
    } finally {
      setSaveLoading(false);
    }
  };

  const sendFollowUpQuestion = async () => {
    if (!followUpInput.trim() || followUpLoading) return;

    const question = followUpInput.trim();
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setFollowUpInput('');
    setFollowUpLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await axios.post(`${API_BASE_URL}/api/recipes/follow-up`, {
        recipeId: recipe?.id,
        question: question,
        recipeContext: recipe
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages(prev => [...prev, { role: 'bot', text: response.data.answer }]);
    } catch (err) {
      console.error("Follow-up error:", err);
      setMessages(prev => [...prev, { role: 'bot', text: "I'm sorry, I encountered an error. Could you try asking that again?" }]);
    } finally {
      setFollowUpLoading(false);
    }
  };

  // ── Style Tokens ──
  const colors = {
    primary: '#75070C',
    brandOrange: '#FF6B35',
    background: '#F0E6DA',
    surfaceContainer: '#FFE9E3',
    surfaceLow: '#FFF1ED',
    surfaceLowest: '#FFFFFF',
    secondaryGreen: '#4F6815',
    text: '#2A241E',
    textVariant: '#594139',
    outline: '#E1BFB5',
    accentRed: '#75070C'
  };

  return (
    <div style={{ backgroundColor: colors.background, minHeight: '100vh', fontFamily: '"Plus Jakarta Sans", sans-serif', color: colors.text }}>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .chat-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .chat-scrollbar::-webkit-scrollbar-track {
          background: rgba(171, 53, 0, 0.05);
          border-radius: 10px;
        }
        .chat-scrollbar::-webkit-scrollbar-thumb {
          background-color: #E1BFB5;
          border-radius: 10px;
          border: 2px solid #FFF8F6;
        }
        .chat-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #ab3500;
        }
        .chat-scrollbar {
          scrollbar-width: auto;
          scrollbar-color: #E1BFB5 transparent;
          scroll-behavior: smooth;
        }
        input[type='range'] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 10px;
          background: linear-gradient(
            to right,
            #75070C 0%,
            #75070C var(--slider-progress, 32%),
            #FFE9E3 var(--slider-progress, 32%),
            #FFE9E3 100%
          );
          outline: none;
          cursor: pointer;
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #75070C;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(117, 7, 12, 0.4);
          transition: all 0.2s ease;
        }
        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(117, 7, 12, 0.5);
        }
        input[type='range']::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #75070C;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(117, 7, 12, 0.4);
        }
        .btn-fluid-fill {
          position: relative;
          overflow: hidden;
        }
        .btn-fluid-fill::before {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(100%);
          transition: transform 0.5s ease-out;
          pointer-events: none;
        }
        .btn-fluid-fill:hover::before {
          transform: translateY(0);
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
            <span onClick={() => navigate('/ai-recipes')} style={{ fontWeight: '800', color: colors.primary, cursor: 'pointer', fontSize: '14px', borderBottom: `2px solid ${colors.primary}`, paddingBottom: '4px' }}>Recipe Generator</span>
            <span onClick={() => navigate('/library')} style={{ fontWeight: '700', color: colors.textVariant, cursor: 'pointer', fontSize: '14px', opacity: 0.7, transition: 'opacity 0.3s' }} onMouseEnter={(e) => (e.target.style.opacity = 1)} onMouseLeave={(e) => (e.target.style.opacity = 0.7)}>My CookBook</span>
            <span onClick={() => navigate('/personalized-picks')} style={{ fontWeight: '700', color: colors.textVariant, cursor: 'pointer', fontSize: '14px', opacity: 0.7, transition: 'opacity 0.3s' }} onMouseEnter={(e) => (e.target.style.opacity = 1)} onMouseLeave={(e) => (e.target.style.opacity = 0.7)}>Personalized Picks</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', backgroundColor: 'rgba(117, 7, 12, 0.05)', borderRadius: '100px' }}>
            <div style={{ width: '32px', height: '32px', backgroundColor: '#75070C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 8px rgba(117, 7, 12, 0.2)' }}>
              <User size={16} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#2A241E' }}>{user?.firstName || 'Chef'}</span>
          </div>
        </div>
      </nav>

      {/* ── Main Layout ── */}
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '120px 60px 80px', display: 'grid', gridTemplateColumns: '340px 1fr', gap: '40px' }}>

        {/* Left Sidebar: Recipe Architect */}
        <aside style={{ position: 'sticky', top: '120px', height: 'fit-content', backgroundColor: colors.surfaceLow, padding: '40px', borderRadius: '40px', border: `1px solid rgba(171, 53, 0, 0.1)`, boxShadow: '0 12px 24px rgba(171, 53, 0, 0.05)' }}>
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: colors.primary, margin: '0 0 8px 0' }}>Recipe Architect</h3>
            <p style={{ fontSize: '13px', color: colors.textVariant, opacity: 0.7 }}>Configure your ingredients and preferences</p>
          </div>

          {/* Pantry Selection */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontWeight: '800', marginBottom: '12px', fontSize: '14px' }}>Pantry Selection</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', backgroundColor: 'white', padding: '12px', borderRadius: '16px', border: `1px solid ${colors.outline}`, marginBottom: '12px' }}>
              {ingredients.length === 0 && (
                <span style={{ 
                  fontSize: '12px', 
                  color: '#594139', 
                  opacity: 0.5,
                  fontStyle: 'italic',
                  padding: '4px 4px'
                }}>
                  No ingredients added yet...
                </span>
              )}
              <AnimatePresence>
                {ingredients.map((ing, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    style={{ backgroundColor: colors.secondaryGreen, color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(79, 104, 21, 0.2)' }}
                  >
                    {ing} <X size={14} style={{ cursor: 'pointer' }} onClick={() => removeIngredient(i)} />
                  </motion.div>
                ))}
              </AnimatePresence>
              <button
                onClick={addIngredient}
                style={{ backgroundColor: 'transparent', border: `1px dashed ${colors.primary}`, color: colors.primary, padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFDBD0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Plus size={14} /> Add
              </button>
            </div>
            <input
              type="text"
              placeholder="Add ingredient..."
              value={ingredientInput}
              onChange={(e) => setIngredientInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '16px', border: `1px solid ${colors.outline}`, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Calorie Range */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ fontWeight: '800', fontSize: '14px' }}>Calorie Range</label>
              <div style={{ backgroundColor: colors.primary, color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', boxShadow: '0 4px 8px rgba(171, 53, 0, 0.2)' }}>
                {calories} kcal
              </div>
            </div>
            <input
              type="range"
              min="100" max="2000" step="50"
              value={calories}
              onChange={(e) => setCalories(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: colors.textVariant, fontWeight: '700' }}>
              <span>100</span>
              <span>2000</span>
            </div>
          </div>

          {/* Servings Counter */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontWeight: '800', marginBottom: '12px', fontSize: '14px' }}>Servings</label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', padding: '8px', borderRadius: '16px', border: `1px solid ${colors.outline}` }}>
              <button
                onClick={() => setServings(Math.max(1, servings - 1))}
                style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: '#FFDBD0', border: 'none', color: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Minus size={20} />
              </button>
              <span style={{ fontSize: '20px', fontWeight: '800', color: colors.primary }}>{servings}</span>
              <button
                onClick={() => setServings(Math.min(10, servings + 1))}
                style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: '#FFDBD0', border: 'none', color: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Dietary Notes */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontWeight: '800', marginBottom: '12px', fontSize: '14px' }}>Dietary Notes</label>
            <textarea
              placeholder="e.g. No dairy, spicy, under 30 mins..."
              value={dietaryNotes}
              onChange={(e) => setDietaryNotes(e.target.value)}
              style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '16px', border: `1px solid ${colors.outline}`, fontSize: '13px', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <motion.button
            onClick={generateRecipe}
            disabled={isLoading || ingredients.length === 0}
            whileHover={(!isLoading && ingredients.length > 0) 
              ? { scale: 1.03, y: -3 } : {}}
            whileTap={(!isLoading && ingredients.length > 0) 
              ? { scale: 0.97 } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="btn-fluid-fill"
            style={{
              width: '100%', 
              padding: '18px', 
              borderRadius: '20px', 
              backgroundColor: colors.primary, 
              color: 'white',
              border: 'none', 
              fontWeight: '900', 
              fontSize: '16px', 
              textTransform: 'uppercase', 
              letterSpacing: '0.5px',
              cursor: (isLoading || ingredients.length === 0) 
                ? 'not-allowed' : 'pointer',
              opacity: (isLoading || ingredients.length === 0) 
                ? 0.6 : 1,
              boxShadow: (isLoading || ingredients.length === 0)
                ? 'none'
                : '0 8px 24px rgba(117,7,12,0.3)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px',
            }}
          >
            {isLoading 
              ? <Loader2 size={24} style={{ 
                  animation: 'spin 1s linear infinite' 
                }} /> 
              : <><ChefHat size={20} /> Get Recipes</>
            }
          </motion.button>

        </aside>

        {/* Right Section: Main Recipe Display Card */}
        <section ref={recipeRef} style={{
          backgroundColor: 'white',
          borderRadius: '40px',
          border: `1px solid rgba(37, 24, 20, 0.08)`,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.04)',
          minHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>

          {/* Header */}
          <div style={{ 
            padding: '16px 32px', 
            backgroundColor: colors.surfaceContainer, 
            borderBottom: `1px solid rgba(171, 53, 0, 0.1)`, 
            borderTopLeftRadius: '40px',
            borderTopRightRadius: '40px',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            minHeight: '80px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: colors.primary, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 16px rgba(117, 7, 12, 0.2)' }}>
                <ChefHat size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: colors.primary, margin: 0 }}>AI Recipe Generator</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#4F6815', borderRadius: '50%' }}></div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#4F6815' }}>Powered by Gemini AI</span>
                </div>
              </div>
            </div>

            {/* Top Right Actions */}
            {recipe && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
              >
                {!isSaved ? (
                  <motion.button
                    onClick={saveRecipe}
                    disabled={saveLoading}
                    whileTap={{ scale: 0.97 }}
                    className="btn-fluid-fill"
                    style={{
                      padding: '10px 24px', borderRadius: '12px', backgroundColor: '#75070C', color: 'white', border: 'none',
                      fontWeight: '800', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px',
                      cursor: saveLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                      boxShadow: '0 4px 12px rgba(117,7,12,0.15)'
                    }}
                  >
                    {saveLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><Bookmark size={16} /> Save Recipe</>}
                  </motion.button>
                ) : (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ padding: '10px 20px', borderRadius: '12px', backgroundColor: '#F0FFF4', border: '1px solid #4F6815', color: '#4F6815', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} /> Saved
                    </div>
                    <motion.button
                      onClick={() => navigate('/library')}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="btn-fluid-fill"
                      style={{ 
                        padding: '10px 20px', borderRadius: '12px', backgroundColor: 'white', color: '#75070C', border: '1px solid #75070C', 
                        fontWeight: '800', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', 
                        display: 'flex', alignItems: 'center', gap: '6px' 
                      }}
                    >
                      Library <ChevronRight size={16} />
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Messages Canvas */}
          <div ref={scrollRef} style={{
            flex: 1,
            padding: '32px',
            paddingBottom: '40px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            backgroundColor: colors.background,
            borderBottom: `1px solid ${colors.outline}`,
            borderBottomLeftRadius: recipe ? 0 : '40px',
            borderBottomRightRadius: recipe ? 0 : '40px'
          }}>

            {/* Initial Bot Welcome */}
            {!isLoading && !recipe && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: '16px',
                  padding: '40px',
                  textAlign: 'center'
                }}
              >
                <motion.div
                  animate={{ 
                    y: [0, -12, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#FFF1ED',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(117,7,12,0.12)'
                  }}
                >
                  <ChefHat size={40} color="#75070C" />
                </motion.div>
                <div>
                  <h3 style={{ 
                    fontSize: '22px', 
                    fontWeight: '900', 
                    color: '#2A241E',
                    margin: '0 0 8px 0'
                  }}>
                    Ready to Cook Something Amazing?
                  </h3>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#594139', 
                    opacity: 0.7,
                    margin: 0,
                    maxWidth: '300px'
                  }}>
                    Add your ingredients on the left and I'll craft the perfect recipe for you.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Chat Messages - Initial Announcement */}
            {messages.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FFE9E3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ChefHat size={16} color="#75070C" />
                    </div>
                <div style={{
                  maxWidth: '80%',
                  padding: '16px 20px',
                  backgroundColor: colors.surfaceContainer,
                  color: colors.text,
                  borderRadius: '20px',
                  borderTopLeftRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {messages[0].text}
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {(isLoading || followUpLoading) && (
              <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FFE9E3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ChefHat size={16} color="#75070C" />
                    </div>
                <div style={{ display: 'flex', gap: '6px', padding: '16px 20px', backgroundColor: colors.surfaceContainer, borderRadius: '20px', borderTopLeftRadius: '4px' }}>
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <div key={i} style={{ width: '8px', height: '8px', backgroundColor: colors.primary, borderRadius: '50%', animation: `bounce 1.4s infinite ease-in-out both`, animationDelay: `${delay}s` }}></div>
                  ))}
                </div>
              </div>
            )}

            {/* Recipe Card */}
            {recipe && (
              <motion.div
                ref={recipeRef}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{ backgroundColor: 'white', borderRadius: '32px', border: `1px solid ${colors.outline}`, boxShadow: '0 12px 24px rgba(171, 53, 0, 0.08)', maxWidth: '700px' }}
              >
                {recipe.image && (
                  <div style={{ height: '280px', position: 'relative', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', overflow: 'hidden' }}>
                    <img src={recipe.image} alt={recipe.recipeName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '6px', maxWidth: '80%' }}>
                      {recipe.tags?.map((tag, i) => (
                        <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '800', color: colors.primary, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                          {tag}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ padding: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '28px', fontWeight: '800', color: colors.text, margin: 0 }}>{recipe.recipeName}</h3>
                    <button style={{ background: 'none', border: 'none', color: colors.primary, cursor: 'pointer' }}><Heart size={28} /></button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                    {[
                      { icon: <Timer size={20} />, label: `${recipe.prepTime + recipe.cookTime} Min` },
                      { icon: <Flame size={20} />, label: `${recipe.calories} Kcal` },
                      { icon: <Users size={20} />, label: `${recipe.servings} Servings` }
                    ].map((item, i) => (
                      <div key={i} style={{ backgroundColor: colors.surfaceContainer, padding: '16px', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ color: colors.primary }}>{item.icon}</div>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: colors.text }}>{item.label}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Key Ingredients</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {recipe.ingredients && (Array.isArray(recipe.ingredients) ? recipe.ingredients : [recipe.ingredients]).map((ing, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: colors.textVariant, fontWeight: '600' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: colors.secondaryGreen }}></div>
                          {typeof ing === 'string' ? ing : `${ing.amount || ''} ${ing.unit || ''} ${ing.item || ''}`.trim()}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ paddingTop: '24px', borderTop: `1px solid rgba(171, 53, 0, 0.1)` }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Instructions</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {recipe.instructions && (Array.isArray(recipe.instructions) ? recipe.instructions : [recipe.instructions]).map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: '16px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: colors.primary }}>{i + 1}.</span>
                          <p style={{ margin: 0, fontSize: '14px', color: colors.textVariant, lineHeight: '1.6', fontWeight: '500' }}>
                            {typeof step === 'string' ? step : `${step.instruction || ''} ${step.duration ? `(${step.duration})` : ''}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Follow-up Conversation */}
                {messages.slice(1).map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '12px', marginBottom: '8px' }}>
                    {msg.role === 'bot' && (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FFE9E3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChefHat size={16} color="#75070C" />
                      </div>
                    )}
                    <div style={{
                      maxWidth: msg.role === 'user' ? '70%' : '85%',
                      padding: '14px 18px',
                      backgroundColor: msg.role === 'user' ? colors.primary : '#FFF8F6',
                      color: msg.role === 'user' ? 'white' : colors.text,
                      borderRadius: '16px',
                      borderTopLeftRadius: msg.role === 'bot' ? '4px' : '16px',
                      borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                      fontSize: msg.role === 'user' ? '13px' : '14px',
                      fontWeight: '500',
                      boxShadow: msg.role === 'bot' ? '0 2px 8px rgba(117,7,12,0.06)' : 'none',
                      border: msg.role === 'bot' ? `1px solid ${colors.outline}` : 'none',
                      lineHeight: '1.6'
                    }}>
                      {msg.role === 'bot' ? cleanFollowUpText(msg.text) : msg.text}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Fixed Bottom Chat Bar */}
          {recipe && (
            <div style={{ 
              position: 'sticky',
              bottom: 0,
              padding: '16px 24px', 
              backgroundColor: 'white', 
              borderTop: `1px solid ${colors.outline}`,
              borderBottomLeftRadius: '40px',
              borderBottomRightRadius: '40px',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 -10px 20px rgba(0,0,0,0.02)'
            }}>
              {/* Follow-up Chat Input */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Ask anything about this recipe..."
                  value={followUpInput}
                  onChange={(e) => setFollowUpInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendFollowUpQuestion()}
                  disabled={followUpLoading}
                  style={{ flex: 1, padding: '12px 20px', borderRadius: '100px', border: `1px solid ${colors.outline}`, backgroundColor: colors.background, fontSize: '13px', fontWeight: '500', outline: 'none', transition: 'all 0.3s ease' }}
                  onFocus={(e) => { e.target.style.borderColor = '#75070C'; e.target.style.boxShadow = '0 0 0 3px rgba(117,7,12,0.08)'; }}
                  onBlur={(e) => { e.target.style.borderColor = colors.outline; e.target.style.boxShadow = 'none'; }}
                />
                <motion.button
                  onClick={sendFollowUpQuestion}
                  disabled={!followUpInput.trim() || followUpLoading}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="btn-fluid-fill"
                  style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: followUpInput.trim() ? '#75070C' : colors.outline, border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (!followUpInput.trim() || followUpLoading) ? 'not-allowed' : 'pointer', transition: 'background-color 0.3s ease', flexShrink: 0 }}
                >
                  {followUpLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
                </motion.button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Success Toast */}
      <AnimatePresence>
        {showSaveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            style={{
              position: 'fixed', bottom: '40px', left: '50%', zIndex: 2000,
              backgroundColor: '#3c2d28', color: 'white', padding: '16px 32px',
              borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)', fontWeight: '800', fontSize: '15px'
            }}
          >
            <div style={{ width: '28px', height: '28px', backgroundColor: colors.secondaryGreen, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <CheckCircle2 size={18} />
            </div>
            Recipe saved to My CookBook!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIRecipeGenerator;
