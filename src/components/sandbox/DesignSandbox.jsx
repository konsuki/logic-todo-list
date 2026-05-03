import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Calendar, Clock, Zap, Sun, Moon } from 'lucide-react';

/**
 * DesignSandbox
 * 王道の人気配色を取り入れたプレミアム・プロトタイプ
 */
const DesignSandbox = () => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [theme, setTheme] = useState('dark');

  const isLight = theme === 'light';

  return (
    <div className="sandbox-root" style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: isLight 
        ? 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)' 
        : '#0B0E14', 
      padding: '20px',
      gap: '24px',
      transition: 'all 0.5s ease',
      fontFamily: "'Inter', sans-serif"
    }}>
      {!isLight && (
        <div style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />
      )}

      <div style={{ 
        display: 'flex', 
        background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', 
        padding: '4px', 
        borderRadius: '100px',
        marginBottom: '20px',
        border: isLight ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.1)',
        zIndex: 10
      }}>
        <button 
          onClick={() => setTheme('light')}
          style={{
            padding: '8px 16px',
            borderRadius: '100px',
            border: 'none',
            background: isLight ? 'white' : 'transparent',
            color: isLight ? '#1E293B' : '#94A3B8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: '600',
            boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.3s'
          }}
        >
          <Sun size={14} /> Light
        </button>
        <button 
          onClick={() => setTheme('dark')}
          style={{
            padding: '8px 16px',
            borderRadius: '100px',
            border: 'none',
            background: !isLight ? '#1E293B' : 'transparent',
            color: !isLight ? 'white' : '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: '600',
            transition: 'all 0.3s'
          }}
        >
          <Moon size={14} /> Dark
        </button>
      </div>

      <motion.div 
        layout
        style={{
          background: isLight 
            ? 'rgba(255, 255, 255, 0.8)' 
            : 'linear-gradient(180deg, #1A1F26 0%, #151921 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: isLight 
            ? '1px solid rgba(255, 255, 255, 0.5)' 
            : '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '32px',
          width: '400px',
          boxShadow: isLight 
            ? '0 20px 40px -15px rgba(0, 0, 0, 0.05)'
            : '0 30px 60px -12px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255,255,255,0.05)',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1
        }}
      >
        {!isLight && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: '20px',
            right: '20px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent)',
            zIndex: 2
          }} />
        )}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ 
              background: isLight ? '#EEF2FF' : 'rgba(99, 102, 241, 0.15)', 
              color: isLight ? '#4F46E5' : '#818CF8', 
              padding: '6px 14px', 
              borderRadius: '8px', 
              fontSize: '11px', 
              fontWeight: '700',
              letterSpacing: '1px'
            }}>
              GOAL
            </div>
            <div style={{ display: 'flex', gap: '8px', color: isLight ? '#94A3B8' : '#64748B' }}>
              <Clock size={16} />
              <span style={{ fontSize: '13px', fontWeight: '500' }}>15:30</span>
            </div>
          </div>

          <h2 style={{ 
            color: isLight ? '#1E293B' : '#F8FAFC', 
            fontSize: '24px', 
            fontWeight: '600', 
            marginBottom: '12px',
            letterSpacing: '-0.02em'
          }}>
            プレミアム・ダークテーマ
          </h2>
          
          <p style={{ 
            color: isLight ? '#64748B' : '#94A3B8', 
            fontSize: '15px',
            lineHeight: '1.6', 
            marginBottom: '32px' 
          }}>
            開発者に好まれる「ミッドナイト・グレー」をベースに、
            インディゴのアクセントを加えた洗練された配色案です。
          </p>

          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px' }}>
              <span style={{ color: isLight ? '#94A3B8' : '#64748B', fontWeight: '500' }}>Progress</span>
              <span style={{ color: isLight ? '#4F46E5' : '#818CF8', fontWeight: '700' }}>
                {isCompleted ? '100%' : '65%'}
              </span>
            </div>
            <div style={{ 
              height: '4px', 
              background: isLight ? '#F1F5F9' : '#2A2F37', 
              borderRadius: '2px', 
              overflow: 'hidden' 
            }}>
              <motion.div 
                initial={false}
                animate={{ width: isCompleted ? '100%' : '65%' }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                style={{ 
                  height: '100%', 
                  background: isLight 
                    ? 'linear-gradient(90deg, #6366F1, #4F46E5)' 
                    : 'linear-gradient(90deg, #6366F1, #A855F7)' 
                }}
              />
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.01, translateY: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setIsCompleted(!isCompleted)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              background: isCompleted 
                ? (isLight ? '#F0FDF4' : 'rgba(34, 197, 94, 0.1)') 
                : (isLight ? '#1E293B' : '#F8FAFC'),
              color: isCompleted 
                ? (isLight ? '#16A34A' : '#4ADE80') 
                : (isLight ? 'white' : '#0B0E14'),
              border: 'none',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: isLight && !isCompleted ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            {isCompleted ? <Check size={18} /> : <Zap size={18} />}
            {isCompleted ? 'Completed' : 'Complete Goal'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default DesignSandbox;
