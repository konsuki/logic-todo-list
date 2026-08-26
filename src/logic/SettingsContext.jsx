import { useState, useEffect } from 'react';
import { SettingsContext } from './settings';

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('logido_settings');
    return savedSettings ? JSON.parse(savedSettings) : {
      showDescriptionInList: true,
      showPhaseBadges: true,
      showNodeTypeTags: true,
      showStepBadges: true,
      useFolderView: true,
      theme: 'theme-classic',
    };
  });

  useEffect(() => {
    localStorage.setItem('logido_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};
