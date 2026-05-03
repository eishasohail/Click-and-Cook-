import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import Logo from "../components/shared/Logo";
import Aurora from "../components/shared/Aurora";
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Zap, Sparkles, Star, Plus, Minus, Bookmark, Search, Globe, BookOpen, MessageCircle, Share2, User
} from 'lucide-react';
import './Landing.css';

// Failsafe sub-component definitions
const SafeLogo = (props) => {
  if (typeof Logo !== 'undefined') return <Logo {...props} />;
  return <div style={{ fontWeight: 'bold' }}>Click&Cook</div>;
};

const SafeAurora = (props) => {
  if (typeof Aurora !== 'undefined') return <Aurora {...props} />;
  return <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(240, 230, 218, 0.5)' }} />;
};

const FAQItem = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid rgba(42,36,30,0.1)' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <h4 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#2A241E', transition: 'color 0.3s ease' }}>
          {item.q}
        </h4>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          {isOpen ? <Minus size={20} color="#2A241E" /> : <Plus size={20} color="#2A241E" />}
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingBottom: '24px', fontSize: '15px', color: '#4A3F35', lineHeight: '1.6', opacity: 0.7 }}>
              {item.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AnimatedStars = ({ count = 5 }) => {
  return (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
      {[...Array(5)].map((_, i) => (
        <motion.div key={i} initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + (i * 0.05), type: 'spring' }}>
          <Star size={16} fill={i < count ? "#D4AF37" : "transparent"} color={i < count ? "#D4AF37" : "#E2E8F0"} />
        </motion.div>
      ))}
    </div>
  );
};

