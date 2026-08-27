import { SettingsProvider } from '../lib/SettingsProvider';

export const AppProvider = ({ children }) => {
  return (
    <SettingsProvider>
      {children}
    </SettingsProvider>
  );
};
