import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat, UtensilsCrossed, Flame,
  Timer, BookOpen, Leaf
} from 'lucide-react';
import Logo from './Logo';

const SafeLogo = () => {
  try {
    return <Logo />;
  } catch {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        lineHeight: '1.1'
      }}>
        <div style={{
          fontWeight: '900',
          fontSize: '22px',
          color: '#2A241E',
          letterSpacing: '-0.5px',
          fontFamily: '"Plus Jakarta Sans", sans-serif'
        }}>
          Click<span style={{ color: '#75070C' }}>&</span>Cook
        </div>
        <div style={{
          fontSize: '9px',
          fontWeight: '800',
          color: '#2A241E',
          opacity: 0.5,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginTop: '3px',
          fontFamily: '"Plus Jakarta Sans", sans-serif'
        }}>
          Smart Kitchen Companion
        </div>
      </div>
    );
  }
};

const messages = [
  "Prepping your next delicious meal...",
  "Gathering the finest ingredients...",
  "Heating up the kitchen...",
  "Crafting something amazing...",
];

const bgIcons = [
  UtensilsCrossed, ChefHat, Flame,
  Timer, BookOpen, Leaf,
  Leaf, Timer, UtensilsCrossed,
  ChefHat, Flame, BookOpen,
  Flame, BookOpen, ChefHat,
  UtensilsCrossed, Leaf, Timer,
];

const PageLoader = ({ isVisible }) => {
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setMsgIdx(0);
      return;
    }

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95;
        const remaining = 95 - prev;
        return prev + (remaining * 0.15);
      });
    }, 100);

    const msgTimer = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % messages.length);
    }, 1500);

    return () => {
      clearInterval(progressTimer);
      clearInterval(msgTimer);
    };
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: '#F0E6DA',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            overflow: 'hidden',
            fontFamily: '"Plus Jakarta Sans", sans-serif'
          }}
        >

          {/* Background Icons Grid — same as Stitch */}
          <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.05,
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)',
          }}>
            {bgIcons.map((Icon, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={56} color="#75070C" />
              </div>
            ))}
          </div>

          {/* Center content — same layout as Stitch */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '40px',
            maxWidth: '480px',
            width: '100%'
          }}>

            {/* Icon circle — same size as Stitch h-48 w-48 */}
            <div style={{
              position: 'relative',
              width: '192px',
              height: '192px',
              borderRadius: '50%',
              backgroundColor: '#FFE9E3',
              boxShadow: '0 12px 30px rgba(117,7,12,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Bouncing icon — same as Stitch animate-bounce */}
              <motion.div
                animate={{ y: [0, -14, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ChefHat
                  size={80}
                  color="#FF6B35"
                  strokeWidth={1.5}
                />
              </motion.div>

              {/* Steam — same position as Stitch -top-4 */}
              <div style={{
                position: 'absolute',
                top: '-16px',
                display: 'flex',
                gap: '16px',
                opacity: 0.4
              }}>
                {[0, 0.3].map((delay, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -6, 0],
                      opacity: [0.4, 0.7, 0.4]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay,
                      ease: "easeInOut"
                    }}
                    style={{
                      width: '4px',
                      height: '18px',
                      backgroundColor: '#75070C',
                      borderRadius: '4px'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Loading text — same structure as Stitch */}
            <div style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'center'
            }}>
              <AnimatePresence mode="wait">
                <motion.h3
                  key={msgIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: [1, 0.6, 1] }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#2A241E',
                    margin: 0,
                    letterSpacing: '-0.3px',
                    lineHeight: '1.4'
                  }}
                >
                  {messages[msgIdx]}
                </motion.h3>
              </AnimatePresence>

              <p style={{
                fontSize: '16px',
                color: '#594139',
                opacity: 0.7,
                margin: 0,
                maxWidth: '300px',
                lineHeight: '1.6',
                fontWeight: '400'
              }}>
                We're gathering the finest ingredients
                and sharpening the digital knives.
              </p>
            </div>

            {/* Progress bar — same structure as Stitch */}
            <div style={{
              width: '100%',
              maxWidth: '320px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 4px'
              }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: '#4F6815',
                  textTransform: 'uppercase',
                  letterSpacing: '3px'
                }}>
                  Kitchen Ready
                </span>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#2A241E'
                }}>
                  {Math.round(Math.min(progress, 95))}%
                </span>
              </div>

              {/* Progress track */}
              <div style={{
                height: '6px',
                width: '100%',
                borderRadius: '100px',
                backgroundColor: 'rgba(117,7,12,0.1)',
                overflow: 'hidden'
              }}>
                <motion.div
                  animate={{
                    width: `${Math.min(progress, 95)}%`
                  }}
                  transition={{
                    duration: 0.3,
                    ease: "easeOut"
                  }}
                  style={{
                    height: '100%',
                    borderRadius: '100px',
                    background:
                      'linear-gradient(90deg, #75070C, #FF6B35)',
                  }}
                />
              </div>
            </div>

          </div>

          {/* Bottom branding — same as Stitch absolute bottom */}
          <div style={{
            position: 'absolute',
            bottom: '32px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px'
          }}>
            <SafeLogo />
            <UtensilsCrossed
              size={22}
              color="#FF6B35"
            />
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageLoader;