export default function Landing() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('Features');
  const [reviews, setReviews] = useState([
    { name: 'Ifra', acc: '#75070C', text: "The AI recommendations are so accurate, it knows my taste better than I do!" },
    { name: 'Menahil', acc: '#4F6815', text: "Cooking has never been this easy and fun. Highly recommended!" },
    { name: 'Maryam', acc: '#75070C', text: "The 15-minute recipes are a lifesaver for busy weeknights." }
  ]);

  useEffect(() => {
    // Fetch Reviews from backend
    const fetchReviews = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const response = await axios.get(`${API_BASE_URL}/api/reviews`);
        if (response.data && response.data.length > 0) {
          setReviews(response.data);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };
    fetchReviews();

    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
      const sections = ['features', 'process', 'reviews', 'kitchen-queries'];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rectT = el.getBoundingClientRect();
          if (rectT.top >= 0 && rectT.top <= window.innerHeight / 2) {
            const tabName = section === 'kitchen-queries' ? 'Kitchen Queries' : section.charAt(0).toUpperCase() + section.slice(1);
            setActiveTab(tabName);
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = ['Features', 'Process', 'Reviews', 'Kitchen Queries'];
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.3 } } };
  const cardVariants = { hidden: { opacity: 0, y: 50, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } } };

  const faqs = [
    { q: "Is it free to use the AI generator?", a: "We offer a generous free tier that lets you generate up to 10 gourmet recipes per month. For unlimited access and advanced features, you can upgrade to Pro." },
    { q: "Can I save my own secret recipes?", a: "Absolutely! You can manually add your favorite recipes to your digital cookbook and organize them perfectly within My CookBook." },
    { q: "Do the recipes cater to allergies?", a: "Yes! You can specify any dietary restrictions or allergies before generating. Our AI carefully filters all ingredients to ensure the suggested meal is safe for you." },
    { q: "Can I tweak a recipe after it's generated?", a: "Definitely! Every generated recipe comes with an AI follow-up chat. You can ask for ingredient substitutions, request a spicier version, or ask any cooking questions right there." }
  ];

  const sectionDividerStyle = { maxWidth: '1440px', margin: '0 auto', borderBottom: '1px solid rgba(42,36,30,0.06)' };

  const scrollToSection = (id) => {
    const sectionId = id.toLowerCase().replace(/ /g, '-');
    const el = document.getElementById(sectionId);
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 120;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div id="click-and-cook-landing" style={{ backgroundColor: '#F0E6DA', minHeight: '100vh', fontFamily: '"Plus Jakarta Sans", sans-serif', scrollBehavior: 'smooth', position: 'relative', overflowX: 'hidden' }}>

      {/* ── Navbar ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, padding: scrolled ? '20px 0' : '40px 0', backgroundColor: scrolled ? 'rgba(240, 230, 218, 0.9)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SafeLogo />
          <div style={{ display: 'flex', gap: '50px', alignItems: 'center', position: 'relative' }}>
            {navItems.map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} onClick={(e) => { e.preventDefault(); setActiveTab(item); scrollToSection(item); }} style={{ fontSize: '14px', fontWeight: '800', color: activeTab === item ? '#75070C' : '#2A241E', textDecoration: 'none', opacity: activeTab === item ? 1 : 0.6, position: 'relative', paddingBottom: '5px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {item}{activeTab === item && (<motion.div layoutId="nav-underline" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: '#75070C' }} />)}
              </a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', backgroundColor: 'rgba(42,36,30,0.05)', borderRadius: '100px' }}>
                  <div style={{ width: '32px', height: '32px', backgroundColor: '#75070C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <User size={18} />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#2A241E' }}>
                    {user?.firstName || 'Chef'}
                  </span>
                </div>
                <button onClick={() => navigate('/dashboard')} className="shimmer-btn" style={{ padding: '16px 36px', borderRadius: '14px', border: 'none', color: 'white', fontWeight: '900', cursor: 'pointer', fontSize: '14px' }}>Dashboard</button>
              </div>
            ) : (
              <>
                <button onClick={() => navigate('/signin')} style={{ padding: '12px 24px', border: 'none', backgroundColor: 'transparent', fontWeight: '900', cursor: 'pointer', fontSize: '14px' }}>Login</button>
                <button onClick={() => navigate('/signup')} className="shimmer-btn" style={{ padding: '16px 36px', borderRadius: '14px', border: 'none', color: 'white', fontWeight: '900', cursor: 'pointer', fontSize: '14px' }}>Get Started</button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        {/* ── Hero (STRICT RESTORATION) ── */}
        <section id="hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', backgroundColor: 'transparent' }}>
          <div style={{ position: 'absolute', top: '120px', bottom: 0, left: 0, right: 0, zIndex: 0, backgroundImage: 'url(/bg4.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#F0E6DA' }} />
          <div style={{ position: 'absolute', top: '120px', bottom: 0, left: 0, right: 0, zIndex: 1, background: 'linear-gradient(to right, #F0E6DA 0%, rgba(240, 230, 218, 0.3) 35%, transparent 100%)' }} />
          <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 60px', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '100px', alignItems: 'center', position: 'relative', zIndex: 2, paddingTop: '100px' }}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '12px 24px', backgroundColor: 'rgba(79, 104, 21, 0.15)', borderRadius: '100px', color: '#4F6815', fontWeight: '800', fontSize: '13px', marginBottom: '40px', backdropFilter: 'blur(10px)', letterSpacing: '1px', textTransform: 'uppercase' }}>The Future of Home Cooking</div>
              <h1 style={{ fontSize: '72px', fontWeight: '900', color: '#2A241E', lineHeight: '1.1', margin: '0 0 40px 0' }}>Cook Smarter, <br /><span style={{ color: '#75070C' }}>Eat Better</span> Every Day</h1>
              <p style={{ fontSize: '18px', color: '#4A3F35', lineHeight: '1.8', maxWidth: '500px', marginBottom: '60px', fontWeight: '600', opacity: 0.7 }}>Transform your kitchen experience with AI-powered recipes, smart meal planning, and a community of food lovers. Your perfect meal is just one click away.</p>
              <button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')} className="shimmer-btn hover-lift" style={{ padding: '24px 60px', borderRadius: '18px', fontSize: '17px', fontWeight: '900' }}>{isAuthenticated ? 'Go to Dashboard' : 'Start Cooking Now'}</button>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: 0.2 }} style={{ position: 'relative' }}>
              <div style={{ width: '90%', aspectRatio: '1/1', borderRadius: '50px', overflow: 'hidden', border: '4px solid white', boxShadow: '0 40px 80px rgba(0,0,0,0.1)', backgroundColor: 'white', margin: '0 auto' }}><img src="/bg5.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Gourmet" /></div>
              <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} style={{ position: 'absolute', bottom: '-20px', left: '0', backgroundColor: 'white', padding: '25px 40px', borderRadius: '35px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.08)' }}>
                <div style={{ width: '50px', height: '50px', backgroundColor: 'rgba(79,104,21,0.05)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F6815' }}><Zap size={26} /></div>
                <div><div style={{ fontSize: '11px', fontWeight: '800', opacity: 0.4, textTransform: 'uppercase' }}>Quick Prep</div><div style={{ fontSize: '24px', fontWeight: '900' }}>15 Mins</div></div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <div style={sectionDividerStyle} />

        {/* ── Features (STRICT RESTORATION) ── */}
        <section id="features" style={{ padding: '180px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '100px' }}><h2 style={{ fontSize: '56px', fontWeight: '900' }}>Kitchen Superpowers</h2><p style={{ fontSize: '18px', opacity: 0.6, marginTop: '20px' }}>Everything you need to become a master chef in your own home.</p></div>
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.1 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '30px', maxWidth: '1440px', margin: '0 auto', padding: '0 60px' }}>
            <motion.div variants={cardVariants} whileHover={{ y: -15 }} style={{ gridColumn: 'span 8', backgroundColor: '#E8A88E', borderRadius: '45px', display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden', minHeight: '380px' }}>
              <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><Sparkles size={36} color="#75070C" style={{ marginBottom: '30px' }} /><h3 style={{ fontSize: '32px', fontWeight: '900' }}>AI Recipe Generation</h3><p style={{ fontSize: '17px', lineHeight: '1.7', marginTop: '15px', opacity: 0.8 }}>Just tell us what's in your fridge, and our AI will craft a gourmet recipe in seconds. No waste, just great taste.</p></div>
              <div style={{ overflow: 'hidden' }}><img src="/bg6.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="AI" /></div>
            </motion.div>
            <motion.div variants={cardVariants} whileHover={{ y: -15 }} style={{ gridColumn: 'span 4', backgroundColor: '#4F6815', borderRadius: '45px', padding: '60px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div><Bookmark size={36} /><h3 style={{ fontSize: '28px', fontWeight: '900', marginTop: '30px' }}>Save Your Favorites</h3><p style={{ fontSize: '17px', opacity: 0.7, marginTop: '15px' }}>Build your personal digital cookbook and access your recipes from any device, anywhere.</p></div>
              <div style={{ display: 'flex', marginLeft: '10px' }}>{[1, 2, 3].map(i => (<div key={i} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #4F6815', marginLeft: '-12px', overflow: 'hidden' }}><img src={`https://i.pravatar.cc/100?img=${i + 30}`} alt="u" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>))}<div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #4F6815', marginLeft: '-12px', backgroundColor: 'white', color: '#4F6815', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900' }}>+2k</div></div>
            </motion.div>
            <motion.div variants={cardVariants} whileHover={{ y: -15 }} style={{ gridColumn: 'span 4', backgroundColor: '#E8A88E', borderRadius: '45px', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><BookOpen size={36} color="#75070C" /><h3 style={{ fontSize: '28px', fontWeight: '900', margin: '30px 0 15px 0' }}>My CookBook</h3><p style={{ fontSize: '17px', opacity: 0.7 }}>Organized by category, difficulty, and prep time for your convenience.</p></motion.div>
            <motion.div variants={cardVariants} whileHover={{ y: -15 }} style={{ gridColumn: 'span 8', backgroundColor: '#2A241E', borderRadius: '45px', padding: '70px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div style={{ maxWidth: '60%' }}><h3 style={{ fontSize: '32px', fontWeight: '900' }}>Personalized Recommendations</h3><p style={{ fontSize: '17px', opacity: 0.7, marginTop: '15px' }}>We learn your taste buds and suggest dishes you'll actually love based on your history.</p></div><div style={{ display: 'flex', gap: '12px' }}>{['Vegan', 'Low Carb', 'Spicy'].map(tag => (<div key={tag} style={{ padding: '12px 24px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.15)', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.05)', fontWeight: '700' }}>{tag}</div>))}</div></motion.div>
          </motion.div>
        </section>

        <div style={sectionDividerStyle} />

        {/* ── Process (STRICT RESTORATION) ── */}
        <section id="process" style={{ padding: '200px 0' }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 60px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '64px', fontWeight: '900', marginBottom: '140px' }}>The Journey to <span style={{ color: '#75070C' }}>Great Food</span></h2>
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.1 }} style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '100px' }}>
              <div style={{ position: 'absolute', top: '55px', left: '15%', right: '15%', height: '2px', overflow: 'hidden' }}>
                <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} style={{ width: '200%', height: '100%', borderTop: '2px dashed rgba(117,7,12,0.15)' }} />
              </div>
              {[
                { n: 1, t: "Input Your Pantry", p: "Tell us what ingredients you have on hand or what you're craving.", icon: <Search size={28} /> },
                { n: 2, t: "Get AI Inspiration", p: "Instantly receive creative, step-by-step recipes tailored to your skill level.", h: true, icon: <Sparkles size={28} /> },
                { n: 3, t: "Cook & Enjoy", p: "Follow the interactive guide and plate your masterpiece. Bon appétit!", icon: <Globe size={28} /> }
              ].map((step, i) => (
                <motion.div key={i} variants={cardVariants} whileHover={{ y: -20 }} style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
                  <motion.div whileHover={{ scale: 1.15, rotate: 8, boxShadow: '0 25px 50px rgba(117,7,12,0.1)' }} style={{ width: '110px', height: '110px', backgroundColor: step.h ? '#75070C' : 'white', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '900', color: step.h ? 'white' : '#75070C', margin: '0 auto 45px auto', boxShadow: '0 15px 35px rgba(0,0,0,0.03)' }}>{step.h ? step.icon : step.n}</motion.div>
                  <h4 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '25px', color: '#2A241E' }}>{step.t}</h4>
                  <p style={{ fontSize: '18px', color: '#4A3F35', lineHeight: '1.8', maxWidth: '300px', margin: '0 auto', opacity: 0.6, fontWeight: '500' }}>{step.p}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <div style={sectionDividerStyle} />

        {/* ── Reviews (STRICT RESTORATION) ── */}
        <section id="reviews" style={{ padding: '180px 0', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}><SafeAurora colorStops={["#FFE899", "#E8A88E", "#F0E6DA"]} blend={0.8} amplitude={1.2} speed={0.4} /></div>
          <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 60px', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: '100px' }}><h2 style={{ fontSize: '56px', fontWeight: '900' }}>Voices of the <span style={{ color: '#75070C' }}>Kitchen</span></h2></div>
          </div>
          
          {reviews && reviews.length > 0 && (
            <div style={{ display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1, padding: '20px 0' }}>
              <motion.div 
                animate={{ x: [0, "-50%"] }} 
                transition={{ ease: "linear", duration: Math.max(reviews.length * 10, 30), repeat: Infinity }}
                style={{ display: 'flex', gap: '40px', paddingLeft: '40px', minWidth: 'max-content' }}
              >
                {[...reviews, ...reviews, ...reviews, ...reviews].map((rev, i) => {
                  const colors = ['#75070C', '#4F6815'];
                  const cardColor = colors[i % colors.length];
                  return (
                    <motion.div key={i} whileHover={{ y: -10 }} style={{ width: '450px', backgroundColor: 'white', padding: '50px', borderRadius: '45px', borderLeft: `8px solid ${cardColor}`, boxShadow: '0 20px 50px rgba(0,0,0,0.03)', position: 'relative', flexShrink: 0, whiteSpace: 'normal', display: 'flex', flexDirection: 'column' }}>
                      <AnimatedStars count={rev.rating || 5} />
                      <p style={{ fontSize: '18px', fontWeight: '500', color: '#4A3F35', lineHeight: '1.7', marginBottom: 'auto', opacity: 0.8, paddingBottom: '30px' }}>"{rev.text}"</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: '45px', height: '45px', borderRadius: '15px', backgroundColor: cardColor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '18px' }}>{(rev.name && rev.name[0]) || 'U'}</div>
                        <h4 style={{ fontWeight: '900', fontSize: '18px', margin: 0, color: '#2A241E' }}>{rev.name}</h4>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          )}
        </section>

        <div style={sectionDividerStyle} />

        {/* ── Kitchen Queries (STRICT RESTORATION) ── */}
        <section id="kitchen-queries" style={{ padding: '200px 0' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 60px' }}>
            <div style={{ textAlign: 'center', marginBottom: '120px' }}><h2 style={{ fontSize: '64px', fontWeight: '900', marginBottom: '30px' }}>Common Kitchen Queries</h2><p style={{ fontSize: '20px', opacity: 0.6, maxWidth: '600px', margin: '0 auto', fontWeight: '500' }}>Everything you need to know about the Click and Cook platform.</p></div>
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.1 }}>{faqs.map((faq, index) => (<motion.div key={index} variants={cardVariants}><FAQItem item={faq} /></motion.div>))}</motion.div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ backgroundColor: '#E8DDCF', padding: '60px 0', color: '#2A241E', borderTop: '1px solid rgba(42,36,30,0.05)' }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SafeLogo />
            <div style={{ fontSize: '14px', fontWeight: '800', opacity: 0.4, letterSpacing: '1px' }}>CLICK AND COOK @ 2026. ALL RIGHTS RESERVED.</div>
            <div style={{ display: 'flex', gap: '35px' }}>
              {navItems.map(item => (
                <button key={item} onClick={() => scrollToSection(item)} style={{ background: 'none', border: 'none', color: '#2A241E', opacity: 0.6, cursor: 'pointer', fontSize: '13px', fontWeight: '800', padding: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item}</button>
              ))}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
