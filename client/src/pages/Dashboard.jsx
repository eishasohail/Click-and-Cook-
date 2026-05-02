import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import Logo from "../components/shared/Logo";
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Search, LogOut, ChevronRight, Star, User, CheckCircle
} from 'lucide-react';
import './Landing.css';

// Failsafe sub-component definitions
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

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const [scrolled, setScrolled] = useState(false);
  
  // Review Form State
  const [reviewText, setReviewText] = useState('');
  const [selectedRating, setSelectedRating] = useState(5);
  const ratingRef = useRef(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handlePostReview = async () => {
    if (!reviewText.trim()) return;
    
    try {
      await axios.post('/api/reviews', 
        { text: reviewText, rating: ratingRef.current, name: user?.firstName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmitted(true);
      setReviewText('');
      setSelectedRating(5);
      ratingRef.current = 5;
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error("Failed to post review:", err);
    }
  };

  const featureCards = [
    {
      title: "AI Recipe Generation",
      desc: "Craft unique dishes with culinary intelligence.",
      img: "/bg9.jpg",
      color: "#75070C",
      action: "Explore",
      path: "/ai-recipes"
    },
    {
      title: "Smart Library",
      desc: "Your collection of world-class inspirations.",
      img: "/bg8.jpg",
      color: "#4F6815",
      action: "View",
      path: "/smart-library"
    },
    {
      title: "Personalized Picks",
      desc: "Curated matches for your unique palate.",
      img: "/bg7.jpg",
      color: "#E8A88E",
      action: "Discover",
      path: "/personalized-picks"
    }
  ];

  const ratingLabels = { 5: 'Excellent', 4: 'Great', 3: 'Good', 2: 'Fair', 1: 'Poor' };

  return (
    <div style={{ backgroundColor: '#F0E6DA', minHeight: '100vh', fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#2A241E' }}>
      
      {/* ── Navbar ── */}
      <nav style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, 
        padding: '25px 0', 
        backgroundColor: 'rgba(240, 230, 218, 0.95)', 
        backdropFilter: 'blur(20px)', 
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        borderBottom: scrolled ? '1px solid rgba(42,36,30,0.05)' : 'none'
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <SafeLogo />
          </div>

          {/* Global Search Bar (Pill Shape) */}
          <div style={{ flex: 1, maxWidth: '600px', margin: '0 40px', position: 'relative' }}>
            <Search size={18} color="#2A241E" style={{ position: 'absolute', left: '25px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
            <input 
              type="text" 
              placeholder="Search recipes, ingredients..." 
              style={{ 
                width: '100%', padding: '15px 30px 15px 60px', borderRadius: '100px', 
                border: '1px solid rgba(42,36,30,0.15)', backgroundColor: '#FDFBF7',
                fontSize: '14px', fontWeight: '600', outline: 'none', transition: 'all 0.3s ease',
                color: '#2A241E'
              }}
              onFocus={(e) => { e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.04)'; }}
              onBlur={(e) => { e.target.style.backgroundColor = '#FDFBF7'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', backgroundColor: 'rgba(42,36,30,0.05)', borderRadius: '100px' }}>
              <div style={{ width: '36px', height: '36px', backgroundColor: '#75070C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(117,7,12,0.2)' }}>
                <User size={18} />
              </div>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#2A241E' }}>
                {user?.firstName || 'Chef'}
              </span>
            </div>
            <button 
              onClick={handleLogout} 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', 
                color: '#75070C', fontWeight: '900', cursor: 'pointer', fontSize: '13px', 
                textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateX(3px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'translateX(0)'; }}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section style={{ 
        position: 'relative', height: '600px', width: '100%', overflow: 'hidden', 
        paddingTop: '100px',
        boxSizing: 'border-box'
      }}>
        <img 
          src="/bg10.jpg" 
          alt="Hero" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', position: 'absolute', inset: 0, zIndex: 0 }} 
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)', zIndex: 1 }} />
        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 80px', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', padding: '10px 20px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '100px', color: 'white', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '25px', backdropFilter: 'blur(10px)', width: 'fit-content', border: '1px solid rgba(255,255,255,0.1)' }}>
            Chef's Workspace
          </div>
          <h2 style={{ fontSize: '72px', fontWeight: '900', color: 'white', lineHeight: '1', margin: '0 0 25px 0', letterSpacing: '-2px' }}>
            Welcome back, <br /><span style={{ color: '#E8A88E' }}>{user?.firstName || 'Chef'}!</span>
          </h2>
          <p style={{ fontSize: '22px', color: 'rgba(255,255,255,0.8)', maxWidth: '650px', fontWeight: '600', fontStyle: 'italic', lineHeight: '1.6' }}>
            Ready to transform your kitchen today? Discover new recipes and master your culinary skills.
          </p>
        </div>
      </section>

      <main>
        {/* ── Feature Cards Grid ── */}
        <section style={{ maxWidth: '1440px', margin: '0 auto', padding: '80px 60px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
          {featureCards.map((card, i) => (
            <div 
              key={i}
              style={{ position: 'relative', height: '450px', backgroundColor: '#F0E6DA', borderRadius: '45px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', border: '1px solid rgba(42,36,30,0.05)', boxShadow: '0 20px 50px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
              onClick={() => navigate(card.path)}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-15px)'; e.currentTarget.style.boxShadow = '0 30px 60px rgba(0,0,0,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.04)'; }}
            >
              <div style={{ position: 'absolute', inset: 0, opacity: 1, zIndex: 0 }}><img src={card.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)', zIndex: 1 }} />
              <div style={{ position: 'relative', zIndex: 2, padding: '45px' }}>
                <h3 style={{ fontSize: '32px', fontWeight: '900', color: 'white', margin: '0 0 15px 0', letterSpacing: '-1px' }}>{card.title}</h3>
                <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', fontWeight: '600', marginBottom: '30px' }}>{card.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#2A241E', fontWeight: '900', fontSize: '14px', backgroundColor: 'white', width: 'fit-content', padding: '14px 28px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {card.action} <ChevronRight size={18} />
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* ── Redesigned Review Section ── */}
        <section style={{ 
          backgroundColor: '#F0E6DA', 
          padding: '100px 60px', 
          position: 'relative',
          backgroundImage: `linear-gradient(rgba(240, 230, 218, 0.88), rgba(240, 230, 218, 0.88)), url(/bg11.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          <div style={{ maxWidth: '680px', margin: '0 auto', position: 'relative' }}>
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.div 
                  key="review-form"
                  initial={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '40px', 
                    padding: '60px', 
                    boxShadow: '0 40px 80px rgba(42,36,30,0.12), 0 10px 30px rgba(42,36,30,0.06)',
                    textAlign: 'center'
                  }}
                >
                  <h2 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '15px', letterSpacing: '-1px' }}>Share Your Culinary Journey</h2>
                  <p style={{ fontSize: '18px', opacity: 0.6, fontWeight: '500', marginBottom: '40px' }}>Your feedback inspires our chefs. Tell us about your latest masterpiece.</p>
                  
                  {/* Interactive Stars */}
                  <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '10px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.div
                          key={star}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => {
                            setSelectedRating(star);
                            ratingRef.current = star;
                          }}
                          whileTap={{ scale: 0.9 }}
                          style={{ cursor: 'pointer' }}
                        >
                          <Star 
                            size={40} 
                            fill={(hoveredRating || selectedRating) >= star ? "#75070C" : "transparent"} 
                            color={(hoveredRating || selectedRating) >= star ? "#75070C" : "rgba(42,36,30,0.15)"} 
                            style={{ transition: 'all 0.2s ease' }}
                          />
                        </motion.div>
                      ))}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#75070C', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {ratingLabels[hoveredRating || selectedRating]}
                    </div>
                  </div>

                  <textarea 
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Tell us about the flavors, the texture, and the experience..."
                    style={{ 
                      width: '100%', padding: '24px', borderRadius: '20px', border: '2px solid transparent', 
                      backgroundColor: '#FAF6F1', fontSize: '18px', fontWeight: '500', minHeight: '160px',
                      outline: 'none', transition: 'all 0.3s ease', resize: 'none', color: '#2A241E',
                      marginBottom: '30px', boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#75070C'}
                    onBlur={(e) => e.target.style.borderColor = 'transparent'}
                  />

                  <button 
                    onClick={handlePostReview}
                    style={{ 
                      width: '100%', padding: '18px', borderRadius: '16px', border: 'none', 
                      background: 'linear-gradient(135deg, #75070C 0%, #A50F15 100%)', 
                      color: 'white', fontWeight: '900', fontSize: '16px', letterSpacing: '1px', 
                      cursor: 'pointer', textTransform: 'uppercase' 
                    }}
                  >
                    POST REVIEW
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="success-message"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '40px', 
                    padding: '80px 60px', 
                    boxShadow: '0 40px 80px rgba(42,36,30,0.12), 0 10px 30px rgba(42,36,30,0.06)',
                    textAlign: 'center'
                  }}
                >
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                    style={{ marginBottom: '30px' }}
                  >
                    <CheckCircle size={80} color="#4F6815" />
                  </motion.div>
                  <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#2A241E', marginBottom: '15px' }}>
                    Thank you, {user?.firstName || 'Chef'}!
                  </h2>
                  <p style={{ fontSize: '20px', fontWeight: '700', color: '#2A241E', opacity: 0.9, marginBottom: '10px' }}>
                    Your review is live.
                  </p>
                  <p style={{ fontSize: '16px', fontWeight: '600', opacity: 0.5 }}>
                    It will appear on our homepage shortly.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer style={{ backgroundColor: '#E8DDCF', padding: '80px 0', color: '#2A241E', borderTop: '1px solid rgba(42,36,30,0.05)' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SafeLogo />
          <div style={{ fontSize: '14px', fontWeight: '800', opacity: 0.4, letterSpacing: '1px' }}>CLICK AND COOK @ 2026. ALL RIGHTS RESERVED.</div>
          <div style={{ display: 'flex', gap: '35px' }}>
            {['AI Recipes', 'Smart Library', 'Picks'].map(item => (
              <a key={item} href="#" style={{ color: '#2A241E', opacity: 0.6, fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', textDecoration: 'none' }}>{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
