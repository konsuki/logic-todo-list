import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Eye, EyeOff } from 'lucide-react';
import { useSettings } from '../../../logic/SettingsContext';
import './SettingsPanel.css';

const SettingsPanel = ({ isOpen, onClose, t }) => {
  const { settings, updateSetting } = useSettings();

  const containerVariants = {
    hidden: { x: '100%' },
    visible: { 
      x: 0,
      transition: { 
        type: 'spring', 
        damping: 25, 
        stiffness: 200,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
    exit: { 
      x: '100%',
      transition: { ease: 'easeInOut', duration: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div 
            className="settings-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div 
            className="settings-panel"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="settings-header">
              <div className="header-title">
                <Settings size={20} className="header-icon" />
                <h2>{t('settings.title') || 'Settings'}</h2>
              </div>
              <button className="close-btn" onClick={onClose}>
                <X size={24} />
              </button>
            </div>

            <div className="settings-content">
              <motion.section className="settings-section" variants={itemVariants}>
                <h3>{t('settings.view_preferences') || 'View Preferences'}</h3>
                
                <motion.div className="setting-item" variants={itemVariants}>
                  <div className="setting-info">
                    <div className="setting-label">
                      {settings.showDescriptionInList ? <Eye size={18} /> : <EyeOff size={18} />}
                      <span>{t('settings.show_description_in_list') || 'Show Description in List'}</span>
                    </div>
                    <p className="setting-desc">
                      {t('settings.show_description_in_list_desc') || 'Toggle visibility of task descriptions in the list view.'}
                    </p>
                  </div>
                  
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={settings.showDescriptionInList} 
                      onChange={(e) => updateSetting('showDescriptionInList', e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </motion.div>
              </motion.section>
            </div>

            <div className="settings-footer">
              <p>LogiDo v1.1.0 — Precision Build</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;
