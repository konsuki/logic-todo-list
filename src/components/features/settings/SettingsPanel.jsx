import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Eye, EyeOff, Sun, Moon, Palette, FileText, Tag, Layers, ListOrdered } from 'lucide-react';
import { useSettings } from '../../../logic/SettingsContext';
import './SettingsPanel.css';

const SettingsPanel = ({ 
  isOpen, 
  onClose, 
  t, 
  themeName, 
  setThemeName, 
  themeMode, 
  setThemeMode,
  onOpenImport
}) => {
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
                <h3>{t('settings.appearance') || 'Appearance'}</h3>
                
                <motion.div className="setting-item" variants={itemVariants}>
                  <div className="setting-info">
                    <div className="setting-label">
                      {themeMode === 'light' ? <Sun size={18} /> : <Moon size={18} />}
                      <span>{t('settings.mode') || 'Mode'}</span>
                    </div>
                  </div>
                  
                  <div className="segmented-control">
                    <button 
                      className={themeMode === 'light' ? 'active' : ''} 
                      onClick={() => setThemeMode('light')}
                    >
                      {t('settings.light') || 'Light'}
                    </button>
                    <button 
                      className={themeMode === 'dark' ? 'active' : ''} 
                      onClick={() => setThemeMode('dark')}
                    >
                      {t('settings.dark') || 'Dark'}
                    </button>
                  </div>
                </motion.div>

                <motion.div className="setting-item" variants={itemVariants}>
                  <div className="setting-info">
                    <div className="setting-label">
                      <Palette size={18} />
                      <span>{t('settings.theme') || 'Theme Color'}</span>
                    </div>
                  </div>
                  
                  <select 
                    className="theme-select"
                    value={themeName}
                    onChange={(e) => setThemeName(e.target.value)}
                  >
                    <option value="classic">{t('settings.theme_classic') || 'Classic'}</option>
                    <option value="premium">{t('settings.theme_premium') || 'Premium'}</option>
                    <option value="github">{t('settings.theme_github') || 'GitHub Actions'}</option>
                  </select>
                </motion.div>
              </motion.section>

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

                <motion.div className="setting-item" variants={itemVariants}>
                  <div className="setting-info">
                    <div className="setting-label">
                      <Tag size={18} />
                      <span>{t('settings.show_phase_badges') || 'Show Phase Badges'}</span>
                    </div>
                    <p className="setting-desc">
                      {t('settings.show_phase_badges_desc') || 'Toggle visibility of execution phase badges in the list view.'}
                    </p>
                  </div>
                  
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={settings.showPhaseBadges} 
                      onChange={(e) => updateSetting('showPhaseBadges', e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </motion.div>

                <motion.div className="setting-item" variants={itemVariants}>
                  <div className="setting-info">
                    <div className="setting-label">
                      <Layers size={18} />
                      <span>{t('settings.show_node_type_tags') || 'Show Node Types'}</span>
                    </div>
                    <p className="setting-desc">
                      {t('settings.show_node_type_tags_desc') || 'Show tags indicating task types.'}
                    </p>
                  </div>
                  
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={settings.showNodeTypeTags} 
                      onChange={(e) => updateSetting('showNodeTypeTags', e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </motion.div>

                <motion.div className="setting-item" variants={itemVariants}>
                  <div className="setting-info">
                    <div className="setting-label">
                      <ListOrdered size={18} />
                      <span>{t('settings.show_step_badges') || 'Show Step Numbers'}</span>
                    </div>
                    <p className="setting-desc">
                      {t('settings.show_step_badges_desc') || 'Show sequence numbers within each level.'}
                    </p>
                  </div>
                  
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={settings.showStepBadges} 
                      onChange={(e) => updateSetting('showStepBadges', e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </motion.div>

                <motion.div className="setting-item" variants={itemVariants}>
                  <div className="setting-info">
                    <div className="setting-label">
                      <FileText size={18} />
                      <span>{t('settings.bulk_import') || 'Bulk Import'}</span>
                    </div>
                    <p className="setting-desc">
                      {t('settings.bulk_import_desc_short') || 'Import multiple tasks at once from JSON or text.'}
                    </p>
                  </div>
                  
                  <button 
                    className="import-btn" 
                    onClick={() => {
                      onClose();
                      onOpenImport();
                    }}
                  >
                    {t('settings.open_import') || 'Open'}
                  </button>
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
