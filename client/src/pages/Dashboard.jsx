import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import Logo from "../components/shared/Logo";
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Search, LogOut, ChevronRight, Star, User, CheckCircle,
  Bookmark, Sparkles, Flame
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

// --- Aceternity-Style Glowing Effect Component ---
const GlowingEffect = ({ containerRef }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseenter', () => setIsHovered(true));
      container.addEventListener('mouseleave', () => setIsHovered(false));
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [containerRef]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 2, // Above the overlays
        overflow: 'hidden',
        borderRadius: 'inherit'
      }}
    >
      {/* Dynamic Cursor Glow */}
      <motion.div
        animate={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(232, 168, 142, 0.6), transparent 80%)`
        }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute',
          inset: 0,
          mixBlendMode: 'plus-lighter',
        }}
      />

      {/* Static Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(1000px circle at 50% 50%, rgba(117, 7, 12, 0.2), transparent 100%)',
          mixBlendMode: 'screen'
        }}
      />
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);

  // Review Form State
  const [reviewText, setReviewText] = useState('');
  const [selectedRating, setSelectedRating] = useState(5);
  const ratingRef = useRef(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [stats, setStats] = useState({
    saved: 0,
    generated: 0,
    activeDays: 1
  });
  const [hoveredCard, setHoveredCard] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const res = await axios.get(
          `${API_BASE_URL}/api/user/stats`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Calculate days active
        const created = new Date(res.data.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - created);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

        setStats({
          saved: res.data.saved,
          generated: res.data.generated,
          activeDays: diffDays
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, [token]);

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

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    try {
      await axios.post(`${API_BASE_URL}/api/reviews`,
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
      title: "My CookBook",
      desc: "Your collection of world-class inspirations.",
      img: "/bg8.jpg",
      color: "#4F6815",
      action: "View",
      path: "/library"
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
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && globalSearch.trim()) {
                  navigate('/library', { state: { searchQuery: globalSearch.trim() } });
                }
              }}
              style={{
                width: '100%', padding: '15px 30px 15px 60px', borderRadius: '100px',
                border: '1px solid rgba(42,36,30,0.15)', backgroundColor: '#FDFBF7',
                fontSize: '14px', fontWeight: '600', outline: 'none', transition: 'all 0.3s ease',
                color: '#2A241E'
              }}
              onFocus={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.boxShadow = '0 0 0 3px rgba(117,7,12,0.1), 0 10px 30px rgba(0,0,0,0.04)';
                e.target.style.borderColor = '#75070C';
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = '#FDFBF7';
                e.target.style.boxShadow = 'none';
                e.target.style.borderColor = 'rgba(42,36,30,0.15)';
              }}
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
      <section
        ref={heroRef}
        style={{
          position: 'relative', height: '600px', width: '100%', overflow: 'hidden',
          paddingTop: '100px',
          boxSizing: 'border-box'
        }}
      >
        <GlowingEffect containerRef={heroRef} />
        <img
          src="/bg10.jpg"
          alt="Hero"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', position: 'absolute', inset: 0, zIndex: 0 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)', zIndex: 1 }} />

        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            position: 'relative', height: '100%',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', padding: '0 80px',
            zIndex: 3
          }} // Above the GlowingEffect
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ display: 'inline-flex', padding: '10px 20px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '100px', color: 'white', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '25px', backdropFilter: 'blur(10px)', width: 'fit-content', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Chef's Workspace
          </motion.div>
          <h2 style={{
            fontSize: '72px', fontWeight: '900',
            color: 'white', lineHeight: '1',
            margin: '0 0 25px 0', letterSpacing: '-2px',
            position: 'relative'
          }}>
            Welcome back, <br />
            <motion.span
              animate={{
                backgroundPosition: ['-200% 0', '200% 0']
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                position: 'relative',
                display: 'inline-block',
                color: '#E8A88E',
                backgroundImage: 'linear-gradient(90deg, #E8A88E 0%, #ffffff 25%, #E8A88E 50%, #ffffff 75%, #E8A88E 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {user?.firstName || 'Chef'}!
            </motion.span>
          </h2>
          <p style={{
            fontSize: '22px', color:
              'rgba(255,255,255,0.8)', maxWidth: '650px',
            fontWeight: '600', lineHeight: '1.6',
            marginBottom: '40px'
          }}>
            Ready to transform your kitchen today?
            Discover new recipes and master your
            culinary skills.
          </p>

          {/* Stat Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            {[
              {
                label: 'Recipes Saved',
                value: stats.saved,
                icon: <Bookmark size={24} />,
                color: 'rgba(117,7,12,0.6)'
              },
              {
                label: 'Recipes Generated',
                value: stats.generated,
                icon: <Sparkles size={24} />,
                color: 'rgba(79,104,21,0.6)'
              },
              {
                label: 'Days Active',
                value: stats.activeDays,
                icon: <Flame size={24} />,
                color: 'rgba(255,107,53,0.6)'
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                style={{
                  padding: '16px 24px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'default'
                }}
              >
                <span style={{ color: 'white' }}>
                  {stat.icon}
                </span>
                <div>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '900',
                    color: 'white',
                    lineHeight: '1'
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: 'rgba(255,255,255,0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginTop: '3px'
                  }}>
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <main>
        {/* ── Feature Cards Grid ── */}
        <section style={{ maxWidth: '1440px', margin: '0 auto', padding: '80px 60px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
          {featureCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              whileHover={{ y: -15 }}
              style={{
                position: 'relative',
                height: '450px',
                backgroundColor: '#F0E6DA',
                borderRadius: '45px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                border: '1px solid rgba(42,36,30,0.05)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                transition: 'box-shadow 0.5s ease'
              }}
              onHoverStart={() => setHoveredCard(i)}
              onHoverEnd={() => setHoveredCard(null)}
              onClick={() => navigate(card.path)}
            >
              <div style={{
                position: 'absolute', inset: 0,
                opacity: 1, zIndex: 0
              }}>
                <img src={card.img} alt="" style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover'
                }} />
              </div>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
                zIndex: 1
              }} />
              <div style={{
                position: 'relative', zIndex: 2,
                padding: '45px'
              }}>
                <h3 style={{
                  fontSize: '32px', fontWeight: '900',
                  color: 'white', margin: '0 0 15px 0',
                  letterSpacing: '-1px'
                }}>
                  {card.title}
                </h3>
                <p style={{
                  fontSize: '17px',
                  color: 'rgba(255,255,255,0.8)',
                  lineHeight: '1.6', fontWeight: '600',
                  marginBottom: '30px'
                }}>
                  {card.desc}
                </p>

                {/* Liquid Fill Button */}
                <div style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  overflow: 'hidden',
                  color: hoveredCard === i ? 'white' : '#2A241E',
                  fontWeight: '900',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  padding: '14px 28px',
                  borderRadius: '100px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  transition: 'color 0.4s ease'
                }}>
                  {/* Liquid fill background */}
                  <motion.div
                    animate={{
                      y: hoveredCard === i ? '0%' : '100%'
                    }}
                    transition={{
                      duration: 0.4,
                      ease: [0.23, 1, 0.32, 1]
                    }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: card.color,
                      borderRadius: '100px',
                    }}
                  />
                  <span style={{ position: 'relative', zIndex: 1 }}>
                    {card.action}
                  </span>
                  <ChevronRight
                    size={18}
                    style={{ position: 'relative', zIndex: 1 }}
                  />
                </div>
              </div>
            </motion.div>
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
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Glow effect */}
                  <motion.div
                    animate={{
                      opacity: [0.03, 0.08, 0.03],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{
                      position: 'absolute',
                      top: '-50%',
                      left: '-50%',
                      width: '200%',
                      height: '200%',
                      background: 'radial-gradient(circle, #75070C 0%, transparent 60%)',
                      pointerEvents: 'none',
                      zIndex: 0
                    }}
                  />
                  <div style={{ position: 'relative', zIndex: 1 }}>
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
                            whileHover={{ scale: 1.2, rotate: 5 }}
                            style={{
                              cursor: 'pointer',
                              position: 'relative',
                              overflow: 'hidden',
                              borderRadius: '4px'
                            }}
                          >
                            <Star
                              size={40}
                              fill={(hoveredRating || selectedRating) >= star ? "#75070C" : "transparent"}
                              color={(hoveredRating || selectedRating) >= star ? "#75070C" : "rgba(42,36,30,0.15)"}
                              style={{ transition: 'all 0.2s ease', position: 'relative', zIndex: 0 }}
                            />

                            {/* Star Shimmer Effect */}
                            {(hoveredRating || selectedRating) >= star && (
                              <motion.div
                                animate={{
                                  x: ['-150%', '150%']
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                  delay: star * 0.1
                                }}
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                                  zIndex: 1,
                                  pointerEvents: 'none',
                                  mixBlendMode: 'plus-lighter'
                                }}
                              />
                            )}
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

                    <motion.button
                      onClick={handlePostReview}
                      whileTap={{ scale: 0.98 }}
                      className="btn-fluid-fill"
                      style={{
                        width: '100%',
                        padding: '18px',
                        borderRadius: '16px',
                        border: 'none',
                        position: 'relative',
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #75070C 0%, #A50F15 100%)',
                        color: 'white',
                        fontWeight: '900',
                        fontSize: '16px',
                        letterSpacing: '1px',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        zIndex: 1
                      }}
                    >
                      <span style={{
                        position: 'relative',
                        zIndex: 2
                      }}>
                        POST REVIEW
                      </span>
                    </motion.button>
                  </div>
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
            {['AI Recipe Generator', 'My CookBook', 'Personalized Picks'].map(item => (
              <a key={item} href="#" style={{ color: '#2A241E', opacity: 0.6, fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', textDecoration: 'none' }}>{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
