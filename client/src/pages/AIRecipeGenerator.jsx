import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const [scrolled, setScrolled] = useState(false);

  // Form State
  const [ingredients, setIngredients] = useState(['Chicken Breast', 'Spinach', 'Garlic']);
  const [ingredientInput, setIngredientInput] = useState('');
  const [calories, setCalories] = useState(750);
  const [servings, setServings] = useState(2);
  const [dietaryNotes, setDietaryNotes] = useState('');

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

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const addIngredient = () => {
    if (ingredientInput.trim() && !ingredients.includes(ingredientInput.trim())) {
      setIngredients([...ingredients, ingredientInput.trim()]);
      setIngredientInput('');
    }
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

    try {
      const response = await axios.post('/api/recipes/generate', {
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
          text: `Hello! I'm your AI Sous-Chef. I've crafted a perfect "${response.data.recipeName}" recipe based on your selection. Ready to cook?`
        }
      ]);
    } catch (err) {
      console.error("Failed to generate recipe:", err);
      const errorMsg = err.response?.data?.error || "Something went wrong while generating your recipe. Please try again.";
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const saveRecipe = async () => {
    if (!recipe || isSaved || saveLoading) return;

    setSaveLoading(true);
    try {
      await axios.post('/api/recipes/save', {
        ...recipe,
        sourceType: 'ai-generated'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsSaved(true);
      setShowSaveSuccess(true);

      // Navigate after 2 seconds
      setTimeout(() => {
        navigate('/smart-library');
      }, 2000);
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
      const response = await axios.post('/api/recipes/follow-up', {
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
    primary: '#ab3500',
    brandOrange: '#FF6B35',
    background: '#FFF8F6',
    surfaceContainer: '#FFE9E3',
    surfaceLow: '#FFF1ED',
    surfaceLowest: '#FFFFFF',
    secondaryGreen: '#4F6815',
    text: '#261814',
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
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', flex: '0 0 240px' }}>
            <SafeLogo />
          </div>

          <div style={{ display: 'flex', gap: '35px', flex: 1, justifyContent: 'center' }}>
            <span onClick={() => navigate('/ai-recipes')} style={{ fontWeight: '800', color: colors.primary, cursor: 'pointer', fontSize: '14px', borderBottom: `2px solid ${colors.primary}`, paddingBottom: '4px' }}>AI Generator</span>
            <span onClick={() => navigate('/smart-library')} style={{ fontWeight: '700', color: colors.textVariant, cursor: 'pointer', fontSize: '14px', opacity: 0.7, transition: 'opacity 0.3s' }} onMouseEnter={(e) => e.target.style.opacity = 1} onMouseLeave={(e) => e.target.style.opacity = 0.7}>Library</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', backgroundColor: 'rgba(171, 53, 0, 0.05)', borderRadius: '100px', flex: '0 0 240px', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', backgroundColor: colors.primary, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 8px rgba(171, 53, 0, 0.2)' }}>
                <User size={16} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: '800' }}>{user?.firstName || 'Chef'}</span>
            </div>
            <div style={{ width: '1px', height: '20px', backgroundColor: colors.outline, margin: '0 8px' }}></div>
            <button
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', color: colors.accentRed, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase' }}
            >
              <LogOut size={16} />
            </button>
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
              {ingredients.map((ing, i) => (
                <div key={i} style={{ backgroundColor: colors.secondaryGreen, color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(79, 104, 21, 0.2)' }}>
                  {ing} <X size={14} style={{ cursor: 'pointer' }} onClick={() => removeIngredient(i)} />
                </div>
              ))}
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
              style={{ width: '100%', height: '6px', borderRadius: '10px', backgroundColor: '#FFDBD0', appearance: 'none', cursor: 'pointer', outline: 'none' }}
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

          <button
            onClick={generateRecipe}
            disabled={isLoading || ingredients.length === 0}
            style={{
              width: '100%', padding: '18px', borderRadius: '20px', backgroundColor: colors.brandOrange, color: 'white',
              border: 'none', fontWeight: '900', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.5px',
              cursor: (isLoading || ingredients.length === 0) ? 'not-allowed' : 'pointer',
              opacity: (isLoading || ingredients.length === 0) ? 0.7 : 1,
              boxShadow: '0 8px 16px rgba(255, 107, 53, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'all 0.3s ease'
            }}
          >
            {isLoading ? <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /> : '🍽️ Get Recipes'}
          </button>
        </aside>

        {/* Right Section: Main Recipe Display Card */}
        <section style={{
          backgroundColor: 'white',
          borderRadius: '40px',
          border: `1px solid rgba(37, 24, 20, 0.08)`,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.04)',
          height: '80vh',
          maxHeight: '900px',
          minHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}>

          {/* Header */}
          <div style={{ padding: '24px 32px', backgroundColor: colors.surfaceContainer, borderBottom: `1px solid rgba(171, 53, 0, 0.1)`, display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: colors.primary, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 16px rgba(171, 53, 0, 0.2)' }}>
              <ChefHat size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: colors.primary, margin: 0 }}>Chef AI Assistant</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#006e1c', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#006e1c' }}>Ready to cook</span>
              </div>
            </div>
          </div>

          {/* Messages Canvas */}
          <div ref={scrollRef} className="chat-scrollbar" style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px',
            paddingBottom: '40px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            backgroundColor: colors.background,
            borderBottom: `1px solid ${colors.outline}`
          }}>

            {/* Initial Bot Welcome */}
            {!isLoading && !recipe && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FFDBD0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
                <div style={{ maxWidth: '80%', padding: '16px 20px', backgroundColor: colors.surfaceContainer, borderRadius: '20px', borderTopLeftRadius: '4px', fontSize: '14px', fontWeight: '600' }}>
                  Hello! I'm your AI Sous-Chef. Ready to turn those ingredients into something delicious. What's on your mind today?
                </div>
              </div>
            )}

            {/* Chat Messages - Initial Announcement */}
            {messages.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FFDBD0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
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
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FFDBD0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
                <div style={{ display: 'flex', gap: '6px', padding: '16px 20px', backgroundColor: colors.surfaceContainer, borderRadius: '20px', borderTopLeftRadius: '4px' }}>
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <div key={i} style={{ width: '8px', height: '8px', backgroundColor: colors.primary, borderRadius: '50%', animation: `bounce 1.4s infinite ease-in-out both`, animationDelay: `${delay}s` }}></div>
                  ))}
                </div>
              </div>
            )}

            {/* Recipe Card */}
            {recipe && (
              <div style={{ backgroundColor: 'white', borderRadius: '32px', border: `1px solid ${colors.outline}`, boxShadow: '0 12px 24px rgba(171, 53, 0, 0.08)', maxWidth: '700px' }}>
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

                  <button
                    onClick={saveRecipe}
                    disabled={isSaved || saveLoading}
                    style={{
                      width: '100%', marginTop: '32px', padding: '16px', borderRadius: '20px',
                      backgroundColor: isSaved ? colors.accentRed : colors.primary,
                      color: 'white', border: 'none', fontWeight: '800', fontSize: '14px',
                      textTransform: 'uppercase', letterSpacing: '1px', cursor: (isSaved || saveLoading) ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      boxShadow: '0 8px 16px rgba(171, 53, 0, 0.2)', transition: 'all 0.3s ease'
                    }}
                  >
                    {saveLoading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : (isSaved ? <><CheckCircle2 size={20} /> Saved</> : <><Bookmark size={20} /> Save Recipe</>)}
                  </button>

                  {isSaved && (
                    <button
                      onClick={() => navigate('/smart-library')}
                      style={{
                        width: '100%', marginTop: '12px', padding: '16px', borderRadius: '20px',
                        backgroundColor: 'white', color: colors.primary,
                        border: `2px solid ${colors.primary}`, fontWeight: '800', fontSize: '14px',
                        textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <ChevronRight size={20} /> Go to Library
                    </button>
                  )}
                </div>

                {/* Follow-up Conversation */}
                {messages.slice(1).map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '12px', marginBottom: '8px' }}>
                    {msg.role === 'bot' && <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FFDBD0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>👨‍🍳</div>}
                    <div style={{
                      maxWidth: msg.role === 'user' ? '70%' : '85%',
                      padding: msg.role === 'user' ? '12px 16px' : '16px 24px',
                      backgroundColor: msg.role === 'user' ? colors.primary : '#FFF',
                      color: msg.role === 'user' ? 'white' : colors.text,
                      borderRadius: '20px',
                      borderTopLeftRadius: msg.role === 'bot' ? '4px' : '20px',
                      borderTopRightRadius: msg.role === 'user' ? '4px' : '20px',
                      fontSize: msg.role === 'user' ? '13px' : '14px',
                      fontWeight: '600',
                      boxShadow: msg.role === 'bot' ? '0 4px 12px rgba(171, 53, 0, 0.05)' : 'none',
                      borderLeft: msg.role === 'bot' ? `4px solid ${colors.primary}` : 'none',
                      lineHeight: '1.6'
                    }}>
                      {msg.role === 'bot' && <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: colors.primary, marginBottom: '4px', fontWeight: '800' }}>Chef's Tip</div>}
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Input Area */}
          {recipe && (
            <div style={{ padding: '20px 32px', backgroundColor: 'white', borderTop: `1px solid ${colors.outline}`, display: 'flex', gap: '12px' }}>
              <input
                type="text"
                placeholder="Ask follow-up questions... (e.g. 'Can I use kale instead?')"
                value={followUpInput}
                onChange={(e) => setFollowUpInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendFollowUpQuestion()}
                disabled={followUpLoading}
                style={{ flex: 1, padding: '14px 24px', borderRadius: '100px', border: `1px solid ${colors.outline}`, backgroundColor: colors.background, fontSize: '14px', fontWeight: '500', outline: 'none' }}
              />
              <button
                onClick={sendFollowUpQuestion}
                disabled={!followUpInput.trim() || followUpLoading}
                style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: colors.primary, border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (followUpLoading || !followUpInput.trim()) ? 'not-allowed' : 'pointer', opacity: (followUpLoading || !followUpInput.trim()) ? 0.6 : 1, transition: 'all 0.2s ease' }}
              >
                <Send size={20} />
              </button>
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
            Recipe saved to Smart Library!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIRecipeGenerator;
