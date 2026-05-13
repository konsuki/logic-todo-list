import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, AlertCircle, Check } from 'lucide-react';
import { parseImportData } from '../../../logic/importLogic';
import './ImportModal.css';

const ImportModal = ({ isOpen, onClose, onImport, t }) => {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState(null);

  const handleImport = () => {
    try {
      const data = parseImportData(inputText);
      onImport(data);
      setInputText('');
      setError(null);
      onClose();
    } catch (e) {
      setError(e.message);
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: 'spring', damping: 25, stiffness: 300 }
    },
    exit: { opacity: 0, scale: 0.9, y: 20 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-backdrop-container">
          <motion.div 
            className="modal-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />
          <motion.div 
            className="import-modal"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="modal-header">
              <div className="header-title">
                <FileText size={20} className="header-icon" />
                <h2>{t('settings.bulk_import_title') || 'Bulk Import Tasks'}</h2>
              </div>
              <button className="close-btn" onClick={onClose}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-content">
              <p className="modal-desc">
                {t('settings.bulk_import_desc') || 'Paste JSON or indented Markdown text to import a task tree.'}
              </p>
              
              <div className="input-container">
                <textarea
                  className={`import-textarea ${error ? 'has-error' : ''}`}
                  placeholder={t('settings.bulk_import_placeholder') || 'Example:\nMy Project\n  Strategic Goal\n    Task 1\n    Task 2'}
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (error) setError(null);
                  }}
                  autoFocus
                />
              </div>

              {error && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="format-hint">
                <span>{t('settings.bulk_import_hint') || 'Formats: JSON or Indented Text'}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="secondary-btn" onClick={onClose}>
                {t('common.cancel')}
              </button>
              <button 
                className="primary-btn" 
                onClick={handleImport}
                disabled={!inputText.trim()}
              >
                <Check size={18} />
                {t('settings.import_button') || 'Import Tree'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ImportModal;
