import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import Logo from "../components/shared/Logo";
import { Search, LogOut, User } from 'lucide-react';

const SafeLogo = (props) => {
  if (typeof Logo !== 'undefined') return <Logo {...props} />;
  return <div style={{ fontWeight: '900', fontSize: '20px', fontStyle: 'italic', color: '#75070C' }}>Click & Cook</div>;
};

const PersonalizedPicks = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  return (
    <div style={{ backgroundColor: '#F0E6DA', minHeight: '100vh', fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#2A241E' }}>
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, padding: '20px 0', backgroundColor: 'rgba(240, 230, 218, 0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(42,36,30,0.05)' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}><SafeLogo /></div>
          <div style={{ flex: 1, maxWidth: '500px', margin: '0 40px', position: 'relative' }}>
             <Search size={20} color="#2A241E" style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
             <input type="text" placeholder="Search your picks..." style={{ width: '100%', padding: '12px 20px 12px 55px', borderRadius: '100px', border: '1px solid rgba(42,36,30,0.1)', backgroundColor: 'white', fontSize: '14px', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', backgroundColor: 'rgba(42,36,30,0.05)', borderRadius: '100px' }}>
              <User size={16} /><span style={{ fontSize: '13px', fontWeight: '800' }}>{user?.firstName || 'Chef'}</span>
            </div>
            <button onClick={() => { dispatch(logout()); navigate('/'); }} style={{ background: 'none', border: 'none', color: '#75070C', fontWeight: '900', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}><LogOut size={16} /> Logout</button>
          </div>
        </div>
      </nav>
      <main style={{ paddingTop: '150px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '20px' }}>Personalized Picks</h1>
        <p style={{ fontSize: '20px', opacity: 0.6 }}>Our AI is learning your taste buds to find the perfect matches.</p>
        <div style={{ fontSize: '100px', margin: '40px 0' }}>❤️🍴</div>
        <p style={{ fontSize: '24px', fontWeight: '800' }}>Coming Soon...</p>
        <button onClick={() => navigate('/dashboard')} style={{ marginTop: '40px', padding: '15px 40px', borderRadius: '12px', border: 'none', backgroundColor: '#75070C', color: 'white', fontWeight: '800', cursor: 'pointer', fontSize: '16px' }}>Back to Dashboard</button>
      </main>
    </div>
  );
};

export default PersonalizedPicks;
