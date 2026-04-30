import React from 'react';
import { useNavigate } from 'react-router-dom';

const Logo = ({ light = false }) => {
  const navigate = useNavigate();
  return (
    <div 
      onClick={() => navigate('/')}
      style={{ display: 'flex', flexDirection: 'column', gap: '2px', cursor: 'pointer' }}
    >
      <span style={{ 
        fontSize: '28px', 
        fontWeight: '900', 
        color: light ? 'white' : '#2A241E', 
        letterSpacing: '-0.04em',
        lineHeight: '1'
      }}>
        Click<span style={{ color: '#75070C' }}>&</span>Cook
      </span>
      <span style={{ 
        fontSize: '11px', 
        fontWeight: '900', 
        color: '#4F6815', 
        letterSpacing: '0.08em', 
        textTransform: 'uppercase'
      }}>
        Smart Kitchen Companion
      </span>
    </div>
  );
};

export default Logo;
